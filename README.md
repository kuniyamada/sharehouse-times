# シェアハウス情報まとめ

全国のシェアハウスに関する最新情報を日付順でまとめて表示するWebアプリケーションです。

## 機能

### 完成済み機能
- 📰 **ニュース表示**: シェアハウス関連の最新ニュース
- 🏠 **物件情報**: 新着シェアハウス物件の紹介
- 💡 **生活Tips**: シェアハウス生活のコツやアドバイス
- 📊 **トレンド**: 市場動向や新しいトレンド情報
- 🔍 **カテゴリフィルター**: カテゴリ別に情報を絞り込み
- 📅 **日付順表示**: 新しい情報から順に表示
- 🔄 **ワンクリック更新**: ボタン一つで最新情報を取得

### 今後の開発予定
- [ ] 実際のWeb検索API連携（現在はサンプルデータ）
- [ ] お気に入り機能
- [ ] 地域別フィルター（東京、大阪、福岡など）
- [ ] 通知機能
- [ ] PWA対応

## URL

### 開発環境
- **ローカル**: http://localhost:3000

### API エンドポイント
| パス | メソッド | 説明 |
|------|----------|------|
| `/` | GET | メインページ（HTML） |
| `/api/news` | GET | シェアハウス情報一覧（JSON） |

## 技術スタック

- **Framework**: Hono
- **Runtime**: Cloudflare Pages / Workers
- **Frontend**: TailwindCSS (CDN), Font Awesome
- **Language**: TypeScript

## プロジェクト構成

```
webapp/
├── src/
│   └── index.tsx      # メインアプリケーション
├── public/
│   └── static/        # 静的ファイル
├── dist/              # ビルド出力
├── ecosystem.config.cjs # PM2設定
├── wrangler.jsonc     # Cloudflare設定
├── package.json
└── README.md
```

## 開発コマンド

```bash
# 開発サーバー起動（サンドボックス環境）
npm run build
pm2 start ecosystem.config.cjs

# ビルド
npm run build

# デプロイ（Cloudflare Pages）
npm run deploy
```

## データモデル

### NewsItem
```typescript
{
  title: string;      // 記事タイトル
  summary: string;    // 要約
  category: 'news' | 'property' | 'tips' | 'trend';
  source: string;     // 情報源
  date: string;       // 日付 (YYYY-MM-DD)
  url?: string;       // 記事URL
}
```

## デプロイ

### Cloudflare Pages
1. `npm run build` でビルド
2. `wrangler pages deploy dist` でデプロイ

## ライセンス

MIT
