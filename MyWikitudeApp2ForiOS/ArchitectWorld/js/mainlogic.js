// ARchitect World（＝AR体験）の実装
var World = {

    // 2つの画像ターゲット間における、現在の距離と回転角を保持する変数。
    curDistance: 1000,
    curRotation: 180,

    // 2つの画像ターゲットを追跡中の場合、そのターゲットオブジェクトをこの変数に登録して保持しておきます。
    targetsRegistry: [],

    // ターゲットオブジェクトの初期化処理を関数にまとめています。
    initTargetObjects: function () {
        World.targetsRegistry = [];
        World.curDistance = 1000;
        World.curRotation = 180;
        World.initInstruction();
    },

    // 初期化用の関数。World.init()の形で、外部から呼び出されることで ARchitect World が生成されます。
    init: function () {
        World.createOverlays();
    },

    // init()関数から呼び出される。ARchitect Worldのオーバーレイを作成します。
    createOverlays: function () {

        // 事前に準備しておいた「複数のターゲット画像群がまとめられた.wtcファイル」から、「画像ターゲットコレクション」リソースを作成します。
        var targetCollectionResource = new AR.TargetCollectionResource("assets/cats.wtc");
        // その「画像ターゲットコレクション」リソースから、「AR画像トラッカー」を作成します。
        var tracker = new AR.ImageTracker(targetCollectionResource, {
            // ImageTrackerクラスのオプションプロパティを以下のように設定します：
            maximumNumberOfConcurrentlyTrackableTargets: 2, // 同時に追跡可能のターゲットの最大数を設定。
            extendedRangeRecognition: AR.CONST.IMAGE_RECOGNITION_RANGE_EXTENSION.OFF, // 拡張された範囲認識を無効にします。理由は、処理パワーが必要になって動作が遅くなるのを回避するため。
            onDistanceChangedThreshold: 0,                  // 後述のonDistanceChangedコールバック関数が呼び出される閾値として、ターゲット間の最小距離（mm）を設定。
            onRotationChangedThreshold: 10,                 // 後述のonRotationChangedコールバック関数が呼び出される閾値として、ターゲット間の最小回転角（°）を設定。
            onTargetsLoaded: World.worldLoaded,              // ターゲット群のロードが完了したときに呼び出されるコールバック関数を指定。
            onError: function (errorMessage) {              // トラッカーがエンジンによってロードできなかったときに呼び出されるコールバック関数を指定。
                alert(errorMessage);
            }
        });

        // 事前に準備しておいた「オーバーレイ用の.pngファイル」から、「画像」リソースを作成します。
        var heartMark = new AR.ImageResource("assets/overlays/heart.png");
        // その「画像」リソースから、オーバーレイとなる「画像描画物」を作成します。
        var heartOverlay = new AR.ImageDrawable(heartMark, 1, {
            translate: {
                x:-0.15  // AR.ImageDrawableのX軸方向への平行移動を設定。
            }
        });

        // 「AR画像トラッカブル」を作成することにより、追跡する（Tracker）側と追跡される（Trackable）側のセットを構築します。
        new AR.ImageTrackable(tracker, "*", {  // 追跡されるターゲットの名前を、ワイルドカード（*）にすることで、画像ターゲットコレクション内の全てのターゲットが反応するようになります。

            drawables: {
                cam: heartOverlay  // このプロパティに対して、追跡されるターゲットのオーバーレイ（＝AR.ImageDrawableオブジェクト）を指定。
            },

            // AR.ImageTrackableオブジェクトが可視から「不可視」に変更されたときに呼び出されるコールバック関数。
            onImageLost: function (target) {
                // 計算処理を中断した方がよいが、サンプルなのでできるだけコードを短くするために実装していません。
                World.initTargetObjects();
            },

            // AR.ImageTrackableオブジェクトが不可視から「可視」に変更されたときに呼び出されるコールバック関数。
            onImageRecognized: function (target) { // 引数targetはImageTargetクラスのオブジェクトです。

                // ターゲット間の距離が変化したときに呼び出されるコールバック関数。前述のonDistanceChangedThresholdプロパティ値も設定してください。
                target.onDistanceChanged = function (distance, destinationTarget) {

                    //var rotation = target.getRotationTo(destinationTarget); // なぜか「0」が返却される（一時的なバグ？ 取りあえず現状では使えない）
                    //AR.logger.info("onDistanceChanged=  target：" + target.name + ", destinationTarget: " + destinationTarget.name + ", rotation.z: " + rotation.z.constructor.name);

                    World.curDistance = distance; // 現在の「距離」を保存
                    World.showTargetObjects(target, destinationTarget);

                };

                // ターゲット間の回転角が変化したときに呼び出されるコールバック関数。前述のonRotationChangedThresholdプロパティ値も設定してください。
                target.onRotationChanged = function (rotation, destinationTarget) {

                    //var distance = target.getDistanceTo(destinationTarget); // なぜか「-1」が返却される（一時的なバグ？ 取りあえず現状では使えない）
                    //AR.logger.info("onRotationChanged=  target：" + target.name + ", destinationTarget: " + destinationTarget.name + ", distance: " + distance.constructor.name);

                    // 回転角を 0° ～ 360° の範囲に調整
                    if (rotation.z < 0) {
                        rotation.z += 360;
                    }

                    World.curRotation = rotation; // 現在の「角度」を保存
                    World.showTargetObjects(target, destinationTarget);

                };

            }
        });
    },


    showTargetObjects: function (target, destinationTarget) {

        if (target == null || destinationTarget == null) return; // 不要だと思うが念のため。

        // 回転角が10°前後以内、かつ距離が30mm以内になったら、計算処理を実行します。
        if ((World.curRotation.z > 350 || World.curRotation.z < 10) && World.curDistance < 30) {

            // 計算処理をすでに実行済みの場合は、再計算しないようにはじきます。
            if (World.targetsRegistry.filter(function (obj) {
                    return (obj.first == target && obj.second == destinationTarget) ||
                        (obj.first == destinationTarget && obj.second == target);
                }).length == 0) {

                    // 計算済みとして2つのターゲットを保存
                    World.targetsRegistry.push({first: target, second: destinationTarget});

                    //AR.logger.info("rotation.z:" + World.curRotation.z + "°, distance:" + World.curDistance + "mm");

                    // 「2人の相性」の計算処理の元データとして、Cognitive Services Face APIを呼び出します。
                    // スクリーンキャプチャなどデバイス側の機能が必要になるので、 iOS（Objective-C）側に処理を任せます。
                    AR.platform.sendJSONObject({
                        action: "calculate_relation"
                    });
            }

        } else {

            if (World.targetsRegistry.length != 0) {
                // 計算処理を中断した方がよいが、サンプルなのでできるだけコードを短くするために実装していません。
                World.initTargetObjects();
            }

        }

    },

    // iOS（Objective-C）側に任せていたCognitive Services Face APIの呼び出しが完了すると、
    // このコールバック関数が呼び出されて、引数jsonDataにその結果データが渡されます。
    showRelation: function (jsonData) {
        var styleAttrDescription = " style='display: table-cell;vertical-align: middle; text-align: center; background-color: pink; font-weight: bold; font-size: 200%;'";
        if ((jsonData instanceof Array) && (jsonData.length == 2)) {
            // 「2人の相性」の計算処理（何の理由も根拠もないデタラメな計算です……）。
            var percentage = 130
            - Math.abs(jsonData[0].faceAttributes.age - jsonData[1].faceAttributes.age) * 3
            - Math.abs(jsonData[0].faceAttributes.emotion.anger - jsonData[1].faceAttributes.emotion.anger) * 100
            - Math.abs(jsonData[0].faceAttributes.emotion.contempt - jsonData[1].faceAttributes.emotion.contempt) * 100
            - Math.abs(jsonData[0].faceAttributes.emotion.disgust - jsonData[1].faceAttributes.emotion.disgust) * 100
            - Math.abs(jsonData[0].faceAttributes.emotion.fear - jsonData[1].faceAttributes.emotion.fear) * 100
            - Math.abs(jsonData[0].faceAttributes.emotion.happiness - jsonData[1].faceAttributes.emotion.happiness) * 100
            - Math.abs(jsonData[0].faceAttributes.emotion.neutral - jsonData[1].faceAttributes.emotion.neutral) * 100
            - Math.abs(jsonData[0].faceAttributes.emotion.sadness - jsonData[1].faceAttributes.emotion.sadness) * 100
            - Math.abs(jsonData[0].faceAttributes.emotion.surprise - jsonData[1].faceAttributes.emotion.surprise) * 100;
            document.getElementById('topMessage').innerHTML =
            "<div" + styleAttrDescription + ">この2人の相性は？ 「" + percentage + "％」</div>";
        } else {
            document.getElementById('topMessage').innerHTML =
            "<div" + styleAttrDescription + ">「" + jsonData + "」</div>";
        }
    },

    // ImageTrackerクラスのonTargetsLoadedイベントに呼び出されます。トラッカーのターゲットコレクションが正常にロードされ、トラッカーがエンジンによってロードされたときにトリガーが発生します。 このトラッカーに関連するImageTrackableは、トラッカーが正常に読み込まれた後にのみトラッキングできます。
    worldLoaded: function () {
        World.initInstruction();
    },

    // ユーザーへの指示文の初期化処理を関数にまとめています。
    initInstruction: function () {
        var styleAttrDescription = " style='display: table-cell;vertical-align: middle; text-align: right; width: 50%; padding-right: 15px;'";
        var styleAttrFigure = " style='display: table-cell;vertical-align: middle; text-align: left; padding-right: 10px; width: 112px; height: 38px;'";
        document.getElementById('topMessage').innerHTML =
            "<div" + styleAttrDescription + ">写真を2枚並べてね:</div>" +
            "<div" + styleAttrFigure + "><img src='assets/leftman.png'></div>" +
            "<div" + styleAttrFigure + "><img src='assets/rightman.png'></div>" +
            "<div" + styleAttrFigure + "><img src='assets/leftwoman.png'></div>" +
            "<div" + styleAttrFigure + "><img src='assets/rightwoman.png'></div>";
    }
};

// ARchitect World を初期化します。
World.init();
