# シェアハウスニュース

全国のシェアハウスに関する最新ニュース・トレンド・生活情報を毎朝自動更新でお届けするWebアプリケーションです。

## 機能

### 完成済み機能
- 📰 **ニュース表示**: カテゴリ別（ニュース・トレンド・生活ガイド・物件情報・インタビュー）
- 🖼️ **写真付き記事**: アイキャッチ画像で視覚的に分かりやすく
- 🔍 **カテゴリフィルター**: ワンクリックでカテゴリ絞り込み
- 📅 **日本時間表示**: すべての日時がJST（日本標準時）で表示
- ⏰ **毎朝10時自動更新**: Cloudflare Cron Triggersで定期実行
- 💾 **KVキャッシュ**: ニュースデータをCloudflare KVに保存
- 🔥 **人気記事ランキング**: サイドセクションに表示

### 自動更新の仕組み
- **Cron Schedule**: `0 1 * * *` (UTC) = 毎朝10:00 (JST)
- **データ保存**: Cloudflare KV Namespace
- **フォールバック**: KVが利用できない場合はデフォルトデータを表示

## URL

### 開発環境
- **ローカル**: http://localhost:3000

### API エンドポイント
| パス | メソッド | 説明 |
|------|----------|------|
| `/` | GET | メインページ（HTML） |
| `/api/news` | GET | ニュース一覧（JSON） |
| `/api/news/refresh` | POST | 手動でニュース更新 |

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
│   └── index.tsx      # メインアプリケーション（API + HTML）
├── public/            # 静的ファイル
├── dist/              # ビルド出力
├── ecosystem.config.cjs # PM2設定
├── wrangler.jsonc     # Cloudflare設定（KV, Cron）
├── package.json
└── README.md
```

## 設定ファイル

### wrangler.jsonc
```jsonc
{
  "name": "sharehouse-news",
  "kv_namespaces": [
    {
      "binding": "NEWS_KV",
      "id": "sharehouse-news-kv"
    }
  ],
  "triggers": {
    "crons": ["0 1 * * *"]  // UTC 01:00 = JST 10:00
  }
}
```

## 開発コマンド

```bash
# 開発サーバー起動
npm run build
pm2 start ecosystem.config.cjs

# ビルド
npm run build

# デプロイ（Cloudflare Pages）
npm run deploy
```

## デプロイ手順

### 1. KV Namespaceの作成
```bash
npx wrangler kv:namespace create NEWS_KV
```

### 2. wrangler.jsoncにIDを設定
作成されたIDをwrangler.jsoncの`kv_namespaces`に設定

### 3. デプロイ
```bash
npm run build
npx wrangler pages deploy dist --project-name sharehouse-news
```

## データモデル

### NewsItem
```typescript
{
  id: number;
  title: string;      // 記事タイトル
  summary: string;    // 要約
  category: 'news' | 'trend' | 'guide' | 'property' | 'interview';
  source: string;     // 情報源
  date: string;       // 日付（日本語形式）
  image: string;      // アイキャッチ画像URL
  url: string;        // 記事リンク
  isPopular: boolean; // 人気記事フラグ
}
```

## ライセンス

MIT
