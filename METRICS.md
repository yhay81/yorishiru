# Metrics

`npm run metrics`はD1から個人を特定しない集計だけをJSON出力します。

## Funnel

- `users`: 訪問した匿名セッション
- `creators`: カードを作成
- `editors`: 作成後に編集
- `sharers`: 公開URLをコピー
- `viewers`: 公開カードを閲覧
- `outbound_users`: 公開カードから活動リンクを開く
- `mark_users`: 読んだ印をコピー
- `exporters`: JSONを出力
- `referred_creators`: 公開カードの「自分のカードを作る」経由で作成
- `returned`: 別日に再訪

## Product state

- `active_profiles`
- `edited_profiles`
- `discoverable_profiles`
- `profiles_with_sections`
- `profiles_with_links`

`?qa=1`またはwebdriverの自動QAはイベント保存前に破棄します。表示名、本文、URL、編集鍵、個別IDは集計出力へ含めません。分母0の比率は0であり、欠測を成功扱いしません。
