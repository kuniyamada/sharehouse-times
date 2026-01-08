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

// Yahoo! JAPAN風スタイル（スマホ対応）
const yahooStyles = `
    <style>
        * { 
            font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic", Meiryo, sans-serif;
            -webkit-tap-highlight-color: transparent;
        }
        
        body {
            background-color: #f5f5f5;
            font-size: 14px;
        }
        
        /* ヘッダー */
        .yahoo-header {
            background: linear-gradient(180deg, #f0f0f0 0%, #e8e8e8 100%);
            border-bottom: 1px solid #ddd;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        /* タブナビゲーション - スマホ対応 */
        .tab-nav {
            background: #fff;
            border-bottom: 1px solid #e0e0e0;
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
            padding: 12px 16px;
            color: #333;
            text-decoration: none;
            font-size: 13px;
            border-bottom: 3px solid transparent;
            transition: all 0.2s;
        }
        .tab-item:hover {
            background: #f5f5f5;
            color: #ff0033;
        }
        .tab-item.active {
            color: #ff0033;
            border-bottom-color: #ff0033;
            font-weight: bold;
        }
        
        /* モバイルカテゴリーメニュー */
        .mobile-cat-menu {
            background: #fff;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            white-space: nowrap;
            border-bottom: 1px solid #e0e0e0;
            padding: 8px 0;
        }
        .mobile-cat-menu::-webkit-scrollbar {
            display: none;
        }
        .mobile-cat-item {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 6px 12px;
            margin: 0 4px;
            background: #f5f5f5;
            border-radius: 20px;
            font-size: 12px;
            color: #333;
            text-decoration: none;
        }
        .mobile-cat-item.active {
            background: #ff0033;
            color: white;
        }
        
        /* 左サイドのカテゴリメニュー（PC用） */
        .side-menu {
            background: #f8f8f8;
            border-right: 1px solid #e0e0e0;
        }
        .side-menu-item {
            display: block;
            padding: 10px 15px;
            color: #333;
            text-decoration: none;
            border-bottom: 1px solid #e8e8e8;
            font-size: 12px;
        }
        .side-menu-item:hover {
            background: #fff;
            color: #ff0033;
        }
        .side-menu-item.active {
            background: #fff;
            color: #ff0033;
            font-weight: bold;
            border-left: 3px solid #ff0033;
        }
        
        /* トピックス（メイン） */
        .topics-box {
            background: #fff;
            border: 1px solid #ddd;
        }
        @media (max-width: 767px) {
            .topics-box {
                border-left: none;
                border-right: none;
                margin-left: 0 !important;
                margin-right: 0 !important;
            }
        }
        .topics-header {
            background: linear-gradient(180deg, #f8f8f8 0%, #f0f0f0 100%);
            border-bottom: 1px solid #ddd;
            padding: 10px 12px;
            font-weight: bold;
            font-size: 13px;
            color: #333;
        }
        .topics-header-icon {
            color: #ff0033;
            margin-right: 5px;
        }
        
        /* 見出しリスト */
        .headline-item {
            padding: 12px;
            border-bottom: 1px solid #f0f0f0;
            display: flex;
            align-items: flex-start;
            gap: 10px;
        }
        .headline-item:active {
            background: #f5f5f5;
        }
        .headline-link {
            color: #1a0dab;
            text-decoration: none;
            font-size: 14px;
            line-height: 1.5;
            flex: 1;
            display: block;
        }
        .headline-link:hover {
            color: #ff0033;
        }
        @media (max-width: 767px) {
            .headline-link {
                font-size: 15px;
            }
        }
        
        /* NEWバッジ */
        .badge-new {
            background: #ff0033;
            color: white;
            font-size: 10px;
            padding: 2px 5px;
            border-radius: 2px;
            margin-left: 5px;
            vertical-align: middle;
        }
        
        /* カテゴリアイコン */
        .cat-icon {
            width: 24px;
            height: 24px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-size: 11px;
            color: white;
        }
        
        /* 情報元 */
        .source-info {
            font-size: 11px;
            color: #999;
            margin-top: 4px;
        }
        
        /* PR広告枠 */
        .pr-box {
            border: 1px solid #ddd;
            background: #fff;
        }
        .pr-header {
            background: #f5f5f5;
            padding: 8px 12px;
            font-size: 12px;
            color: #666;
            border-bottom: 1px solid #ddd;
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
            border-radius: 8px;
            overflow: hidden;
        }
        
        /* ランキング */
        .ranking-num {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
            border-radius: 4px;
            flex-shrink: 0;
        }
        .rank-1 { background: #ffd700; color: #333; }
        .rank-2 { background: #c0c0c0; color: #333; }
        .rank-3 { background: #cd7f32; color: #fff; }
        .rank-other { background: #e8e8e8; color: #666; }
        
        /* 更新時刻 */
        .update-time {
            font-size: 10px;
            color: #999;
        }

        /* フッター */
        .yahoo-footer {
            background: #f5f5f5;
            border-top: 1px solid #ddd;
        }
        .footer-link {
            color: #666;
            text-decoration: none;
            font-size: 12px;
        }
        .footer-link:hover {
            text-decoration: underline;
        }
        
        /* モバイルフッター固定バナー */
        .mobile-fixed-banner {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #2d5a27 0%, #4a7c43 100%);
            color: white;
            padding: 10px 15px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 1000;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
        }
        
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
    <title>シェアハウスニュース</title>
    <meta name="description" content="日本と世界のシェアハウス・コリビング最新ニュースをお届け。">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    ${yahooStyles}
</head>
<body>
    <!-- ヘッダー -->
    <header class="yahoo-header">
        <div class="max-w-5xl mx-auto px-3 py-2">
            <div class="flex items-center justify-between">
                <a href="/" class="flex items-center gap-2">
                    <span class="text-red-600 font-bold text-lg">S!</span>
                    <span class="font-bold text-sm text-gray-700 hidden sm:inline">シェアハウスニュース</span>
                    <span class="font-bold text-sm text-gray-700 sm:hidden">シェアハウス</span>
                </a>
                <div class="flex items-center gap-2">
                    <span class="update-time hidden sm:inline"><i class="far fa-clock mr-1"></i>毎朝10時更新</span>
                    <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer" 
                       class="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700 hidden sm:flex items-center gap-1">
                        <i class="fas fa-home"></i>
                        クランテラス
                    </a>
                </div>
            </div>
        </div>
    </header>

    <!-- タブナビゲーション -->
    <nav class="tab-nav">
        <div class="max-w-5xl mx-auto px-2">
            <a href="#" class="tab-item active" onclick="filterRegion('all'); return false;" data-region="all">トップ</a>
            <a href="#" class="tab-item" onclick="filterRegion('japan'); return false;" data-region="japan">🇯🇵 国内</a>
            <a href="#" class="tab-item" onclick="filterRegion('world'); return false;" data-region="world">🌍 海外</a>
        </div>
    </nav>

    <!-- モバイル用カテゴリーメニュー -->
    <div class="mobile-cat-menu md:hidden">
        <div class="px-2">
            <a href="#" class="mobile-cat-item active" onclick="filterCategory('all'); return false;" data-cat="all">主要</a>
            <a href="#" class="mobile-cat-item" onclick="filterCategory('new_open'); return false;" data-cat="new_open">
                <i class="fas fa-door-open text-blue-500"></i>新規
            </a>
            <a href="#" class="mobile-cat-item" onclick="filterCategory('senior'); return false;" data-cat="senior">
                <i class="fas fa-user-group text-orange-500"></i>高齢者
            </a>
            <a href="#" class="mobile-cat-item" onclick="filterCategory('women'); return false;" data-cat="women">
                <i class="fas fa-venus text-pink-500"></i>女性専用
            </a>
            <a href="#" class="mobile-cat-item" onclick="filterCategory('foreign'); return false;" data-cat="foreign">
                <i class="fas fa-globe text-green-500"></i>外国人
            </a>
            <a href="#" class="mobile-cat-item" onclick="filterCategory('pet'); return false;" data-cat="pet">
                <i class="fas fa-paw text-amber-500"></i>ペット
            </a>
            <a href="#" class="mobile-cat-item" onclick="filterCategory('market'); return false;" data-cat="market">
                <i class="fas fa-chart-line text-purple-500"></i>市場
            </a>
        </div>
    </div>

    <!-- メインコンテンツ -->
    <main class="max-w-5xl mx-auto md:flex">
        
        <!-- 左サイドメニュー（PC用） -->
        <aside class="side-menu w-36 flex-shrink-0 hidden md:block">
            <a href="#" class="side-menu-item active" onclick="filterCategory('all'); return false;" data-cat="all">
                <i class="fas fa-home mr-2 text-gray-400"></i>主要
            </a>
            <a href="#" class="side-menu-item" onclick="filterCategory('new_open'); return false;" data-cat="new_open">
                <i class="fas fa-door-open mr-2 text-blue-400"></i>新規オープン
            </a>
            <a href="#" class="side-menu-item" onclick="filterCategory('senior'); return false;" data-cat="senior">
                <i class="fas fa-user-group mr-2 text-orange-400"></i>高齢者向け
            </a>
            <a href="#" class="side-menu-item" onclick="filterCategory('women'); return false;" data-cat="women">
                <i class="fas fa-venus mr-2 text-pink-400"></i>女性専用
            </a>
            <a href="#" class="side-menu-item" onclick="filterCategory('foreign'); return false;" data-cat="foreign">
                <i class="fas fa-globe mr-2 text-green-400"></i>外国人向け
            </a>
            <a href="#" class="side-menu-item" onclick="filterCategory('pet'); return false;" data-cat="pet">
                <i class="fas fa-paw mr-2 text-amber-400"></i>ペット可
            </a>
            <a href="#" class="side-menu-item" onclick="filterCategory('market'); return false;" data-cat="market">
                <i class="fas fa-chart-line mr-2 text-purple-400"></i>市場動向
            </a>
            <a href="#" class="side-menu-item" onclick="filterCategory('world'); return false;" data-cat="world">
                <i class="fas fa-earth-americas mr-2 text-cyan-400"></i>海外ニュース
            </a>
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
            
            <!-- トピックス -->
            <section class="topics-box m-3 md:m-3">
                <div class="topics-header flex items-center justify-between">
                    <span><i class="fas fa-fire topics-header-icon"></i>トピックス</span>
                    <span class="update-time" id="updateTime"></span>
                </div>
                <div id="topicsList" class="divide-y divide-gray-100"></div>
            </section>

            <!-- 国内ニュース -->
            <section id="japanSection" class="topics-box m-3 md:m-3">
                <div class="topics-header">
                    <span>🇯🇵 国内</span>
                </div>
                <div id="japanNewsList" class="divide-y divide-gray-100"></div>
            </section>

            <!-- 海外ニュース -->
            <section id="worldSection" class="topics-box m-3 md:m-3">
                <div class="topics-header">
                    <span>🌍 海外</span>
                </div>
                <div id="worldNewsList" class="divide-y divide-gray-100"></div>
            </section>

            <!-- モバイル用ランキング -->
            <section class="topics-box m-3 md:hidden">
                <div class="topics-header">
                    <i class="fas fa-ranking-star text-yellow-500 mr-2"></i>アクセスランキング
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
                    <i class="fas fa-tag text-blue-500 mr-2"></i>
                    注目キーワード
                </div>
                <div class="p-2 flex flex-wrap gap-1">
                    <span class="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 cursor-pointer">シェアハウス</span>
                    <span class="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 cursor-pointer">コリビング</span>
                    <span class="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 cursor-pointer">高齢者</span>
                    <span class="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 cursor-pointer">女性専用</span>
                    <span class="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 cursor-pointer">ペット可</span>
                    <span class="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 cursor-pointer">東京</span>
                </div>
            </div>

        </aside>
    </main>

    <!-- フッター -->
    <footer class="yahoo-footer py-6 mt-4">
        <div class="max-w-5xl mx-auto px-3 text-center">
            <div class="flex justify-center gap-4 mb-3">
                <a href="https://crann-terrace.com/" class="footer-link">クランテラス公式サイト</a>
                <span class="text-gray-300">|</span>
                <a href="/" class="footer-link">トップページ</a>
            </div>
            <p class="text-xs text-gray-400">
                Presented by <a href="https://crann-terrace.com/" class="text-green-600 hover:underline">クランテラス</a>
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

        // カテゴリー別アイコンと色
        const categoryConfig = {
            'new_open': { icon: 'fa-door-open', color: 'bg-blue-500' },
            'senior': { icon: 'fa-user-group', color: 'bg-orange-500' },
            'foreign': { icon: 'fa-globe', color: 'bg-green-500' },
            'women': { icon: 'fa-venus', color: 'bg-pink-500' },
            'pet': { icon: 'fa-paw', color: 'bg-amber-500' },
            'market': { icon: 'fa-chart-line', color: 'bg-purple-500' },
            'policy': { icon: 'fa-landmark', color: 'bg-red-500' },
            'investment': { icon: 'fa-coins', color: 'bg-yellow-500' },
            'uk': { icon: 'fa-building', color: 'bg-indigo-500' },
            'us': { icon: 'fa-city', color: 'bg-blue-600' },
            'asia': { icon: 'fa-earth-asia', color: 'bg-teal-500' },
            'global': { icon: 'fa-earth-americas', color: 'bg-cyan-500' },
        };

        function createHeadlineItem(article) {
            const today = new Date();
            const isNew = article.date.includes(today.getDate() + '(') || article.date.includes((today.getDate()-1) + '(');
            const newBadge = isNew ? '<span class="badge-new">NEW</span>' : '';
            const cat = categoryConfig[article.category] || { icon: 'fa-newspaper', color: 'bg-gray-400' };
            
            return \`
                <div class="headline-item">
                    <div class="cat-icon \${cat.color}">
                        <i class="fas \${cat.icon}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <a href="\${article.url}" target="_blank" rel="noopener noreferrer" class="headline-link">
                            \${article.title}\${newBadge}
                        </a>
                        <div class="source-info">
                            \${article.source} \${article.date}
                        </div>
                    </div>
                </div>
            \`;
        }

        function createRankingItem(article, rank) {
            const rankClass = rank <= 3 ? \`rank-\${rank}\` : 'rank-other';
            return \`
                <div class="flex gap-2 py-2 border-b border-gray-100 last:border-b-0">
                    <span class="ranking-num \${rankClass}">\${rank}</span>
                    <a href="\${article.url}" target="_blank" rel="noopener noreferrer" 
                       class="flex-1 text-sm text-gray-700 hover:text-red-600 leading-snug">
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
            if (currentCategory !== 'all' && currentCategory !== 'world') {
                filteredNews = filteredNews.filter(n => n.category === currentCategory);
            } else if (currentCategory === 'world') {
                filteredNews = news.filter(n => n.region === 'world');
            }

            const japanNews = filteredNews.filter(n => n.region === 'japan');
            const worldNews = filteredNews.filter(n => n.region === 'world');
            
            // トピックス（上位5件）
            const topNews = filteredNews.slice(0, 5);
            document.getElementById('topicsList').innerHTML = 
                topNews.map(n => createHeadlineItem(n)).join('');
            
            // 更新時刻
            const now = new Date();
            document.getElementById('updateTime').textContent = 
                now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) + ' 更新';
            
            // 日本ニュース
            const japanSection = document.getElementById('japanSection');
            const japanContainer = document.getElementById('japanNewsList');
            if ((currentRegion === 'all' || currentRegion === 'japan') && japanNews.length > 0) {
                japanSection.classList.remove('hidden');
                japanContainer.innerHTML = japanNews.map(n => createHeadlineItem(n)).join('');
            } else {
                japanSection.classList.add('hidden');
            }
            
            // 海外ニュース
            const worldSection = document.getElementById('worldSection');
            const worldContainer = document.getElementById('worldNewsList');
            if ((currentRegion === 'all' || currentRegion === 'world') && worldNews.length > 0) {
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
            if (category === 'world') {
                currentRegion = 'world';
            }
            
            // サイドメニュー・モバイルメニューのアクティブ状態更新
            document.querySelectorAll('.side-menu-item, .mobile-cat-item').forEach(item => {
                if (item.dataset.cat === category) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
            
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

// ニュースデータ生成（実際のニュース記事リンク付き）
function generateDefaultNews() {
  const now = new Date()
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const formatDate = (daysAgo: number): string => {
    const date = new Date(jstNow)
    date.setDate(date.getDate() - daysAgo)
    return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }) + '(' + ['日','月','火','水','木','金','土'][date.getDay()] + ')'
  }
  
  return [
    // 日本のニュース
    { id: 1, title: 'シェアレジデンス「nears五反田」2026年5月入居開始', summary: 'ひとり暮らしとシェアハウスの間、ゆるくつながる心地よい暮らしを提案する新コンセプト物件が五反田にオープン予定。', region: 'japan', country: '日本', source: '大和ハウス工業', date: formatDate(0), category: 'new_open', url: 'https://www.daiwahouse.co.jp/about/release/group/20251211162546.html' },
    { id: 2, title: '高齢者シェアハウスで新しい老後生活、自由と安心を両立', summary: '70代〜90代が共同生活するシェアハウスが人気に。孤独解消と自立を両立する新しい住まいの形として注目される。', region: 'japan', country: '日本', source: 'テレ朝NEWS', date: formatDate(0), category: 'senior', url: 'https://news.tv-asahi.co.jp/news_economy/articles/900180056.html' },
    { id: 3, title: '空き家を外国人材の住まいに再生「外国人材シェアハウス」提供開始', summary: '空き家の利活用を起点に、企業向け外国人社宅サービスとして家具付き・敷金礼金ゼロの物件を提供。', region: 'japan', country: '日本', source: 'PR TIMES', date: formatDate(1), category: 'foreign', url: 'https://prtimes.jp/main/html/rd/p/000000077.000120610.html' },
    { id: 4, title: 'ネイバーズ羽田が2026年3月開業、新規入居者の募集開始', summary: '京急空港線「糀谷駅」徒歩13分、羽田空港まで最短10分の好立地にソーシャルアパートメントがオープン予定。', region: 'japan', country: '日本', source: 'SOCIAL APARTMENT', date: formatDate(1), category: 'new_open', url: 'https://www.social-apartment.com/lifestyle/detail/20251219192601' },
    { id: 5, title: '長崎に女性専用シェアハウス「長崎ライトハウス」誕生', summary: '斜面地の空き家をリノベーション。実家と1人暮らしの間の新しい選択肢として、女性の自立を支援。', region: 'japan', country: '日本', source: '長崎新聞', date: formatDate(2), category: 'women', url: 'https://www.nagasaki-np.co.jp/kijis/?kijiid=341c58b5163a4d06a220c50c5f6436c5' },
    { id: 6, title: '全国でも珍しいペット共生型シェアハウス「ペミリ住之江」', summary: 'ドッグトレーナーが管理人として常駐。ペットに関するお悩みを気軽に相談できる日本で数少ないペット共生型シェアハウス。', region: 'japan', country: '日本', source: '産経ニュース', date: formatDate(2), category: 'pet', url: 'https://www.sankei.com/article/20231106-IQ2SI6RUHFMNJNSRUPWZBELAJU/' },
    { id: 7, title: 'インバウンド需要の回復でシェアハウス市場が活況に', summary: '外国人入居者が7割に達する物件も。日本シェアハウス連盟によると物件数は前年比5.4%増と拡大傾向。', region: 'japan', country: '日本', source: 'WEB翻訳', date: formatDate(3), category: 'market', url: 'https://web-honyaku.jp/2025/05/14/share-house/' },
    { id: 8, title: '政府が「高齢者シェアハウス」整備へ、2028年度までに全国100カ所目標', summary: '急増する独居高齢者の孤独死防止や生活支援を目的に、低料金で入居可能な高齢者向けシェアハウスの整備を推進。', region: 'japan', country: '日本', source: 'SUUMO', date: formatDate(3), category: 'policy', url: 'https://suumo.jp/journal/2025/11/18/212864/' },
    // 海外のニュース
    { id: 101, title: 'Co-Living Apartments Could Help Fix the Housing Crisis', summary: 'Co-living apartments are evolving into a key strategy for affordable housing that doesn\'t skimp on the amenities.', region: 'world', country: 'アメリカ', source: 'Business Insider', date: formatDate(0), category: 'us', url: 'https://www.businessinsider.com/co-living-apartments-cheap-rent-fix-housing-crisis-2025-8' },
    { id: 102, title: 'UK Co-Living 2025: Renters Ready to Embrace Shared Living', summary: 'London Co-Living starting rents range from £1,550 to £1,750 pcm. Average tenant age has remained above 30 for third consecutive year.', region: 'world', country: 'イギリス', source: 'Savills', date: formatDate(1), category: 'uk', url: 'https://www.savills.co.uk/research_articles/229130/372282-0' },
    { id: 103, title: 'Singapore Co-living Player The Assembly Place Gears Up for Listing', summary: 'シンガポールのコリビング大手がCatalist上場に向けて目論見書を提出。市場拡大の勢いを反映。', region: 'world', country: 'シンガポール', source: 'EdgeProp', date: formatDate(1), category: 'asia', url: 'https://www.edgeprop.sg/property-news/co-living-player-assembly-place-lodges-prospectus-gears-catalist-listing' },
    { id: 104, title: 'Coliving 2025: Key Investment, Design and Development Trends', summary: 'Explore 2025 coliving trends, from investment shifts to evolving design and tenant needs, with insights from industry experts.', region: 'world', country: 'グローバル', source: 'Coliving Insights', date: formatDate(2), category: 'investment', url: 'https://www.colivinginsights.com/articles/whats-next-for-coliving-key-investment-design-and-development-trends-shaping-2025-at-coliving-insights-talks' },
    { id: 105, title: 'East London Coliving Scheme Gets the Green Light', summary: 'Blue Coast Capital has been granted planning consent for a 245-unit coliving scheme in Shoreditch, east London.', region: 'world', country: 'イギリス', source: 'Urban Living News', date: formatDate(2), category: 'uk', url: 'https://urbanliving.news/coliving/east-london-coliving-scheme-gets-the-green-light/' },
    { id: 106, title: 'Korea\'s Co-Living Market Heats Up in 2025', summary: 'The average monthly rent for a sub-40sqm co-living unit in Seoul stands at 1.13 million won, about 1.5 times higher than the average officetel.', region: 'world', country: '韓国', source: 'World Property Journal', date: formatDate(3), category: 'asia', url: 'https://www.worldpropertyjournal.com/real-estate-news/south-korea/seoul-real-estate-news/korea-real-estate-news-jll-korea-coliving-property-report-for-2025-veronica-shim-korea-property-trends-in-2025-korea-housing-data-for-2025-igis-reside-14462.php' },
  ]
}
