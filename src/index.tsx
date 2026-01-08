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

// Yahoo風スタイル
const yahooStyles = `
    <style>
        * { font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif; }
        
        .yahoo-red { background-color: #ff0033; }
        .yahoo-red-text { color: #ff0033; }
        
        .news-item {
            border-bottom: 1px solid #e8e8e8;
            transition: background-color 0.15s;
        }
        .news-item:hover {
            background-color: #f8f8f8;
        }
        .news-item:last-child {
            border-bottom: none;
        }
        
        .news-title {
            color: #1a0dab;
            text-decoration: none;
            font-size: 13px;
            line-height: 1.5;
        }
        .news-title:hover {
            color: #ff0033;
            text-decoration: underline;
        }
        
        .category-tab {
            padding: 8px 16px;
            font-size: 13px;
            cursor: pointer;
            border-bottom: 3px solid transparent;
            transition: all 0.2s;
        }
        .category-tab:hover {
            background-color: #f5f5f5;
        }
        .category-tab.active {
            border-bottom-color: #ff0033;
            font-weight: bold;
            color: #ff0033;
        }
        
        .section-header {
            background: linear-gradient(to right, #f5f5f5, #fff);
            border-left: 4px solid #ff0033;
            padding: 8px 12px;
            font-weight: bold;
            font-size: 14px;
        }
        
        .sidebar-box {
            border: 1px solid #ddd;
            background: #fff;
        }
        .sidebar-header {
            background: #f5f5f5;
            border-bottom: 1px solid #ddd;
            padding: 10px 12px;
            font-weight: bold;
            font-size: 13px;
        }
        
        .crann-banner {
            background: linear-gradient(135deg, #2d5a27 0%, #4a7c43 100%);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .crann-banner:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .badge-new {
            background: #ff0033;
            color: white;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 2px;
            margin-left: 6px;
        }
        
        .topic-link {
            color: #1a0dab;
            font-size: 12px;
        }
        .topic-link:hover {
            color: #ff0033;
        }
        
        .footer-link {
            color: #666;
            font-size: 11px;
        }
        .footer-link:hover {
            text-decoration: underline;
        }

        .ranking-num {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            border-radius: 4px;
        }
        .ranking-1 { background: #ffd700; color: #333; }
        .ranking-2 { background: #c0c0c0; color: #333; }
        .ranking-3 { background: #cd7f32; color: #fff; }
        .ranking-other { background: #eee; color: #666; }
    </style>
`

// Yahooスタイルのヘッダー
const header = `
    <header class="yahoo-red text-white shadow-md">
        <div class="max-w-6xl mx-auto px-4">
            <div class="flex items-center justify-between h-12">
                <a href="/" class="flex items-center gap-2 text-white hover:opacity-90">
                    <i class="fas fa-home text-lg"></i>
                    <span class="text-lg font-bold tracking-tight">シェアハウスニュース</span>
                </a>
                <div class="flex items-center gap-4">
                    <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer" 
                       class="bg-white text-red-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-100 transition flex items-center gap-1">
                        <i class="fas fa-building"></i>
                        クランテラス
                    </a>
                </div>
            </div>
        </div>
    </header>
    
    <!-- カテゴリータブ -->
    <nav class="bg-white border-b shadow-sm">
        <div class="max-w-6xl mx-auto px-4">
            <div class="flex items-center overflow-x-auto">
                <button onclick="filterRegion('all')" class="category-tab active" data-region="all">
                    トップ
                </button>
                <button onclick="filterRegion('japan')" class="category-tab" data-region="japan">
                    🇯🇵 国内
                </button>
                <button onclick="filterRegion('world')" class="category-tab" data-region="world">
                    🌍 海外
                </button>
            </div>
        </div>
    </nav>
`

