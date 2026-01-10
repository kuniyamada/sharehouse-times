import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createSeoRoutes } from './seo-routes'
import { createLlmoRoutes } from './llmo-routes'

// Cloudflare Bindings型定義
type Bindings = {
  NEWS_KV: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// SEO対策ルートを追加（ニュース個別ページ、サイトマップ、RSS）
app.route('/', createSeoRoutes())

// LLMO対策ルートを追加（/llms.txt, /api/llms, /.well-known/llms.txt）
app.route('/', createLlmoRoutes())

// Google Search Console 確認用
app.get('/googlec63dbc50a2bf04c5.html', (c) => {
  return c.text('google-site-verification: googlec63dbc50a2bf04c5.html')
})



// クランテラスの画像URL（物件別）
const CRANN_IMAGES = {
  // クランテラス久が原
  kugahara: '/images/kugahara.jpg',
  // クランテラス溝の口
  mizonokuchi: '/images/mizonokuchi.jpg',
  // クランテラス品川
  shinagawa: '/images/shinagawa.jpg',
}

// モダンスタイル（ミニマル・クリーン）
const yahooStyles = `
    <style>
        * { 
            font-family: "Inter", "Hiragino Kaku Gothic ProN", "Hiragino Sans", sans-serif;
            -webkit-tap-highlight-color: transparent;
        }
        
        body {
            background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
            font-size: 14px;
            min-height: 100vh;
            overscroll-behavior-y: contain;
        }
        
        /* Pull to Refresh インジケーター */
        .pull-indicator {
            position: fixed;
            top: 0;
            left: 50%;
            transform: translateX(-50%) translateY(-100%);
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 0 0 20px 20px;
            font-size: 13px;
            font-weight: 600;
            z-index: 9999;
            transition: transform 0.3s ease;
            box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .pull-indicator.visible {
            transform: translateX(-50%) translateY(0);
        }
        .pull-indicator.refreshing {
            transform: translateX(-50%) translateY(0);
        }
        .pull-indicator i {
            transition: transform 0.3s ease;
        }
        .pull-indicator.refreshing i {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        /* 更新ボタン */
        .refresh-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(99, 102, 241, 0.3);
        }
        .refresh-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
        }
        .refresh-btn:active {
            transform: scale(0.95);
        }
        .refresh-btn.refreshing i {
            animation: spin 1s linear infinite;
        }
        
        /* 最終更新時刻 */
        .last-updated {
            font-size: 10px;
            color: #64748b;
            text-align: center;
            padding: 8px;
            background: rgba(255,255,255,0.8);
            border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        
        /* トーストアニメーション */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateX(-50%) translateY(20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        /* ヘッダー - グラスモーフィズム */
        .yahoo-header {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(0,0,0,0.08);
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        /* タブナビゲーション */
        .tab-nav {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(0,0,0,0.06);
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            white-space: nowrap;
            position: sticky;
            top: 44px;
            z-index: 99;
        }
        .tab-nav::-webkit-scrollbar {
            display: none;
        }
        .tab-item {
            display: inline-block;
            padding: 14px 20px;
            color: #64748b;
            text-decoration: none;
            font-size: 13px;
            font-weight: 600;
            border-bottom: 2px solid transparent;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .tab-item:hover {
            color: #6366f1;
        }
        .tab-item.active {
            color: #6366f1;
            border-bottom-color: #6366f1;
        }
        
        /* モバイルカテゴリーメニュー */
        .mobile-cat-menu {
            background: rgba(255, 255, 255, 0.95);
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            white-space: nowrap;
            border-bottom: 1px solid rgba(0,0,0,0.06);
            padding: 12px 0;
        }
        .mobile-cat-menu::-webkit-scrollbar {
            display: none;
        }
        .mobile-cat-item {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            margin: 0 4px;
            background: #f1f5f9;
            border: none;
            border-radius: 100px;
            font-size: 12px;
            font-weight: 600;
            color: #64748b;
            text-decoration: none;
            white-space: nowrap;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .mobile-cat-item:hover {
            background: #e2e8f0;
            color: #6366f1;
        }
        .mobile-cat-item.active {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
        }
        
        /* カテゴリーセクション */
        .cat-section-title {
            font-size: 11px;
            color: #94a3b8;
            padding: 12px 16px 8px;
            background: transparent;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        
        /* 左サイドのカテゴリメニュー（PC用） */
        .side-menu {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(10px);
            border-right: 1px solid rgba(0,0,0,0.06);
            max-height: calc(100vh - 90px);
            overflow-y: auto;
            position: sticky;
            top: 90px;
        }
        .side-menu::-webkit-scrollbar {
            width: 4px;
        }
        .side-menu::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }
        .side-menu-section {
            border-bottom: 1px solid rgba(0,0,0,0.04);
            padding: 8px 0;
        }
        .side-menu-section-title {
            font-size: 10px;
            color: #94a3b8;
            padding: 8px 16px;
            font-weight: 700;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            background: transparent;
        }
        .side-menu-section:nth-child(1) .side-menu-section-title { color: #6366f1; }
        .side-menu-section:nth-child(2) .side-menu-section-title { color: #ec4899; }
        .side-menu-section:nth-child(3) .side-menu-section-title { color: #06b6d4; }
        .side-menu-item {
            display: flex;
            align-items: center;
            padding: 10px 16px;
            margin: 2px 8px;
            color: #64748b;
            text-decoration: none;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .side-menu-item:hover {
            background: #f1f5f9;
            color: #6366f1;
        }
        .side-menu-item.active {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            font-weight: 600;
        }
        
        /* トピックス（メイン）- グラスモーフィズム */
        .topics-box {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.8);
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.06);
            overflow: hidden;
        }
        @media (max-width: 767px) {
            .topics-box {
                border-radius: 0;
                margin-left: 0 !important;
                margin-right: 0 !important;
                border-left: none;
                border-right: none;
            }
        }
        .topics-header {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            border-bottom: none;
            padding: 14px 20px;
            font-weight: 700;
            font-size: 14px;
            color: #fff;
            letter-spacing: 0.3px;
        }
        .topics-header-icon {
            color: #fff;
            margin-right: 8px;
        }
        
        /* セクション別ヘッダー色 */
        .section-japan .topics-header {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        }
        .section-world .topics-header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        .section-ranking .topics-header {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
        
        /* 見出しリスト */
        .headline-item {
            padding: 16px 20px;
            border-bottom: 1px solid rgba(0,0,0,0.04);
            display: flex;
            align-items: flex-start;
            gap: 14px;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .headline-item:hover {
            background: rgba(99, 102, 241, 0.04);
        }
        .headline-item:active {
            background: rgba(99, 102, 241, 0.08);
        }
        .headline-link {
            color: #1e293b;
            text-decoration: none;
            font-size: 14px;
            line-height: 1.7;
            flex: 1;
            display: block;
            font-weight: 500;
        }
        .headline-link:hover {
            color: #6366f1;
        }
        @media (max-width: 767px) {
            .headline-link {
                font-size: 15px;
            }
        }
        
        /* NEWバッジ */
        .badge-new {
            background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
            color: white;
            font-size: 9px;
            padding: 3px 8px;
            border-radius: 4px;
            margin-left: 6px;
            vertical-align: middle;
            font-weight: bold;
            letter-spacing: 0.5px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
        }
        
        /* カテゴリアイコン */
        .cat-icon {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-size: 14px;
            color: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        }
        
        /* 情報元 */
        .source-info {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        /* カテゴリータグ */
        .cat-tag {
            display: inline-block;
            font-size: 10px;
            padding: 4px 10px;
            border-radius: 100px;
            font-weight: 600;
            letter-spacing: 0.3px;
        }
        
        /* PR広告枠 - グラスモーフィズム */
        .pr-box {
            border: 1px solid rgba(255,255,255,0.8);
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.06);
            overflow: hidden;
        }
        .pr-header {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            padding: 12px 16px;
            font-size: 12px;
            font-weight: 700;
            color: #fff;
            border-bottom: none;
        }
        
        /* クランテラス広告 */
        .crann-ad {
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            color: white;
            border-radius: 16px;
            overflow: hidden;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        .crann-ad:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(5, 150, 105, 0.3);
        }
        
        /* モバイル用クランテラスバナー */
        .mobile-crann-banner {
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            color: white;
            margin: 16px;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(5, 150, 105, 0.25);
        }
        
        /* ランキング */
        .ranking-num {
            width: 26px;
            height: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            border-radius: 8px;
            flex-shrink: 0;
        }
        .rank-1 { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #fff; }
        .rank-2 { background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%); color: #fff; }
        .rank-3 { background: linear-gradient(135deg, #d97706 0%, #b45309 100%); color: #fff; }
        .rank-other { background: #f1f5f9; color: #64748b; }
        
        /* 更新時刻 */
        .update-time {
            font-size: 11px;
            color: #94a3b8;
        }

        /* フッター */
        .yahoo-footer {
            background: #1e293b;
            border-top: none;
        }
        .footer-link {
            color: #94a3b8;
            text-decoration: none;
            font-size: 12px;
            transition: color 0.2s;
        }
        .footer-link:hover {
            color: #6366f1;
            text-decoration: none;
        }
        
        /* モバイルフッター固定バナー */
        .mobile-fixed-banner {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            color: white;
            padding: 14px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 1000;
            box-shadow: 0 -4px 24px rgba(0,0,0,0.1);
        }
        
        /* 注目キーワード */
        .keyword-tag {
            display: inline-block;
            padding: 8px 14px;
            margin: 4px;
            background: #f1f5f9;
            border-radius: 100px;
            font-size: 12px;
            color: #64748b;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: none;
        }
        .keyword-tag:hover {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: #fff;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }
        
        /* カテゴリー別ハイライト色 - よりソフトに */
        .cat-highlight-new_open { border-left: 3px solid #3b82f6; background: linear-gradient(90deg, rgba(59,130,246,0.05) 0%, transparent 100%); }
        .cat-highlight-women { border-left: 3px solid #ec4899; background: linear-gradient(90deg, rgba(236,72,153,0.05) 0%, transparent 100%); }
        .cat-highlight-senior { border-left: 3px solid #f97316; background: linear-gradient(90deg, rgba(249,115,22,0.05) 0%, transparent 100%); }
        .cat-highlight-pet { border-left: 3px solid #f59e0b; background: linear-gradient(90deg, rgba(245,158,11,0.05) 0%, transparent 100%); }
        .cat-highlight-foreign { border-left: 3px solid #22c55e; background: linear-gradient(90deg, rgba(34,197,94,0.05) 0%, transparent 100%); }
        .cat-highlight-student { border-left: 3px solid #6366f1; background: linear-gradient(90deg, rgba(99,102,241,0.05) 0%, transparent 100%); }
        .cat-highlight-budget { border-left: 3px solid #eab308; background: linear-gradient(90deg, rgba(234,179,8,0.05) 0%, transparent 100%); }
        .cat-highlight-remote { border-left: 3px solid #06b6d4; background: linear-gradient(90deg, rgba(6,182,212,0.05) 0%, transparent 100%); }
        .cat-highlight-tokyo { border-left: 3px solid #ef4444; background: linear-gradient(90deg, rgba(239,68,68,0.05) 0%, transparent 100%); }
        .cat-highlight-osaka { border-left: 3px solid #a855f7; background: linear-gradient(90deg, rgba(168,85,247,0.05) 0%, transparent 100%); }
        .cat-highlight-trend { border-left: 3px solid #2563eb; background: linear-gradient(90deg, rgba(37,99,235,0.05) 0%, transparent 100%); }
        .cat-highlight-coliving { border-left: 3px solid #14b8a6; background: linear-gradient(90deg, rgba(20,184,166,0.05) 0%, transparent 100%); }
        .cat-highlight-desk_tour { border-left: 3px solid #8b5cf6; background: linear-gradient(90deg, rgba(139,92,246,0.05) 0%, transparent 100%); }
        .cat-highlight-company_housing { border-left: 3px solid #475569; background: linear-gradient(90deg, rgba(71,85,105,0.05) 0%, transparent 100%); }
        
        /* スマホ用の余白調整 */
        @media (max-width: 767px) {
            body {
                padding-bottom: 70px;
            }
        }
    </style>
`

// ニュースページ（Yahoo! JAPAN風トップ - スマホ対応）
app.get('/', (c) => {
  const currentDate = new Date().toISOString();
  
  return c.html(`
<!DOCTYPE html>
<html lang="ja" prefix="og: https://ogp.me/ns#">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="format-detection" content="telephone=no">
    
    <!-- 基本SEOメタタグ -->
    <title>シェアハウス探し・東京一人暮らし情報｜SHARE HOUSE TIMES</title>
    <meta name="description" content="【2026年最新】シェアハウス・コリビングの最新ニュースをAIが毎日更新。東京で一人暮らしを始める方、女性専用・ペット可・格安物件を探している方必見。社宅・借り上げ社宅・法人契約情報も充実。家賃相場、初期費用、エリア別おすすめ情報を網羅。">
    <meta name="keywords" content="シェアハウス,東京 一人暮らし,コリビング,女性専用シェアハウス,ペット可シェアハウス,格安シェアハウス,東京 シェアハウス,社宅,借り上げ社宅,法人契約,一人暮らし 費用,家賃相場,初期費用,賃貸">
    <meta name="author" content="SHARE HOUSE TIMES">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="googlebot" content="index, follow">
    <meta name="google-site-verification" content="bhdWzbIDYMG2GKfgXbEW-MEKU4f2zmw6TvusTNrRr0E" />
    <link rel="canonical" href="https://sharehouse-times.pages.dev/">
    
    <!-- 多言語対応 -->
    <link rel="alternate" hreflang="ja" href="https://sharehouse-times.pages.dev/">
    <link rel="alternate" hreflang="x-default" href="https://sharehouse-times.pages.dev/">
    
    <!-- OGP（Open Graph Protocol） -->
    <meta property="og:site_name" content="SHARE HOUSE TIMES">
    <meta property="og:title" content="シェアハウス探し・東京一人暮らし情報｜SHARE HOUSE TIMES">
    <meta property="og:description" content="シェアハウス・コリビングの最新ニュースをAIが毎日更新。東京で一人暮らしを始める方必見の情報サイト。">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://sharehouse-times.pages.dev/">
    <meta property="og:image" content="https://sharehouse-times.pages.dev/images/kugahara.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:locale" content="ja_JP">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="シェアハウス探し・東京一人暮らし情報｜SHARE HOUSE TIMES">
    <meta name="twitter:description" content="シェアハウス・コリビングの最新ニュースをAIが毎日更新。">
    <meta name="twitter:image" content="https://sharehouse-times.pages.dev/images/kugahara.jpg">
    
    <!-- ファビコン & アプリアイコン -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">
    
    <!-- iOS（iPhone/iPad）ホーム画面アイコン -->
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="シェアハウス">
    
    <!-- Android ホーム画面アイコン & PWA -->
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#6366f1">
    <meta name="mobile-web-app-capable" content="yes">
    
    <!-- 構造化データ（JSON-LD） -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "SHARE HOUSE TIMES",
      "alternateName": "シェアハウスタイムズ",
      "url": "https://sharehouse-times.pages.dev/",
      "description": "シェアハウス・コリビングの最新ニュースをAIが毎日更新",
      "inLanguage": "ja",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://sharehouse-times.pages.dev/?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    }
    </script>
    
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "SHARE HOUSE TIMES",
      "url": "https://sharehouse-times.pages.dev/",
      "logo": "https://sharehouse-times.pages.dev/images/kugahara.jpg",
      "description": "AIがシェアハウス・コリビングの最新情報を毎日お届け",
      "foundingDate": "2026",
      "sameAs": []
    }
    </script>
    
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsMediaOrganization",
      "name": "SHARE HOUSE TIMES",
      "url": "https://sharehouse-times.pages.dev/",
      "description": "シェアハウス・東京一人暮らしに特化したニュースメディア",
      "actionableFeedbackPolicy": "https://sharehouse-times.pages.dev/",
      "diversityPolicy": "https://sharehouse-times.pages.dev/",
      "ethicsPolicy": "https://sharehouse-times.pages.dev/"
    }
    </script>
    
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "シェアハウスカテゴリー一覧",
      "description": "シェアハウスの種類・エリア別カテゴリー",
      "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "女性専用シェアハウス", "url": "https://sharehouse-times.pages.dev/#women"},
        {"@type": "ListItem", "position": 2, "name": "ペット可シェアハウス", "url": "https://sharehouse-times.pages.dev/#pet"},
        {"@type": "ListItem", "position": 3, "name": "格安シェアハウス", "url": "https://sharehouse-times.pages.dev/#budget"},
        {"@type": "ListItem", "position": 4, "name": "東京のシェアハウス", "url": "https://sharehouse-times.pages.dev/#tokyo"},
        {"@type": "ListItem", "position": 5, "name": "コリビング", "url": "https://sharehouse-times.pages.dev/#coliving"},
        {"@type": "ListItem", "position": 6, "name": "東京一人暮らし情報", "url": "https://sharehouse-times.pages.dev/#tokyo_life"},
        {"@type": "ListItem", "position": 7, "name": "社宅・法人契約", "url": "https://sharehouse-times.pages.dev/#company_housing"}
      ]
    }
    </script>
    
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "ホーム",
          "item": "https://sharehouse-times.pages.dev/"
        }
      ]
    }
    </script>
    
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "シェアハウスとは何ですか？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "シェアハウスとは、複数の入居者がキッチンやリビングなどの共用スペースを共有しながら、個室で生活する賃貸住宅の形態です。一人暮らしより家賃を抑えられ、入居者同士の交流も楽しめます。"
          }
        },
        {
          "@type": "Question",
          "name": "東京でシェアハウスの家賃相場はいくらですか？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "東京のシェアハウスの家賃相場は、エリアや設備により異なりますが、一般的に月額4万円〜8万円程度です。山手線沿線など人気エリアは6万円〜10万円程度になることもあります。"
          }
        },
        {
          "@type": "Question",
          "name": "シェアハウスの初期費用はいくらですか？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "シェアハウスの初期費用は一般的な賃貸より低く、デポジット（保証金）1ヶ月分＋初月家賃程度で入居できることが多いです。敷金・礼金・仲介手数料が不要な物件も多くあります。"
          }
        },
        {
          "@type": "Question",
          "name": "女性専用シェアハウスのメリットは？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "女性専用シェアハウスは、セキュリティ面での安心感、清潔な共用スペース、女性同士の気軽なコミュニケーションなどのメリットがあります。オートロックや防犯カメラ完備の物件も多いです。"
          }
        },
        {
          "@type": "Question",
          "name": "社宅・借り上げ社宅とシェアハウスの違いは？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "社宅・借り上げ社宅は企業が従業員のために用意する住居で、家賃補助や福利厚生の一環として提供されます。最近では法人契約可能なシェアハウスも増えており、企業の社宅として活用するケースが増加しています。転勤者や新入社員の住居としてコミュニティ形成にも役立ちます。"
          }
        },
        {
          "@type": "Question",
          "name": "クランテラスとはどんなシェアハウスですか？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "クランテラス（CRANN TERRACE）は東京ディフェンス株式会社が運営する大型シェアハウスシリーズです。久が原（大田区・御嶽山駅徒歩6分・賃料59,800円〜）、溝の口（川崎市高津区・高津駅徒歩4分・賃料59,000円〜）、品川（品川区大井・大井町駅徒歩9分・賃料75,000円〜）の3物件を展開。敷金礼金0円、家具付き、防音室・シアタールーム・ワークスペースなど充実した共用設備が特徴。全物件オートロック・防犯カメラ完備で安心。公式サイト: https://crann-terrace.com/"
          }
        }
      ]
    }
    </script>
    
    <!-- クランテラス物件情報（LLMO対策用構造化データ） -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "クランテラス シェアハウス物件一覧",
      "description": "東京ディフェンス株式会社が運営する大型シェアハウス「クランテラス」シリーズ",
      "numberOfItems": 3,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "item": {
            "@type": "Accommodation",
            "@id": "https://crann-terrace.com/kugahara.html",
            "name": "クランテラス久が原",
            "alternateName": "CRANN TERRACE KUGAHARA",
            "description": "緑と光があふれる憩いの場。防音室・カラオケルーム・ファミリータイプ浴室完備。閑静な住宅地で趣味が広がる自然豊かな生活を実現。",
            "url": "https://crann-terrace.com/kugahara.html",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "大田区",
              "addressRegion": "東京都",
              "addressCountry": "JP"
            },
            "numberOfRooms": 62,
            "floorSize": {
              "@type": "QuantitativeValue",
              "value": 9,
              "unitCode": "MTK"
            },
            "amenityFeature": [
              {"@type": "LocationFeatureSpecification", "name": "防音室", "value": true},
              {"@type": "LocationFeatureSpecification", "name": "カラオケルーム", "value": true},
              {"@type": "LocationFeatureSpecification", "name": "大型バスルーム", "value": true},
              {"@type": "LocationFeatureSpecification", "name": "ガーデン", "value": true},
              {"@type": "LocationFeatureSpecification", "name": "宅配ボックス", "value": true},
              {"@type": "LocationFeatureSpecification", "name": "オートロック", "value": true},
              {"@type": "LocationFeatureSpecification", "name": "防犯カメラ", "value": true},
              {"@type": "LocationFeatureSpecification", "name": "家具付き", "value": true},
              {"@type": "LocationFeatureSpecification", "name": "インターネット無料", "value": true}
            ],
            "priceRange": "¥59,800〜¥92,000/月",
            "additionalProperty": [
              {"@type": "PropertyValue", "name": "共益費", "value": "20,000円/月"},
              {"@type": "PropertyValue", "name": "保証金", "value": "50,000円"},
              {"@type": "PropertyValue", "name": "敷金礼金", "value": "0円"},
              {"@type": "PropertyValue", "name": "アクセス", "value": "東急池上線『御嶽山』駅より徒歩6分、『久が原』駅より徒歩8分"}
            ]
          }
        },
        {
          "@type": "ListItem",
          "position": 2,
          "item": {
            "@type": "Accommodation",
            "@id": "https://crann-terrace.com/mizonokuchi.html",
            "name": "クランテラス溝の口",
            "alternateName": "CRANN TERRACE MIZONOKUCHI",
            "description": "アンティーク家具に囲まれた上質な生活。シアタールーム・クワイエットルーム完備。渋谷駅まで13分、3路線利用可能な好立地。",
            "url": "https://crann-terrace.com/mizonokuchi.html",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "溝口3",
              "addressLocality": "川崎市高津区",
              "addressRegion": "神奈川県",
              "addressCountry": "JP"
            },
            "numberOfRooms": 45,
            "floorSize": {
              "@type": "QuantitativeValue",
              "value": 12.2,
              "unitCode": "MTK"
            },
            "amenityFeature": [
              {"@type": "LocationFeatureSpecification", "name": "シアタールーム", "value": true},
              {"@type": "LocationFeatureSpecification", "name": "クワイエットルーム", "value": true},
              {"@type": "LocationFeatureSpecification", "name": "女性専用フロア", "value": true},
              {"@type": "LocationFeatureSpecification", "name": "アンティーク家具", "value": true},
              {"@type": "LocationFeatureSpecification", "name": "宅配ボックス", "value": true},
              {"@type": "LocationFeatureSpecification", "name": "オートロック", "value": true},
              {"@type": "LocationFeatureSpecification", "name": "防犯カメラ", "value": true},
              {"@type": "LocationFeatureSpecification", "name": "家具付き", "value": true},
              {"@type": "LocationFeatureSpecification", "name": "インターネット無料", "value": true}
            ],
            "priceRange": "¥59,000〜¥67,000/月",
            "additionalProperty": [
              {"@type": "PropertyValue", "name": "共益費", "value": "20,000円/月"},
              {"@type": "PropertyValue", "name": "保証金", "value": "50,000円"},
              {"@type": "PropertyValue", "name": "敷金礼金", "value": "0円"},
              {"@type": "PropertyValue", "name": "アクセス", "value": "東急田園都市線・大井町線『溝の口』駅より徒歩8分、JR南武線『武蔵溝の口』駅より徒歩8分、『高津』駅より徒歩4分"}
            ]
          }
        },
        {
          "@type": "ListItem",
          "position": 3,
          "item": {
            "@type": "Accommodation",
            "@id": "https://crann-terrace.com/shinagawa.html",
            "name": "クランテラス品川",
            "alternateName": "CRANN TERRACE SHINAGAWA",
            "description": "天井高3mの開放的な空間。ガーデンテラス・ワークスペース完備。品川駅まで一駅、4路線利用可能な抜群のアクセス。",
            "url": "https://crann-terrace.com/shinagawa.html",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "品川区大井",
              "addressRegion": "東京都",
              "addressCountry": "JP"
            },
            "numberOfRooms": 41,
            "floorSize": {
              "@type": "QuantitativeValue",
              "value": 9,
              "unitCode": "MTK"
            },
            "amenityFeature": [
              {"@type": "LocationFeatureSpecification", "name": "ガーデンテラス", "value": true},
              {"@type": "LocationFeatureSpecification", "name": "ワークスペース", "value": true},
              {"@type": "LocationFeatureSpecification", "name": "天井高3m", "value": true},
              {"@type": "LocationFeatureSpecification", "name": "宅配ボックス", "value": true},
              {"@type": "LocationFeatureSpecification", "name": "オートロック", "value": true},
              {"@type": "LocationFeatureSpecification", "name": "防犯カメラ", "value": true},
              {"@type": "LocationFeatureSpecification", "name": "家具付き", "value": true},
              {"@type": "LocationFeatureSpecification", "name": "インターネット無料", "value": true}
            ],
            "priceRange": "¥75,000〜¥88,000/月",
            "additionalProperty": [
              {"@type": "PropertyValue", "name": "共益費", "value": "20,000円/月"},
              {"@type": "PropertyValue", "name": "保証金", "value": "50,000円"},
              {"@type": "PropertyValue", "name": "敷金礼金", "value": "0円"},
              {"@type": "PropertyValue", "name": "アクセス", "value": "JR京浜東北線・東急大井町線・りんかい線『大井町』駅より徒歩9分、京急本線『立会川』駅より徒歩9分"}
            ]
          }
        }
      ]
    }
    </script>
    
    <!-- クランテラス運営会社情報 -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "RealEstateAgent",
      "name": "東京ディフェンス株式会社",
      "description": "「ひと、もの、こと。何かと出会える生活を。」をコンセプトに、従来のシェアハウスの概念にとらわれない新しい時代のシェアハウス「クランテラス」を運営",
      "url": "https://crann-terrace.com/",
      "areaServed": ["東京都", "神奈川県"],
      "makesOffer": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "シェアハウス運営",
            "description": "大型シェアハウスの企画・運営。週2回以上の巡回、24時間緊急対応、LINEでの相談対応"
          }
        }
      ],
      "slogan": "ひと、もの、こと。何かと出会える生活を。"
    }
    </script>
    
    <!-- パフォーマンス最適化 -->
    <link rel="preconnect" href="https://cdn.tailwindcss.com">
    <link rel="preconnect" href="https://cdn.jsdelivr.net">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="dns-prefetch" href="https://cdn.tailwindcss.com">
    <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
    
    <!-- CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet">
    ${yahooStyles}
    <style>
        .logo-text { font-family: 'Poppins', sans-serif; }
        .logo-icon {
            background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
            animation: gradient-shift 3s ease infinite;
            background-size: 200% 200%;
        }
        @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        .ai-badge {
            background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
            animation: pulse-glow 2s ease-in-out infinite;
        }
        @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
            50% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
        }
        .header-cta {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .header-cta:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
        }
    </style>
</head>
<body itemscope itemtype="https://schema.org/WebPage">
    <!-- Pull to Refresh インジケーター -->
    <div id="pullIndicator" class="pull-indicator">
        <i class="fas fa-arrow-down"></i>
        <span>引っ張って更新</span>
    </div>
    
    <!-- スキップリンク（アクセシビリティ） -->
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-indigo-600 focus:text-white focus:p-4">
        メインコンテンツへスキップ
    </a>

    <!-- ヘッダー -->
    <header class="yahoo-header" role="banner">
        <div class="max-w-6xl mx-auto px-4 py-3">
            <div class="flex items-center justify-between">
                <a href="/" class="flex items-center gap-3 group" aria-label="SHARE HOUSE TIMES ホーム">
                    <!-- ロゴアイコン -->
                    <div class="logo-icon w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg relative" aria-hidden="true">
                        <i class="fas fa-house-chimney text-lg"></i>
                        <div class="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                            <i class="fas fa-bolt text-[8px] text-yellow-900"></i>
                        </div>
                    </div>
                    <!-- ロゴテキスト -->
                    <div>
                        <div class="flex items-center gap-2">
                            <h1 class="logo-text font-extrabold text-lg text-slate-800 tracking-wide hidden sm:block group-hover:text-indigo-600 transition-colors m-0">
                                SHARE HOUSE TIMES
                            </h1>
                            <span class="logo-text font-extrabold text-sm text-slate-800 tracking-wide sm:hidden">
                                SHARE HOUSE TIMES
                            </span>
                            <span class="ai-badge text-[10px] font-bold text-white px-2 py-0.5 rounded-full" aria-label="AI powered">
                                AI
                            </span>
                        </div>
                        <span class="text-[10px] text-slate-500 hidden sm:flex items-center gap-1">
                            <i class="fas fa-sparkles text-amber-400" aria-hidden="true"></i>
                            シェアハウス・東京一人暮らしの最新情報をAIがお届け
                        </span>
                    </div>
                </a>
                <div class="flex items-center gap-3">
                    <!-- 手動更新ボタン -->
                    <button onclick="refreshNews()" class="refresh-btn" id="refreshBtn" title="最新ニュースに更新">
                        <i class="fas fa-sync-alt text-sm"></i>
                    </button>
                    <!-- 更新時刻 -->
                    <div class="hidden md:flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                        <i class="fas fa-sync-alt text-indigo-500" aria-hidden="true"></i>
                        <time datetime="07:00">毎日 <strong class="text-slate-700">7時・18時</strong> 更新</time>
                    </div>
                    <!-- クランテラスボタン -->
                    <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer sponsored" 
                       class="header-cta text-white px-5 py-2.5 rounded-full text-xs font-bold hidden sm:flex items-center gap-2 shadow-lg"
                       aria-label="クランテラス シェアハウス物件を見る（外部サイト）">
                        <i class="fas fa-building" aria-hidden="true"></i>
                        <span>クランテラス</span>
                        <i class="fas fa-arrow-right text-[10px] opacity-70" aria-hidden="true"></i>
                    </a>
                    <!-- モバイル用アイコン -->
                    <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer sponsored" 
                       class="header-cta w-10 h-10 rounded-full flex items-center justify-center text-white sm:hidden shadow-lg"
                       aria-label="クランテラス（外部サイト）">
                        <i class="fas fa-building" aria-hidden="true"></i>
                    </a>
                </div>
            </div>
        </div>
    </header>

    <!-- パンくずリスト -->
    <nav class="max-w-6xl mx-auto px-4 py-2 text-xs text-gray-500" aria-label="パンくずリスト">
        <ol class="flex items-center gap-2" itemscope itemtype="https://schema.org/BreadcrumbList">
            <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                <a href="/" itemprop="item" class="hover:text-indigo-600">
                    <span itemprop="name">ホーム</span>
                </a>
                <meta itemprop="position" content="1">
            </li>
            <li class="text-gray-300" aria-hidden="true">></li>
            <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem" id="breadcrumb-current">
                <span itemprop="name">シェアハウスニュース</span>
                <meta itemprop="position" content="2">
            </li>
        </ol>
    </nav>

    <!-- モバイル用カテゴリーナビゲーション -->
    <nav class="mobile-cat-menu md:hidden" role="navigation" aria-label="カテゴリーメニュー">
        <div class="px-3">
            <a href="#" class="mobile-cat-item active" onclick="filterCategory('all'); return false;" data-cat="all">主要</a>
            <a href="#women" class="mobile-cat-item" onclick="filterCategory('women'); return false;" data-cat="women">女性専用</a>
            <a href="#pet" class="mobile-cat-item" onclick="filterCategory('pet'); return false;" data-cat="pet">ペット可</a>
            <a href="#budget" class="mobile-cat-item" onclick="filterCategory('budget'); return false;" data-cat="budget">格安</a>
            <a href="#student" class="mobile-cat-item" onclick="filterCategory('student'); return false;" data-cat="student">学生</a>
            <a href="#remote" class="mobile-cat-item" onclick="filterCategory('remote'); return false;" data-cat="remote">リモート</a>
            <a href="#tokyo" class="mobile-cat-item" onclick="filterCategory('tokyo'); return false;" data-cat="tokyo">東京</a>
            <a href="#osaka" class="mobile-cat-item" onclick="filterCategory('osaka'); return false;" data-cat="osaka">大阪</a>
            <a href="#coliving" class="mobile-cat-item" onclick="filterCategory('coliving'); return false;" data-cat="coliving">コリビング</a>
            <a href="#tokyo_life" class="mobile-cat-item" onclick="filterCategory('tokyo_life'); return false;" data-cat="tokyo_life">一人暮らし</a>
            <a href="#new_open" class="mobile-cat-item" onclick="filterCategory('new_open'); return false;" data-cat="new_open">新規</a>
            <a href="#senior" class="mobile-cat-item" onclick="filterCategory('senior'); return false;" data-cat="senior">高齢者</a>
            <a href="#trend" class="mobile-cat-item" onclick="filterCategory('trend'); return false;" data-cat="trend">トレンド</a>
            <a href="#desk_tour" class="mobile-cat-item" onclick="filterCategory('desk_tour'); return false;" data-cat="desk_tour">デスクツアー</a>
            <a href="#company_housing" class="mobile-cat-item" onclick="filterCategory('company_housing'); return false;" data-cat="company_housing">社宅</a>
        </div>
    </nav>

    <!-- メインコンテンツ -->
    <main id="main-content" class="max-w-6xl mx-auto md:flex" role="main" itemprop="mainContentOfPage">
        
        <!-- 左サイドメニュー（PC用） -->
        <aside class="side-menu w-40 flex-shrink-0 hidden md:block" role="complementary" aria-label="カテゴリーメニュー">
            <!-- 物件タイプ -->
            <div class="side-menu-section">
                <a href="#" class="side-menu-item active" onclick="filterCategory('all'); return false;" data-cat="all">
                    <i class="fas fa-home mr-2 text-gray-400"></i>主要ニュース
                </a>
                <a href="#" class="side-menu-item" onclick="filterCategory('new_open'); return false;" data-cat="new_open">
                    <i class="fas fa-door-open mr-2 text-blue-400"></i>新規オープン
                </a>
                <a href="#" class="side-menu-item" onclick="filterCategory('women'); return false;" data-cat="women">
                    <i class="fas fa-venus mr-2 text-pink-400"></i>女性専用
                </a>
                <a href="#" class="side-menu-item" onclick="filterCategory('senior'); return false;" data-cat="senior">
                    <i class="fas fa-user-group mr-2 text-orange-400"></i>高齢者向け
                </a>
                <a href="#" class="side-menu-item" onclick="filterCategory('pet'); return false;" data-cat="pet">
                    <i class="fas fa-paw mr-2 text-amber-400"></i>ペット可
                </a>
                <a href="#" class="side-menu-item" onclick="filterCategory('foreign'); return false;" data-cat="foreign">
                    <i class="fas fa-globe mr-2 text-green-400"></i>外国人向け
                </a>
                <a href="#" class="side-menu-item" onclick="filterCategory('student'); return false;" data-cat="student">
                    <i class="fas fa-graduation-cap mr-2 text-indigo-400"></i>学生向け
                </a>
                <a href="#" class="side-menu-item" onclick="filterCategory('remote'); return false;" data-cat="remote">
                    <i class="fas fa-laptop-house mr-2 text-cyan-400"></i>リモートワーク
                </a>
            </div>
            
            <!-- エリア -->
            <div class="side-menu-section">
                <h2 class="side-menu-section-title">エリア</h2>
                <a href="#" class="side-menu-item" onclick="filterCategory('tokyo'); return false;" data-cat="tokyo">
                    <i class="fas fa-building mr-2 text-red-400"></i>東京
                </a>
                <a href="#" class="side-menu-item" onclick="filterCategory('osaka'); return false;" data-cat="osaka">
                    <i class="fas fa-torii-gate mr-2 text-purple-400"></i>大阪
                </a>
                <a href="#" class="side-menu-item" onclick="filterCategory('fukuoka'); return false;" data-cat="fukuoka">
                    <i class="fas fa-tree mr-2 text-pink-400"></i>福岡
                </a>
                <a href="#" class="side-menu-item" onclick="filterCategory('nagoya'); return false;" data-cat="nagoya">
                    <i class="fas fa-chess-rook mr-2 text-amber-400"></i>名古屋
                </a>
                <a href="#" class="side-menu-item" onclick="filterCategory('kyoto'); return false;" data-cat="kyoto">
                    <i class="fas fa-vihara mr-2 text-red-400"></i>京都
                </a>
            </div>
            

        </aside>

        <!-- 中央メインコンテンツ -->
        <div class="flex-1 min-w-0">
            
            <!-- モバイル用クランテラスバナー -->
            <div class="block md:hidden m-3">
                <div class="bg-white rounded-xl shadow-md overflow-hidden">
                    <div class="bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 flex items-center justify-between">
                        <span class="text-white font-bold text-xs"><i class="fas fa-building mr-1"></i>クランテラス物件</span>
                        <span class="text-white/80 text-[10px]">PR</span>
                    </div>
                    <div class="flex overflow-x-auto gap-2 p-2 scrollbar-hide" style="-webkit-overflow-scrolling: touch;">
                        <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer" class="flex-shrink-0 w-40">
                            <img src="${CRANN_IMAGES.kugahara}" alt="久が原" class="w-full h-20 object-cover rounded-lg mb-1">
                            <p class="text-xs font-bold text-gray-800 truncate">クランテラス久が原</p>
                            <p class="text-[10px] text-gray-500">久が原駅</p>
                        </a>
                        <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer" class="flex-shrink-0 w-40">
                            <img src="${CRANN_IMAGES.mizonokuchi}" alt="溝の口" class="w-full h-20 object-cover rounded-lg mb-1">
                            <p class="text-xs font-bold text-gray-800 truncate">クランテラス溝の口</p>
                            <p class="text-[10px] text-gray-500">溝の口駅</p>
                        </a>
                        <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer" class="flex-shrink-0 w-40">
                            <img src="${CRANN_IMAGES.shinagawa}" alt="品川" class="w-full h-20 object-cover rounded-lg mb-1">
                            <p class="text-xs font-bold text-gray-800 truncate">クランテラス品川</p>
                            <p class="text-[10px] text-gray-500">大井町駅</p>
                        </a>
                    </div>
                </div>
            </div>
            
            <!-- カテゴリータイトル -->
            <div id="categoryTitle" class="hidden bg-white border-b px-4 py-3 m-3 md:m-3 rounded-t">
                <h2 class="text-lg font-bold text-gray-800" id="categoryTitleText">主要ニュース</h2>
                <p class="text-xs text-gray-500" id="categoryDescription">シェアハウス・コリビングの最新ニュース</p>
            </div>
            
            <!-- 注目記事 -->
            <section class="topics-box m-3 md:m-3" aria-labelledby="topics-heading" itemscope itemtype="https://schema.org/ItemList">
                <header class="topics-header flex items-center justify-between">
                    <h2 id="topics-heading" class="flex items-center m-0 text-base font-bold">
                        <i class="fas fa-star topics-header-icon mr-2 text-amber-500" aria-hidden="true"></i>
                        <span itemprop="name">注目記事</span>
                        <span class="ml-2 text-xs font-normal text-gray-400">ピックアップ</span>
                    </h2>
                    <time class="update-time" id="updateTime" datetime=""></time>
                </header>
                <div id="topicsList" class="divide-y divide-gray-100" role="feed" aria-label="注目記事一覧"></div>
            </section>

            <!-- 国内ニュース -->
            <section id="japanSection" class="topics-box section-japan m-3 md:m-3" aria-labelledby="japan-heading">
                <header class="topics-header">
                    <h2 id="japan-heading" class="m-0 text-base font-bold">
                        <span aria-hidden="true">🇯🇵</span> 国内シェアハウスニュース
                    </h2>
                </header>
                <div id="japanNewsList" class="divide-y divide-gray-100" role="feed" aria-label="国内ニュース一覧"></div>
            </section>

            <!-- 海外ニュース -->
            <section id="worldSection" class="topics-box section-world m-3 md:m-3" aria-labelledby="world-heading">
                <header class="topics-header">
                    <h2 id="world-heading" class="m-0 text-base font-bold">
                        <span aria-hidden="true">🌍</span> 海外コリビングニュース
                    </h2>
                </header>
                <div id="worldNewsList" class="divide-y divide-gray-100" role="feed" aria-label="海外ニュース一覧"></div>
            </section>

            <!-- モバイル用ランキング -->
            <section class="topics-box section-ranking m-3 md:hidden" aria-labelledby="mobile-ranking-heading">
                <header class="topics-header">
                    <h2 id="mobile-ranking-heading" class="m-0 text-base font-bold flex items-center">
                        <i class="fas fa-ranking-star mr-2" aria-hidden="true"></i>アクセスランキング
                    </h2>
                </header>
                <div class="p-3" id="mobileRankingList" role="list" aria-label="人気記事ランキング"></div>
            </section>

        </div>

        <!-- 右サイドバー（PC用） -->
        <aside class="w-64 flex-shrink-0 hidden lg:block p-3 space-y-3" role="complementary" aria-label="おすすめ物件・ランキング">
            
            <!-- クランテラス物件バナー広告 -->
            <div class="bg-white rounded-2xl shadow-md overflow-hidden" itemscope itemtype="https://schema.org/ItemList">
                <div class="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2">
                    <h2 class="flex items-center gap-2 m-0 text-sm font-bold text-white">
                        <i class="fas fa-building" aria-hidden="true"></i>
                        <span itemprop="name">おすすめシェアハウス物件</span>
                    </h2>
                </div>
                
                <!-- クランテラス久が原 -->
                <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer" class="block p-3 border-b hover:bg-gray-50 transition-colors group">
                    <div class="overflow-hidden rounded-xl mb-2">
                        <img src="${CRANN_IMAGES.kugahara}" alt="クランテラス久が原" class="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300">
                    </div>
                    <div class="flex items-start justify-between">
                        <div>
                            <p class="font-bold text-gray-800 text-sm">クランテラス久が原</p>
                            <p class="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <i class="fas fa-map-marker-alt text-red-400"></i>東急池上線 久が原駅
                            </p>
                        </div>
                        <i class="fas fa-chevron-right text-gray-300 group-hover:text-emerald-500 transition-colors"></i>
                    </div>
                </a>
                
                <!-- クランテラス溝の口 -->
                <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer" class="block p-3 border-b hover:bg-gray-50 transition-colors group">
                    <div class="overflow-hidden rounded-xl mb-2">
                        <img src="${CRANN_IMAGES.mizonokuchi}" alt="クランテラス溝の口" class="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300">
                    </div>
                    <div class="flex items-start justify-between">
                        <div>
                            <p class="font-bold text-gray-800 text-sm">クランテラス溝の口</p>
                            <p class="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <i class="fas fa-map-marker-alt text-red-400"></i>東急田園都市線 溝の口駅
                            </p>
                        </div>
                        <i class="fas fa-chevron-right text-gray-300 group-hover:text-emerald-500 transition-colors"></i>
                    </div>
                </a>
                
                <!-- クランテラス品川 -->
                <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer" class="block p-3 hover:bg-gray-50 transition-colors group">
                    <div class="overflow-hidden rounded-xl mb-2">
                        <img src="${CRANN_IMAGES.shinagawa}" alt="クランテラス品川" class="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300">
                    </div>
                    <div class="flex items-start justify-between">
                        <div>
                            <p class="font-bold text-gray-800 text-sm">クランテラス品川</p>
                            <p class="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <i class="fas fa-map-marker-alt text-red-400"></i>JR 大井町駅
                            </p>
                        </div>
                        <i class="fas fa-chevron-right text-gray-300 group-hover:text-emerald-500 transition-colors"></i>
                    </div>
                </a>
                
                <!-- CTAボタン -->
                <div class="p-3 bg-gradient-to-r from-gray-50 to-gray-100">
                    <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer" 
                       class="block bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-center py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all">
                        <i class="fas fa-search mr-2"></i>全物件を見る
                    </a>
                </div>
            </div>

            <!-- アクセスランキング -->
            <div class="pr-box" aria-labelledby="ranking-heading">
                <h2 id="ranking-heading" class="pr-header flex items-center m-0 text-sm font-bold">
                    <i class="fas fa-ranking-star text-yellow-500 mr-2" aria-hidden="true"></i>
                    アクセスランキング
                </h2>
                <div class="p-2" id="rankingList" role="list" aria-label="人気記事ランキング"></div>
            </div>

            <!-- 注目キーワード -->
            <div class="pr-box" aria-labelledby="keywords-heading">
                <h2 id="keywords-heading" class="pr-header m-0 text-sm font-bold">
                    <i class="fas fa-tag mr-2" aria-hidden="true"></i>
                    シェアハウス検索キーワード
                </h2>
                <div class="p-3 flex flex-wrap" role="list" aria-label="人気の検索キーワード">
                    <button onclick="filterCategory('women')" class="keyword-tag" role="listitem">女性専用シェアハウス</button>
                    <button onclick="filterCategory('pet')" class="keyword-tag" role="listitem">ペット可シェアハウス</button>
                    <button onclick="filterCategory('budget')" class="keyword-tag" role="listitem">格安シェアハウス</button>
                    <button onclick="filterCategory('tokyo')" class="keyword-tag" role="listitem">東京シェアハウス</button>
                    <button onclick="filterCategory('coliving')" class="keyword-tag" role="listitem">コリビング</button>
                    <button onclick="filterCategory('remote')" class="keyword-tag" role="listitem">リモートワーク向け</button>
                    <button onclick="filterCategory('tokyo_life')" class="keyword-tag" role="listitem">東京一人暮らし</button>
                    <button onclick="filterCategory('student')" class="keyword-tag" role="listitem">学生向け</button>
                    <button onclick="filterCategory('company_housing')" class="keyword-tag" role="listitem">社宅・法人契約</button>
                </div>
            </div>

        </aside>
    </main>
    
    <!-- SEO用コンテンツ（検索エンジン向け説明文） -->
    <section class="max-w-6xl mx-auto px-4 py-8 mt-6" aria-labelledby="about-heading">
        
        <!-- メインの説明セクション -->
        <div class="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-3xl shadow-lg overflow-hidden">
            
            <!-- ヘッダー部分 -->
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                        <i class="fas fa-house-chimney text-white text-xl"></i>
                    </div>
                    <div>
                        <h2 id="about-heading" class="text-xl font-bold text-white m-0">SHARE HOUSE TIMESについて</h2>
                        <p class="text-indigo-200 text-xs mt-0.5">シェアハウス・東京一人暮らし情報サイト</p>
                    </div>
                </div>
            </div>
            
            <!-- コンテンツ部分 -->
            <div class="p-6 md:p-8">
                
                <!-- 特徴カード -->
                <div class="grid md:grid-cols-3 gap-4 mb-8">
                    <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-3">
                            <i class="fas fa-robot text-white"></i>
                        </div>
                        <h3 class="font-bold text-gray-800 text-sm mb-2">AIが自動収集</h3>
                        <p class="text-xs text-gray-500 leading-relaxed">最新のシェアハウス・コリビング情報をAIが24時間自動で収集してお届けします。</p>
                    </div>
                    <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div class="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-3">
                            <i class="fas fa-clock text-white"></i>
                        </div>
                        <h3 class="font-bold text-gray-800 text-sm mb-2">毎日2回更新</h3>
                        <p class="text-xs text-gray-500 leading-relaxed">朝7時と夕方18時に最新情報を更新。いつでも新鮮な情報をチェックできます。</p>
                    </div>
                    <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div class="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-3">
                            <i class="fas fa-tags text-white"></i>
                        </div>
                        <h3 class="font-bold text-gray-800 text-sm mb-2">19カテゴリー</h3>
                        <p class="text-xs text-gray-500 leading-relaxed">女性専用・ペット可・格安など、あなたのニーズに合った情報が見つかります。</p>
                    </div>
                </div>
                
                <!-- 説明文 -->
                <div class="bg-white/70 rounded-2xl p-5 mb-8 border border-gray-100">
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i class="fas fa-info-circle text-indigo-600 text-sm"></i>
                        </div>
                        <div class="text-sm text-gray-600 space-y-2 leading-relaxed">
                            <p>
                                <strong class="text-gray-800">SHARE HOUSE TIMES</strong>は、<span class="text-indigo-600 font-medium">東京で一人暮らしを始める方</span>、<span class="text-indigo-600 font-medium">シェアハウスを探している方</span>に向けた情報サイトです。
                            </p>
                            <p>
                                家賃相場、初期費用、メリット・デメリット、入居時の注意点など、シェアハウス選びに役立つ情報を幅広くカバーしています。
                            </p>
                        </div>
                    </div>
                </div>
                
                <!-- カテゴリータグ -->
                <div class="mb-8">
                    <h3 class="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <i class="fas fa-th-large text-indigo-500"></i>
                        対応カテゴリー
                    </h3>
                    <div class="flex flex-wrap gap-2">
                        <span class="px-3 py-1.5 bg-pink-100 text-pink-700 rounded-full text-xs font-medium">女性専用</span>
                        <span class="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">ペット可</span>
                        <span class="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">学生向け</span>
                        <span class="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">リモートワーク</span>
                        <span class="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">東京</span>
                        <span class="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">大阪</span>
                        <span class="px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">コリビング</span>
                        <span class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">+9カテゴリー</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- よくある質問（FAQセクション） -->
        <div class="mt-8 bg-white rounded-3xl shadow-lg overflow-hidden">
            <div class="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
                <h3 class="text-lg font-bold text-white m-0 flex items-center gap-2">
                    <i class="fas fa-circle-question"></i>
                    よくある質問
                </h3>
            </div>
            
            <div class="p-6 space-y-4">
                <!-- FAQ 1 -->
                <details class="group bg-gray-50 rounded-2xl overflow-hidden" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                    <summary class="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors">
                        <div class="flex items-center gap-3">
                            <span class="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">Q</span>
                            <span class="font-medium text-gray-800 text-sm" itemprop="name">シェアハウスとは何ですか？</span>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 group-open:rotate-180 transition-transform"></i>
                    </summary>
                    <div class="px-4 pb-4" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                        <div class="ml-11 p-4 bg-white rounded-xl border-l-4 border-indigo-500">
                            <p class="text-sm text-gray-600 leading-relaxed" itemprop="text">
                                シェアハウスは、複数の入居者がキッチンやリビングなどの<strong class="text-gray-800">共用スペースを共有</strong>しながら、個室で生活する賃貸住宅です。一人暮らしより<strong class="text-gray-800">家賃を抑えられ</strong>、入居者同士の交流も楽しめます。
                            </p>
                        </div>
                    </div>
                </details>
                
                <!-- FAQ 2 -->
                <details class="group bg-gray-50 rounded-2xl overflow-hidden" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                    <summary class="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors">
                        <div class="flex items-center gap-3">
                            <span class="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">Q</span>
                            <span class="font-medium text-gray-800 text-sm" itemprop="name">東京のシェアハウスの家賃相場は？</span>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 group-open:rotate-180 transition-transform"></i>
                    </summary>
                    <div class="px-4 pb-4" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                        <div class="ml-11 p-4 bg-white rounded-xl border-l-4 border-emerald-500">
                            <p class="text-sm text-gray-600 leading-relaxed" itemprop="text">
                                東京のシェアハウスの家賃相場は<strong class="text-gray-800">月額4万円〜8万円程度</strong>です。山手線沿線など人気エリアは6万円〜10万円程度になることもあります。
                            </p>
                        </div>
                    </div>
                </details>
                
                <!-- FAQ 3 -->
                <details class="group bg-gray-50 rounded-2xl overflow-hidden" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                    <summary class="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors">
                        <div class="flex items-center gap-3">
                            <span class="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">Q</span>
                            <span class="font-medium text-gray-800 text-sm" itemprop="name">シェアハウスの初期費用はいくら？</span>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 group-open:rotate-180 transition-transform"></i>
                    </summary>
                    <div class="px-4 pb-4" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                        <div class="ml-11 p-4 bg-white rounded-xl border-l-4 border-amber-500">
                            <p class="text-sm text-gray-600 leading-relaxed" itemprop="text">
                                シェアハウスの初期費用は一般的な賃貸より低く、<strong class="text-gray-800">デポジット1ヶ月分＋初月家賃程度</strong>で入居できることが多いです。敷金・礼金・仲介手数料が不要な物件も多くあります。
                            </p>
                        </div>
                    </div>
                </details>
                
                <!-- FAQ 4 -->
                <details class="group bg-gray-50 rounded-2xl overflow-hidden" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                    <summary class="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors">
                        <div class="flex items-center gap-3">
                            <span class="w-8 h-8 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">Q</span>
                            <span class="font-medium text-gray-800 text-sm" itemprop="name">女性専用シェアハウスのメリットは？</span>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 group-open:rotate-180 transition-transform"></i>
                    </summary>
                    <div class="px-4 pb-4" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                        <div class="ml-11 p-4 bg-white rounded-xl border-l-4 border-pink-500">
                            <p class="text-sm text-gray-600 leading-relaxed" itemprop="text">
                                女性専用シェアハウスは、<strong class="text-gray-800">セキュリティ面での安心感</strong>、清潔な共用スペース、女性同士の気軽なコミュニケーションなどのメリットがあります。オートロックや防犯カメラ完備の物件も多いです。
                            </p>
                        </div>
                    </div>
                </details>
                
                <!-- FAQ 5: 社宅 -->
                <details class="group bg-gray-50 rounded-2xl overflow-hidden" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                    <summary class="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors">
                        <div class="flex items-center gap-3">
                            <span class="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">Q</span>
                            <span class="font-medium text-gray-800 text-sm" itemprop="name">社宅・借り上げ社宅とシェアハウスの違いは？</span>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 group-open:rotate-180 transition-transform"></i>
                    </summary>
                    <div class="px-4 pb-4" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                        <div class="ml-11 p-4 bg-white rounded-xl border-l-4 border-slate-500">
                            <p class="text-sm text-gray-600 leading-relaxed" itemprop="text">
                                <strong class="text-gray-800">社宅・借り上げ社宅</strong>は企業が従業員のために用意する住居で、家賃補助や福利厚生の一環として提供されます。最近では<strong class="text-gray-800">法人契約可能なシェアハウス</strong>も増えており、企業の社宅として活用するケースが増加しています。転勤者や新入社員の住居としてコミュニティ形成にも役立ちます。
                            </p>
                        </div>
                    </div>
                </details>
                
                <!-- FAQ 6: クランテラス -->
                <details class="group bg-gray-50 rounded-2xl overflow-hidden" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                    <summary class="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors">
                        <div class="flex items-center gap-3">
                            <span class="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">Q</span>
                            <span class="font-medium text-gray-800 text-sm" itemprop="name">クランテラスとはどんなシェアハウスですか？</span>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 group-open:rotate-180 transition-transform"></i>
                    </summary>
                    <div class="px-4 pb-4" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                        <div class="ml-11 p-4 bg-white rounded-xl border-l-4 border-emerald-500">
                            <p class="text-sm text-gray-600 leading-relaxed" itemprop="text">
                                <strong class="text-gray-800">クランテラス（CRANN TERRACE）</strong>は東京ディフェンス株式会社が運営する大型シェアハウスシリーズです。「ひと、もの、こと。何かと出会える生活を。」をコンセプトに、<strong class="text-gray-800">久が原（大田区・御嶽山駅徒歩6分）・溝の口（川崎市高津区・高津駅徒歩4分）・品川（品川区大井・大井町駅徒歩9分）</strong>の3物件を展開。敷金礼金0円、家具付き、防音室・シアタールーム・ワークスペースなど充実した共用設備が特徴です。詳細は<a href="https://crann-terrace.com/" target="_blank" rel="noopener" class="text-emerald-600 hover:underline">公式サイト</a>をご覧ください。
                            </p>
                        </div>
                    </div>
                </details>
            </div>
        </div>
        
    </section>

    <!-- フッター -->
    <footer class="yahoo-footer py-8 mt-4" role="contentinfo" itemscope itemtype="https://schema.org/WPFooter">
        <div class="max-w-6xl mx-auto px-4 text-center">
            <!-- 内部リンク（SEO強化） -->
            <nav class="mb-6" aria-label="カテゴリーリンク">
                <h3 class="text-xs text-slate-400 mb-3">シェアハウスカテゴリー</h3>
                <div class="flex flex-wrap justify-center gap-3 text-xs">
                    <a href="#women" onclick="filterCategory('women'); return false;" class="footer-link hover:text-indigo-600">女性専用シェアハウス</a>
                    <a href="#pet" onclick="filterCategory('pet'); return false;" class="footer-link hover:text-indigo-600">ペット可シェアハウス</a>
                    <a href="#budget" onclick="filterCategory('budget'); return false;" class="footer-link hover:text-indigo-600">格安シェアハウス</a>
                    <a href="#tokyo" onclick="filterCategory('tokyo'); return false;" class="footer-link hover:text-indigo-600">東京のシェアハウス</a>
                    <a href="#osaka" onclick="filterCategory('osaka'); return false;" class="footer-link hover:text-indigo-600">大阪のシェアハウス</a>
                    <a href="#coliving" onclick="filterCategory('coliving'); return false;" class="footer-link hover:text-indigo-600">コリビング</a>
                    <a href="#tokyo_life" onclick="filterCategory('tokyo_life'); return false;" class="footer-link hover:text-indigo-600">東京一人暮らし</a>
                    <a href="#student" onclick="filterCategory('student'); return false;" class="footer-link hover:text-indigo-600">学生向けシェアハウス</a>
                    <a href="#company_housing" onclick="filterCategory('company_housing'); return false;" class="footer-link hover:text-indigo-600">社宅・法人契約</a>
                </div>
            </nav>
            
            <!-- 外部リンク -->
            <div class="flex flex-wrap justify-center gap-4 mb-4 text-xs">
                <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer sponsored" class="footer-link">クランテラス公式サイト</a>
            </div>
            
            <div class="flex items-center justify-center gap-2 mb-3">
                <i class="fas fa-shield-halved text-indigo-400" aria-hidden="true"></i>
                <span class="text-xs text-slate-400">東京ディフェンス株式会社 提供</span>
            </div>
            <p class="text-xs text-slate-500">
                <small>&copy; 2026 SHARE HOUSE TIMES - シェアハウス・東京一人暮らし情報サイト</small>
            </p>
        </div>
    </footer>

    <!-- モバイル固定バナー -->
    <div class="mobile-fixed-banner md:hidden">
        <div class="flex items-center gap-2">
            <i class="fas fa-home"></i>
            <span class="text-sm font-bold">クランテラス</span>
        </div>
        <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer" 
           class="bg-white text-green-700 px-4 py-1.5 rounded text-xs font-bold">
            物件を見る
        </a>
    </div>

    <script>
        let allNews = [];
        let currentRegion = 'all';
        let currentCategory = 'all';

        // カテゴリー設定（19カテゴリー）
        const categoryConfig = {
            // 物件タイプ
            'new_open': { icon: 'fa-door-open', color: 'bg-blue-500', label: '新規オープン', desc: '新しくオープンするシェアハウス情報' },
            'women': { icon: 'fa-venus', color: 'bg-pink-500', label: '女性専用', desc: '女性専用シェアハウスの最新情報' },
            'senior': { icon: 'fa-user-group', color: 'bg-orange-500', label: '高齢者向け', desc: '高齢者・シニア向けシェアハウス情報' },
            'pet': { icon: 'fa-paw', color: 'bg-amber-500', label: 'ペット可', desc: 'ペットと暮らせるシェアハウス情報' },
            'foreign': { icon: 'fa-globe', color: 'bg-green-500', label: '外国人向け', desc: '外国人歓迎のシェアハウス情報' },
            'student': { icon: 'fa-graduation-cap', color: 'bg-indigo-500', label: '学生向け', desc: '学生向けシェアハウス情報' },
            'budget': { icon: 'fa-yen-sign', color: 'bg-yellow-500', label: '格安', desc: '3万円以下の格安シェアハウス情報' },
            'remote': { icon: 'fa-laptop-house', color: 'bg-cyan-500', label: 'リモートワーク', desc: 'テレワーク対応シェアハウス情報' },
            'company_housing': { icon: 'fa-briefcase', color: 'bg-slate-600', label: '社宅', desc: '社宅・借り上げ社宅・法人向け物件情報' },
            // エリア
            'tokyo': { icon: 'fa-building', color: 'bg-red-500', label: '東京', desc: '東京都内のシェアハウス最新情報' },
            'osaka': { icon: 'fa-torii-gate', color: 'bg-purple-500', label: '大阪', desc: '大阪府内のシェアハウス最新情報' },
            'fukuoka': { icon: 'fa-tree', color: 'bg-pink-500', label: '福岡', desc: '福岡県内のシェアハウス最新情報' },
            'nagoya': { icon: 'fa-chess-rook', color: 'bg-amber-600', label: '名古屋', desc: '名古屋市内のシェアハウス最新情報' },
            'kyoto': { icon: 'fa-vihara', color: 'bg-red-600', label: '京都', desc: '京都府内のシェアハウス最新情報' },
            // トレンド
            'trend': { icon: 'fa-chart-line', color: 'bg-blue-600', label: '賃貸トレンド', desc: '賃貸市場の最新動向・トレンド情報' },
            'tokyo_life': { icon: 'fa-city', color: 'bg-gray-500', label: '東京一人暮らし', desc: '東京での一人暮らし情報・費用比較' },
            'coliving': { icon: 'fa-building-user', color: 'bg-teal-500', label: 'コリビング', desc: 'コリビング・海外シェア最新情報' },
            'rural': { icon: 'fa-mountain-sun', color: 'bg-green-600', label: '地方移住', desc: '地方移住×シェアハウス情報' },
            'investment': { icon: 'fa-coins', color: 'bg-yellow-600', label: '投資', desc: 'シェアハウス投資・オーナー向け情報' },
            'desk_tour': { icon: 'fa-desktop', color: 'bg-purple-500', label: 'デスクツアー', desc: 'シェアハウス住民のデスク環境・作業スペース' },
            // 海外
            'uk': { icon: 'fa-building', color: 'bg-indigo-500', label: 'イギリス', desc: 'イギリスのコリビング情報' },
            'us': { icon: 'fa-city', color: 'bg-blue-600', label: 'アメリカ', desc: 'アメリカのコリビング情報' },
            'asia': { icon: 'fa-earth-asia', color: 'bg-teal-500', label: 'アジア', desc: 'アジア各国のコリビング情報' },
            'market': { icon: 'fa-chart-line', color: 'bg-purple-500', label: '市場動向', desc: 'シェアハウス市場の動向' },
            'policy': { icon: 'fa-landmark', color: 'bg-red-500', label: '政策', desc: 'シェアハウス関連の政策・制度' },
        };

        function createHeadlineItem(article) {
            const today = new Date();
            const isNew = article.date.includes(today.getDate() + '(') || article.date.includes((today.getDate()-1) + '(');
            const newBadge = isNew ? '<span class="badge-new">NEW</span>' : '';
            const cat = categoryConfig[article.category] || { icon: 'fa-newspaper', color: 'bg-gray-400', label: 'ニュース' };
            const highlightClass = 'cat-highlight-' + article.category;
            
            return \`
                <div class="headline-item \${highlightClass}">
                    <div class="cat-icon \${cat.color}">
                        <i class="fas \${cat.icon}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <a href="\${article.url}" target="_blank" rel="noopener noreferrer" class="headline-link">
                            \${article.title}\${newBadge}
                        </a>
                        <div class="source-info">
                            <span class="cat-tag \${cat.color} text-white">\${cat.label}</span>
                            <span class="text-gray-400">|</span>
                            <span>\${article.source}</span>
                            <span class="text-gray-400">|</span>
                            <span>\${article.date}</span>
                        </div>
                    </div>
                </div>
            \`;
        }

        function createRankingItem(article, rank) {
            const rankClass = rank <= 3 ? \`rank-\${rank}\` : 'rank-other';
            return \`
                <div class="flex gap-3 py-3 border-b border-gray-100 last:border-b-0 items-start">
                    <span class="ranking-num \${rankClass}">\${rank}</span>
                    <a href="\${article.url}" target="_blank" rel="noopener noreferrer" 
                       class="flex-1 text-sm text-gray-700 hover:text-[#e94560] leading-snug font-medium">
                        \${article.title}
                    </a>
                </div>
            \`;
        }

        // 表示件数の設定
        const DISPLAY_LIMITS = {
            topics: 5,      // トピックス初期表示
            japan: 5,       // 国内ニュース初期表示
            world: 3,       // 海外ニュース初期表示
            expanded: 20    // 展開時の最大表示
        };
        
        // 展開状態の管理
        let expandedSections = {
            topics: false,
            japan: false,
            world: false
        };

        function createMoreButton(sectionId, totalCount, currentCount) {
            if (totalCount <= currentCount) return '';
            const remaining = totalCount - currentCount;
            return \`
                <button onclick="expandSection('\${sectionId}')" 
                        class="w-full py-3 text-center text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors border-t border-gray-100 flex items-center justify-center gap-2"
                        id="\${sectionId}MoreBtn">
                    <i class="fas fa-chevron-down"></i>
                    もっと見る（残り\${remaining}件）
                </button>
            \`;
        }
        
        function createCollapseButton(sectionId) {
            return \`
                <button onclick="collapseSection('\${sectionId}')" 
                        class="w-full py-3 text-center text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100 flex items-center justify-center gap-2"
                        id="\${sectionId}CollapseBtn">
                    <i class="fas fa-chevron-up"></i>
                    閉じる
                </button>
            \`;
        }
        
        function expandSection(sectionId) {
            expandedSections[sectionId] = true;
            displayNews(allNews);
        }
        
        function collapseSection(sectionId) {
            expandedSections[sectionId] = false;
            displayNews(allNews);
            // スクロール位置をセクション上部に戻す
            const section = document.getElementById(sectionId + 'Section') || document.getElementById(sectionId + 'List')?.parentElement;
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        function displayNews(news) {
            // フィルタリング
            let filteredNews = news;
            if (currentRegion !== 'all') {
                filteredNews = news.filter(n => n.region === currentRegion);
            }
            if (currentCategory !== 'all') {
                filteredNews = news.filter(n => n.category === currentCategory || (n.categories && n.categories.includes(currentCategory)));
            }

            const japanNews = filteredNews.filter(n => n.region === 'japan');
            const worldNews = filteredNews.filter(n => n.region === 'world');
            
            // カテゴリータイトル更新
            const titleEl = document.getElementById('categoryTitle');
            const titleText = document.getElementById('categoryTitleText');
            const descText = document.getElementById('categoryDescription');
            if (currentCategory !== 'all' && categoryConfig[currentCategory]) {
                titleEl.classList.remove('hidden');
                titleText.textContent = categoryConfig[currentCategory].label + 'のニュース';
                descText.textContent = categoryConfig[currentCategory].desc;
            } else {
                titleEl.classList.add('hidden');
            }
            
            // 注目記事の選定（国内・海外ニュースと差別化）
            // - 国内・海外を交互に混ぜる
            // - カテゴリーが重複しないよう多様性を確保
            function selectFeaturedNews(allNews, limit) {
                const featured = [];
                const usedCategories = new Set();
                const japan = allNews.filter(n => n.region === 'japan');
                const world = allNews.filter(n => n.region === 'world');
                let japanIdx = 0, worldIdx = 0;
                let useJapan = true;
                
                while (featured.length < limit && (japanIdx < japan.length || worldIdx < world.length)) {
                    const source = useJapan ? japan : world;
                    const idx = useJapan ? japanIdx : worldIdx;
                    
                    if (idx < source.length) {
                        const article = source[idx];
                        // カテゴリーの多様性を優先（同じカテゴリーは後回し）
                        if (!usedCategories.has(article.category) || featured.length >= limit / 2) {
                            featured.push(article);
                            usedCategories.add(article.category);
                        }
                        if (useJapan) japanIdx++; else worldIdx++;
                    }
                    
                    // 交互に切り替え（片方が尽きたらもう片方から）
                    if (useJapan && worldIdx < world.length) useJapan = false;
                    else if (!useJapan && japanIdx < japan.length) useJapan = true;
                    else if (japanIdx < japan.length) useJapan = true;
                    else useJapan = false;
                }
                
                return featured;
            }
            
            // 注目記事（初期5件、展開時は最大20件）- 国内・海外混合でカテゴリー多様性重視
            const topicsLimit = expandedSections.topics ? DISPLAY_LIMITS.expanded : DISPLAY_LIMITS.topics;
            const featuredNews = selectFeaturedNews(filteredNews, Math.min(topicsLimit, filteredNews.length));
            const topicsContainer = document.getElementById('topicsList');
            if (featuredNews.length > 0) {
                let html = featuredNews.map(n => createHeadlineItem(n)).join('');
                if (expandedSections.topics) {
                    html += createCollapseButton('topics');
                } else {
                    html += createMoreButton('topics', filteredNews.length, DISPLAY_LIMITS.topics);
                }
                topicsContainer.innerHTML = html;
            } else {
                topicsContainer.innerHTML = '<p class="p-4 text-gray-500 text-sm">該当するニュースがありません</p>';
            }
            
            // 更新時刻
            const now = new Date();
            document.getElementById('updateTime').textContent = 
                now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) + ' 更新';
            
            // 日本ニュース（初期5件、展開時は最大20件）
            const japanSection = document.getElementById('japanSection');
            const japanContainer = document.getElementById('japanNewsList');
            if ((currentRegion === 'all' || currentRegion === 'japan') && currentCategory === 'all' && japanNews.length > 0) {
                japanSection.classList.remove('hidden');
                const japanLimit = expandedSections.japan ? DISPLAY_LIMITS.expanded : DISPLAY_LIMITS.japan;
                const displayJapan = japanNews.slice(0, japanLimit);
                let html = displayJapan.map(n => createHeadlineItem(n)).join('');
                if (expandedSections.japan) {
                    html += createCollapseButton('japan');
                } else {
                    html += createMoreButton('japan', japanNews.length, DISPLAY_LIMITS.japan);
                }
                japanContainer.innerHTML = html;
            } else {
                japanSection.classList.add('hidden');
            }
            
            // 海外ニュース（初期3件、展開時は最大20件）
            const worldSection = document.getElementById('worldSection');
            const worldContainer = document.getElementById('worldNewsList');
            if ((currentRegion === 'all' || currentRegion === 'world') && currentCategory === 'all' && worldNews.length > 0) {
                worldSection.classList.remove('hidden');
                const worldLimit = expandedSections.world ? DISPLAY_LIMITS.expanded : DISPLAY_LIMITS.world;
                const displayWorld = worldNews.slice(0, worldLimit);
                let html = displayWorld.map(n => createHeadlineItem(n)).join('');
                if (expandedSections.world) {
                    html += createCollapseButton('world');
                } else {
                    html += createMoreButton('world', worldNews.length, DISPLAY_LIMITS.world);
                }
                worldContainer.innerHTML = html;
            } else {
                worldSection.classList.add('hidden');
            }

            // ランキング
            const rankingNews = [...news].sort(() => Math.random() - 0.5).slice(0, 5);
            const rankingHTML = rankingNews.map((n, i) => createRankingItem(n, i + 1)).join('');
            document.getElementById('rankingList').innerHTML = rankingHTML;
            
            // モバイル用ランキング
            const mobileRanking = document.getElementById('mobileRankingList');
            if (mobileRanking) {
                mobileRanking.innerHTML = rankingHTML;
            }
        }

        function filterRegion(region) {
            currentRegion = region;
            currentCategory = 'all';
            
            // タブのアクティブ状態更新
            document.querySelectorAll('.tab-item').forEach(tab => {
                if (tab.dataset.region === region) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
            
            // サイドメニュー・モバイルメニューのアクティブ状態リセット
            document.querySelectorAll('.side-menu-item, .mobile-cat-item').forEach(item => {
                if (item.dataset.cat === 'all') {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
            
            displayNews(allNews);
        }

        function filterCategory(category) {
            currentCategory = category;
            currentRegion = 'all';
            
            // サイドメニュー・モバイルメニューのアクティブ状態更新
            document.querySelectorAll('.side-menu-item, .mobile-cat-item').forEach(item => {
                if (item.dataset.cat === category) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
            
            // タブのアクティブ状態リセット
            document.querySelectorAll('.tab-item').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelector('.tab-item[data-region="all"]')?.classList.add('active');
            
            displayNews(allNews);
        }

        let lastFetchTime = 0;
        let isRefreshing = false;
        
        async function fetchNews(showIndicator = false) {
            if (isRefreshing) return;
            isRefreshing = true;
            
            const btn = document.getElementById('refreshBtn');
            const indicator = document.getElementById('pullIndicator');
            
            if (showIndicator && btn) {
                btn.classList.add('refreshing');
            }
            
            try {
                // キャッシュバスティング用のタイムスタンプを追加
                const timestamp = Date.now();
                const response = await fetch('/api/news?t=' + timestamp, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' }
                });
                const data = await response.json();
                allNews = data.news || [];
                lastFetchTime = timestamp;
                
                // 最終更新時刻を表示
                if (data.lastUpdated) {
                    const date = new Date(data.lastUpdated);
                    const timeStr = date.toLocaleString('ja-JP', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    updateLastUpdatedDisplay(timeStr);
                }
                
                displayNews(allNews);
                
                if (showIndicator) {
                    showToast('最新ニュースを取得しました');
                }
            } catch (err) {
                console.error('Error:', err);
                if (showIndicator) {
                    showToast('更新に失敗しました', true);
                }
            } finally {
                isRefreshing = false;
                if (btn) btn.classList.remove('refreshing');
                if (indicator) {
                    indicator.classList.remove('visible', 'refreshing');
                }
            }
        }
        
        function updateLastUpdatedDisplay(timeStr) {
            let el = document.getElementById('lastUpdatedDisplay');
            if (!el) {
                el = document.createElement('div');
                el.id = 'lastUpdatedDisplay';
                el.className = 'last-updated';
                const header = document.querySelector('.yahoo-header');
                if (header) header.after(el);
            }
            el.innerHTML = '<i class="fas fa-clock mr-1"></i>最終更新: ' + timeStr;
        }
        
        function showToast(message, isError) {
            const toast = document.createElement('div');
            const bgColor = isError ? '#ef4444' : '#10b981';
            toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:' + bgColor + ';color:white;padding:12px 24px;border-radius:100px;font-size:13px;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.2);animation:fadeInUp 0.3s ease;';
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(function() {
                toast.style.animation = 'fadeOut 0.3s ease';
                setTimeout(function() { toast.remove(); }, 300);
            }, 2000);
        }
        
        // 手動更新ボタン
        function refreshNews() {
            fetchNews(true);
        }
        
        // アプリに戻った時に自動更新（5分以上経過している場合）
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible') {
                var now = Date.now();
                var fiveMinutes = 5 * 60 * 1000;
                if (now - lastFetchTime > fiveMinutes) {
                    fetchNews(true);
                }
            }
        });
        
        // Pull to Refresh
        var touchStartY = 0;
        var touchCurrentY = 0;
        var isPulling = false;
        
        document.addEventListener('touchstart', function(e) {
            if (window.scrollY === 0) {
                touchStartY = e.touches[0].clientY;
                isPulling = true;
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', function(e) {
            if (!isPulling) return;
            touchCurrentY = e.touches[0].clientY;
            var pullDistance = touchCurrentY - touchStartY;
            
            if (pullDistance > 60 && window.scrollY === 0) {
                var indicator = document.getElementById('pullIndicator');
                if (indicator && !indicator.classList.contains('refreshing')) {
                    indicator.classList.add('visible');
                }
            }
        }, { passive: true });
        
        document.addEventListener('touchend', function() {
            if (!isPulling) return;
            var pullDistance = touchCurrentY - touchStartY;
            
            if (pullDistance > 80 && window.scrollY === 0) {
                var indicator = document.getElementById('pullIndicator');
                if (indicator) {
                    indicator.classList.add('refreshing');
                    indicator.innerHTML = '<i class="fas fa-spinner"></i> 更新中...';
                }
                fetchNews(true);
            } else {
                var indicator = document.getElementById('pullIndicator');
                if (indicator) indicator.classList.remove('visible');
            }
            
            isPulling = false;
            touchStartY = 0;
            touchCurrentY = 0;
        }, { passive: true });

        document.addEventListener('DOMContentLoaded', function() {
            fetchNews(false);
            lastFetchTime = Date.now();
        });
    </script>
</body>
</html>
  `)
})

// 管理者パスワード（本番環境では環境変数から取得）
const ADMIN_PASSWORD = 'sharehouse2026'

// 管理者ページ
app.get('/admin', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>管理者ダッシュボード | シェアハウスタイムズ</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { font-family: "Hiragino Kaku Gothic ProN", sans-serif; background: #1a1a2e; color: #fff; }
        .card { background: linear-gradient(135deg, #16213e 0%, #1a1a2e 100%); border: 1px solid #2d3748; border-radius: 12px; }
        .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .btn-primary { background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%); }
        .btn-success { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
        .btn-warning { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        .table-row:hover { background: rgba(102, 126, 234, 0.1); }
        .status-online { color: #38ef7d; }
        .status-offline { color: #f5576c; }
        .login-card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); }
    </style>
</head>
<body class="min-h-screen">
    <!-- ログイン画面 -->
    <div id="loginScreen" class="min-h-screen flex items-center justify-center p-4">
        <div class="login-card card p-8 w-full max-w-md">
            <div class="text-center mb-6">
                <span class="text-3xl font-bold text-white">ST</span>
                <h1 class="text-xl font-bold mt-2">管理者ダッシュボード</h1>
                <p class="text-gray-400 text-sm mt-1">シェアハウスタイムズ</p>
            </div>
            <form id="loginForm" class="space-y-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-1">パスワード</label>
                    <input type="password" id="password" 
                           class="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-purple-500 focus:outline-none"
                           placeholder="パスワードを入力">
                </div>
                <button type="submit" class="btn-primary w-full py-3 rounded-lg font-bold text-white">
                    <i class="fas fa-sign-in-alt mr-2"></i>ログイン
                </button>
                <p id="loginError" class="text-red-400 text-sm text-center hidden">パスワードが正しくありません</p>
            </form>
        </div>
    </div>

    <!-- ダッシュボード -->
    <div id="dashboard" class="hidden">
        <!-- ヘッダー -->
        <header class="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="text-2xl font-bold text-white">ST</span>
                    <span class="text-gray-400">|</span>
                    <span class="font-bold">管理者ダッシュボード</span>
                </div>
                <div class="flex items-center gap-4">
                    <a href="/" class="text-gray-400 hover:text-white text-sm">
                        <i class="fas fa-external-link-alt mr-1"></i>サイトを表示
                    </a>
                    <button onclick="logout()" class="text-gray-400 hover:text-red-400 text-sm">
                        <i class="fas fa-sign-out-alt mr-1"></i>ログアウト
                    </button>
                </div>
            </div>
        </header>

        <main class="max-w-7xl mx-auto p-4 space-y-6">
            <!-- 統計カード -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="stat-card p-4 rounded-xl">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm opacity-80">総ニュース数</p>
                            <p class="text-3xl font-bold" id="totalNews">-</p>
                        </div>
                        <i class="fas fa-newspaper text-3xl opacity-50"></i>
                    </div>
                </div>
                <div class="card p-4 rounded-xl" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm opacity-80">国内ニュース</p>
                            <p class="text-3xl font-bold" id="japanNews">-</p>
                        </div>
                        <span class="text-3xl">🇯🇵</span>
                    </div>
                </div>
                <div class="card p-4 rounded-xl" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm opacity-80">海外ニュース</p>
                            <p class="text-3xl font-bold" id="worldNews">-</p>
                        </div>
                        <span class="text-3xl">🌍</span>
                    </div>
                </div>
                <div class="card p-4 rounded-xl" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm opacity-80">カテゴリー数</p>
                            <p class="text-3xl font-bold" id="categoryCount">18</p>
                        </div>
                        <i class="fas fa-tags text-3xl opacity-50"></i>
                    </div>
                </div>
            </div>

            <!-- システム状態 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="card p-6">
                    <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-server text-purple-400"></i>
                        システム状態
                    </h2>
                    <div class="space-y-3">
                        <div class="flex justify-between items-center py-2 border-b border-gray-700">
                            <span class="text-gray-400">Cron Worker</span>
                            <span id="cronStatus" class="status-online"><i class="fas fa-circle text-xs mr-1"></i>稼働中</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-gray-700">
                            <span class="text-gray-400">最終更新</span>
                            <span id="lastUpdate" class="text-white">-</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-gray-700">
                            <span class="text-gray-400">次回更新（朝）</span>
                            <span class="text-white">07:00 JST</span>
                        </div>
                        <div class="flex justify-between items-center py-2">
                            <span class="text-gray-400">次回更新（夕）</span>
                            <span class="text-white">18:00 JST</span>
                        </div>
                    </div>
                </div>

                <div class="card p-6">
                    <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-tools text-yellow-400"></i>
                        クイックアクション
                    </h2>
                    <div class="space-y-3">
                        <button onclick="manualUpdate()" id="updateBtn" class="btn-success w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2">
                            <i class="fas fa-sync-alt"></i>
                            今すぐニュースを更新
                        </button>
                        <button onclick="checkStatus()" class="btn-primary w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2">
                            <i class="fas fa-heartbeat"></i>
                            ステータスを確認
                        </button>
                        <a href="https://sharehouse-times-cron.kunihiro72.workers.dev/" target="_blank"
                           class="btn-warning w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 block text-center">
                            <i class="fas fa-external-link-alt"></i>
                            Cron Worker を開く
                        </a>
                    </div>
                </div>
            </div>

            <!-- カテゴリー別統計 -->
            <div class="card p-6">
                <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-chart-pie text-blue-400"></i>
                    カテゴリー別ニュース数
                </h2>
                <div id="categoryStats" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <!-- カテゴリー統計が動的に挿入される -->
                </div>
            </div>

            <!-- ニュース一覧 -->
            <div class="card p-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-bold flex items-center gap-2">
                        <i class="fas fa-list text-green-400"></i>
                        ニュース一覧
                    </h2>
                    <div class="flex gap-2">
                        <select id="filterRegion" onchange="filterNews()" class="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm">
                            <option value="all">すべて</option>
                            <option value="japan">国内</option>
                            <option value="world">海外</option>
                        </select>
                        <select id="filterCategory" onchange="filterNews()" class="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm">
                            <option value="all">全カテゴリー</option>
                        </select>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="text-left text-gray-400 border-b border-gray-700">
                            <tr>
                                <th class="py-3 px-2">ID</th>
                                <th class="py-3 px-2">タイトル</th>
                                <th class="py-3 px-2">カテゴリー</th>
                                <th class="py-3 px-2">地域</th>
                                <th class="py-3 px-2">ソース</th>
                                <th class="py-3 px-2">日付</th>
                            </tr>
                        </thead>
                        <tbody id="newsTable" class="divide-y divide-gray-800">
                            <!-- ニュースが動的に挿入される -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 外部リンク -->
            <div class="card p-6">
                <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-link text-cyan-400"></i>
                    関連リンク
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a href="https://sharehouse-times.pages.dev/" target="_blank" 
                       class="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition flex items-center gap-3">
                        <i class="fas fa-globe text-2xl text-blue-400"></i>
                        <div>
                            <p class="font-bold">本番サイト</p>
                            <p class="text-xs text-gray-400">sharehouse-times.pages.dev</p>
                        </div>
                    </a>
                    <a href="https://dash.cloudflare.com/" target="_blank"
                       class="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition flex items-center gap-3">
                        <i class="fas fa-cloud text-2xl text-orange-400"></i>
                        <div>
                            <p class="font-bold">Cloudflare Dashboard</p>
                            <p class="text-xs text-gray-400">Workers & Pages 管理</p>
                        </div>
                    </a>
                    <a href="https://crann-terrace.com/" target="_blank"
                       class="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition flex items-center gap-3">
                        <i class="fas fa-home text-2xl text-green-400"></i>
                        <div>
                            <p class="font-bold">クランテラス</p>
                            <p class="text-xs text-gray-400">PR先サイト</p>
                        </div>
                    </a>
                </div>
            </div>
        </main>

        <!-- フッター -->
        <footer class="border-t border-gray-800 mt-8 py-4 text-center text-gray-500 text-sm">
            <p>シェアハウスタイムズ 管理者ダッシュボード &copy; 2026</p>
        </footer>
    </div>

    <script>
        const CRON_WORKER_URL = 'https://sharehouse-times-cron.kunihiro72.workers.dev';
        let allNews = [];
        let categoryConfig = {
            'new_open': { label: '新規オープン', color: 'bg-blue-500' },
            'women': { label: '女性専用', color: 'bg-pink-500' },
            'senior': { label: '高齢者向け', color: 'bg-orange-500' },
            'pet': { label: 'ペット可', color: 'bg-amber-500' },
            'foreign': { label: '外国人向け', color: 'bg-green-500' },
            'student': { label: '学生向け', color: 'bg-indigo-500' },
            'budget': { label: '格安', color: 'bg-yellow-500' },
            'remote': { label: 'リモート', color: 'bg-cyan-500' },
            'tokyo': { label: '東京', color: 'bg-red-500' },
            'osaka': { label: '大阪', color: 'bg-purple-500' },
            'fukuoka': { label: '福岡', color: 'bg-pink-500' },
            'nagoya': { label: '名古屋', color: 'bg-amber-600' },
            'kyoto': { label: '京都', color: 'bg-red-600' },
            'trend': { label: '賃貸トレンド', color: 'bg-blue-600' },
            'tokyo_life': { label: '東京一人暮らし', color: 'bg-gray-500' },
            'coliving': { label: 'コリビング', color: 'bg-teal-500' },
            'rural': { label: '地方移住', color: 'bg-green-600' },
            'investment': { label: '投資', color: 'bg-yellow-600' },
            'desk_tour': { label: 'デスクツアー', color: 'bg-purple-500' },
            'market': { label: '市場動向', color: 'bg-purple-500' },
            'policy': { label: '政策', color: 'bg-red-500' },
        };

        // ログイン処理
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;
            
            try {
                const res = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });
                const data = await res.json();
                
                if (data.success) {
                    sessionStorage.setItem('adminAuth', 'true');
                    showDashboard();
                } else {
                    document.getElementById('loginError').classList.remove('hidden');
                }
            } catch (err) {
                console.error(err);
                document.getElementById('loginError').classList.remove('hidden');
            }
        });

        function logout() {
            sessionStorage.removeItem('adminAuth');
            document.getElementById('dashboard').classList.add('hidden');
            document.getElementById('loginScreen').classList.remove('hidden');
            document.getElementById('password').value = '';
        }

        function showDashboard() {
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
            loadDashboard();
        }

        async function loadDashboard() {
            await fetchNews();
            await checkStatus();
            populateCategoryFilter();
        }

        async function fetchNews() {
            try {
                const res = await fetch('/api/news');
                const data = await res.json();
                allNews = data.news || [];
                updateStats();
                renderNewsTable(allNews);
                renderCategoryStats();
            } catch (err) {
                console.error('Error fetching news:', err);
            }
        }

        function updateStats() {
            const japanCount = allNews.filter(n => n.region === 'japan').length;
            const worldCount = allNews.filter(n => n.region === 'world').length;
            document.getElementById('totalNews').textContent = allNews.length;
            document.getElementById('japanNews').textContent = japanCount;
            document.getElementById('worldNews').textContent = worldCount;
        }

        function renderCategoryStats() {
            const stats = {};
            allNews.forEach(n => {
                if (n.categories) {
                    n.categories.forEach(cat => {
                        stats[cat] = (stats[cat] || 0) + 1;
                    });
                }
            });

            const container = document.getElementById('categoryStats');
            container.innerHTML = Object.entries(categoryConfig).map(([key, config]) => {
                const count = stats[key] || 0;
                return \`
                    <div class="bg-gray-800 rounded-lg p-3 text-center">
                        <p class="text-2xl font-bold">\${count}</p>
                        <p class="text-xs text-gray-400">\${config.label}</p>
                    </div>
                \`;
            }).join('');
        }

        function renderNewsTable(news) {
            const tbody = document.getElementById('newsTable');
            tbody.innerHTML = news.map(n => {
                const cat = categoryConfig[n.category] || { label: n.category, color: 'bg-gray-500' };
                const regionEmoji = n.region === 'japan' ? '🇯🇵' : '🌍';
                return \`
                    <tr class="table-row">
                        <td class="py-3 px-2 text-gray-400">\${n.id}</td>
                        <td class="py-3 px-2">
                            <a href="\${n.url}" target="_blank" class="hover:text-purple-400">\${n.title}</a>
                        </td>
                        <td class="py-3 px-2">
                            <span class="\${cat.color} text-white text-xs px-2 py-1 rounded">\${cat.label}</span>
                        </td>
                        <td class="py-3 px-2">\${regionEmoji}</td>
                        <td class="py-3 px-2 text-gray-400">\${n.source}</td>
                        <td class="py-3 px-2 text-gray-400">\${n.date}</td>
                    </tr>
                \`;
            }).join('');
        }

        function populateCategoryFilter() {
            const select = document.getElementById('filterCategory');
            select.innerHTML = '<option value="all">全カテゴリー</option>' +
                Object.entries(categoryConfig).map(([key, config]) => 
                    \`<option value="\${key}">\${config.label}</option>\`
                ).join('');
        }

        function filterNews() {
            const region = document.getElementById('filterRegion').value;
            const category = document.getElementById('filterCategory').value;
            
            let filtered = allNews;
            if (region !== 'all') {
                filtered = filtered.filter(n => n.region === region);
            }
            if (category !== 'all') {
                filtered = filtered.filter(n => n.category === category || (n.categories && n.categories.includes(category)));
            }
            renderNewsTable(filtered);
        }

        async function checkStatus() {
            try {
                const res = await fetch(CRON_WORKER_URL + '/status');
                const data = await res.json();
                
                document.getElementById('cronStatus').innerHTML = '<i class="fas fa-circle text-xs mr-1"></i>稼働中';
                document.getElementById('cronStatus').className = 'status-online';
                
                if (data.lastUpdated && data.lastUpdated !== 'Never') {
                    const date = new Date(data.lastUpdated);
                    const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
                    document.getElementById('lastUpdate').textContent = 
                        jst.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                }
            } catch (err) {
                document.getElementById('cronStatus').innerHTML = '<i class="fas fa-circle text-xs mr-1"></i>エラー';
                document.getElementById('cronStatus').className = 'status-offline';
            }
        }

        async function manualUpdate() {
            const btn = document.getElementById('updateBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>更新中...';
            
            try {
                const res = await fetch(CRON_WORKER_URL + '/update');
                const data = await res.json();
                
                if (data.success) {
                    btn.innerHTML = '<i class="fas fa-check mr-2"></i>更新完了！';
                    setTimeout(() => {
                        btn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>今すぐニュースを更新';
                        btn.disabled = false;
                    }, 2000);
                    
                    // データを再取得
                    await fetchNews();
                    await checkStatus();
                }
            } catch (err) {
                btn.innerHTML = '<i class="fas fa-times mr-2"></i>エラー';
                setTimeout(() => {
                    btn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>今すぐニュースを更新';
                    btn.disabled = false;
                }, 2000);
            }
        }

        // 初期化
        if (sessionStorage.getItem('adminAuth') === 'true') {
            showDashboard();
        }
    </script>
</body>
</html>
  `)
})

// 管理者ログインAPI
app.post('/api/admin/login', async (c) => {
  const { password } = await c.req.json()
  if (password === ADMIN_PASSWORD) {
    return c.json({ success: true })
  }
  return c.json({ success: false, error: 'Invalid password' }, 401)
})

// Cron WorkerのURL
const CRON_WORKER_URL = 'https://sharehouse-times-cron.kunihiro72.workers.dev'

// API: ニュースデータを取得（Cron Workerから取得）
app.get('/api/news', async (c) => {
  try {
    // まずCron Workerから最新データを取得
    const cronResponse = await fetch(`${CRON_WORKER_URL}/api/news`, {
      headers: { 'Cache-Control': 'no-cache' }
    })
    
    if (cronResponse.ok) {
      const cronData = await cronResponse.json() as { news: any[], lastUpdated: string | null }
      if (cronData.news && cronData.news.length > 0) {
        return c.json({ 
          success: true, 
          news: cronData.news, 
          total: cronData.news.length, 
          lastUpdated: cronData.lastUpdated,
          source: 'cron-worker'
        })
      }
    }
    
    // Cron Workerから取得できない場合はKVを確認
    let cachedData: { news: any[], lastUpdated: string | null } | null = null
    if (c.env?.NEWS_KV) {
      cachedData = await c.env.NEWS_KV.get('news_data', 'json')
    }
    
    if (cachedData?.news && cachedData.news.length > 0) {
      return c.json({ 
        success: true, 
        news: cachedData.news, 
        total: cachedData.news.length, 
        lastUpdated: cachedData.lastUpdated,
        source: 'kv-cache'
      })
    }
    
    // どちらも取得できない場合はデフォルトニュース
    const news = generateDefaultNews()
    return c.json({ success: true, news, total: news.length, lastUpdated: null, source: 'default' })
  } catch (error) {
    console.error('News fetch error:', error)
    const news = generateDefaultNews()
    return c.json({ success: false, news, total: news.length, lastUpdated: null, source: 'error-fallback' })
  }
})

// Cron Trigger
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: { NEWS_KV: KVNamespace }, ctx: ExecutionContext) {
    try {
      const news = generateDefaultNews()
      await env.NEWS_KV.put('news_data', JSON.stringify({ news, lastUpdated: new Date().toISOString() }))
    } catch (error) {
      console.error('Cron job failed:', error)
    }
  }
}

