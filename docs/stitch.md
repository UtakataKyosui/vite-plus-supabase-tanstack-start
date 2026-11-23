# Stitch デザイン

Stitch プロジェクト「Smart Box」にデザインを作成している。

- プロジェクト: https://stitch.google.com/projects/6835793091568963943
- デザインシステム: `assets/10507115428230245109`（shadcn `base-nova` / baseColor `mist`、primary は `apps/web/src/styles/app.css` の `--primary` = sky-700 `#0369a1`、フォントは Outfit）
- 参照元: `apps/web/components.json`、`apps/web/src/styles/app.css`、`apps/backend/openapi.yaml`

## 画面

| 画面                | 対応する API                                  |
| ------------------- | --------------------------------------------- |
| Smart Box Dashboard | `/v1/groups/statistics*`                      |
| Items               | `/v1/entities`                                |
| Item Detail         | `/v1/entities/{id}`、attachments、maintenance |

## 運用

- 画面生成は数分かかり、MCP 呼び出しはタイムアウトする。再試行せず `list_screens` で確認する。
- デザインシステムは oklch のトークンを `designMd` に持たせている。`app.css` を変更したら Stitch 側の `designMd` も更新する。
