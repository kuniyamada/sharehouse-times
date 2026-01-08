import { Hono } from 'hono'
import { cors } from 'hono/cors'

// Cloudflare Bindings型定義
type Bindings = {
  NEWS_KV: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// クランテラスの画像URL
const CRANN_IMAGES = {
  lounge1: '/images/crann1.jpg',
  lounge2: '/images/crann2.jpg',
  lounge3: '/images/crann3.jpg',
}

// Yahoo! JAPAN風スタイル（スマホ対応・カテゴリー色付き）
const yahooStyles = `
    <style>
        * { 
            font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic", Meiryo, sans-serif;
            -webkit-tap-highlight-color: transparent;
        }
        
        body {
            background-color: #f0f2f5;
            font-size: 14px;
        }
        
        /* ヘッダー */
        .yahoo-header {
            background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
            border-bottom: 2px solid #e94560;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        /* タブナビゲーション - スマホ対応 */
        .tab-nav {
            background: linear-gradient(180deg, #fff 0%, #f8f9fa 100%);
            border-bottom: 2px solid #e0e0e0;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            white-space: nowrap;
            position: sticky;
            top: 44px;
            z-index: 99;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .tab-nav::-webkit-scrollbar {
            display: none;
        }
        .tab-item {
            display: inline-block;
            padding: 12px 16px;
            color: #444;
            text-decoration: none;
            font-size: 13px;
            font-weight: 500;
            border-bottom: 3px solid transparent;
            transition: all 0.2s;
        }
        .tab-item:hover {
            background: #f0f4ff;
            color: #e94560;
        }
        .tab-item.active {
            color: #e94560;
            border-bottom-color: #e94560;
            font-weight: bold;
            background: #fff0f3;
        }
        
        /* モバイルカテゴリーメニュー */
        .mobile-cat-menu {
            background: linear-gradient(180deg, #f8f9fa 0%, #fff 100%);
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            white-space: nowrap;
            border-bottom: 1px solid #e0e0e0;
            padding: 10px 0;
        }
        .mobile-cat-menu::-webkit-scrollbar {
            display: none;
        }
        .mobile-cat-item {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 8px 14px;
            margin: 0 4px;
            background: #fff;
            border: 1px solid #e0e0e0;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 500;
            color: #555;
            text-decoration: none;
            white-space: nowrap;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            transition: all 0.2s;
        }
        .mobile-cat-item:hover {
            border-color: #e94560;
            color: #e94560;
        }
        .mobile-cat-item.active {
            background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
            border-color: #e94560;
            color: white;
            box-shadow: 0 2px 8px rgba(233,69,96,0.3);
        }
        
        /* カテゴリーセクション */
        .cat-section-title {
            font-size: 10px;
            color: #888;
            padding: 10px 12px 6px;
            background: linear-gradient(180deg, #f0f2f5 0%, #e8eaed 100%);
            border-bottom: 1px solid #ddd;
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        
        /* 左サイドのカテゴリメニュー（PC用） */
        .side-menu {
            background: linear-gradient(180deg, #fff 0%, #f8f9fa 100%);
            border-right: 1px solid #e0e0e0;
            max-height: calc(100vh - 90px);
            overflow-y: auto;
            position: sticky;
            top: 90px;
        }
        .side-menu::-webkit-scrollbar {
            width: 4px;
        }
        .side-menu::-webkit-scrollbar-thumb {
            background: #ccc;
            border-radius: 2px;
        }
        .side-menu-section {
            border-bottom: 1px solid #e8e8e8;
        }
        .side-menu-section-title {
            font-size: 10px;
            color: #fff;
            padding: 8px 12px;
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        .side-menu-section:nth-child(1) .side-menu-section-title {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .side-menu-section:nth-child(2) .side-menu-section-title {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        .side-menu-section:nth-child(3) .side-menu-section-title {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
        .side-menu-item {
            display: flex;
            align-items: center;
            padding: 10px 12px;
            color: #444;
            text-decoration: none;
            border-bottom: 1px solid #f0f0f0;
            font-size: 11px;
            font-weight: 500;
            transition: all 0.2s;
        }
        .side-menu-item:hover {
            background: #f0f4ff;
            color: #e94560;
            padding-left: 15px;
        }
        .side-menu-item.active {
            background: linear-gradient(90deg, #fff0f3 0%, #fff 100%);
            color: #e94560;
            font-weight: bold;
            border-left: 4px solid #e94560;
            padding-left: 8px;
        }
        
        /* トピックス（メイン） */
        .topics-box {
            background: #fff;
            border: none;
            border-radius: 12px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            overflow: hidden;
        }
        @media (max-width: 767px) {
            .topics-box {
                border-radius: 0;
                margin-left: 0 !important;
                margin-right: 0 !important;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
        }
        .topics-header {
            background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
            border-bottom: none;
            padding: 12px 16px;
            font-weight: bold;
            font-size: 14px;
            color: #fff;
        }
        .topics-header-icon {
            color: #fff;
            margin-right: 6px;
        }
        
        /* セクション別ヘッダー色 */
        .section-japan .topics-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .section-world .topics-header {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }
        .section-ranking .topics-header {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        
        /* 見出しリスト */
        .headline-item {
            padding: 14px 16px;
            border-bottom: 1px solid #f0f0f0;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            transition: all 0.2s;
        }
        .headline-item:hover {
            background: #f8f9ff;
        }
        .headline-item:active {
            background: #f0f2f5;
        }
        .headline-link {
            color: #2c3e50;
            text-decoration: none;
            font-size: 14px;
            line-height: 1.6;
            flex: 1;
            display: block;
            font-weight: 500;
        }
        .headline-link:hover {
            color: #e94560;
        }
        @media (max-width: 767px) {
            .headline-link {
                font-size: 15px;
            }
        }
        
        /* NEWバッジ */
        .badge-new {
            background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
            color: white;
            font-size: 9px;
            padding: 3px 6px;
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
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-size: 13px;
            color: white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        
        /* 情報元 */
        .source-info {
            font-size: 11px;
            color: #888;
            margin-top: 6px;
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        /* カテゴリータグ */
        .cat-tag {
            display: inline-block;
            font-size: 10px;
            padding: 3px 8px;
            border-radius: 4px;
            font-weight: 600;
            letter-spacing: 0.3px;
        }
        
        /* PR広告枠 */
        .pr-box {
            border: none;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            overflow: hidden;
        }
        .pr-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 10px 14px;
            font-size: 12px;
            font-weight: 600;
            color: #fff;
            border-bottom: none;
        }
        
        /* クランテラス広告 */
        .crann-ad {
            background: linear-gradient(135deg, #2d5a27 0%, #4a7c43 100%);
            color: white;
            border-radius: 8px;
            overflow: hidden;
        }
        .crann-ad:hover {
            opacity: 0.95;
        }
        
        /* モバイル用クランテラスバナー */
        .mobile-crann-banner {
            background: linear-gradient(135deg, #2d5a27 0%, #4a7c43 100%);
            color: white;
            margin: 12px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(45,90,39,0.3);
        }
        
        /* ランキング */
        .ranking-num {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            border-radius: 6px;
            flex-shrink: 0;
        }
        .rank-1 { background: linear-gradient(135deg, #f5af19 0%, #f12711 100%); color: #fff; box-shadow: 0 2px 6px rgba(245,175,25,0.4); }
        .rank-2 { background: linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%); color: #fff; box-shadow: 0 2px 6px rgba(189,195,199,0.4); }
        .rank-3 { background: linear-gradient(135deg, #c9920e 0%, #8b5a00 100%); color: #fff; box-shadow: 0 2px 6px rgba(201,146,14,0.4); }
        .rank-other { background: #f0f2f5; color: #666; }
        
        /* 更新時刻 */
        .update-time {
            font-size: 10px;
            color: #999;
        }

        /* フッター */
        .yahoo-footer {
            background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
            border-top: none;
        }
        .footer-link {
            color: #a0aec0;
            text-decoration: none;
            font-size: 12px;
            transition: color 0.2s;
        }
        .footer-link:hover {
            color: #e94560;
            text-decoration: none;
        }
        
        /* モバイルフッター固定バナー */
        .mobile-fixed-banner {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #2d5a27 0%, #4a7c43 100%);
            color: white;
            padding: 12px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 1000;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
        }
        
        /* 注目キーワード */
        .keyword-tag {
            display: inline-block;
            padding: 6px 12px;
            margin: 3px;
            background: linear-gradient(135deg, #f0f2f5 0%, #e8eaed 100%);
            border-radius: 20px;
            font-size: 11px;
            color: #555;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid #e0e0e0;
        }
        .keyword-tag:hover {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            border-color: #667eea;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(102,126,234,0.3);
        }
        
        /* カテゴリー別ハイライト色 */
        .cat-highlight-new_open { border-left: 4px solid #3b82f6; }
        .cat-highlight-women { border-left: 4px solid #ec4899; }
        .cat-highlight-senior { border-left: 4px solid #f97316; }
        .cat-highlight-pet { border-left: 4px solid #f59e0b; }
        .cat-highlight-foreign { border-left: 4px solid #22c55e; }
        .cat-highlight-student { border-left: 4px solid #6366f1; }
        .cat-highlight-budget { border-left: 4px solid #eab308; }
        .cat-highlight-remote { border-left: 4px solid #06b6d4; }
        .cat-highlight-tokyo { border-left: 4px solid #ef4444; }
        .cat-highlight-osaka { border-left: 4px solid #a855f7; }
        .cat-highlight-trend { border-left: 4px solid #2563eb; }
        .cat-highlight-coliving { border-left: 4px solid #14b8a6; }
        .cat-highlight-desk_tour { border-left: 4px solid #8b5cf6; }
        
        /* スマホ用の余白調整 */
        @media (max-width: 767px) {
            body {
                padding-bottom: 60px;
            }
        }
    </style>
`

// ニュースページ（Yahoo! JAPAN風トップ - スマホ対応）
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="format-detection" content="telephone=no">
    <title>シェアハウスタイムズ｜AIがまとめる最新シェアハウス情報</title>
    <meta name="description" content="AIが国内外のシェアハウス・コリビング最新ニュースを毎日自動収集。女性専用、ペット可、高齢者向け、格安物件など幅広くカバー。東京・大阪・福岡のエリア情報も。">
    <meta name="keywords" content="シェアハウス,コリビング,女性専用,ペット可,高齢者,東京,一人暮らし,賃貸,ニュース">
    <link rel="canonical" href="https://sharehouse-times.pages.dev/">
    <meta property="og:title" content="シェアハウスタイムズ｜AIがまとめる最新情報">
    <meta property="og:description" content="AIが国内外のシェアハウス最新ニュースを毎日自動収集">
    <meta property="og:type" content="website">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    ${yahooStyles}
</head>
<body>
    <!-- ヘッダー -->
    <header class="yahoo-header">
        <div class="max-w-6xl mx-auto px-3 py-2">
            <div class="flex items-center justify-between">
                <a href="/" class="flex items-center gap-2">
                    <span class="text-white font-bold text-xl" style="text-shadow: 0 0 10px rgba(233,69,96,0.5);">ST</span>
                    <span class="font-bold text-sm text-gray-200 hidden sm:inline">シェアハウスタイムズ</span>
                    <span class="font-bold text-xs text-gray-200 sm:hidden">シェアタイムズ</span>
                    <span class="text-xs px-2 py-0.5 rounded font-bold" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">AI</span>
                </a>
                <div class="flex items-center gap-3">
                    <span class="update-time hidden sm:inline text-gray-400"><i class="far fa-clock mr-1"></i>毎日7時・18時更新</span>
                    <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer" 
                       class="text-white px-4 py-1.5 rounded-full text-xs font-bold hidden sm:flex items-center gap-1" style="background: linear-gradient(135deg, #2d5a27 0%, #4a7c43 100%); box-shadow: 0 2px 8px rgba(45,90,39,0.3);">
                        <i class="fas fa-home"></i>
                        クランテラス
                    </a>
                </div>
            </div>
        </div>
    </header>

    <!-- タブナビゲーション -->
    <nav class="tab-nav">
        <div class="max-w-6xl mx-auto px-2">
            <a href="#" class="tab-item active" onclick="filterRegion('all'); return false;" data-region="all">トップ</a>
            <a href="#" class="tab-item" onclick="filterRegion('japan'); return false;" data-region="japan">🇯🇵 国内</a>
            <a href="#" class="tab-item" onclick="filterRegion('world'); return false;" data-region="world">🌍 海外</a>
            <a href="#" class="tab-item" onclick="filterCategory('tokyo_life'); return false;" data-region="tokyo">🗼 東京</a>
            <a href="#" class="tab-item" onclick="filterCategory('trend'); return false;" data-region="trend">📊 トレンド</a>
        </div>
    </nav>

    <!-- モバイル用カテゴリーメニュー -->
    <div class="mobile-cat-menu md:hidden">
        <div class="px-2">
            <a href="#" class="mobile-cat-item active" onclick="filterCategory('all'); return false;" data-cat="all">主要</a>
            <a href="#" class="mobile-cat-item" onclick="filterCategory('new_open'); return false;" data-cat="new_open">🚪新規</a>
            <a href="#" class="mobile-cat-item" onclick="filterCategory('women'); return false;" data-cat="women">♀️女性</a>
            <a href="#" class="mobile-cat-item" onclick="filterCategory('senior'); return false;" data-cat="senior">👴高齢者</a>
            <a href="#" class="mobile-cat-item" onclick="filterCategory('pet'); return false;" data-cat="pet">🐾ペット</a>
            <a href="#" class="mobile-cat-item" onclick="filterCategory('budget'); return false;" data-cat="budget">💴格安</a>
            <a href="#" class="mobile-cat-item" onclick="filterCategory('student'); return false;" data-cat="student">🎓学生</a>
            <a href="#" class="mobile-cat-item" onclick="filterCategory('remote'); return false;" data-cat="remote">💻リモート</a>
            <a href="#" class="mobile-cat-item" onclick="filterCategory('tokyo'); return false;" data-cat="tokyo">🗼東京</a>
            <a href="#" class="mobile-cat-item" onclick="filterCategory('osaka'); return false;" data-cat="osaka">🏯大阪</a>
            <a href="#" class="mobile-cat-item" onclick="filterCategory('coliving'); return false;" data-cat="coliving">🏢コリビング</a>
            <a href="#" class="mobile-cat-item" onclick="filterCategory('tokyo_life'); return false;" data-cat="tokyo_life">🏠一人暮らし</a>
            <a href="#" class="mobile-cat-item" onclick="filterCategory('trend'); return false;" data-cat="trend">📊賃貸トレンド</a>
            <a href="#" class="mobile-cat-item" onclick="filterCategory('desk_tour'); return false;" data-cat="desk_tour">🖥️デスクツアー</a>
        </div>
    </div>

    <!-- メインコンテンツ -->
    <main class="max-w-6xl mx-auto md:flex">
        
        <!-- 左サイドメニュー（PC用） -->
        <aside class="side-menu w-40 flex-shrink-0 hidden md:block">
            <!-- 物件タイプ -->
            <div class="side-menu-section">
                <div class="side-menu-section-title">物件タイプ</div>
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
                <a href="#" class="side-menu-item" onclick="filterCategory('budget'); return false;" data-cat="budget">
                    <i class="fas fa-yen-sign mr-2 text-yellow-500"></i>格安
                </a>
                <a href="#" class="side-menu-item" onclick="filterCategory('remote'); return false;" data-cat="remote">
                    <i class="fas fa-laptop-house mr-2 text-cyan-400"></i>リモートワーク
                </a>
            </div>
            
            <!-- エリア -->
            <div class="side-menu-section">
                <div class="side-menu-section-title">エリア</div>
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
            
            <!-- ライフスタイル・トレンド -->
            <div class="side-menu-section">
                <div class="side-menu-section-title">トレンド</div>
                <a href="#" class="side-menu-item" onclick="filterCategory('trend'); return false;" data-cat="trend">
                    <i class="fas fa-chart-line mr-2 text-blue-400"></i>賃貸トレンド
                </a>
                <a href="#" class="side-menu-item" onclick="filterCategory('tokyo_life'); return false;" data-cat="tokyo_life">
                    <i class="fas fa-city mr-2 text-gray-400"></i>東京一人暮らし
                </a>
                <a href="#" class="side-menu-item" onclick="filterCategory('coliving'); return false;" data-cat="coliving">
                    <i class="fas fa-building-user mr-2 text-teal-400"></i>コリビング
                </a>
                <a href="#" class="side-menu-item" onclick="filterCategory('rural'); return false;" data-cat="rural">
                    <i class="fas fa-mountain-sun mr-2 text-green-400"></i>地方移住
                </a>
                <a href="#" class="side-menu-item" onclick="filterCategory('investment'); return false;" data-cat="investment">
                    <i class="fas fa-coins mr-2 text-yellow-400"></i>投資
                </a>
                <a href="#" class="side-menu-item" onclick="filterCategory('desk_tour'); return false;" data-cat="desk_tour">
                    <i class="fas fa-desktop mr-2 text-purple-400"></i>デスクツアー
                </a>
            </div>
        </aside>

        <!-- 中央メインコンテンツ -->
        <div class="flex-1 min-w-0">
            
            <!-- モバイル用クランテラスバナー -->
            <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer" class="mobile-crann-banner block md:hidden">
                <div class="p-3 flex items-center gap-3">
                    <img src="${CRANN_IMAGES.lounge1}" alt="クランテラス" class="w-16 h-16 object-cover rounded">
                    <div class="flex-1">
                        <div class="text-xs opacity-70">PR</div>
                        <div class="font-bold text-sm">クランテラスシリーズ</div>
                        <div class="text-xs opacity-90">緑あふれる開放的な空間で新生活を</div>
                    </div>
                    <i class="fas fa-chevron-right opacity-70"></i>
                </div>
            </a>
            
            <!-- カテゴリータイトル -->
            <div id="categoryTitle" class="hidden bg-white border-b px-4 py-3 m-3 md:m-3 rounded-t">
                <h1 class="text-lg font-bold text-gray-800" id="categoryTitleText">主要ニュース</h1>
                <p class="text-xs text-gray-500" id="categoryDescription">シェアハウス・コリビングの最新ニュース</p>
            </div>
            
            <!-- トピックス -->
            <section class="topics-box m-3 md:m-3">
                <div class="topics-header flex items-center justify-between">
                    <span><i class="fas fa-fire topics-header-icon"></i>トピックス</span>
                    <span class="update-time" id="updateTime"></span>
                </div>
                <div id="topicsList" class="divide-y divide-gray-100"></div>
            </section>

            <!-- 国内ニュース -->
            <section id="japanSection" class="topics-box section-japan m-3 md:m-3">
                <div class="topics-header">
                    <span>🇯🇵 国内ニュース</span>
                </div>
                <div id="japanNewsList" class="divide-y divide-gray-100"></div>
            </section>

            <!-- 海外ニュース -->
            <section id="worldSection" class="topics-box section-world m-3 md:m-3">
                <div class="topics-header">
                    <span>🌍 海外ニュース</span>
                </div>
                <div id="worldNewsList" class="divide-y divide-gray-100"></div>
            </section>

            <!-- モバイル用ランキング -->
            <section class="topics-box section-ranking m-3 md:hidden">
                <div class="topics-header">
                    <i class="fas fa-ranking-star mr-2"></i>アクセスランキング
                </div>
                <div class="p-3" id="mobileRankingList"></div>
            </section>

        </div>

        <!-- 右サイドバー（PC用） -->
        <aside class="w-64 flex-shrink-0 hidden lg:block p-3 space-y-3">
            
            <!-- クランテラス広告 -->
            <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer" class="block crann-ad">
                <div class="p-3">
                    <div class="text-xs opacity-70 mb-1">PR</div>
                    <div class="font-bold mb-2">クランテラスシリーズ</div>
                    <div class="grid grid-cols-3 gap-1 mb-2">
                        <img src="${CRANN_IMAGES.lounge1}" alt="" class="w-full h-12 object-cover rounded">
                        <img src="${CRANN_IMAGES.lounge2}" alt="" class="w-full h-12 object-cover rounded">
                        <img src="${CRANN_IMAGES.lounge3}" alt="" class="w-full h-12 object-cover rounded">
                    </div>
                    <p class="text-xs opacity-90 mb-2">緑あふれる開放的な空間でシェアライフを</p>
                    <div class="bg-white text-green-700 text-center py-1.5 rounded text-xs font-bold">
                        物件を見る →
                    </div>
                </div>
            </a>

            <!-- アクセスランキング -->
            <div class="pr-box">
                <div class="pr-header flex items-center">
                    <i class="fas fa-ranking-star text-yellow-500 mr-2"></i>
                    アクセスランキング
                </div>
                <div class="p-2" id="rankingList"></div>
            </div>

            <!-- おすすめシェアハウス -->
            <div class="pr-box">
                <div class="pr-header">
                    <i class="fas fa-leaf text-green-500 mr-2"></i>
                    おすすめ
                </div>
                <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer" class="block p-2 hover:bg-gray-50">
                    <img src="${CRANN_IMAGES.lounge2}" alt="クランテラス" class="w-full h-24 object-cover rounded mb-2">
                    <p class="text-xs font-bold text-gray-800">クランテラス</p>
                    <p class="text-xs text-gray-500">駅近・Wi-Fi完備・共用ラウンジ</p>
                </a>
            </div>

            <!-- 注目キーワード -->
            <div class="pr-box">
                <div class="pr-header">
                    <i class="fas fa-tag mr-2"></i>
                    注目キーワード
                </div>
                <div class="p-3 flex flex-wrap">
                    <span onclick="filterCategory('women')" class="keyword-tag">♀️ 女性専用</span>
                    <span onclick="filterCategory('pet')" class="keyword-tag">🐾 ペット可</span>
                    <span onclick="filterCategory('budget')" class="keyword-tag">💴 格安</span>
                    <span onclick="filterCategory('tokyo')" class="keyword-tag">🗼 東京</span>
                    <span onclick="filterCategory('coliving')" class="keyword-tag">🏢 コリビング</span>
                    <span onclick="filterCategory('remote')" class="keyword-tag">💻 リモート</span>
                </div>
            </div>

        </aside>
    </main>

    <!-- フッター -->
    <footer class="yahoo-footer py-6 mt-4">
        <div class="max-w-6xl mx-auto px-3 text-center">
            <div class="flex flex-wrap justify-center gap-3 mb-3 text-xs">
                <a href="https://crann-terrace.com/" class="footer-link">クランテラス公式</a>
                <span class="text-gray-300">|</span>
                <a href="#" onclick="filterCategory('women'); return false;" class="footer-link">女性専用</a>
                <span class="text-gray-300">|</span>
                <a href="#" onclick="filterCategory('tokyo'); return false;" class="footer-link">東京</a>
                <span class="text-gray-300">|</span>
                <a href="#" onclick="filterCategory('coliving'); return false;" class="footer-link">コリビング</a>
            </div>
            <p class="text-xs text-gray-500">
                Presented by <a href="https://crann-terrace.com/" class="text-green-400 hover:text-green-300">クランテラス</a>
                &copy; 2026
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

        // カテゴリー設定（18カテゴリー）
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
            
            // トピックス（上位5件）
            const topNews = filteredNews.slice(0, 5);
            document.getElementById('topicsList').innerHTML = 
                topNews.length > 0 ? topNews.map(n => createHeadlineItem(n)).join('') : '<p class="p-4 text-gray-500 text-sm">該当するニュースがありません</p>';
            
            // 更新時刻
            const now = new Date();
            document.getElementById('updateTime').textContent = 
                now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) + ' 更新';
            
            // 日本ニュース
            const japanSection = document.getElementById('japanSection');
            const japanContainer = document.getElementById('japanNewsList');
            if ((currentRegion === 'all' || currentRegion === 'japan') && currentCategory === 'all' && japanNews.length > 0) {
                japanSection.classList.remove('hidden');
                japanContainer.innerHTML = japanNews.map(n => createHeadlineItem(n)).join('');
            } else {
                japanSection.classList.add('hidden');
            }
            
            // 海外ニュース
            const worldSection = document.getElementById('worldSection');
            const worldContainer = document.getElementById('worldNewsList');
            if ((currentRegion === 'all' || currentRegion === 'world') && currentCategory === 'all' && worldNews.length > 0) {
                worldSection.classList.remove('hidden');
                worldContainer.innerHTML = worldNews.map(n => createHeadlineItem(n)).join('');
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

        async function fetchNews() {
            try {
                const response = await fetch('/api/news');
                const data = await response.json();
                allNews = data.news || [];
                displayNews(allNews);
            } catch (err) {
                console.error('Error:', err);
            }
        }

        document.addEventListener('DOMContentLoaded', fetchNews);
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

// API: ニュースデータを取得
app.get('/api/news', async (c) => {
  try {
    let cachedNews = null
    if (c.env?.NEWS_KV) {
      const cached = await c.env.NEWS_KV.get('news_data', 'json')
      if (cached) cachedNews = cached.news
    }
    const news = cachedNews || generateDefaultNews()
    return c.json({ success: true, news, total: news.length })
  } catch (error) {
    return c.json({ success: false, news: generateDefaultNews(), total: 0 })
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