// ニュースデータ生成（18カテゴリー対応）
function generateDefaultNews() {
  const now = new Date()
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const formatDate = (daysAgo: number): string => {
    const date = new Date(jstNow)
    date.setDate(date.getDate() - daysAgo)
    return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }) + '(' + ['日','月','火','水','木','金','土'][date.getDay()] + ')'
  }
  
  return [
    // 物件タイプ別ニュース
    { id: 1, title: 'シェアレジデンス「nears五反田」2026年5月入居開始', summary: 'ひとり暮らしとシェアハウスの間、ゆるくつながる心地よい暮らしを提案する新コンセプト物件。', region: 'japan', source: '大和ハウス工業', date: formatDate(0), category: 'new_open', categories: ['new_open', 'tokyo'], url: 'https://www.daiwahouse.co.jp/about/release/group/20251211162546.html' },
    { id: 2, title: '高齢者シェアハウスで新しい老後生活、自由と安心を両立', summary: '70代〜90代が共同生活するシェアハウスが人気に。孤独解消と自立を両立する新しい住まいの形。', region: 'japan', source: 'テレ朝NEWS', date: formatDate(0), category: 'senior', categories: ['senior'], url: 'https://news.tv-asahi.co.jp/news_economy/articles/900180056.html' },
    { id: 3, title: '空き家を外国人材の住まいに再生「外国人材シェアハウス」提供開始', summary: '企業向け外国人社宅サービスとして家具付き・敷金礼金ゼロの物件を提供。', region: 'japan', source: 'PR TIMES', date: formatDate(1), category: 'foreign', categories: ['foreign'], url: 'https://prtimes.jp/main/html/rd/p/000000077.000120610.html' },
    { id: 4, title: 'ネイバーズ羽田が2026年3月開業、新規入居者の募集開始', summary: '京急空港線「糀谷駅」徒歩13分、羽田空港まで最短10分の好立地。', region: 'japan', source: 'SOCIAL APARTMENT', date: formatDate(1), category: 'new_open', categories: ['new_open', 'tokyo'], url: 'https://www.social-apartment.com/lifestyle/detail/20251219192601' },
    { id: 5, title: '長崎に女性専用シェアハウス「長崎ライトハウス」誕生', summary: '斜面地の空き家をリノベーション。女性の自立を支援。', region: 'japan', source: '長崎新聞', date: formatDate(2), category: 'women', categories: ['women'], url: 'https://www.nagasaki-np.co.jp/kijis/?kijiid=341c58b5163a4d06a220c50c5f6436c5' },
    { id: 6, title: '全国でも珍しいペット共生型シェアハウス「ペミリ住之江」', summary: 'ドッグトレーナーが管理人として常駐するペット共生型シェアハウス。', region: 'japan', source: '産経ニュース', date: formatDate(2), category: 'pet', categories: ['pet', 'osaka'], url: 'https://www.sankei.com/article/20231106-IQ2SI6RUHFMNJNSRUPWZBELAJU/' },
    
    // 格安・学生向け
    { id: 7, title: '月額2.5万円から！学生向け格安シェアハウスが人気', summary: '都内でも家賃を抑えたい学生に支持される格安シェアハウスの実態。', region: 'japan', source: 'SUUMO', date: formatDate(1), category: 'budget', categories: ['budget', 'student', 'tokyo'], url: 'https://suumo.jp/journal/2025/11/18/212864/' },
    { id: 8, title: '大学生の新生活、シェアハウスという選択肢', summary: '初期費用を抑えられるシェアハウスが大学生の間で人気上昇中。', region: 'japan', source: '東洋経済', date: formatDate(2), category: 'student', categories: ['student', 'budget'], url: 'https://toyokeizai.net/' },
    
    // リモートワーク
    { id: 9, title: 'テレワーク対応シェアハウス、コワーキング併設型が増加', summary: '在宅勤務の普及で、Wi-Fi完備・作業スペース付きの物件需要が急増。', region: 'japan', source: 'ITmedia', date: formatDate(0), category: 'remote', categories: ['remote'], url: 'https://www.itmedia.co.jp/' },
    
    // エリア別
    { id: 10, title: '東京都心のシェアハウス、平均家賃は6.5万円に', summary: '23区内のシェアハウス家賃相場最新データ。人気エリアは新宿・渋谷。', region: 'japan', source: '不動産経済研究所', date: formatDate(1), category: 'tokyo', categories: ['tokyo', 'trend'], url: 'https://www.fudousankeizai.co.jp/' },
    { id: 11, title: '大阪・心斎橋エリアにデザイナーズシェアハウス誕生', summary: 'アーティスト向けのクリエイティブな空間を提供。', region: 'japan', source: '大阪日日新聞', date: formatDate(2), category: 'osaka', categories: ['osaka', 'new_open'], url: 'https://www.nnn.co.jp/' },
    { id: 12, title: '福岡・天神エリアのシェアハウス人気上昇中', summary: 'スタートアップ集積地として注目の福岡でシェアハウス需要が拡大。', region: 'japan', source: '西日本新聞', date: formatDate(3), category: 'fukuoka', categories: ['fukuoka'], url: 'https://www.nishinippon.co.jp/' },
    
    // トレンド系
    { id: 13, title: '2026年賃貸トレンド：シェアハウスが一人暮らしを超える？', summary: 'コスト面・コミュニティ面で賃貸市場に変化の兆し。', region: 'japan', source: 'LIFULL HOME\'S', date: formatDate(0), category: 'trend', categories: ['trend'], url: 'https://www.homes.co.jp/' },
    { id: 14, title: '東京一人暮らしvs シェアハウス、月額費用を徹底比較', summary: '家賃・光熱費・通信費を含めた総コストで比較検証。', region: 'japan', source: 'マネーの達人', date: formatDate(1), category: 'tokyo_life', categories: ['tokyo_life', 'tokyo', 'budget'], url: 'https://manetatsu.com/' },
    { id: 15, title: '地方移住×シェアハウス、新しいライフスタイルの提案', summary: '都会を離れ、地方でシェアハウス暮らしを始める人が増加。', region: 'japan', source: '田舎暮らしの本', date: formatDate(2), category: 'rural', categories: ['rural'], url: 'https://inaka.tkj.jp/' },
    { id: 16, title: 'シェアハウス投資、利回り8%超えの物件も', summary: '不動産投資としてのシェアハウス経営の魅力と注意点。', region: 'japan', source: '楽待新聞', date: formatDate(3), category: 'investment', categories: ['investment'], url: 'https://www.rakumachi.jp/' },
    
    // デスクツアー
    { id: 17, title: 'シェアハウス住民のデスク環境公開！在宅ワーク最適化術', summary: '限られたスペースで快適な作業環境を作るコツを紹介。', region: 'japan', source: 'Gigazine', date: formatDate(0), category: 'desk_tour', categories: ['desk_tour', 'remote'], url: 'https://gigazine.net/' },
    { id: 18, title: '6畳個室でも快適！シェアハウスのデスクセットアップ', summary: 'コンパクトでも機能的なデスク環境を実現した住民を取材。', region: 'japan', source: 'Impress Watch', date: formatDate(1), category: 'desk_tour', categories: ['desk_tour'], url: 'https://www.watch.impress.co.jp/' },
    
    // 市場動向
    { id: 19, title: 'インバウンド需要の回復でシェアハウス市場が活況に', summary: '外国人入居者が7割に達する物件も。物件数は前年比5.4%増。', region: 'japan', source: 'WEB翻訳', date: formatDate(3), category: 'market', categories: ['market', 'foreign'], url: 'https://web-honyaku.jp/2025/05/14/share-house/' },
    { id: 20, title: '政府が「高齢者シェアハウス」整備へ、全国100カ所目標', summary: '独居高齢者の孤独死防止・生活支援を目的に整備推進。', region: 'japan', source: 'SUUMO', date: formatDate(3), category: 'policy', categories: ['policy', 'senior'], url: 'https://suumo.jp/journal/2025/11/18/212864/' },
    
    // 海外・コリビング
    { id: 101, title: 'Co-Living Apartments Could Help Fix the Housing Crisis', summary: 'Co-living as a key strategy for affordable housing in the US.', region: 'world', source: 'Business Insider', date: formatDate(0), category: 'coliving', categories: ['coliving', 'us'], url: 'https://www.businessinsider.com/co-living-apartments-cheap-rent-fix-housing-crisis-2025-8' },
    { id: 102, title: 'UK Co-Living 2025: Renters Ready to Embrace Shared Living', summary: 'London Co-Living rents range from £1,550 to £1,750 pcm.', region: 'world', source: 'Savills', date: formatDate(1), category: 'coliving', categories: ['coliving', 'uk'], url: 'https://www.savills.co.uk/research_articles/229130/372282-0' },
    { id: 103, title: 'Singapore Co-living Player Gears Up for Listing', summary: 'シンガポールのコリビング大手がCatalist上場へ。', region: 'world', source: 'EdgeProp', date: formatDate(1), category: 'coliving', categories: ['coliving', 'asia'], url: 'https://www.edgeprop.sg/property-news/co-living-player-assembly-place-lodges-prospectus-gears-catalist-listing' },
    { id: 104, title: 'Coliving 2025: Key Investment Trends', summary: 'Investment shifts and evolving design trends in coliving.', region: 'world', source: 'Coliving Insights', date: formatDate(2), category: 'investment', categories: ['investment', 'coliving'], url: 'https://www.colivinginsights.com/articles/whats-next-for-coliving-key-investment-design-and-development-trends-shaping-2025-at-coliving-insights-talks' },
    { id: 105, title: 'East London Coliving Scheme Gets Green Light', summary: '245-unit coliving scheme approved in Shoreditch.', region: 'world', source: 'Urban Living News', date: formatDate(2), category: 'coliving', categories: ['coliving', 'uk'], url: 'https://urbanliving.news/coliving/east-london-coliving-scheme-gets-the-green-light/' },
    { id: 106, title: 'Korea\'s Co-Living Market Heats Up in 2025', summary: 'Seoul co-living rent 1.5x higher than average officetel.', region: 'world', source: 'World Property Journal', date: formatDate(3), category: 'coliving', categories: ['coliving', 'asia'], url: 'https://www.worldpropertyjournal.com/' },
  ]
}