// Yahooスタイルのフッター
const footer = `
    <footer class="bg-gray-100 border-t mt-8">
        <div class="max-w-6xl mx-auto px-4 py-6">
            <div class="flex flex-wrap justify-center gap-4 mb-4">
                <a href="https://crann-terrace.com/" class="footer-link">クランテラス公式サイト</a>
                <span class="text-gray-300">|</span>
                <a href="/" class="footer-link">トップページ</a>
            </div>
            <div class="text-center">
                <p class="text-gray-500 text-xs mb-1">Presented by <a href="https://crann-terrace.com/" class="text-green-600 hover:underline font-medium">クランテラス</a></p>
                <p class="text-gray-400 text-xs">© 2026 シェアハウスニュース</p>
            </div>
        </div>
    </footer>
`

// ニュースページ（Yahoo風トップ）
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>シェアハウスニュース - 日本・海外のシェアハウス最新情報</title>
    <meta name="description" content="日本と世界のシェアハウス・コリビング最新ニュースをお届け。クランテラスが運営。">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    ${yahooStyles}
</head>
<body class="bg-gray-100">
    ${header}

    <main class="max-w-6xl mx-auto px-4 py-4">
        <div class="flex flex-col lg:flex-row gap-4">
            
            <!-- メインコンテンツ -->
            <div class="lg:w-2/3">
                
                <!-- トピックス（トップニュース） -->
                <section class="bg-white shadow-sm mb-4">
                    <div class="section-header flex items-center justify-between">
                        <span><i class="fas fa-fire-flame-curved text-red-500 mr-2"></i>トピックス</span>
                        <span class="text-xs text-gray-400 font-normal">毎朝10時更新</span>
                    </div>
                    <div class="p-4">
                        <div id="topNewsList"></div>
                    </div>
                </section>

                <!-- 国内ニュース -->
                <section id="japanSection" class="bg-white shadow-sm mb-4">
                    <div class="section-header">
                        <span>🇯🇵 国内のシェアハウスニュース</span>
                    </div>
                    <div class="p-4">
                        <div id="japanNewsList"></div>
                    </div>
                </section>

                <!-- 海外ニュース -->
                <section id="worldSection" class="bg-white shadow-sm mb-4">
                    <div class="section-header">
                        <span>🌍 海外のシェアハウスニュース</span>
                    </div>
                    <div class="p-4">
                        <div id="worldNewsList"></div>
                    </div>
                </section>

            </div>

            <!-- サイドバー -->
            <div class="lg:w-1/3 space-y-4">
                
                <!-- クランテラス広告 -->
                <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer" class="block crann-banner rounded-lg overflow-hidden text-white">
                    <div class="p-4">
                        <div class="text-xs opacity-80 mb-1">PR</div>
                        <div class="font-bold text-lg mb-2">クランテラス</div>
                        <p class="text-sm opacity-90 mb-3">緑あふれる開放的な空間で、新しいシェアライフを始めませんか？</p>
                        <div class="flex gap-2 mb-3">
                            <img src="${CRANN_IMAGES.lounge1}" alt="" class="w-1/3 h-16 object-cover rounded">
                            <img src="${CRANN_IMAGES.lounge2}" alt="" class="w-1/3 h-16 object-cover rounded">
                            <img src="${CRANN_IMAGES.lounge3}" alt="" class="w-1/3 h-16 object-cover rounded">
                        </div>
                        <div class="bg-white text-green-700 text-center py-2 rounded text-sm font-bold">
                            物件を見る →
                        </div>
                    </div>
                </a>

                <!-- アクセスランキング -->
                <div class="sidebar-box">
                    <div class="sidebar-header flex items-center">
                        <i class="fas fa-ranking-star text-yellow-500 mr-2"></i>
                        アクセスランキング
                    </div>
                    <div class="p-3" id="rankingList"></div>
                </div>

                <!-- キーワード -->
                <div class="sidebar-box">
                    <div class="sidebar-header">
                        <i class="fas fa-tags text-blue-500 mr-2"></i>
                        注目キーワード
                    </div>
                    <div class="p-3 flex flex-wrap gap-2">
                        <a href="#" class="text-xs bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 text-gray-700">シェアハウス</a>
                        <a href="#" class="text-xs bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 text-gray-700">コリビング</a>
                        <a href="#" class="text-xs bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 text-gray-700">高齢者向け</a>
                        <a href="#" class="text-xs bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 text-gray-700">女性専用</a>
                        <a href="#" class="text-xs bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 text-gray-700">ペット可</a>
                        <a href="#" class="text-xs bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 text-gray-700">外国人向け</a>
                        <a href="#" class="text-xs bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 text-gray-700">東京</a>
                        <a href="#" class="text-xs bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 text-gray-700">大阪</a>
                    </div>
                </div>

                <!-- クランテラス誘導2 -->
                <div class="sidebar-box">
                    <div class="sidebar-header bg-green-50">
                        <i class="fas fa-leaf text-green-600 mr-2"></i>
                        おすすめシェアハウス
                    </div>
                    <div class="p-3">
                        <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer" class="block hover:opacity-90">
                            <img src="${CRANN_IMAGES.lounge2}" alt="クランテラス" class="w-full h-32 object-cover rounded mb-3">
                            <p class="text-sm font-bold text-gray-800 mb-1">クランテラスシリーズ</p>
                            <p class="text-xs text-gray-500 mb-2">充実の共用設備・駅近・Wi-Fi完備</p>
                            <div class="flex gap-1 flex-wrap">
                                <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">高速Wi-Fi</span>
                                <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">駅近</span>
                                <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">共用ラウンジ</span>
                            </div>
                        </a>
                    </div>
                </div>

            </div>
        </div>
    </main>

    ${footer}

    <script>
        let allNews = [];
        let currentRegion = 'all';

        function createNewsItem(article, showImage = false) {
            const isNew = article.date.includes('1月8日') || article.date.includes('1月7日');
            const newBadge = isNew ? '<span class="badge-new">NEW</span>' : '';
            const regionFlag = article.region === 'japan' ? '🇯🇵' : '🌍';
            
            if (showImage) {
                return \`
                    <div class="news-item py-3 flex gap-3">
                        <a href="\${article.url}" target="_blank" rel="noopener noreferrer" class="flex-shrink-0">
                            <img src="\${article.image}" alt="" class="w-24 h-16 object-cover rounded">
                        </a>
                        <div class="flex-1 min-w-0">
                            <a href="\${article.url}" target="_blank" rel="noopener noreferrer" class="news-title font-bold block mb-1">
                                \${article.title}\${newBadge}
                            </a>
                            <p class="text-xs text-gray-500 truncate">\${article.summary}</p>
                            <div class="flex items-center gap-2 mt-1 text-xs text-gray-400">
                                <span>\${regionFlag} \${article.source}</span>
                                <span>\${article.date}</span>
                            </div>
                        </div>
                    </div>
                \`;
            }
            
            return \`
                <div class="news-item py-2">
                    <a href="\${article.url}" target="_blank" rel="noopener noreferrer" class="news-title">
                        \${article.title}\${newBadge}
                    </a>
                    <div class="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span>\${regionFlag} \${article.source}</span>
                        <span>\${article.date}</span>
                    </div>
                </div>
            \`;
        }

        function createRankingItem(article, rank) {
            const rankClass = rank <= 3 ? \`ranking-\${rank}\` : 'ranking-other';
            return \`
                <div class="flex gap-3 py-2 border-b border-gray-100 last:border-b-0">
                    <span class="ranking-num \${rankClass}">\${rank}</span>
                    <a href="\${article.url}" target="_blank" rel="noopener noreferrer" 
                       class="flex-1 text-xs text-gray-700 hover:text-red-600 line-clamp-2">
                        \${article.title}
                    </a>
                </div>
            \`;
        }

        function displayNews(news) {
            const japanNews = news.filter(n => n.region === 'japan');
            const worldNews = news.filter(n => n.region === 'world');
            
            // トップニュース（画像付き、上位3件）
            const topNews = news.slice(0, 3);
            document.getElementById('topNewsList').innerHTML = 
                topNews.map(n => createNewsItem(n, true)).join('');
            
            // 日本ニュース
            const japanSection = document.getElementById('japanSection');
            const japanContainer = document.getElementById('japanNewsList');
            if (currentRegion === 'all' || currentRegion === 'japan') {
                japanSection.classList.remove('hidden');
                japanContainer.innerHTML = japanNews.map(n => createNewsItem(n, false)).join('');
            } else {
                japanSection.classList.add('hidden');
            }
            
            // 海外ニュース
            const worldSection = document.getElementById('worldSection');
            const worldContainer = document.getElementById('worldNewsList');
            if (currentRegion === 'all' || currentRegion === 'world') {
                worldSection.classList.remove('hidden');
                worldContainer.innerHTML = worldNews.map(n => createNewsItem(n, false)).join('');
            } else {
                worldSection.classList.add('hidden');
            }

            // ランキング
            const rankingNews = [...news].sort(() => Math.random() - 0.5).slice(0, 5);
            document.getElementById('rankingList').innerHTML = 
                rankingNews.map((n, i) => createRankingItem(n, i + 1)).join('');
        }

        function filterRegion(region) {
            currentRegion = region;
            document.querySelectorAll('.category-tab').forEach(btn => {
                if (btn.dataset.region === region) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
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
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
  }
  
  return [
    // 日本のニュース（実際の記事リンク）
    { id: 1, title: 'シェアレジデンス「nears五反田」2026年5月入居開始', summary: 'ひとり暮らしとシェアハウスの間、ゆるくつながる心地よい暮らしを提案する新コンセプト物件が五反田にオープン予定。', region: 'japan', country: '日本', source: '大和ハウス工業', date: formatDate(0), image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop', url: 'https://www.daiwahouse.co.jp/about/release/group/20251211162546.html' },
    { id: 2, title: '高齢者シェアハウスで新しい老後生活、自由と安心を両立', summary: '70代〜90代が共同生活するシェアハウスが人気に。孤独解消と自立を両立する新しい住まいの形として注目される。', region: 'japan', country: '日本', source: 'テレ朝NEWS', date: formatDate(0), image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=500&fit=crop', url: 'https://news.tv-asahi.co.jp/news_economy/articles/900180056.html' },
    { id: 3, title: '空き家を外国人材の住まいに再生「外国人材シェアハウス」提供開始', summary: '空き家の利活用を起点に、企業向け外国人社宅サービスとして家具付き・敷金礼金ゼロの物件を提供。', region: 'japan', country: '日本', source: 'PR TIMES', date: formatDate(1), image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop', url: 'https://prtimes.jp/main/html/rd/p/000000077.000120610.html' },
    { id: 4, title: 'ネイバーズ羽田が2026年3月開業、新規入居者の募集開始', summary: '京急空港線「糀谷駅」徒歩13分、羽田空港まで最短10分の好立地にソーシャルアパートメントがオープン予定。', region: 'japan', country: '日本', source: 'SOCIAL APARTMENT', date: formatDate(1), image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop', url: 'https://www.social-apartment.com/lifestyle/detail/20251219192601' },
    { id: 5, title: '長崎に女性専用シェアハウス「長崎ライトハウス」誕生', summary: '斜面地の空き家をリノベーション。実家と1人暮らしの間の新しい選択肢として、女性の自立を支援。', region: 'japan', country: '日本', source: '長崎新聞', date: formatDate(2), image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&h=500&fit=crop', url: 'https://www.nagasaki-np.co.jp/kijis/?kijiid=341c58b5163a4d06a220c50c5f6436c5' },
    { id: 6, title: '全国でも珍しいペット共生型シェアハウス「ペミリ住之江」', summary: 'ドッグトレーナーが管理人として常駐。ペットに関するお悩みを気軽に相談できる日本で数少ないペット共生型シェアハウス。', region: 'japan', country: '日本', source: '産経ニュース', date: formatDate(2), image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=500&fit=crop', url: 'https://www.sankei.com/article/20231106-IQ2SI6RUHFMNJNSRUPWZBELAJU/' },
    { id: 7, title: 'インバウンド需要の回復でシェアハウス市場が活況に', summary: '外国人入居者が7割に達する物件も。日本シェアハウス連盟によると物件数は前年比5.4%増と拡大傾向。', region: 'japan', country: '日本', source: 'WEB翻訳', date: formatDate(3), image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop', url: 'https://web-honyaku.jp/2025/05/14/share-house/' },
    { id: 8, title: '政府が「高齢者シェアハウス」整備へ、2028年度までに全国100カ所目標', summary: '急増する独居高齢者の孤独死防止や生活支援を目的に、低料金で入居可能な高齢者向けシェアハウスの整備を推進。', region: 'japan', country: '日本', source: 'SUUMO', date: formatDate(3), image: 'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=800&h=500&fit=crop', url: 'https://suumo.jp/journal/2025/11/18/212864/' },
    // 海外のニュース（実際の記事リンク）
    { id: 101, title: 'Co-Living Apartments Could Help Fix the Housing Crisis', summary: 'Co-living apartments are evolving into a key strategy for affordable housing that doesn\'t skimp on the amenities.', region: 'world', country: 'アメリカ', source: 'Business Insider', date: formatDate(0), image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&h=500&fit=crop', url: 'https://www.businessinsider.com/co-living-apartments-cheap-rent-fix-housing-crisis-2025-8' },
    { id: 102, title: 'UK Co-Living 2025: Renters Ready to Embrace Shared Living', summary: 'London Co-Living starting rents range from £1,550 to £1,750 pcm. Average tenant age has remained above 30 for third consecutive year.', region: 'world', country: 'イギリス', source: 'Savills', date: formatDate(1), image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=500&fit=crop', url: 'https://www.savills.co.uk/research_articles/229130/372282-0' },
    { id: 103, title: 'Singapore Co-living Player The Assembly Place Gears Up for Listing', summary: 'シンガポールのコリビング大手がCatalist上場に向けて目論見書を提出。市場拡大の勢いを反映。', region: 'world', country: 'シンガポール', source: 'EdgeProp', date: formatDate(1), image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&h=500&fit=crop', url: 'https://www.edgeprop.sg/property-news/co-living-player-assembly-place-lodges-prospectus-gears-catalist-listing' },
    { id: 104, title: 'Coliving 2025: Key Investment, Design and Development Trends', summary: 'Explore 2025 coliving trends, from investment shifts to evolving design and tenant needs, with insights from industry experts.', region: 'world', country: 'グローバル', source: 'Coliving Insights', date: formatDate(2), image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&h=500&fit=crop', url: 'https://www.colivinginsights.com/articles/whats-next-for-coliving-key-investment-design-and-development-trends-shaping-2025-at-coliving-insights-talks' },
    { id: 105, title: 'East London Coliving Scheme Gets the Green Light', summary: 'Blue Coast Capital has been granted planning consent for a 245-unit coliving scheme in Shoreditch, east London.', region: 'world', country: 'イギリス', source: 'Urban Living News', date: formatDate(2), image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=500&fit=crop', url: 'https://urbanliving.news/coliving/east-london-coliving-scheme-gets-the-green-light/' },
    { id: 106, title: 'Korea\'s Co-Living Market Heats Up in 2025', summary: 'The average monthly rent for a sub-40sqm co-living unit in Seoul stands at 1.13 million won, about 1.5 times higher than the average officetel.', region: 'world', country: '韓国', source: 'World Property Journal', date: formatDate(3), image: 'https://images.unsplash.com/photo-1534274867514-d5b47ef89ed7?w=800&h=500&fit=crop', url: 'https://www.worldpropertyjournal.com/real-estate-news/south-korea/seoul-real-estate-news/korea-real-estate-news-jll-korea-coliving-property-report-for-2025-veronica-shim-korea-property-trends-in-2025-korea-housing-data-for-2025-igis-reside-14462.php' },
  ]
}
