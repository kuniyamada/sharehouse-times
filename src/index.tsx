import { Hono } from 'hono'
import { cors } from 'hono/cors'

// Cloudflare Bindings型定義
type Bindings = {
  NEWS_KV: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
    </style>
`

// 共通のヘッダー
const getHeader = (currentPage: string) => `
    <header class="bg-white border-b sticky top-0 z-50">
        <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-16">
                <a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <i class="fas fa-home text-2xl text-purple-600"></i>
                    <span class="text-xl font-bold gradient-text">シェアハウスニュース</span>
                </a>
                <nav class="flex items-center gap-1">
                    <a href="/" class="px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 'news' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}">
                        <i class="fas fa-newspaper mr-1"></i>ニュース
                    </a>
                    <a href="/properties" class="px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 'properties' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}">
                        <i class="fas fa-building mr-1"></i>物件紹介
                    </a>
                </nav>
            </div>
        </div>
    </header>
`

// 共通のフッター
const footer = `
    <footer class="bg-gray-800 text-white py-8 mt-12">
        <div class="container mx-auto px-4 text-center">
            <div class="flex items-center justify-center gap-2 mb-4">
                <i class="fas fa-home text-purple-400"></i>
                <span class="font-bold">シェアハウスニュース</span>
            </div>
            <p class="text-gray-400 text-sm">© 2026 シェアハウスニュース All Rights Reserved.</p>
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
    <title>シェアハウスニュース | 日本・海外のシェアハウス最新情報</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    ${commonStyles}
</head>
<body class="bg-gray-50">
    ${getHeader('news')}

    <!-- サイト説明 -->
    <section class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-12">
        <div class="container mx-auto px-4 text-center">
            <h1 class="text-3xl md:text-4xl font-bold mb-4">
                <i class="fas fa-globe-asia mr-2"></i>
                シェアハウスニュース
            </h1>
            <p class="text-xl text-white/90 mb-2">日本と世界のシェアハウス最新情報をお届け</p>
            <p class="text-white/70">
                <i class="fas fa-clock mr-1"></i>
                毎朝10時に自動更新
            </p>
        </div>
    </section>

    <main class="container mx-auto px-4 py-8">
        <!-- 地域タブ -->
        <div class="flex justify-center gap-4 mb-8">
            <button onclick="filterRegion('all')" class="region-btn px-6 py-3 rounded-full font-medium bg-purple-600 text-white transition-all shadow-md" data-region="all">
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

        <!-- 海外のニュース -->
        <section id="worldSection">
            <div class="flex items-center gap-3 mb-6">
                <i class="fas fa-earth-americas text-3xl text-blue-500"></i>
                <h2 class="text-2xl font-bold text-gray-800">海外のシェアハウスニュース</h2>
            </div>
            <div id="worldNewsList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
        </section>

        <div id="loading" class="hidden text-center py-12">
            <i class="fas fa-spinner fa-spin text-4xl text-purple-500 mb-4"></i>
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
                            <h3 class="font-bold text-gray-800 mb-2 line-clamp-2 hover:text-purple-600 transition-colors">\${article.title}</h3>
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
                    btn.classList.add('bg-purple-600', 'text-white', 'shadow-md');
                } else {
                    btn.classList.remove('bg-purple-600', 'text-white', 'shadow-md');
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

// 物件紹介ページ
app.get('/properties', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>日本のシェアハウス紹介 | シェアハウスニュース</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    ${commonStyles}
</head>
<body class="bg-gray-50">
    ${getHeader('properties')}

    <!-- ヒーロー -->
    <section class="bg-gradient-to-r from-red-500 to-pink-500 text-white py-12">
        <div class="container mx-auto px-4 text-center">
            <h1 class="text-3xl md:text-4xl font-bold mb-4">
                <span class="mr-2">🇯🇵</span>
                日本のシェアハウス紹介
            </h1>
            <p class="text-xl text-white/90">全国の人気シェアハウスをピックアップ</p>
        </div>
    </section>

    <main class="container mx-auto px-4 py-8">
        <!-- エリアフィルター -->
        <div class="flex flex-wrap justify-center gap-2 mb-8">
            <button onclick="filterArea('all')" class="area-btn px-5 py-2 rounded-full text-sm font-medium bg-red-500 text-white transition-all" data-area="all">
                すべて
            </button>
            <button onclick="filterArea('tokyo')" class="area-btn px-5 py-2 rounded-full text-sm font-medium bg-white text-gray-600 border hover:border-red-300 transition-all" data-area="tokyo">
                東京
            </button>
            <button onclick="filterArea('kanagawa')" class="area-btn px-5 py-2 rounded-full text-sm font-medium bg-white text-gray-600 border hover:border-red-300 transition-all" data-area="kanagawa">
                神奈川
            </button>
            <button onclick="filterArea('osaka')" class="area-btn px-5 py-2 rounded-full text-sm font-medium bg-white text-gray-600 border hover:border-red-300 transition-all" data-area="osaka">
                大阪
            </button>
            <button onclick="filterArea('fukuoka')" class="area-btn px-5 py-2 rounded-full text-sm font-medium bg-white text-gray-600 border hover:border-red-300 transition-all" data-area="fukuoka">
                福岡
            </button>
            <button onclick="filterArea('other')" class="area-btn px-5 py-2 rounded-full text-sm font-medium bg-white text-gray-600 border hover:border-red-300 transition-all" data-area="other">
                その他
            </button>
        </div>

        <!-- 物件一覧 -->
        <div id="propertyList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>

        <div id="loading" class="hidden text-center py-12">
            <i class="fas fa-spinner fa-spin text-4xl text-red-500 mb-4"></i>
            <p class="text-gray-500">物件を読み込み中...</p>
        </div>
    </main>

    ${footer}

    <script>
        let allProperties = [];
        let currentArea = 'all';

        function createPropertyCard(property, index) {
            const delay = index * 80;
            const tags = property.tags || [];
            
            return \`
                <article class="card-hover bg-white rounded-xl overflow-hidden shadow-sm fade-in" style="animation-delay: \${delay}ms">
                    <a href="\${property.url}" target="_blank" rel="noopener noreferrer" class="block">
                        <div class="relative h-52 overflow-hidden">
                            <img src="\${property.image}" alt="\${property.name}" class="w-full h-full object-cover image-zoom">
                            <div class="absolute top-3 left-3 flex gap-2">
                                <span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full">\${property.area}</span>
                                \${property.isNew ? '<span class="bg-green-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>' : ''}
                            </div>
                            <div class="absolute bottom-3 right-3">
                                <span class="bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                                    ¥\${property.rent.toLocaleString()}〜/月
                                </span>
                            </div>
                        </div>
                        <div class="p-5">
                            <h3 class="font-bold text-gray-800 text-lg mb-2">\${property.name}</h3>
                            <p class="text-gray-500 text-sm mb-3">
                                <i class="fas fa-map-marker-alt text-red-400 mr-1"></i>
                                \${property.location}
                            </p>
                            <p class="text-gray-600 text-sm mb-4 line-clamp-2">\${property.description}</p>
                            <div class="flex flex-wrap gap-2 mb-4">
                                \${tags.map(tag => \`<span class="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">\${tag}</span>\`).join('')}
                            </div>
                            <div class="flex items-center justify-between text-xs text-gray-400 border-t pt-3">
                                <span><i class="fas fa-door-open mr-1"></i>\${property.rooms}室</span>
                                <span><i class="fas fa-train mr-1"></i>\${property.station}</span>
                            </div>
                        </div>
                    </a>
                </article>
            \`;
        }

        function displayProperties(properties) {
            const container = document.getElementById('propertyList');
            const filtered = currentArea === 'all' 
                ? properties 
                : properties.filter(p => p.areaCode === currentArea);
            
            container.innerHTML = filtered.length > 0
                ? filtered.map((p, i) => createPropertyCard(p, i)).join('')
                : '<p class="col-span-full text-center text-gray-500 py-12">該当する物件がありません</p>';
        }

        function filterArea(area) {
            currentArea = area;
            document.querySelectorAll('.area-btn').forEach(btn => {
                if (btn.dataset.area === area) {
                    btn.classList.remove('bg-white', 'text-gray-600', 'border');
                    btn.classList.add('bg-red-500', 'text-white');
                } else {
                    btn.classList.remove('bg-red-500', 'text-white');
                    btn.classList.add('bg-white', 'text-gray-600', 'border');
                }
            });
            displayProperties(allProperties);
        }

        async function fetchProperties() {
            document.getElementById('loading').classList.remove('hidden');
            try {
                const response = await fetch('/api/properties');
                const data = await response.json();
                allProperties = data.properties || [];
                displayProperties(allProperties);
            } catch (err) {
                console.error('Error:', err);
            } finally {
                document.getElementById('loading').classList.add('hidden');
            }
        }

        document.addEventListener('DOMContentLoaded', fetchProperties);
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

// API: 物件データを取得
app.get('/api/properties', async (c) => {
  const properties = generateProperties()
  return c.json({ success: true, properties, total: properties.length })
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

// ニュースデータ生成
function generateDefaultNews() {
  const now = new Date()
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const formatDate = (daysAgo: number): string => {
    const date = new Date(jstNow)
    date.setDate(date.getDate() - daysAgo)
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
  }
  
  return [
    // 日本
    { id: 1, title: '2026年シェアハウス市場、過去最高の成長率を記録', summary: '不動産経済研究所の調査によると、市場規模は前年比15%増の3,500億円に達する見込み。', region: 'japan', country: '日本', source: '不動産経済新聞', date: formatDate(0), image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop', url: 'https://www.hituji.jp/' },
    { id: 2, title: '大手不動産3社、シェアハウス事業を本格展開へ', summary: '三井不動産、三菱地所、住友不動産が市場に本格参入。2026年度中に100棟計画。', region: 'japan', country: '日本', source: '日経不動産', date: formatDate(1), image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop', url: 'https://www.oakhouse.jp/' },
    { id: 3, title: '多世代交流型シェアハウスが台頭、孤独解消の場として注目', summary: '若者からシニアまでが共に暮らす多世代型が全国で増加。自治体支援も拡大。', region: 'japan', country: '日本', source: '住まいトレンド研究所', date: formatDate(1), image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=500&fit=crop', url: 'https://address.love/' },
    { id: 4, title: '渋谷に過去最大級のシェアハウスオープン、全150室', summary: '渋谷駅徒歩5分。コワーキング、ジム、シアタールーム完備の大型物件。', region: 'japan', country: '日本', source: 'シェアハウスポータル', date: formatDate(2), image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop', url: 'https://www.social-apartment.com/' },
    { id: 5, title: 'ペット可シェアハウスが全国で300件突破', summary: 'ドッグラン、猫部屋完備物件が急増。ペットオーナーのコミュニティ形成にも一役。', region: 'japan', country: '日本', source: 'ペットライフジャパン', date: formatDate(3), image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=500&fit=crop', url: 'https://www.hituji.jp/comret/search/pet' },
    { id: 6, title: '福岡・天神に女性専用高セキュリティシェアハウス登場', summary: '顔認証オートロック、24時間管理人常駐。女性向け設備も充実。', region: 'japan', country: '日本', source: 'SHARE LIFE', date: formatDate(3), image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&h=500&fit=crop', url: 'https://www.share-apartment.com/' },
    // 海外
    { id: 101, title: 'NYでコリビング市場が急成長、WeWorkが新ブランド', summary: 'リモートワーカー向け市場が拡大。マンハッタンで5物件を展開予定。', region: 'world', country: 'アメリカ', source: 'TechCrunch', date: formatDate(0), image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&h=500&fit=crop', url: 'https://www.common.com/' },
    { id: 102, title: 'ロンドンのコリビング大手が欧州全土に拡大計画', summary: '英国最大の運営会社がドイツ・フランスへ進出。2027年までに1万室目標。', region: 'world', country: 'イギリス', source: 'The Guardian', date: formatDate(1), image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=500&fit=crop', url: 'https://www.thecollective.com/' },
    { id: 103, title: 'シンガポール政府、若者向けシェアハウス補助金制度を新設', summary: '35歳以下対象に入居費用30%を補助。来年1月から開始。', region: 'world', country: 'シンガポール', source: 'Channel News Asia', date: formatDate(1), image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&h=500&fit=crop', url: 'https://www.hmlet.com/' },
    { id: 104, title: 'ベルリンでデジタルノマド向けコリビングが人気', summary: '高速WiFi・コワーキング完備。多国籍コミュニティが魅力。月額800ユーロから。', region: 'world', country: 'ドイツ', source: 'Deutsche Welle', date: formatDate(2), image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&h=500&fit=crop', url: 'https://www.medici-living.com/' },
    { id: 105, title: 'メルボルンで学生向けシェアハウスが急増', summary: '留学生増加で大学公認物件が急増。家賃高騰の新たな選択肢に。', region: 'world', country: 'オーストラリア', source: 'ABC News', date: formatDate(2), image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=500&fit=crop', url: 'https://www.iglu.com.au/' },
    { id: 106, title: '韓国ソウル、青年向け「シェアハウス村」プロジェクト始動', summary: 'ソウル市が遊休地を活用。コミュニティスペースや共同菜園も設置予定。', region: 'world', country: '韓国', source: 'Korea Herald', date: formatDate(3), image: 'https://images.unsplash.com/photo-1534274867514-d5b47ef89ed7?w=800&h=500&fit=crop', url: 'https://www.woozoo.kr/' },
  ]
}

// 物件データ生成
function generateProperties() {
  return [
    { id: 1, name: 'SOCIAL APARTMENT 渋谷', location: '東京都渋谷区神南1丁目', area: '東京', areaCode: 'tokyo', station: '渋谷駅 徒歩8分', rent: 65000, rooms: 80, description: 'コワーキングスペース、ジム、シアタールーム完備。クリエイターやIT系に人気。', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop', url: 'https://www.social-apartment.com/', tags: ['個室', 'ジム', 'コワーキング', 'Wi-Fi'], isNew: false },
    { id: 2, name: 'オークハウス目黒', location: '東京都目黒区目黒2丁目', area: '東京', areaCode: 'tokyo', station: '目黒駅 徒歩5分', rent: 72000, rooms: 45, description: '閑静な住宅街に位置する落ち着いた雰囲気。広々としたキッチンとリビングが自慢。', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop', url: 'https://www.oakhouse.jp/', tags: ['個室', 'オートロック', '駅近', '家具付き'], isNew: true },
    { id: 3, name: 'シェアプレイス田園調布', location: '東京都大田区田園調布3丁目', area: '東京', areaCode: 'tokyo', station: '田園調布駅 徒歩10分', rent: 85000, rooms: 30, description: '高級住宅街のハイグレード物件。広い個室とホテルライクな共用部が特徴。', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop', url: 'https://www.hituji.jp/', tags: ['高級', '広い個室', '防音', 'ラウンジ'], isNew: true },
    { id: 4, name: 'グローバルシェアハウス池袋', location: '東京都豊島区池袋2丁目', area: '東京', areaCode: 'tokyo', station: '池袋駅 徒歩10分', rent: 52000, rooms: 70, description: '20カ国以上の入居者が暮らす国際色豊かな物件。毎週国際交流イベント開催。', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop', url: 'https://tokyosharehouse.com/', tags: ['国際交流', '語学', 'イベント', 'キッチン広い'], isNew: false },
    { id: 5, name: 'レディースシェア新宿', location: '東京都新宿区西新宿5丁目', area: '東京', areaCode: 'tokyo', station: '西新宿駅 徒歩6分', rent: 58000, rooms: 35, description: '女性専用のセキュリティ重視物件。オートロック、防犯カメラ、管理人常駐。', image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600&h=400&fit=crop', url: 'https://www.share-apartment.com/', tags: ['女性専用', 'オートロック', '管理人常駐', 'パウダールーム'], isNew: true },
    { id: 6, name: 'ADDress 鎌倉邸', location: '神奈川県鎌倉市長谷2丁目', area: '神奈川', areaCode: 'kanagawa', station: '長谷駅 徒歩8分', rent: 55000, rooms: 15, description: '古都・鎌倉で暮らす贅沢。海も山も徒歩圏内。リモートワーカーに人気。', image: 'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=600&h=400&fit=crop', url: 'https://address.love/', tags: ['多拠点', '海近', '古民家風', 'リモートワーク'], isNew: true },
    { id: 7, name: 'シェアハウス横浜みなとみらい', location: '神奈川県横浜市西区みなとみらい', area: '神奈川', areaCode: 'kanagawa', station: 'みなとみらい駅 徒歩7分', rent: 62000, rooms: 40, description: '夜景が美しいベイエリアに位置。屋上テラスからの眺望が自慢。', image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop', url: 'https://www.oakhouse.jp/', tags: ['夜景', '屋上テラス', 'オーシャンビュー', 'モダン'], isNew: false },
    { id: 8, name: 'CROSS HOUSE 大阪梅田', location: '大阪府大阪市北区梅田1丁目', area: '大阪', areaCode: 'osaka', station: '梅田駅 徒歩5分', rent: 48000, rooms: 60, description: '大阪の中心・梅田駅徒歩5分。ビジネスパーソンに人気の好立地物件。', image: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600&h=400&fit=crop', url: 'https://www.hituji.jp/comret/info/osaka', tags: ['駅近', 'ビジネス向け', 'Wi-Fi高速', '会議室'], isNew: false },
    { id: 9, name: 'シェアハウス難波', location: '大阪府大阪市中央区難波', area: '大阪', areaCode: 'osaka', station: '難波駅 徒歩3分', rent: 45000, rooms: 35, description: 'なんば駅徒歩3分の好アクセス。外国人入居者も多く国際的な雰囲気。', image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&h=400&fit=crop', url: 'https://www.oakhouse.jp/', tags: ['駅近', '国際交流', '繁華街', '格安'], isNew: true },
    { id: 10, name: 'SHARE HOUSE 福岡天神', location: '福岡県福岡市中央区天神2丁目', area: '福岡', areaCode: 'fukuoka', station: '天神駅 徒歩3分', rent: 42000, rooms: 50, description: '天神駅徒歩3分。屋上テラスから福岡の夜景が一望。国際色豊かな入居者。', image: 'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=600&h=400&fit=crop', url: 'https://www.oakhouse.jp/', tags: ['駅近', '屋上テラス', '国際交流', '格安'], isNew: false },
    { id: 11, name: 'ペットと暮らすシェアハウス中野', location: '東京都中野区中野3丁目', area: '東京', areaCode: 'tokyo', station: '中野駅 徒歩7分', rent: 68000, rooms: 25, description: '愛犬・愛猫と暮らせる貴重な物件。専用ドッグラン、猫部屋完備。', image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop', url: 'https://www.hituji.jp/comret/search/pet', tags: ['ペット可', 'ドッグラン', '猫部屋', 'ペットシッター'], isNew: false },
    { id: 12, name: 'エコシェアハウス世田谷', location: '東京都世田谷区三軒茶屋1丁目', area: '東京', areaCode: 'tokyo', station: '三軒茶屋駅 徒歩12分', rent: 60000, rooms: 20, description: '太陽光発電、雨水利用、コンポスト完備。サステナブルな暮らしを実践。', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop', url: 'https://www.social-apartment.com/', tags: ['エコ', '太陽光発電', '菜園', 'サステナブル'], isNew: true },
    { id: 13, name: 'シェアハウス札幌', location: '北海道札幌市中央区大通', area: 'その他', areaCode: 'other', station: '大通駅 徒歩5分', rent: 38000, rooms: 30, description: '札幌中心部の好立地。冬も暖かい全館暖房完備。スキー・スノボ好きに人気。', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&h=400&fit=crop', url: 'https://www.oakhouse.jp/', tags: ['全館暖房', '駅近', 'スキー', '格安'], isNew: false },
    { id: 14, name: 'シェアハウス名古屋栄', location: '愛知県名古屋市中区栄', area: 'その他', areaCode: 'other', station: '栄駅 徒歩6分', rent: 45000, rooms: 40, description: '名古屋の中心・栄エリア。おしゃれなカフェ風ラウンジが自慢の物件。', image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&h=400&fit=crop', url: 'https://www.hituji.jp/', tags: ['カフェ風', '駅近', 'おしゃれ', 'ラウンジ'], isNew: true },
  ]
}
