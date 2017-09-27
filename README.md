# MyWikitudeApp2ForiOS

Wikitude SDK（JavaScript API）を用いたターゲット画像認識型ARのサンプルアプリで、2枚の顔写真を近づて横に並べると2人の相性診断が行われます。

連載記事「[Wikitudeでスマホアプリをお手軽開発［PR］ - Build Insider](http://www.buildinsider.net/pr/grapecity/wikitude)」の第4回で作成したiOS向けのサンプルアプリです。

このサンプルアプリは、SDKに付属のサンプルをベースに独自の拡張を加えたものです。


## ビルド・実行するための注意点

- /MyWikitudeApp2ForiOS/ViewController.m

ViewController.mファイル内の `#define kWT_LICENSE_KEY` の値を、実際に取得した正しいアクセスキーにしてください。

本サンプルではFace APIを呼び出した際と同様のデータを仮想的に作成します。実際にCognitive Servicesのを使って処理したい場合は（※Wikitudeのトライアルライセンスキーでは動作しません）、ViewController.mファイル内の `#define USE_FACE_API` のコメントアウトを外したうえで、 `#define kCS_SUBSCRIPTION_KEY` の値を、実際に取得した正しいサブスクリプションキーにしてください。


- /MyWikitudeApp2ForiOS/Frameworks/WikitudeSDK.framework/WikitudeSDK

WikitudeSDKファイルは100Mbytesを超えているため、GitHubにアップロードできませんでした。ダウンロードしたWikitude SDKから入手してください。できればFrameworks配下すべてを置き換えてください。


## ライセンス

MIT.



