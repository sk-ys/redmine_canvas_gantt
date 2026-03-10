<div align="center">

# Redmine Canvas Gantt

Redmine 向けの高性能 Canvas ガントチャートプラグイン。

Listed on Redmine Plugins Directory:
https://www.redmine.org/plugins/redmine_canvas_gantt

[![License](https://img.shields.io/github/license/tiohsa/redmine_canvas_gantt)](LICENSE)
[![Redmine](https://img.shields.io/badge/Redmine-6.x-red)](#requirements)
[![Ruby](https://img.shields.io/badge/Ruby-3.x-cc342d)](#requirements)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933)](#requirements)

[English README](README.md) · [Issues](https://github.com/tiohsa/redmine_canvas_gantt/issues)

</div>

---

## Overview

Redmine Canvas Gantt は、タイムラインを HTML5 Canvas で描画しつつ左側のサイドバーを直接編集できる、Redmine 向けの高速なガントチャートプラグインです。標準の Redmine ガントが見づらい、または重くなりやすいプロジェクト向けに設計されています。

## Features

- Canvas ベースの高速描画による滑らかなスクロールとズーム
- タスクの移動、期間変更、端点ドラッグによる依存関係作成
- 依存関係の作成、更新、削除に対応
- 件名、担当者、ステータス、進捗率、期日、カスタムフィールドのインライン編集
- サイドバーでのドラッグアンドドロップによる親子関係の変更
- 複数行入力による子チケット一括作成
- プロジェクト、担当者、ステータス、バージョン、題名によるフィルタとグループ化
- バージョンヘッダー、進捗ライン、行高プリセット、UI 設定の永続化

## Demo

![Canvas Gantt Demo](./docs/demo.gif)

![Canvas Gantt Demo](./docs/demo2.gif)

## Requirements

- Redmine 6.x
- Ruby 3.x
- SPA ビルドおよびフロントエンド開発用に Node.js 20+
- Redmine で REST API が有効化されていること

### Security and impact

- データベースマイグレーション: なし
- 追加パーミッション: `view_canvas_gantt`, `edit_canvas_gantt`
- アンインストール: プラグインディレクトリを削除して Redmine を再起動

## Installation

1. プラグインを Redmine の `plugins/` ディレクトリに配置します。

   ```bash
   cd /path/to/redmine/plugins
   git clone https://github.com/tiohsa/redmine_canvas_gantt.git
   ```

2. Redmine を再起動します。

   配置後にアプリケーションサーバーを再起動してください。

## Usage

1. REST API を有効化します。
   **管理** -> **設定** -> **API** で **REST による Web サービスを有効にする** を有効化します。

2. プロジェクトモジュールを有効化します。
   **プロジェクト** -> **設定** -> **モジュール** で **Canvas Gantt** を有効化します。

3. 権限を付与します。
   **管理** -> **ロールと権限** で `view_canvas_gantt` と `edit_canvas_gantt` を必要に応じて付与します。

4. チャートを開きます。
   プロジェクトメニューの **Canvas Gantt** をクリックします。

5. タスクを操作します。
   - Ctrl/Cmd + マウスホイールまたはツールバーでズーム
   - タスクをドラッグしてタイムライン上で移動
   - タスク端をドラッグして期間変更
   - 端点ドットからドラッグして依存関係を作成
   - 依存関係編集から種別や delay を変更、または削除
   - サイドバーの行を別タスクへドラッグして子チケット化
   - 子チケット一括作成で複数の子チケットをまとめて追加

## Configuration

**管理** -> **プラグイン** -> **Canvas Gantt** -> **設定** から設定します。

- インライン編集切替: `subject`, `assigned_to`, `status`, `done_ratio`, `due_date`, `custom_fields`
- `row_height`: デフォルト行高
- `use_vite_dev_server`: 開発時に `http://localhost:5173` のフロントエンド資産を利用

### Compatibility note

`redmica_ui_extension` による Select2 の挙動が Canvas Gantt の操作に干渉する場合は、**管理** -> **プラグイン** -> **Redmica UI Extension** -> **設定** で検索可能セレクトボックスを無効化してください。

## Docker Quick Start

このリポジトリには、Redmine 6.0 と MariaDB をローカルで起動するための `docker-compose.yml` が含まれています。

### スタックを起動

```bash
docker compose up -d --wait
```

[http://localhost:3000](http://localhost:3000) で Redmine を開けます。

### 初期データを投入

```bash
docker compose exec -T -e REDMINE_LANG=ja redmine bundle exec rake redmine:load_default_data
docker compose exec -T redmine bundle exec rake db:fixtures:load
```

### プロジェクトで Canvas Gantt を有効化

1. 対象プロジェクトを開きます。
2. **設定** -> **モジュール** を開きます。
3. **Canvas Gantt** を有効化します。
4. 編集が必要な場合は、利用ロールに `view_canvas_gantt` と `edit_canvas_gantt` を付与します。

### スタックを停止

```bash
docker compose down
```

## Development

SPA フロントエンドは `spa/` にあります。

```bash
cd spa
npm ci
npm run build
npm run lint
npm run test -- --run
```

フロントエンドをライブ開発する場合:

```bash
cd spa
npm run dev
```

その後、プラグイン設定で `use_vite_dev_server` を有効化してください。

### Redmine integration tests

`spa/` から Redmine 連携の Playwright テストを実行できます。

```bash
npx playwright test -c playwright.redmine.config.ts
```

## Build Output

- `npm run build` の出力先は `assets/build/`
- Redmine 起動時に、それらのファイルは `public/plugin_assets/redmine_canvas_gantt/build` へリンクまたはコピーされます
- フォールバック資産ルート `/plugin_assets/redmine_canvas_gantt/build/*` も利用できます

## License

GNU General Public License v2.0 (GPL v2). 詳細は [LICENSE](LICENSE) を参照してください。
