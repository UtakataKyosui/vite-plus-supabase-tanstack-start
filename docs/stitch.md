# Stitch デザイン

Stitch プロジェクト「Smart Box」にデザインを作成している。

- プロジェクト: https://stitch.google.com/projects/6835793091568963943
- デザインシステム: `assets/10507115428230245109`（shadcn `base-nova` / baseColor `mist`、primary は `apps/web/src/styles/app.css` の `--primary` = sky-700 `#0369a1`、フォントは Outfit）
- 参照元: `apps/web/components.json`、`apps/web/src/styles/app.css`、`apps/backend/openapi.yaml`

## 画面

| 画面                           | 画面 ID                            | 対応する API                                                                                |
| ------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------- |
| Smart Box Dashboard            | `eecaf2ceb2534fbf9f4632a4b6c0b4b7` | `/v1/groups/statistics*`                                                                    |
| Items                          | `8548e159edc14a5285e6c716ed2cd247` | `/v1/entities`                                                                              |
| Item Detail                    | `fd0ea68cf19c49ba83d250dc6fbe999d` | `/v1/entities/{id}`、attachments、maintenance                                               |
| New Item — Smart Box           | `c8ee39a2e9dd4085a2f1f761cfcdacf3` | `POST /v1/entities`、`PUT /v1/entities/{id}`                                                |
| New Item（重複）               | `ac2cb3bfec9143ae960a4b606dd493aa` | 同上。どちらか一方を採用する                                                                |
| Locations                      | `582e037a23bd422aa0ef52d7a4daedf5` | `/v1/entities`（location）                                                                  |
| Location Detail — Shelf A      | `235dbdd5fdeb466d82f209edecc14fbd` | `/v1/entities/{id}`（location）                                                             |
| Tags                           | `ce6fc568e7694340aa2f3f15b57941ea` | `/v1/tags`                                                                                  |
| Label Templates                | `4d28fa4303fa49859d2c58da9c48c3d5` | `/v1/label-templates`                                                                       |
| Label Template Detail & Editor | `b5c1454bbf0d490eac1a0317ab763dda` | `/v1/label-templates/{id}`、`render*`、`print*`                                             |
| Item Templates                 | `2c4241cb573a449d9dec3dce0ea45d3f` | `/v1/templates`、`/v1/templates/{id}/create-item`                                           |
| Maintenance                    | `40914bfb763e47a4afc2e0c51157ad2b` | `/v1/maintenance`                                                                           |
| Group Settings                 | `9b72fd7d3b7b4128bcc7b8283fef3c27` | `/v1/groups`、`/v1/groups/members`、`/v1/groups/invitations`                                |
| Tools                          | `040b1bb4eb2e46e5876feb4fae489783` | `/v1/group/import`、`/v1/group/exports`、`/v1/actions/*`、`/v1/reporting/bill-of-materials` |
| Profile & Settings             | `7cc800dbf0374961bfeb40bd237db15a` | `/v1/users/self*`、`/v1/users/self/api-keys`、`/v1/notifiers`                               |

## 生成待ち

生成を依頼済みだが、まだ `list_screens` に現れていない画面。

- Entity Types 設定（`/v1/entity-types`）
- Sign in / Sign up
- Scan（モバイル。`/v1/products/search-from-barcode`、`/v1/qrcode`）

## 運用

- 画面生成は数分かかり、MCP 呼び出しはタイムアウトする。タイムアウトしても生成は続いていることが多く、5 分以上たってから反映されることもある。再試行すると重複するので、`list_screens` で確認する。
- デザインシステムは oklch のトークンを `designMd` に持たせている。`app.css` を変更したら Stitch 側の `designMd` も更新する。
