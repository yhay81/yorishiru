# Security Policy

## 実装済み

- 32-byte編集鍵をURL fragmentへ置き、D1にはSHA-256ハッシュだけを保存
- 閲覧URLと編集URLの分離、更新時のrevision競合検知
- 同一site書き込み、JSON Content-Type・36KB上限、Cloudflare Rate Limiting、honeypot
- テキスト長、件数、ID重複、テーマ、HTTPS URL、URL内認証情報の検証
- Hono JSXの出力エスケープと、クライアント側DOMの`textContent`構築
- CSP、HSTS、frame拒否、権限拒否、noindex既定
- 365日無編集カードと35日イベントの自動削除

## 扱わないもの

パスワード、Cookie認証、メール、画像、現在位置、住所、電話番号、決済、コメント、DM、外部HTML埋め込みは扱いません。Better Authは所有者アカウントが必要になるまで追加しません。

## 報告

脆弱性はGitHubのPrivate vulnerability reportingを利用し、公開Issueへ秘密情報や再現用編集URLを投稿しないでください。
