# backend

Homebox（ホームインベントリ管理）を TanStack Start で作り直すための、バックエンド側の置き場所。
現時点では API 契約（`openapi.yaml`）だけを持つ。フロントエンドは `apps/web`。

- 元実装: [sysadminsmedia/homebox](https://github.com/sysadminsmedia/homebox) の `backend/`（Go）
- 基準 commit: `4d19c9e4d23ae3e55c12c844e4810b494a0f1318`
- 上流のライセンスは AGPL-3.0。`openapi.yaml` は上流の生成物から派生している。

## 元のバックエンドがしていること

Go 製の単一バイナリで、REST API（`/api/v1/*`）と、ビルド済み SPA の静的配信を兼ねる。

| 領域           | 内容                                                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 認証           | メール + パスワード、OIDC（設定で有効化）、API キー、パスワードリセット（メール送信）                                        |
| マルチテナント | ユーザーは複数のコレクション（`group`）に所属する。招待トークンで参加し、ロールは owner / member                             |
| エンティティ   | 物品と保管場所を `entity` に統合している。`entity_type.is_location` で区別し、親子関係で木構造をつくる                       |
| 付随データ     | タグ（階層あり）、カスタムフィールド、添付ファイル（写真・領収書・マニュアル・外部リンク、サムネイル生成）、メンテナンス記録 |
| テンプレート   | エンティティテンプレート（入力の雛形）、ラベルテンプレート（QR / バーコード付きラベルの描画・印刷）                          |
| 入出力         | CSV のインポートとエクスポート、コレクション丸ごとの zip エクスポートとインポート（非同期ジョブ）、部品表（BOM）の出力       |
| 統計           | 総額、場所別・タグ別の集計、購入額の推移                                                                                     |
| 通知           | コレクションに登録した通知先（shoutrrr 形式の URL）へ、当日予定のメンテナンスを毎朝 8 時に通知する                           |
| リアルタイム   | WebSocket `/api/v1/ws/events`。同じコレクションへの変更を `{ "event": "entity.mutation" }` などの形で配信する                |
| 外部連携       | バーコード（EAN）から製品情報を検索、GitHub の最新リリース確認                                                               |

### 認証とテナントの解決

| 項目             | 挙動                                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| トークンの取得元 | Cookie `hb.auth.token` → `Authorization` ヘッダ（`Bearer ` は省略可）→ `Sec-WebSocket-Protocol` → `?access_token=` の順に探す                   |
| `?access_token=` | 添付ファイル用トークンだけを受け付ける。使えるのは `/qrcode` と添付ファイル取得のみ（例外として `/ws/events` はセッショントークンも受け付ける） |
| テナント         | `X-Tenant` ヘッダ、無ければ `?tenant=`、それも無ければユーザーの既定コレクション                                                                |
| owner 限定       | コレクションの更新・削除、メンバーの削除、招待の作成・削除                                                                                      |
| レート制限       | register / login / forgot-password / reset-password / OIDC / notifiers/test                                                                     |

### 定期ジョブ

| ジョブ                                                   | 間隔                               |
| -------------------------------------------------------- | ---------------------------------- |
| 期限切れトークン、パスワードリセットトークン、招待の削除 | 24 時間                            |
| 7 日より古いエクスポート成果物の削除                     | 24 時間                            |
| 通知の送信                                               | 1 時間ごとに確認し、8 時台だけ送る |
| GitHub の最新リリース確認                                | 1 時間                             |
| コレクションのエクスポートとインポート                   | pub/sub キューの購読               |

### 永続化

- DB: SQLite（既定）または PostgreSQL。ORM は ent。
- ファイル: gocloud.dev blob（既定はローカルの `.data`）。
- 検索: DB（既定）または Meilisearch。

## openapi.yaml

上流の swag 生成物 `backend/app/api/static/docs/openapi-3.json` を元に、`backend/app/api/routes.go` と突き合わせて補正している。
補正は `scripts/sync-openapi.mjs` で行う。スペックの operation と `routes.go` のルートが 1 対 1 に一致しないとスクリプトは失敗する。

上流との差分:

- `PUT /v1/users/change-password` を、実際のルートである `/v1/users/self/change-password` に直した
- swag 定義が欠けていたルートを追加した: `GET /v1/ws/events`、`GET /v1/labelmaker/entity/{id}`、`POST /v1/telemetry`
- 設定で有効にしたときだけ存在するルートに `x-homebox-condition` を付けた（OIDC、telemetry）
- `operationId` を Go のハンドラ名から付けた（例: `HandleEntitiesGetAll` → `entitiesGetAll`）
- 認証方式を `CookieAuth` / `BearerAuth` / `AttachmentToken` / `SessionQueryToken` に分けた
- 認証が必要な operation に `X-Tenant` / `tenant` パラメータと 401 を、owner 限定の operation に 403 を、レート制限のある operation に 429 を付けた
- OpenAPI 3.0 で無効な `nullable` + `allOf` の組に `type: object` を補った

### コマンド

```sh
vp run check:openapi                        # スペックを lint する（moon の check タスク）
vp run sync:openapi <homebox の checkout>   # 上流から openapi.yaml を再生成する
```

## 未決事項

実装はまだ無い。着手前に次を決める。

- ランタイム: TanStack Start の server routes / server functions、独立した HTTP サーバー（Hono など）、Supabase Edge Functions のどれに載せるか
- 永続化: Supabase Postgres と Storage に寄せるか（上流は ent + SQLite/PostgreSQL + gocloud blob）
- 認証: 上流の独自トークン（Cookie `hb.auth.token`、API キー、添付トークン）を再現するか、Supabase Auth に置き換えて契約を変えるか
- リアルタイム: `/v1/ws/events` を Supabase Realtime で代替するか
- `apps/web` から呼ぶクライアントを `openapi.yaml` からどう生成するか
