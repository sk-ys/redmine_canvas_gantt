# AGENTS.md

## Project overview

Redmine Canvas Gantt は Redmine 向けの高性能 Canvas ベースガントチャートプラグイン。バックエンドは Ruby on Rails (Redmine プラグイン)、フロントエンドは `spa/` ディレクトリの React SPA で構成される。

- Language: Ruby (backend), TypeScript (frontend)
- Framework: Redmine 6.0 plugin (Rails), React 19, Vite 7
- Architecture: Redmine プラグイン + SPA フロントエンド

## Dev environment setup

### バックエンド (Redmine プラグイン)

- プラグインを Redmine の `plugins/` ディレクトリに配置
- Docker で Redmine 環境を起動: `docker compose up -d --wait`
- Redmine: `http://localhost:3003`

### フロントエンド (SPA)

- 作業ディレクトリ: `spa/`
- 依存インストール: `cd spa && npm ci`
- Node.js バージョン: 20 以上
- 開発サーバー: `cd spa && npm run dev`

## Build commands

- SPA ビルド: `cd spa && npm run build` (TypeScript コンパイル + Vite ビルド → `assets/build/` に出力)
- 開発サーバー: `cd spa && npm run dev`
- TypeScript 型チェック: `cd spa && tsc -b`

## Testing instructions

### ユニットテスト (Vitest)

- 全テスト実行: `cd spa && npm run test -- --run`
- ウォッチモード: `cd spa && npm run test`
- 単一ファイル: `cd spa && npx vitest run src/components/GanttContainer.resize.test.tsx`

### E2E テスト (Playwright)

- スタンドアロン E2E: `cd spa && npm run test:e2e`
- ヘッド付き: `cd spa && npm run test:e2e:headed`
- Redmine 統合 E2E (Docker 環境必要): `cd spa && npx playwright test -c playwright.redmine.config.ts`

### バックエンド (RSpec)

- `bundle exec rspec spec/`

## Code style

- Linter: `cd spa && npm run lint`
- 設定: `spa/eslint.config.js` (ESLint 9 flat config)
  - `@eslint/js` recommended
  - `typescript-eslint` recommended
  - `eslint-plugin-react-hooks` recommended
  - `eslint-plugin-react-refresh` (Vite)
- TypeScript: strict モード有効 (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`)
- コミット前に `npm run lint` と `npm run test -- --run` を必ず実行

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`):

1. **spa-test**: Lint → Unit Tests
2. **e2e-redmine**: Docker で Redmine スタック起動 → Playwright E2E

## Security considerations

- API キーやシークレットをコミットしない
- 環境変数で機密設定を管理
- Redmine の権限モデル (`view_canvas_gantt`, `edit_canvas_gantt`) を遵守

## Architecture

```
redmine_canvas_gantt/
├── init.rb                    # プラグイン登録・設定・アセットリンク
├── config/
│   ├── routes.rb              # API ルーティング定義
│   └── locales/               # i18n (en.yml, ja.yml)
├── app/
│   ├── controllers/           # canvas_gantts_controller.rb
│   └── views/                 # ERB テンプレート
├── lib/                       # ライブラリ・Rake タスク
├── spec/                      # RSpec テスト
├── assets/build/              # SPA ビルド成果物 (Vite 出力先)
├── spa/                       # React SPA (詳細は spa/AGENTS.md)
├── docker-compose.yml         # Redmine + MariaDB 開発環境
└── .github/workflows/ci.yml   # CI パイプライン
```

- `canvas_gantts_controller.rb` が API エンドポイントを提供 (data, update, destroy_relation)
- SPA は `window.RedmineCanvasGantt` グローバルオブジェクトから設定を受け取る
- ビルド成果物は `assets/build/` に出力され、`init.rb` が `public/plugin_assets/` にシンボリックリンクを作成
