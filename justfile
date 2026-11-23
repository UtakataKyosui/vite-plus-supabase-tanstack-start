set shell := ["zsh", "-cu"]

# レシピの一覧を表示する
default:
    @just --list

# 依存関係をインストールする
install:
    vp install

# 開発サーバーを起動する
dev:
    moon run web:dev

# 本番ビルドする
build:
    moon run web:build

# ビルド済みの成果物をプレビューする
preview:
    moon run web:preview

# 本番モードで起動する
start:
    moon run web:start

# 型チェックと lint を全プロジェクトで実行する
check:
    moon run :check

# テストを全プロジェクトで実行する
test:
    moon run :test

# OpenAPI からスキーマとクライアントを再生成する
generate:
    moon run backend:generate-schemas web:generate-api

# CI と同じ検証（check と test）をまとめて実行する
ci: check test

# リモートの Supabase プロジェクトへ migration を適用する（確認プロンプトあり）
db-push:
    supabase db push --remote

# 適用される migration を確認する（実際には適用しない）
db-push-dry-run:
    supabase db push --remote --dry-run
