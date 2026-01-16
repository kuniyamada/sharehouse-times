# SHARE HOUSE TIMES

シェアハウス・コリビング・東京一人暮らしに関する最新ニュースとコラムを毎日自動更新でお届けするWebアプリケーションです。

## 本番URL

- **メインサイト**: https://sharehouse-times.pages.dev/
- **ブログ一覧**: https://sharehouse-times.pages.dev/blog
- **サイトマップ**: https://sharehouse-times.pages.dev/sitemap.xml

## 管理画面

| ページ | URL | パスワード |
|--------|-----|------------|
| 管理メニュー | /admin | sharehouse2026 |
| ブログ管理 | /admin/blog | sharehouse2026 |
| バックアップ管理 | /admin/backup | sharehouse2026 |

## 機能一覧

### ニュース機能
- 📰 **ニュース自動取得**: Google News RSSから最新ニュースを自動取得（過去7日間）
- 🔍 **カテゴリフィルター**: 女性専用、ペット可、外国人向け、学生向け、リモートワーク向け、エリア別など
- 📅 **日付順表示**: 最新ニュースが上に表示
- 🔗 **元記事リンク**: ニュースをクリックで元記事に直接遷移
- 🗑️ **重複除去**: 同じニュースが異なるソースから配信されても重複表示しない

### ブログ機能
- 📝 **手動投稿**: Markdown対応のブログ記事投稿
- 🏷️ **カテゴリ・タグ**: 記事の分類と検索性向上
- 👤 **著者名**: 記事ごとに著者を設定可能
- 📊 **閲覧数カウント**: 記事の人気度を把握
- 🖼️ **アイキャッチ画像**: 記事にサムネイル画像を設定可能
- ✏️ **下書き保存**: 公開前に記事を保存
- 📱 **トップページ表示**: 最新4件がトップページに表示

### バックアップ機能
- 💾 **バックアップ作成**: ニュース・ブログデータの手動バックアップ
- 👀 **プレビュー機能**: バックアップ内容を復元前に確認
- 📋 **詳細表示**: ニュース件数、ブログ記事一覧、更新日時などを表示
- 🔄 **復元機能**: バックアップからデータを復元
- 🗑️ **削除機能**: 不要なバックアップを削除

### SEO対策
- 🔎 **メタタグ最適化**: title, description, keywords設定済み
- 📍 **構造化データ**: JSON-LD（WebSite, NewsArticle, FAQPage）
- 🗺️ **サイトマップ**: 動的生成（sitemap.xml, sitemap-news.xml）
- 📡 **RSS/Atomフィード**: feed.xml, atom.xml
- 🤖 **robots.txt**: カスタム設定
- 🔗 **canonical URL**: 重複コンテンツ対策

### LLMO対策
- 📄 **llms.txt**: AIボット向け情報ファイル
- 🔌 **API**: /api/llms でサイト情報をJSON形式で提供

## APIエンドポイント

| パス | メソッド | 説明 |
|------|----------|------|
| `/` | GET | トップページ（HTML） |
| `/api/news` | GET | ニュース一覧（JSON） |
| `/api/news/refresh` | POST | ニュース手動更新 |
| `/api/blog` | GET | ブログ記事一覧 |
| `/api/blog/:slug` | GET | ブログ記事詳細 |
| `/api/backups` | GET | バックアップ一覧 |
| `/sitemap.xml` | GET | サイトマップ |
| `/feed.xml` | GET | RSSフィード |

## 技術スタック

- **Framework**: Hono
- **Runtime**: Cloudflare Pages / Workers
- **Storage**: Cloudflare KV
- **Scheduler**: Cloudflare Cron Triggers
- **Frontend**: TailwindCSS (CDN), Font Awesome
- **Language**: TypeScript

## プロジェクト構成

```
webapp/
├── src/
│   ├── index.tsx        # メインアプリケーション
│   ├── seo-routes.ts    # SEO関連ルート（サイトマップ、RSS等）
│   ├── llmo-routes.ts   # LLMO対策ルート
│   ├── blog-routes.ts   # ブログ機能
│   ├── backup-routes.ts # バックアップ機能
│   └── news-fetcher.ts  # ニュース取得ロジック
├── public/              # 静的ファイル
├── dist/                # ビルド出力
├── wrangler.jsonc       # Cloudflare設定
├── ecosystem.config.cjs # PM2設定
└── package.json
```

## 開発コマンド

```bash
# 開発サーバー起動
npm run build
pm2 start ecosystem.config.cjs

# ビルド
npm run build

# デプロイ
npm run deploy

# ニュース手動更新
curl -X POST https://sharehouse-times.pages.dev/api/news/refresh
```

## データモデル

### NewsItem
```typescript
{
  id: number;
  title: string;       // 記事タイトル
  summary: string;     // 要約
  category: string;    // カテゴリ
  source: string;      // ニュースソース
  date: string;        // 日付
  pubDate: string;     // 公開日時（ISO形式）
  originalUrl: string; // 元記事URL
}
```

### BlogPost
```typescript
{
  id: string;
  slug: string;           // URLスラッグ
  title: string;          // 記事タイトル
  content: string;        // 本文（Markdown）
  excerpt: string;        // 抜粋
  category: string;       // カテゴリ
  tags: string[];         // タグ
  author: string;         // 著者
  status: 'draft' | 'published';
  featuredImage: string;  // アイキャッチ画像URL
  views: number;          // 閲覧数
  createdAt: string;      // 作成日時
  updatedAt: string;      // 更新日時
  publishedAt: string;    // 公開日時
}
```

## ライセンス

MIT
