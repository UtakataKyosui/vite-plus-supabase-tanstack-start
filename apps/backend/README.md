# backend

さまざまな物を管理するアプリのバックエンド。フロントエンドは `apps/web`（TanStack Start）、認証は Supabase Auth。
HTTP は `apps/web` の TanStack Start server routes で受け、処理の中身はこのパッケージに置く。

## 構成

| 置き場所                        | 役割                                                                                                                                |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `apps/backend/openapi.yaml`     | API 契約                                                                                                                            |
| `apps/backend/src`              | ドメイン処理。入力と依存（Supabase クライアント、ユーザー、テナント）を受け取り、契約どおりの値を返す。`@tanstack/*` には依存しない |
| `apps/backend/src/generated`    | Orval（zod）でスペックから生成したスキーマ。入力検証と型（`z.infer`）に使う                                                         |
| `apps/web/src/routes/api/v1/**` | server routes。リクエストの解釈、認証とテナントの解決、ドメイン処理の呼び出し、エラーの HTTP 応答への変換だけを行う                 |
| `apps/web/src/api/generated`    | Orval（react-query）で生成したクライアント                                                                                          |

`apps/backend` は `apps/web` を import しない。パスは `/api` + スペックのパスになる（`/v1/tags/{id}` は `routes/api/v1/tags/$id.ts`）。

API 契約は [sysadminsmedia/homebox](https://github.com/sysadminsmedia/homebox) の `backend/`（Go、commit `4d19c9e4d23ae3e55c12c844e4810b494a0f1318`）を起点にしており、そこから独自に変更していく。
Homebox のライセンスは AGPL-3.0。

## 参考: Homebox のバックエンド

Go 製の単一バイナリで、REST API（`/api/v1/*`）と、ビルド済み SPA の静的配信を兼ねる。

| 領域           | 内容                                                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 認証           | メール + パスワード、OIDC（設定で有効化）、API キー、パスワードリセット（メール送信）                                        |
| マルチテナント | ユーザーは複数のコレクション（`group`）に所属する。招待トークンで参加し、ロールは `owner` / `user`                           |
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

手で保守する。Homebox の swag 生成物を `routes.go` と突き合わせて補正したものを起点に、次を変更した。

- 認証を Supabase Auth に置き換えた。登録・ログイン・ログアウト・トークン更新・パスワードリセット・パスワード変更・OIDC の operation を削除した
- 認証方式を 2 つにした。ブラウザは Supabase のセッション Cookie（`SessionCookie`）、外部クライアントは API キー（`ApiKey`、`Authorization: Bearer`）。API キーの管理（`/v1/users/self/api-keys`）はセッション Cookie でしか呼べない
- 状態を変える要求（POST、PUT、PATCH、DELETE）は、`Origin` が自分のオリジンと一致しなければ拒否する（CSRF 対策）
- リアルタイム（`/v1/ws/events`）と、Homebox 固有の拡張フィールド（`x-upstream`、`x-homebox-condition`）を削除した
- 添付ファイル用トークン（`?access_token=`）を廃止した
- `?tenant=` は、URL を直接使う operation（画像、ダウンロード）だけに残した。それ以外は `X-Tenant` ヘッダのみ
- 画像・CSV を返す operation の content type を実際の値（`image/png`、`image/jpeg`、`text/csv`）に直した

Homebox から引き継いだ補正:

- swag 定義が欠けていたルート（`GET /v1/labelmaker/entity/{id}`、`POST /v1/telemetry`）を追加し、`PUT /v1/users/self/change-password` のパスを直した
- `operationId` を Go のハンドラ名から付けた（例: `HandleEntitiesGetAll` → `entitiesGetAll`）。Orval が生成する関数名になる
- owner 限定の operation に 403 を付けた
- OpenAPI 3.0 で無効な `nullable` + `allOf` の組に `type: object` を補った

```sh
vp run check:openapi   # スペックを lint する（moon の check タスク）
```

スペックを変えたら、両方の生成物を作り直す。

```sh
moon run backend:generate-schemas web:generate-api
```

## 方針

| 項目     | 決定                                                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| DB       | Supabase Postgres                                                                                                                   |
| 認証     | ブラウザは `@supabase/ssr` のセッション Cookie、外部クライアントは API キー。変更系の要求は `Origin` を検証する                     |
| API キー | 平文では保存せず、ハッシュと識別用の先頭文字だけを保存する。発行時に 1 回だけ表示する。テナント、スコープ、期限、最終使用日時を持つ |
| 通知     | リアルタイム配信は入れない。必要になったらブラウザから Supabase Realtime を直接購読する                                             |
| 名前     | Smart Box                                                                                                                           |

## 未決事項

- 認証アダプタ: server routes で Cookie と API キーを受け、Cookie は `getUser()`（または `getClaims()`）で検証する。最初の認証付き operation と一緒に作る
- Cookie を HttpOnly にするか。`@supabase/ssr` のブラウザクライアントは Cookie を JS から読む前提で、標準では HttpOnly にならない。HttpOnly にするには、ログインを server function 経由にして Cookie をサーバー側で書く
- API キーの権限判定: API キーの呼び出しにはユーザーの JWT が無く、`auth.uid()` を使う RLS が効かない。アプリ層で `tenant_id` を必ず絞る（リポジトリ層に集約する）か、キーから短命の JWT を発行して RLS を使うか
- 添付ファイルの配信: Storage の署名付き URL に置き換えるか（`<img src>` では Authorization ヘッダを付けられない）
- 対象範囲を家財以外に広げるときの `entity` / `entity_type` の扱い
- スペックを自分のドメインに書き換えたあと、`info.contact`、`info.license`、冒頭の Homebox 由来の説明、このファイルの Homebox 由来の記述を外すか。Homebox のライセンスは AGPL-3.0 で、現状のスペックは Homebox のルートとスキーマを写したもの
