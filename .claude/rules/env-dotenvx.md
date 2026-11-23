---
paths:
  - "apps/*/.env*"
  - "apps/*/src/utils/supabase.ts"
  - "apps/*/package.json"
  - "apps/*/vite.config.ts"
---

# 環境変数と dotenvx

## 前提

- `.env` の値は dotenvx で暗号化されている（`encrypted:...`）。復号鍵は `.env.keys` にある。
- Vite は `.env` を自前で読み、暗号化された値を復号せずに `import.meta.env` へ入れる。したがって `import.meta.env` と暗号化 `.env` は併用できない。
- コード中の `config()`（`@dotenvx/dotenvx`）が復号して埋めるのは `process.env` だけである。

## 規則

- Supabase の URL・キーなどサーバー専用の値は `process.env` から読む。キー名は `SUPABASE_URL` / `SUPABASE_ANON_KEY` とし、`VITE_` を付けない。
- 暗号化した `.env` を使うときは、scripts を `dotenvx run -- <command>` で起動する（`dev` / `build` / `preview`）。`pnpx dotenv run` や `dotenv-cli` は復号しないので使わない。
- ソース内で `config()` を呼ばない。起動は `dotenvx run` に一本化する。
- ブラウザで使う値だけ `VITE_` を付け、平文で別管理する。暗号化値に `VITE_` を付けても動かない。
- `.env` の編集は `dotenvx set KEY value` で行い、暗号化済みの行を手で書き換えない。値をログや応答に出さない。
- キーを改名したら、コード側の参照（`grep` で全件）と `.env` を同じ変更で揃える。
- `.env.keys` は Git にコミットしない。`.gitignore` に入っていることを確認する。
- 本番・CI には `DOTENV_PRIVATE_KEY` を環境変数として渡す。

## 症状と原因

「`@supabase/ssr`: Your project's URL and API key are required」は、次のいずれかで起きる。

- キー名がコードと `.env` で食い違っている
- 暗号化値が復号されていない（`dotenvx run` を経由していない、または `import.meta.env` から読んでいる）
