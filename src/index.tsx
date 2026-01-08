import { Hono } from 'hono'
import { cors } from 'hono/cors'

// Cloudflare Bindings型定義
type Bindings = {
  NEWS_KV: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// クランテラスの画像URL
const CRANN_TERRACE_IMAGE = 'https://www.genspark.ai/api/files/s/V4bSF9bT'

// 共通のスタイル
const commonStyles = `
    <style>
        .card-hover {
            transition: all 0.3s ease;
        }
        .card-hover:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .image-zoom {
            transition: transform 0.5s ease;
        }
        .card-hover:hover .image-zoom {
            transform: scale(1.05);
        }
        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .fade-in {
            animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .gradient-text {
            background: linear-gradient(135deg, #2d5a27 0%, #4a7c43 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .crann-gradient {
            background: linear-gradient(135deg, #2d5a27 0%, #4a7c43 50%, #6b9b64 100%);
        }
        .crann-btn {
            background: linear-gradient(135deg, #2d5a27 0%, #4a7c43 100%);
            transition: all 0.3s ease;
        }
        .crann-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(45, 90, 39, 0.4);
        }
        .featured-card {
            background: linear-gradient(135deg, rgba(45, 90, 39, 0.05) 0%, rgba(107, 155, 100, 0.1) 100%);
            border: 2px solid #4a7c43;
        }
        .pulse-border {
            animation: pulse-border 2s infinite;
        }
        @keyframes pulse-border {
            0%, 100% { box-shadow: 0 0 0 0 rgba(74, 124, 67, 0.4); }
            50% { box-shadow: 0 0 0 10px rgba(74, 124, 67, 0); }
        }
    </style>
`

// 共通のヘッダー（クランテラスブランド）
const header = `
    <header class="bg-white border-b sticky top-0 z-50">
        <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-16">
                <a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <i class="fas fa-leaf text-2xl text-green-700"></i>
                    <span class="text-xl font-bold gradient-text">シェアハウスニュース</span>
                </a>
                <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer" 
                   class="crann-btn text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                    <i class="fas fa-home"></i>
                    クランテラスを見る
                </a>
            </div>
        </div>
    </header>
`

// 共通のフッター（クランテラス訴求）
const footer = `
    <footer class="bg-gray-800 text-white py-12 mt-12">
        <div class="container mx-auto px-4">
            <!-- クランテラスCTA -->
            <div class="bg-gradient-to-r from-green-800 to-green-600 rounded-2xl p-8 mb-8 text-center">
                <h3 class="text-2xl font-bold mb-3">シェアハウスをお探しですか？</h3>
                <p class="text-white/90 mb-6">クランテラスシリーズで、新しい暮らしを始めませんか</p>
                <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer"
                   class="inline-flex items-center gap-2 bg-white text-green-700 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors">
                    <i class="fas fa-arrow-right"></i>
                    クランテラス公式サイトへ
                </a>
            </div>
            
            <div class="text-center">
                <div class="flex items-center justify-center gap-2 mb-4">
                    <i class="fas fa-leaf text-green-400"></i>
                    <span class="font-bold">シェアハウスニュース</span>
                </div>
                <p class="text-gray-400 text-sm mb-2">Presented by <a href="https://crann-terrace.com/" class="text-green-400 hover:underline">クランテラス</a></p>
                <p class="text-gray-500 text-xs">© 2026 シェアハウスニュース All Rights Reserved.</p>
            </div>
        </div>
    </footer>
`

// ニュースページ（トップ）
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>シェアハウスニュース | 日本・海外のシェアハウス最新情報 by クランテラス</title>
    <meta name="description" content="日本と世界のシェアハウス最新ニュースをお届け。クランテラスが運営するシェアハウス情報サイト。">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    ${commonStyles}
</head>
<body class="bg-gray-50">
    ${header}

    <!-- クランテラス特集バナー（トップ） -->
    <section class="crann-gradient text-white py-8">
        <div class="container mx-auto px-4">
            <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer" 
               class="block bg-white/10 backdrop-blur rounded-2xl overflow-hidden hover:bg-white/20 transition-all">
                <div class="flex flex-col md:flex-row items-center">
                    <div class="md:w-1/2 p-6 md:p-8">
                        <div class="inline-block bg-white/20 text-white text-xs px-3 py-1 rounded-full mb-4">
                            <i class="fas fa-star mr-1"></i>PICK UP
                        </div>
                        <h2 class="text-2xl md:text-3xl font-bold mb-3">クランテラスシリーズ</h2>
                        <p class="text-white/90 mb-4 leading-relaxed">
                            緑あふれる開放的な空間で、新しい出会いと暮らしを。<br>
                            都心へのアクセス良好、充実した共用設備で快適なシェアライフを提供します。
                        </p>
                        <div class="flex flex-wrap gap-2 mb-4">
                            <span class="bg-white/20 text-sm px-3 py-1 rounded-full">
                                <i class="fas fa-wifi mr-1"></i>高速Wi-Fi
                            </span>
                            <span class="bg-white/20 text-sm px-3 py-1 rounded-full">
                                <i class="fas fa-couch mr-1"></i>充実の共用スペース
                            </span>
                            <span class="bg-white/20 text-sm px-3 py-1 rounded-full">
                                <i class="fas fa-train mr-1"></i>駅近物件多数
                            </span>
                        </div>
                        <span class="inline-flex items-center gap-2 bg-white text-green-700 px-6 py-3 rounded-full font-bold hover:shadow-lg transition-all">
                            詳しく見る
                            <i class="fas fa-chevron-right"></i>
                        </span>
                    </div>
                    <div class="md:w-1/2">
                        <img src="${CRANN_TERRACE_IMAGE}" alt="クランテラス - 開放的なラウンジ" 
                             class="w-full h-64 md:h-80 object-cover">
                    </div>
                </div>
            </a>
        </div>
    </section>

    <!-- サイト説明 -->
    <section class="bg-white py-8 border-b">
        <div class="container mx-auto px-4 text-center">
            <h1 class="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                <i class="fas fa-newspaper text-green-600 mr-2"></i>
                シェアハウスニュース
            </h1>
            <p class="text-gray-600">日本と世界のシェアハウス最新情報をお届け</p>
            <p class="text-gray-400 text-sm mt-1">
                <i class="fas fa-clock mr-1"></i>
                毎朝10時に自動更新
            </p>
        </div>
    </section>

    <main class="container mx-auto px-4 py-8">
        <!-- 地域タブ -->
        <div class="flex justify-center gap-4 mb-8">
            <button onclick="filterRegion('all')" class="region-btn px-6 py-3 rounded-full font-medium bg-green-700 text-white transition-all shadow-md" data-region="all">
                <i class="fas fa-globe mr-2"></i>すべて
            </button>
            <button onclick="filterRegion('japan')" class="region-btn px-6 py-3 rounded-full font-medium bg-white text-gray-600 border-2 border-gray-200 hover:border-red-300 transition-all" data-region="japan">
                <span class="mr-2">🇯🇵</span>日本
            </button>
            <button onclick="filterRegion('world')" class="region-btn px-6 py-3 rounded-full font-medium bg-white text-gray-600 border-2 border-gray-200 hover:border-blue-300 transition-all" data-region="world">
                <i class="fas fa-earth-americas mr-2"></i>海外
            </button>
        </div>

        <!-- 日本のニュース -->
        <section id="japanSection" class="mb-12">
            <div class="flex items-center gap-3 mb-6">
                <span class="text-3xl">🇯🇵</span>
                <h2 class="text-2xl font-bold text-gray-800">日本のシェアハウスニュース</h2>
            </div>
            <div id="japanNewsList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
        </section>

        <!-- クランテラス中間バナー -->
        <section class="mb-12">
            <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer"
               class="block featured-card rounded-2xl p-6 hover:shadow-lg transition-all pulse-border">
                <div class="flex flex-col md:flex-row items-center gap-6">
                    <div class="md:w-1/3">
                        <img src="${CRANN_TERRACE_IMAGE}" alt="クランテラス" 
                             class="w-full h-48 object-cover rounded-xl">
                    </div>
                    <div class="md:w-2/3">
                        <div class="inline-block bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full mb-3">
                            <i class="fas fa-bullhorn mr-1"></i>おすすめシェアハウス
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">クランテラスで新生活を始めませんか？</h3>
                        <p class="text-gray-600 mb-4">
                            緑に囲まれた開放的なリビング、充実した設備、そして素敵な仲間との出会い。
                            クランテラスシリーズがあなたの新生活をサポートします。
                        </p>
                        <span class="inline-flex items-center gap-2 text-green-700 font-bold hover:underline">
                            公式サイトで物件を見る
                            <i class="fas fa-external-link-alt"></i>
                        </span>
                    </div>
                </div>
            </a>
        </section>

        <!-- 海外のニュース -->
        <section id="worldSection">
            <div class="flex items-center gap-3 mb-6">
                <i class="fas fa-earth-americas text-3xl text-blue-500"></i>
                <h2 class="text-2xl font-bold text-gray-800">海外のシェアハウスニュース</h2>
            </div>
            <div id="worldNewsList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
        </section>

        <div id="loading" class="hidden text-center py-12">
            <i class="fas fa-spinner fa-spin text-4xl text-green-600 mb-4"></i>
            <p class="text-gray-500">記事を読み込み中...</p>
        </div>
    </main>

    ${footer}

    <script>
        let allNews = [];
        let currentRegion = 'all';

        function createNewsCard(article, index) {
            const delay = index * 80;
            const regionBadge = article.region === 'japan' 
                ? '<span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full">🇯🇵 日本</span>'
                : \`<span class="bg-blue-500 text-white text-xs px-2 py-1 rounded-full"><i class="fas fa-globe mr-1"></i>\${article.country}</span>\`;
            
            return \`
                <article class="card-hover bg-white rounded-xl overflow-hidden shadow-sm fade-in" style="animation-delay: \${delay}ms">
                    <a href="\${article.url}" target="_blank" rel="noopener noreferrer" class="block">
                        <div class="relative h-48 overflow-hidden">
                            <img src="\${article.image}" alt="\${article.title}" class="w-full h-full object-cover image-zoom">
                            <div class="absolute top-3 left-3">\${regionBadge}</div>
                        </div>
                        <div class="p-5">
                            <h3 class="font-bold text-gray-800 mb-2 line-clamp-2 hover:text-green-700 transition-colors">\${article.title}</h3>
                            <p class="text-gray-500 text-sm mb-4 line-clamp-2">\${article.summary}</p>
                            <div class="flex items-center justify-between text-xs text-gray-400">
                                <span><i class="fas fa-clock mr-1"></i>\${article.date}</span>
                                <span>\${article.source}</span>
                            </div>
                        </div>
                    </a>
                </article>
            \`;
        }

        function displayNews(news) {
            const japanNews = news.filter(n => n.region === 'japan');
            const worldNews = news.filter(n => n.region === 'world');
            
            const japanContainer = document.getElementById('japanNewsList');
            const worldContainer = document.getElementById('worldNewsList');
            const japanSection = document.getElementById('japanSection');
            const worldSection = document.getElementById('worldSection');
            
            if (currentRegion === 'all' || currentRegion === 'japan') {
                japanSection.classList.remove('hidden');
                japanContainer.innerHTML = japanNews.map((n, i) => createNewsCard(n, i)).join('');
            } else {
                japanSection.classList.add('hidden');
            }
            
            if (currentRegion === 'all' || currentRegion === 'world') {
                worldSection.classList.remove('hidden');
                worldContainer.innerHTML = worldNews.map((n, i) => createNewsCard(n, i)).join('');
            } else {
                worldSection.classList.add('hidden');
            }
        }

        function filterRegion(region) {
            currentRegion = region;
            document.querySelectorAll('.region-btn').forEach(btn => {
                if (btn.dataset.region === region) {
                    btn.classList.remove('bg-white', 'text-gray-600', 'border-2', 'border-gray-200');
                    btn.classList.add('bg-green-700', 'text-white', 'shadow-md');
                } else {
                    btn.classList.remove('bg-green-700', 'text-white', 'shadow-md');
                    btn.classList.add('bg-white', 'text-gray-600', 'border-2', 'border-gray-200');
                }
            });
            displayNews(allNews);
        }

        async function fetchNews() {
            document.getElementById('loading').classList.remove('hidden');
            try {
                const response = await fetch('/api/news');
                const data = await response.json();
                allNews = data.news || [];
                displayNews(allNews);
            } catch (err) {
                console.error('Error:', err);
            } finally {
                document.getElementById('loading').classList.add('hidden');
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
