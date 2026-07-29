# よりしる

自己紹介、活動リンク、確認事項、読んだ印を、登録なしで一枚の公開カードへまとめるWebサービスです。

- 本番: <https://yorishiru.yhay81.com>
- 対象: Xなどの短いプロフィール欄では情報が足りない創作者、趣味アカウント、取引アカウント
- 公開: 閲覧URLと編集鍵つきURLを分離。検索表示は明示的なopt-in

## 中核フロー

1. 表示名、紹介、既存プロフィール本文を入力する。
2. `# 見出し`を本文カードへ、HTTPS URLを活動リンクへ変換する。
3. 公開URLを共有し、必要なら読んだ印をコピーしてもらう。
4. 編集URLから更新、JSON出力、完全削除を行う。

氏名、住所、電話番号、メール、決済情報、本人確認書類、画像、現在位置は扱いません。

## 開発

```powershell
vp env off
npm ci
npx wrangler d1 migrations apply yorishiru --local
npm run dev
```

## 品質ゲートと公開

```powershell
npm run release:check
npm run check
npm test
npm run build
npm run deploy
npm run indexnow
npm run metrics
```

ユーザーデータ、編集鍵、生ログ、秘密値をGitへ保存しないでください。
