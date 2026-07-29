# Stack

## 採用

- Runtime: Cloudflare Workers
- HTTP/UI: Hono、Hono JSX、Web標準API
- Build: Vite+、TypeScript、Oxlint/Oxfmt、Vitest
- Data: D1と手書きSQL migration
- Abuse control: Cloudflare Rate Limiting、honeypot、厳格な入力上限
- Public origin: `https://yorishiru.yhay81.com`

## 見送り

- Better Auth: 匿名編集鍵で中核作業を完了でき、会員登録が作成摩擦になる
- R2/Cloudflare Images: 画像を保存しない
- 外部SNS API/Xログイン: プロフィール本文とHTTPSリンクだけで検証できる
- AI文章分割: `# 見出し`とURLの端末内パーサーで十分で、入力本文を外部送信しない
- 課金、メール、通知、公開ディレクトリ: 需要検証前には不要

## Release gate

release contract、静的解析、テスト、build、D1 migration、本番CRUD、削除、CSP、noindex、390px表示、IndexNow、集計初期値を確認して公開します。
