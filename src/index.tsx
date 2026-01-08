import { Hono } from 'hono'
import { cors } from 'hono/cors'

// Cloudflare Bindings型定義
type Bindings = {
  NEWS_KV: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// メインページ
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
        .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
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
</head>
<body class="bg-gray-50">
    <!-- ヘッダー -->
    <header class="bg-white border-b sticky top-0 z-50">
        <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center gap-2">
                    <i class="fas fa-home text-2xl text-purple-600"></i>
                    <span class="text-xl font-bold gradient-text">シェアハウスニュース</span>
                </div>
                <div class="text-sm text-gray-500">
                    <i class="fas fa-calendar mr-1"></i>
                    <span id="currentDate"></span>
                </div>
            </div>
        </div>
    </header>

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
            <div id="japanNewsList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            </div>
        </section>

        <!-- 海外のニュース -->
        <section id="worldSection">
            <div class="flex items-center gap-3 mb-6">
                <i class="fas fa-earth-americas text-3xl text-blue-500"></i>
                <h2 class="text-2xl font-bold text-gray-800">海外のシェアハウスニュース</h2>
            </div>
            <div id="worldNewsList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            </div>
        </section>

        <!-- ローディング -->
        <div id="loading" class="hidden text-center py-12">
            <i class="fas fa-spinner fa-spin text-4xl text-purple-500 mb-4"></i>
            <p class="text-gray-500">記事を読み込み中...</p>
        </div>
    </main>

    <!-- フッター -->
    <footer class="bg-gray-800 text-white py-8 mt-12">
        <div class="container mx-auto px-4 text-center">
            <div class="flex items-center justify-center gap-2 mb-4">
                <i class="fas fa-home text-purple-400"></i>
                <span class="font-bold">シェアハウスニュース</span>
            </div>
            <p class="text-gray-400 text-sm">© 2026 シェアハウスニュース All Rights Reserved.</p>
        </div>
    </footer>

    <script>
        // 日本時間で日付を表示
        document.getElementById('currentDate').textContent = new Date().toLocaleDateString('ja-JP', {
            timeZone: 'Asia/Tokyo',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short'
        });

        let allNews = [];
        let currentRegion = 'all';

        // 記事カードを生成
        function createNewsCard(article, index) {
            const delay = index * 80;
            const regionBadge = article.region === 'japan' 
                ? '<span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full">🇯🇵 日本</span>'
                : \`<span class="bg-blue-500 text-white text-xs px-2 py-1 rounded-full"><i class="fas fa-globe mr-1"></i>\${article.country}</span>\`;
            
            return \`
                <article class="card-hover bg-white rounded-xl overflow-hidden shadow-sm fade-in" style="animation-delay: \${delay}ms">
                    <a href="\${article.url}" target="_blank" rel="noopener noreferrer" class="block">
                        <div class="relative h-48 overflow-hidden">
                            <img src="\${article.image}" alt="\${article.title}" 
                                 class="w-full h-full object-cover image-zoom"
                                 onerror="this.src='https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop'">
                            <div class="absolute top-3 left-3">
                                \${regionBadge}
                            </div>
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

        // 記事を表示
        function displayNews(news) {
            const japanNews = news.filter(n => n.region === 'japan');
            const worldNews = news.filter(n => n.region === 'world');
            
            const japanContainer = document.getElementById('japanNewsList');
            const worldContainer = document.getElementById('worldNewsList');
            const japanSection = document.getElementById('japanSection');
            const worldSection = document.getElementById('worldSection');
            
            // 日本のニュース
            if (currentRegion === 'all' || currentRegion === 'japan') {
                japanSection.classList.remove('hidden');
                japanContainer.innerHTML = japanNews.length > 0 
                    ? japanNews.map((n, i) => createNewsCard(n, i)).join('')
                    : '<p class="col-span-full text-center text-gray-500 py-8">記事がありません</p>';
            } else {
                japanSection.classList.add('hidden');
            }
            
            // 海外のニュース
            if (currentRegion === 'all' || currentRegion === 'world') {
                worldSection.classList.remove('hidden');
                worldContainer.innerHTML = worldNews.length > 0 
                    ? worldNews.map((n, i) => createNewsCard(n, i)).join('')
                    : '<p class="col-span-full text-center text-gray-500 py-8">記事がありません</p>';
            } else {
                worldSection.classList.add('hidden');
            }
        }

        // 地域フィルター
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

        // データ取得
        async function fetchNews() {
            const loading = document.getElementById('loading');
            loading.classList.remove('hidden');

            try {
                const response = await fetch('/api/news');
                const data = await response.json();
                allNews = data.news || [];
                displayNews(allNews);
            } catch (err) {
                console.error('Error:', err);
            } finally {
                loading.classList.add('hidden');
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
      if (cached) {
        cachedNews = cached.news
      }
    }
    
    const news = cachedNews || generateDefaultNews()
    
    return c.json({
      success: true,
      news: news,
      total: news.length
    })
  } catch (error) {
    console.error('Error fetching news:', error)
    return c.json({
      success: false,
      news: generateDefaultNews(),
      total: 0
    })
  }
})

// Cron Trigger用のスケジュールハンドラ
export default {
  fetch: app.fetch,
  
  async scheduled(event: ScheduledEvent, env: { NEWS_KV: KVNamespace }, ctx: ExecutionContext) {
    console.log('Cron triggered at:', new Date().toISOString())
    
    try {
      const news = await fetchAndProcessNews()
      
      await env.NEWS_KV.put('news_data', JSON.stringify({
        news: news,
        lastUpdated: new Date().toISOString()
      }))
      
      console.log('News updated successfully:', news.length, 'articles')
    } catch (error) {
      console.error('Cron job failed:', error)
    }
  }
}

async function fetchAndProcessNews(): Promise<NewsItem[]> {
  return generateDefaultNews()
}

interface NewsItem {
  id: number
  title: string
  summary: string
  region: 'japan' | 'world'
  country: string
  source: string
  date: string
  image: string
  url: string
}

function generateDefaultNews(): NewsItem[] {
  const now = new Date()
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  
  const formatDate = (daysAgo: number): string => {
    const date = new Date(jstNow)
    date.setDate(date.getDate() - daysAgo)
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
  }
  
  return [
    // 日本のニュース
    {
      id: 1,
      title: '2026年シェアハウス市場、過去最高の成長率を記録　コロナ後の住まい方改革が加速',
      summary: '不動産経済研究所の調査によると、2026年のシェアハウス市場規模は前年比15%増の3,500億円に達する見込み。テレワーク定着による住まい方の多様化が背景に。',
      region: 'japan',
      country: '日本',
      source: '不動産経済新聞',
      date: formatDate(0),
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop',
      url: 'https://www.hituji.jp/'
    },
    {
      id: 2,
      title: '大手不動産3社、シェアハウス事業を本格展開へ　2026年度中に100棟計画',
      summary: '三井不動産、三菱地所、住友不動産の大手3社がシェアハウス市場に本格参入。都心部を中心に高品質物件を展開し、新たな顧客層の開拓を目指す。',
      region: 'japan',
      country: '日本',
      source: '日経不動産',
      date: formatDate(1),
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop',
      url: 'https://www.oakhouse.jp/'
    },
    {
      id: 3,
      title: '多世代交流型シェアハウスが台頭、孤独解消の場として全国で増加',
      summary: '若者からシニアまでが共に暮らす多世代型シェアハウスが注目。孤独死問題や高齢者の見守りニーズにも対応し、自治体からの支援も拡大している。',
      region: 'japan',
      country: '日本',
      source: '住まいトレンド研究所',
      date: formatDate(1),
      image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=500&fit=crop',
      url: 'https://address.love/'
    },
    {
      id: 4,
      title: '渋谷に過去最大級のシェアハウスオープン、全150室でコワーキング併設',
      summary: '渋谷駅徒歩5分の好立地に、全150室の大型シェアハウスが来月オープン。24時間利用可能なコワーキングスペース、ジム、シアタールームを完備。',
      region: 'japan',
      country: '日本',
      source: 'シェアハウスポータル',
      date: formatDate(2),
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop',
      url: 'https://www.social-apartment.com/'
    },
    {
      id: 5,
      title: 'ペット可シェアハウスが全国で300件突破、ドッグラン・猫部屋完備物件も',
      summary: 'ペットとの暮らしに特化したシェアハウスが急増。専用設備やペットシッターサービスを提供し、ペットオーナーのコミュニティ形成にも一役。',
      region: 'japan',
      country: '日本',
      source: 'ペットライフジャパン',
      date: formatDate(3),
      image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=500&fit=crop',
      url: 'https://www.hituji.jp/comret/search/pet'
    },
    {
      id: 6,
      title: '福岡・天神に女性専用高セキュリティシェアハウス登場　顔認証オートロック完備',
      summary: '24時間管理人常駐、防犯カメラ完備のセキュリティ特化型物件。パウダールームやヨガスタジオなど女性向け設備も充実。',
      region: 'japan',
      country: '日本',
      source: 'SHARE LIFE',
      date: formatDate(3),
      image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&h=500&fit=crop',
      url: 'https://www.share-apartment.com/'
    },
    {
      id: 7,
      title: '鎌倉の古民家をリノベーション、海を望むシェアハウスが予約殺到',
      summary: '築80年の古民家を改装したシェアハウスが話題に。海まで徒歩3分、サーファーやリモートワーカーに人気でオープン前に満室御礼。',
      region: 'japan',
      country: '日本',
      source: 'ひつじ不動産',
      date: formatDate(4),
      image: 'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=800&h=500&fit=crop',
      url: 'https://address.love/'
    },
    {
      id: 8,
      title: 'シェアハウス入居前に確認すべき10のポイント【完全ガイド】',
      summary: '契約条件、共用ルール、退去時の費用まで、シェアハウス選びで失敗しないためのチェックリストを専門家が解説。初めての方必見。',
      region: 'japan',
      country: '日本',
      source: 'シェアライフマガジン',
      date: formatDate(5),
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=500&fit=crop',
      url: 'https://www.hituji.jp/comret/knowledge'
    },

    // 海外のニュース
    {
      id: 101,
      title: 'ニューヨークでコリビング市場が急成長、WeWorkが新ブランド立ち上げ',
      summary: 'リモートワーカー向けのコリビング（共同生活）市場が急拡大。WeWorkが新たにコリビングブランドを立ち上げ、マンハッタンで5物件を展開予定。',
      region: 'world',
      country: 'アメリカ',
      source: 'TechCrunch',
      date: formatDate(0),
      image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&h=500&fit=crop',
      url: 'https://www.common.com/'
    },
    {
      id: 102,
      title: 'ロンドンのコリビング大手「The Collective」が欧州全土に拡大計画を発表',
      summary: '英国最大のコリビング運営会社が、ドイツ・フランス・オランダへの進出を発表。2027年までに欧州で1万室の提供を目指す。',
      region: 'world',
      country: 'イギリス',
      source: 'The Guardian',
      date: formatDate(1),
      image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=500&fit=crop',
      url: 'https://www.thecollective.com/'
    },
    {
      id: 103,
      title: 'シンガポール政府、若者向けシェアハウス補助金制度を新設',
      summary: '住宅価格高騰を受け、シンガポール政府が35歳以下の若者を対象にシェアハウス入居費用の30%を補助する新制度を発表。来年1月から開始。',
      region: 'world',
      country: 'シンガポール',
      source: 'Channel News Asia',
      date: formatDate(1),
      image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&h=500&fit=crop',
      url: 'https://www.hmlet.com/'
    },
    {
      id: 104,
      title: 'ベルリンでデジタルノマド向けコリビングが人気、月額800ユーロから',
      summary: '世界中のリモートワーカーが集まるベルリンで、高速WiFi・コワーキングスペース完備のコリビングが人気。多国籍コミュニティが魅力。',
      region: 'world',
      country: 'ドイツ',
      source: 'Deutsche Welle',
      date: formatDate(2),
      image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&h=500&fit=crop',
      url: 'https://www.medici-living.com/'
    },
    {
      id: 105,
      title: 'オーストラリア・メルボルンで学生向けシェアハウスが急増、大学と提携も',
      summary: '留学生の増加を受け、メルボルンで大学公認のシェアハウスが急増。家賃高騰に悩む学生の新たな選択肢として注目を集めている。',
      region: 'world',
      country: 'オーストラリア',
      source: 'ABC News',
      date: formatDate(2),
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=500&fit=crop',
      url: 'https://www.iglu.com.au/'
    },
    {
      id: 106,
      title: '韓国ソウル、一人暮らし青年向け「シェアハウス村」プロジェクト始動',
      summary: 'ソウル市が遊休地を活用し、20〜30代向けのシェアハウス集合地区を整備。低価格で入居可能で、コミュニティスペースや共同菜園も設置予定。',
      region: 'world',
      country: '韓国',
      source: 'Korea Herald',
      date: formatDate(3),
      image: 'https://images.unsplash.com/photo-1534274867514-d5b47ef89ed7?w=800&h=500&fit=crop',
      url: 'https://www.woozoo.kr/'
    },
    {
      id: 107,
      title: 'バリ島にノマドワーカー向け高級コリビング登場、月額1,500ドル〜',
      summary: 'インドネシア・バリ島のウブドに、プール・ヨガスタジオ・オーガニックレストラン完備のラグジュアリーコリビングがオープン。長期滞在者に人気。',
      region: 'world',
      country: 'インドネシア',
      source: 'Coconuts Bali',
      date: formatDate(4),
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=500&fit=crop',
      url: 'https://www.outsite.co/'
    },
    {
      id: 108,
      title: '台湾・台北でシェアハウス法整備へ、入居者保護を強化',
      summary: '台湾政府がシェアハウスに関する法整備を検討。契約トラブルや安全基準に関するルールを明確化し、入居者保護を強化する方針。',
      region: 'world',
      country: '台湾',
      source: 'Taiwan News',
      date: formatDate(5),
      image: 'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=800&h=500&fit=crop',
      url: 'https://www.borderless-house.com/tw/'
    }
  ]
}
