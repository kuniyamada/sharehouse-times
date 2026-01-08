import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('/api/*', cors())

// メインページ
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>シェアハウスニュース | 全国のシェアハウス最新情報</title>
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
                <nav class="hidden md:flex items-center gap-6 text-sm">
                    <a href="#" class="text-gray-600 hover:text-purple-600 transition-colors">ニュース</a>
                    <a href="#" class="text-gray-600 hover:text-purple-600 transition-colors">トレンド</a>
                    <a href="#" class="text-gray-600 hover:text-purple-600 transition-colors">生活ガイド</a>
                    <a href="#" class="text-gray-600 hover:text-purple-600 transition-colors">物件情報</a>
                </nav>
                <div class="text-sm text-gray-500">
                    <i class="fas fa-calendar mr-1"></i>
                    <span id="currentDate"></span>
                </div>
            </div>
        </div>
    </header>

    <main class="container mx-auto px-4 py-8">
        <!-- ヒーローセクション -->
        <section class="mb-10">
            <div id="featuredNews" class="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl overflow-hidden shadow-xl">
                <!-- メイン記事がここに入る -->
            </div>
        </section>

        <!-- カテゴリタブ -->
        <div class="flex flex-wrap gap-2 mb-8">
            <button onclick="filterCategory('all')" class="filter-btn px-4 py-2 rounded-full text-sm font-medium bg-purple-600 text-white transition-all" data-category="all">
                <i class="fas fa-newspaper mr-1"></i>すべて
            </button>
            <button onclick="filterCategory('news')" class="filter-btn px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-600 border hover:border-purple-300 transition-all" data-category="news">
                <i class="fas fa-bolt mr-1"></i>最新ニュース
            </button>
            <button onclick="filterCategory('trend')" class="filter-btn px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-600 border hover:border-purple-300 transition-all" data-category="trend">
                <i class="fas fa-chart-line mr-1"></i>トレンド
            </button>
            <button onclick="filterCategory('guide')" class="filter-btn px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-600 border hover:border-purple-300 transition-all" data-category="guide">
                <i class="fas fa-book mr-1"></i>生活ガイド
            </button>
            <button onclick="filterCategory('property')" class="filter-btn px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-600 border hover:border-purple-300 transition-all" data-category="property">
                <i class="fas fa-building mr-1"></i>物件ニュース
            </button>
            <button onclick="filterCategory('interview')" class="filter-btn px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-600 border hover:border-purple-300 transition-all" data-category="interview">
                <i class="fas fa-user mr-1"></i>インタビュー
            </button>
        </div>

        <!-- 記事一覧 -->
        <div id="newsList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        </div>

        <!-- ローディング -->
        <div id="loading" class="hidden text-center py-12">
            <i class="fas fa-spinner fa-spin text-4xl text-purple-500 mb-4"></i>
            <p class="text-gray-500">記事を読み込み中...</p>
        </div>
    </main>

    <!-- サイドバー的なセクション -->
    <section class="bg-white border-t py-12">
        <div class="container mx-auto px-4">
            <h2 class="text-xl font-bold text-gray-800 mb-6">
                <i class="fas fa-fire text-orange-500 mr-2"></i>人気の記事
            </h2>
            <div id="popularList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            </div>
        </div>
    </section>

    <!-- フッター -->
    <footer class="bg-gray-800 text-white py-10">
        <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div>
                    <div class="flex items-center gap-2 mb-4">
                        <i class="fas fa-home text-purple-400"></i>
                        <span class="font-bold">シェアハウスニュース</span>
                    </div>
                    <p class="text-gray-400 text-sm">全国のシェアハウスに関する最新ニュース、トレンド、生活情報をお届けします。</p>
                </div>
                <div>
                    <h4 class="font-bold mb-4">カテゴリ</h4>
                    <ul class="space-y-2 text-gray-400 text-sm">
                        <li><a href="#" class="hover:text-white">最新ニュース</a></li>
                        <li><a href="#" class="hover:text-white">トレンド・市場動向</a></li>
                        <li><a href="#" class="hover:text-white">生活ガイド</a></li>
                        <li><a href="#" class="hover:text-white">インタビュー</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4">関連サイト</h4>
                    <ul class="space-y-2 text-gray-400 text-sm">
                        <li><a href="https://www.hituji.jp/" target="_blank" class="hover:text-white">ひつじ不動産</a></li>
                        <li><a href="https://www.oakhouse.jp/" target="_blank" class="hover:text-white">オークハウス</a></li>
                        <li><a href="https://www.social-apartment.com/" target="_blank" class="hover:text-white">ソーシャルアパートメント</a></li>
                    </ul>
                </div>
            </div>
            <div class="border-t border-gray-700 pt-6 text-center text-gray-400 text-sm">
                <p>© 2026 シェアハウスニュース All Rights Reserved.</p>
            </div>
        </div>
    </footer>

    <script>
        document.getElementById('currentDate').textContent = new Date().toLocaleDateString('ja-JP', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        let allNews = [];
        let currentCategory = 'all';

        // カテゴリラベル
        const categoryLabels = {
            news: { label: '最新ニュース', color: 'bg-red-500', icon: 'fa-bolt' },
            trend: { label: 'トレンド', color: 'bg-purple-500', icon: 'fa-chart-line' },
            guide: { label: '生活ガイド', color: 'bg-green-500', icon: 'fa-book' },
            property: { label: '物件ニュース', color: 'bg-blue-500', icon: 'fa-building' },
            interview: { label: 'インタビュー', color: 'bg-orange-500', icon: 'fa-user' }
        };

        // メイン記事を表示
        function displayFeatured(article) {
            const cat = categoryLabels[article.category];
            document.getElementById('featuredNews').innerHTML = \`
                <a href="\${article.url}" target="_blank" rel="noopener noreferrer" class="block md:flex">
                    <div class="md:w-1/2 h-64 md:h-80 overflow-hidden">
                        <img src="\${article.image}" alt="\${article.title}" class="w-full h-full object-cover">
                    </div>
                    <div class="md:w-1/2 p-6 md:p-10 flex flex-col justify-center text-white">
                        <span class="inline-flex items-center gap-1 text-sm bg-white/20 px-3 py-1 rounded-full w-fit mb-4">
                            <i class="fas \${cat.icon}"></i> \${cat.label}
                        </span>
                        <h2 class="text-2xl md:text-3xl font-bold mb-4 leading-tight">\${article.title}</h2>
                        <p class="text-white/80 mb-4 line-clamp-3">\${article.summary}</p>
                        <div class="flex items-center gap-4 text-sm text-white/60">
                            <span><i class="fas fa-clock mr-1"></i>\${article.date}</span>
                            <span><i class="fas fa-user mr-1"></i>\${article.source}</span>
                        </div>
                    </div>
                </a>
            \`;
        }

        // 記事カードを生成
        function createNewsCard(article, index) {
            const cat = categoryLabels[article.category];
            const delay = index * 80;
            
            return \`
                <article class="card-hover bg-white rounded-xl overflow-hidden shadow-sm fade-in" style="animation-delay: \${delay}ms">
                    <a href="\${article.url}" target="_blank" rel="noopener noreferrer" class="block">
                        <div class="relative h-48 overflow-hidden">
                            <img src="\${article.image}" alt="\${article.title}" 
                                 class="w-full h-full object-cover image-zoom"
                                 onerror="this.src='https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop'">
                            <span class="absolute top-3 left-3 \${cat.color} text-white text-xs px-3 py-1 rounded-full">
                                <i class="fas \${cat.icon} mr-1"></i>\${cat.label}
                            </span>
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

        // 人気記事カードを生成
        function createPopularCard(article, index) {
            return \`
                <a href="\${article.url}" target="_blank" rel="noopener noreferrer" 
                   class="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span class="text-2xl font-bold text-purple-300">\${index + 1}</span>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-medium text-gray-800 text-sm line-clamp-2">\${article.title}</h4>
                        <span class="text-xs text-gray-400">\${article.date}</span>
                    </div>
                </a>
            \`;
        }

        // 記事一覧を表示
        function displayNews(news) {
            const container = document.getElementById('newsList');
            
            if (!news || news.length === 0) {
                container.innerHTML = '<div class="col-span-full text-center py-12 text-gray-500">記事が見つかりませんでした</div>';
                return;
            }

            const filtered = currentCategory === 'all' 
                ? news 
                : news.filter(n => n.category === currentCategory);

            // 最初の記事をフィーチャーに
            if (filtered.length > 0) {
                displayFeatured(filtered[0]);
            }

            // 残りをグリッドに
            const remaining = filtered.slice(1);
            container.innerHTML = remaining.map((n, i) => createNewsCard(n, i)).join('');
        }

        // 人気記事を表示
        function displayPopular(news) {
            const popular = news.filter(n => n.isPopular).slice(0, 4);
            document.getElementById('popularList').innerHTML = popular.map((n, i) => createPopularCard(n, i)).join('');
        }

        // カテゴリフィルター
        function filterCategory(category) {
            currentCategory = category;
            
            document.querySelectorAll('.filter-btn').forEach(btn => {
                if (btn.dataset.category === category) {
                    btn.classList.remove('bg-white', 'text-gray-600', 'border');
                    btn.classList.add('bg-purple-600', 'text-white');
                } else {
                    btn.classList.remove('bg-purple-600', 'text-white');
                    btn.classList.add('bg-white', 'text-gray-600', 'border');
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
                
                // 日付順にソート
                allNews.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                displayNews(allNews);
                displayPopular(allNews);
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
  const news = generateNews()
  return c.json({
    success: true,
    news: news,
    total: news.length,
    lastUpdated: new Date().toISOString()
  })
})

// ニュースデータを生成
function generateNews() {
  const today = new Date()
  
  return [
    // 最新ニュース
    {
      id: 1,
      title: '2026年シェアハウス市場、過去最高の成長率を記録　コロナ後の住まい方改革が加速',
      summary: '不動産経済研究所の調査によると、2026年のシェアハウス市場規模は前年比15%増の3,500億円に達する見込み。テレワーク定着による住まい方の多様化が背景に。',
      category: 'news',
      source: '不動産経済新聞',
      date: formatDate(today),
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop',
      url: 'https://www.hituji.jp/',
      isPopular: true
    },
    {
      id: 2,
      title: '大手不動産3社、シェアハウス事業を本格展開へ　2026年度中に100棟計画',
      summary: '三井不動産、三菱地所、住友不動産の大手3社がシェアハウス市場に本格参入。都心部を中心に高品質物件を展開し、新たな顧客層の開拓を目指す。',
      category: 'news',
      source: '日経不動産',
      date: formatDate(addDays(today, -1)),
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop',
      url: 'https://www.oakhouse.jp/',
      isPopular: true
    },
    {
      id: 3,
      title: '外国人居住者が急増、国際交流型シェアハウスに注目集まる',
      summary: '円安と訪日外国人の増加を背景に、国際交流をコンセプトにしたシェアハウスの入居率が95%を超える。語学力向上を目指す日本人若者にも人気。',
      category: 'news',
      source: 'SUUMO NEWS',
      date: formatDate(addDays(today, -2)),
      image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=500&fit=crop',
      url: 'https://tokyosharehouse.com/',
      isPopular: false
    },
    
    // トレンド
    {
      id: 4,
      title: '【2026年トレンド】多世代交流型シェアハウスが台頭、孤独解消の場として注目',
      summary: '若者からシニアまでが共に暮らす多世代型シェアハウスが全国で増加。孤独死問題や高齢者の見守りニーズにも対応し、自治体からの支援も拡大している。',
      category: 'trend',
      source: '住まいトレンド研究所',
      date: formatDate(today),
      image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=500&fit=crop',
      url: 'https://address.love/',
      isPopular: true
    },
    {
      id: 5,
      title: 'サステナブル志向のエコシェアハウス、若年層の支持を獲得',
      summary: '太陽光発電、雨水利用、コンポストなど環境配慮型設備を備えたシェアハウスが人気上昇。Z世代を中心に「エシカルな暮らし」への関心が高まっている。',
      category: 'trend',
      source: 'エコライフ通信',
      date: formatDate(addDays(today, -1)),
      image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=800&h=500&fit=crop',
      url: 'https://www.social-apartment.com/',
      isPopular: false
    },
    {
      id: 6,
      title: 'ペット可シェアハウスが全国で300件突破、専用設備も充実化',
      summary: 'ドッグラン、キャットウォーク、ペットシッターサービスなど、ペットとの暮らしに特化したシェアハウスが急増。ペットオーナーのコミュニティ形成にも一役。',
      category: 'trend',
      source: 'ペットライフジャパン',
      date: formatDate(addDays(today, -3)),
      image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=500&fit=crop',
      url: 'https://www.hituji.jp/comret/search/pet',
      isPopular: true
    },
    
    // 生活ガイド
    {
      id: 7,
      title: '【完全ガイド】シェアハウス入居前に確認すべき10のポイント',
      summary: '契約条件、共用ルール、退去時の費用まで、シェアハウス選びで失敗しないためのチェックリストを専門家が解説。初めての方必見の保存版ガイド。',
      category: 'guide',
      source: 'シェアライフマガジン',
      date: formatDate(today),
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=500&fit=crop',
      url: 'https://www.hituji.jp/comret/knowledge',
      isPopular: true
    },
    {
      id: 8,
      title: 'シェアハウスの人間関係、うまくいく人の5つの習慣',
      summary: '100人以上のシェアハウス居住者へのアンケートから判明した、良好なコミュニティを築くためのコミュニケーション術とは。トラブル回避のヒントも。',
      category: 'guide',
      source: 'ルームシェアNavi',
      date: formatDate(addDays(today, -2)),
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=500&fit=crop',
      url: 'https://www.share-share.jp/',
      isPopular: false
    },
    {
      id: 9,
      title: 'シェアハウスで食費を月2万円に抑える！料理シェアのススメ',
      summary: '住人同士で食材や料理をシェアすることで、食費を大幅に節約できるテクニックを紹介。実践者の声と具体的なルール作りのコツを解説。',
      category: 'guide',
      source: '節約ライフ',
      date: formatDate(addDays(today, -4)),
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=500&fit=crop',
      url: 'https://www.oakhouse.jp/',
      isPopular: false
    },
    
    // 物件ニュース
    {
      id: 10,
      title: '渋谷に過去最大級のシェアハウスオープン、全150室でコワーキング併設',
      summary: '渋谷駅徒歩5分の好立地に、全150室の大型シェアハウスが来月オープン。24時間利用可能なコワーキングスペース、ジム、シアタールームを完備。',
      category: 'property',
      source: 'シェアハウスポータル',
      date: formatDate(today),
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop',
      url: 'https://www.social-apartment.com/',
      isPopular: false
    },
    {
      id: 11,
      title: '福岡・天神エリアに女性専用高セキュリティシェアハウスが登場',
      summary: '顔認証オートロック、24時間管理人常駐、防犯カメラ完備のセキュリティ特化型物件。パウダールームやヨガスタジオなど女性向け設備も充実。',
      category: 'property',
      source: 'SHARE LIFE',
      date: formatDate(addDays(today, -1)),
      image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&h=500&fit=crop',
      url: 'https://www.share-apartment.com/',
      isPopular: false
    },
    {
      id: 12,
      title: '鎌倉の古民家をリノベーション、海を望むシェアハウスが予約殺到',
      summary: '築80年の古民家を改装したシェアハウスが話題に。海まで徒歩3分、サーファーやリモートワーカーに人気でオープン前に満室御礼。',
      category: 'property',
      source: 'ひつじ不動産',
      date: formatDate(addDays(today, -3)),
      image: 'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=800&h=500&fit=crop',
      url: 'https://address.love/',
      isPopular: true
    },
    
    // インタビュー
    {
      id: 13,
      title: '【インタビュー】シェアハウス歴5年、フリーランスデザイナーが語る「理想の住まい方」',
      summary: '都内のシェアハウスを転々とし、現在は下北沢のクリエイター向け物件に居住するデザイナーに密着。シェアライフの魅力と課題をリアルに語る。',
      category: 'interview',
      source: 'シェアライフマガジン',
      date: formatDate(addDays(today, -1)),
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=500&fit=crop',
      url: 'https://www.hituji.jp/',
      isPopular: false
    },
    {
      id: 14,
      title: '【インタビュー】70歳でシェアハウスに入居した元教師「毎日が修学旅行のよう」',
      summary: '定年退職後、一人暮らしの孤独感からシェアハウス入居を決意した田中さん（70）。若者との交流で生きがいを見つけた体験談。',
      category: 'interview',
      source: 'シニアライフ',
      date: formatDate(addDays(today, -2)),
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=500&fit=crop',
      url: 'https://address.love/',
      isPopular: true
    },
    {
      id: 15,
      title: '【対談】シェアハウス運営者が明かす「選ばれる物件」の条件',
      summary: '入居率95%以上を維持する人気シェアハウス運営者3名が集結。物件選び、コミュニティ作り、トラブル対応のノウハウを惜しみなく公開。',
      category: 'interview',
      source: '不動産オーナーズ',
      date: formatDate(addDays(today, -5)),
      image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=500&fit=crop',
      url: 'https://www.oakhouse.jp/',
      isPopular: false
    }
  ]
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export default app
