# MIRAINA Website

## 自動ブログ生成時のルール

このファイルは `daily-blog.sh` による自動実行時の制約を定義する。

### 許可する操作
- `blogs/` 配下への新規HTMLファイル作成
- `images/` 配下への画像ファイル保存
- `data/` 配下のJSONファイル編集
- `index.html` のブログセクション更新
- `llms.txt` への追記
- `sitemap.xml` の更新
- `blogs.html` の更新
- git commit & push

### 禁止する操作
- 上記以外のHTML/CSS/JSファイルの変更
- 既存ブログ記事の内容変更（リンク追加は除く）
- 環境変数やシークレットの出力
- プロジェクト外へのファイルアクセス
