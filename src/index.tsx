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
    <title>シェアハウスナビ | 全国のシェアハウス情報ポータル</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        .card-hover {
            transition: all 0.3s ease;
        }
        .card-hover:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        .image-container {
            position: relative;
            overflow: hidden;
        }
        .image-container img {
            transition: transform 0.5s ease;
        }
        .card-hover:hover .image-container img {
            transform: scale(1.1);
        }
        .tag {
            backdrop-filter: blur(10px);
        }
        .loading-skeleton {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
        }
        @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        .hero-gradient {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .fade-in {
            animation: fadeIn 0.6s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- ヘッダー -->
    <header class="hero-gradient text-white">
        <div class="container mx-auto px-4 py-8">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <div class="bg-white/20 p-3 rounded-xl">
                        <i class="fas fa-home text-2xl"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl md:text-3xl font-bold">シェアハウスナビ</h1>
                        <p class="text-white/80 text-sm">全国のシェアハウス情報ポータル</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-white/70 text-sm"><i class="fas fa-calendar-alt mr-1"></i><span id="currentDate"></span></p>
                </div>
            </div>
            
            <!-- 検索バー -->
            <div class="bg-white rounded-2xl p-4 shadow-lg">
                <div class="flex flex-col md:flex-row gap-3">
                    <div class="flex-1 relative">
                        <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input type="text" id="searchInput" placeholder="エリア・キーワードで検索" 
                               class="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-gray-700">
                    </div>
                    <select id="areaSelect" class="px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 outline-none text-gray-700 bg-white">
                        <option value="">全国</option>
                        <option value="tokyo">東京</option>
                        <option value="osaka">大阪</option>
                        <option value="fukuoka">福岡</option>
                        <option value="nagoya">名古屋</option>
                        <option value="hokkaido">北海道</option>
                    </select>
                    <button onclick="searchProperties()" class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity">
                        <i class="fas fa-search mr-2"></i>検索
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- 統計バー -->
    <div class="bg-white border-b">
        <div class="container mx-auto px-4 py-4">
            <div class="flex flex-wrap justify-center gap-8 text-center">
                <div>
                    <p class="text-2xl font-bold text-purple-600" id="totalCount">--</p>
                    <p class="text-gray-500 text-sm">掲載物件数</p>
                </div>
                <div>
                    <p class="text-2xl font-bold text-green-600">¥35,000~</p>
                    <p class="text-gray-500 text-sm">最低賃料</p>
                </div>
                <div>
                    <p class="text-2xl font-bold text-blue-600">47</p>
                    <p class="text-gray-500 text-sm">対応エリア</p>
                </div>
                <div>
                    <p class="text-2xl font-bold text-orange-500">24h</p>
                    <p class="text-gray-500 text-sm">即入居可能</p>
                </div>
            </div>
        </div>
    </div>

    <main class="container mx-auto px-4 py-8">
        <!-- カテゴリタブ -->
        <div class="flex flex-wrap gap-2 mb-8 justify-center">
            <button onclick="filterCategory('all')" class="filter-btn active px-5 py-2.5 rounded-full font-medium bg-purple-600 text-white transition-all" data-category="all">
                <i class="fas fa-th-large mr-2"></i>すべて
            </button>
            <button onclick="filterCategory('new')" class="filter-btn px-5 py-2.5 rounded-full font-medium bg-white text-gray-600 border border-gray-200 hover:border-purple-300 transition-all" data-category="new">
                <i class="fas fa-sparkles mr-2"></i>新着物件
            </button>
            <button onclick="filterCategory('popular')" class="filter-btn px-5 py-2.5 rounded-full font-medium bg-white text-gray-600 border border-gray-200 hover:border-purple-300 transition-all" data-category="popular">
                <i class="fas fa-fire mr-2"></i>人気物件
            </button>
            <button onclick="filterCategory('women')" class="filter-btn px-5 py-2.5 rounded-full font-medium bg-white text-gray-600 border border-gray-200 hover:border-purple-300 transition-all" data-category="women">
                <i class="fas fa-venus mr-2"></i>女性専用
            </button>
            <button onclick="filterCategory('pet')" class="filter-btn px-5 py-2.5 rounded-full font-medium bg-white text-gray-600 border border-gray-200 hover:border-purple-300 transition-all" data-category="pet">
                <i class="fas fa-paw mr-2"></i>ペット可
            </button>
            <button onclick="filterCategory('luxury')" class="filter-btn px-5 py-2.5 rounded-full font-medium bg-white text-gray-600 border border-gray-200 hover:border-purple-300 transition-all" data-category="luxury">
                <i class="fas fa-crown mr-2"></i>高級物件
            </button>
        </div>

        <!-- ローディング -->
        <div id="loading" class="hidden">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="bg-white rounded-2xl overflow-hidden shadow-md">
                    <div class="loading-skeleton h-48"></div>
                    <div class="p-5">
                        <div class="loading-skeleton h-6 w-3/4 rounded mb-3"></div>
                        <div class="loading-skeleton h-4 w-1/2 rounded mb-2"></div>
                        <div class="loading-skeleton h-4 w-full rounded"></div>
                    </div>
                </div>
                <div class="bg-white rounded-2xl overflow-hidden shadow-md">
                    <div class="loading-skeleton h-48"></div>
                    <div class="p-5">
                        <div class="loading-skeleton h-6 w-3/4 rounded mb-3"></div>
                        <div class="loading-skeleton h-4 w-1/2 rounded mb-2"></div>
                        <div class="loading-skeleton h-4 w-full rounded"></div>
                    </div>
                </div>
                <div class="bg-white rounded-2xl overflow-hidden shadow-md">
                    <div class="loading-skeleton h-48"></div>
                    <div class="p-5">
                        <div class="loading-skeleton h-6 w-3/4 rounded mb-3"></div>
                        <div class="loading-skeleton h-4 w-1/2 rounded mb-2"></div>
                        <div class="loading-skeleton h-4 w-full rounded"></div>
                    </div>
                </div>
                <div class="bg-white rounded-2xl overflow-hidden shadow-md hidden md:block">
                    <div class="loading-skeleton h-48"></div>
                    <div class="p-5">
                        <div class="loading-skeleton h-6 w-3/4 rounded mb-3"></div>
                        <div class="loading-skeleton h-4 w-1/2 rounded mb-2"></div>
                        <div class="loading-skeleton h-4 w-full rounded"></div>
                    </div>
                </div>
                <div class="bg-white rounded-2xl overflow-hidden shadow-md hidden md:block">
                    <div class="loading-skeleton h-48"></div>
                    <div class="p-5">
                        <div class="loading-skeleton h-6 w-3/4 rounded mb-3"></div>
                        <div class="loading-skeleton h-4 w-1/2 rounded mb-2"></div>
                        <div class="loading-skeleton h-4 w-full rounded"></div>
                    </div>
                </div>
                <div class="bg-white rounded-2xl overflow-hidden shadow-md hidden lg:block">
                    <div class="loading-skeleton h-48"></div>
                    <div class="p-5">
                        <div class="loading-skeleton h-6 w-3/4 rounded mb-3"></div>
                        <div class="loading-skeleton h-4 w-1/2 rounded mb-2"></div>
                        <div class="loading-skeleton h-4 w-full rounded"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 物件一覧 -->
        <div id="propertyList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        </div>

        <!-- もっと見るボタン -->
        <div class="text-center mt-10">
            <button onclick="loadMore()" class="bg-white text-purple-600 border-2 border-purple-600 px-8 py-3 rounded-full font-medium hover:bg-purple-600 hover:text-white transition-all">
                <i class="fas fa-plus mr-2"></i>もっと見る
            </button>
        </div>
    </main>

    <!-- フッター -->
    <footer class="bg-gray-800 text-white py-12 mt-12">
        <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                    <div class="flex items-center gap-2 mb-4">
                        <i class="fas fa-home text-purple-400 text-xl"></i>
                        <span class="font-bold text-lg">シェアハウスナビ</span>
                    </div>
                    <p class="text-gray-400 text-sm">全国のシェアハウス情報を毎日更新。あなたにぴったりの住まいが見つかります。</p>
                </div>
                <div>
                    <h4 class="font-bold mb-4">エリアから探す</h4>
                    <ul class="space-y-2 text-gray-400 text-sm">
                        <li><a href="#" class="hover:text-white">東京のシェアハウス</a></li>
                        <li><a href="#" class="hover:text-white">大阪のシェアハウス</a></li>
                        <li><a href="#" class="hover:text-white">福岡のシェアハウス</a></li>
                        <li><a href="#" class="hover:text-white">名古屋のシェアハウス</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4">特集から探す</h4>
                    <ul class="space-y-2 text-gray-400 text-sm">
                        <li><a href="#" class="hover:text-white">女性専用物件</a></li>
                        <li><a href="#" class="hover:text-white">ペット可物件</a></li>
                        <li><a href="#" class="hover:text-white">個室タイプ</a></li>
                        <li><a href="#" class="hover:text-white">即入居可能</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4">お役立ち情報</h4>
                    <ul class="space-y-2 text-gray-400 text-sm">
                        <li><a href="#" class="hover:text-white">シェアハウスとは</a></li>
                        <li><a href="#" class="hover:text-white">入居までの流れ</a></li>
                        <li><a href="#" class="hover:text-white">よくある質問</a></li>
                        <li><a href="#" class="hover:text-white">生活のコツ</a></li>
                    </ul>
                </div>
            </div>
            <div class="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
                <p>© 2026 シェアハウスナビ All Rights Reserved.</p>
            </div>
        </div>
    </footer>

    <script>
        // 現在の日付
        document.getElementById('currentDate').textContent = new Date().toLocaleDateString('ja-JP', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        let allProperties = [];
        let currentCategory = 'all';

        // 物件カードを生成
        function createPropertyCard(property, index) {
            const delay = index * 100;
            const tags = property.tags || [];
            
            return \`
                <article class="card-hover bg-white rounded-2xl overflow-hidden shadow-md fade-in" style="animation-delay: \${delay}ms">
                    <a href="\${property.url}" target="_blank" rel="noopener noreferrer" class="block">
                        <div class="image-container relative h-52">
                            <img src="\${property.image}" alt="\${property.name}" 
                                 class="w-full h-full object-cover"
                                 onerror="this.src='https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'">
                            <div class="absolute top-3 left-3 flex flex-wrap gap-2">
                                \${property.isNew ? '<span class="tag bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium">NEW</span>' : ''}
                                \${property.isPopular ? '<span class="tag bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium">人気</span>' : ''}
                            </div>
                            <div class="absolute bottom-3 right-3">
                                <span class="tag bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                                    <i class="fas fa-yen-sign mr-1"></i>\${property.rent.toLocaleString()}~/月
                                </span>
                            </div>
                        </div>
                        <div class="p-5">
                            <div class="flex items-start justify-between mb-2">
                                <h3 class="font-bold text-gray-800 text-lg leading-tight flex-1">\${property.name}</h3>
                            </div>
                            <p class="text-gray-500 text-sm mb-3">
                                <i class="fas fa-map-marker-alt text-purple-500 mr-1"></i>
                                \${property.location}
                            </p>
                            <p class="text-gray-600 text-sm mb-4 line-clamp-2">\${property.description}</p>
                            <div class="flex flex-wrap gap-2 mb-4">
                                \${tags.map(tag => \`
                                    <span class="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">\${tag}</span>
                                \`).join('')}
                            </div>
                            <div class="flex items-center justify-between text-sm text-gray-400 border-t pt-3">
                                <span><i class="fas fa-door-open mr-1"></i>\${property.rooms}室</span>
                                <span><i class="fas fa-users mr-1"></i>\${property.capacity}名</span>
                                <span><i class="fas fa-train mr-1"></i>\${property.station}</span>
                            </div>
                        </div>
                    </a>
                </article>
            \`;
        }

        // 物件を表示
        function displayProperties(properties) {
            const container = document.getElementById('propertyList');
            
            if (!properties || properties.length === 0) {
                container.innerHTML = \`
                    <div class="col-span-full text-center py-16">
                        <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
                        <p class="text-gray-500">該当する物件が見つかりませんでした</p>
                    </div>
                \`;
                return;
            }

            const filtered = currentCategory === 'all' 
                ? properties 
                : properties.filter(p => p.category === currentCategory);

            document.getElementById('totalCount').textContent = filtered.length;
            container.innerHTML = filtered.map((p, i) => createPropertyCard(p, i)).join('');
        }

        // カテゴリフィルター
        function filterCategory(category) {
            currentCategory = category;
            
            document.querySelectorAll('.filter-btn').forEach(btn => {
                if (btn.dataset.category === category) {
                    btn.classList.remove('bg-white', 'text-gray-600', 'border', 'border-gray-200');
                    btn.classList.add('bg-purple-600', 'text-white');
                } else {
                    btn.classList.remove('bg-purple-600', 'text-white');
                    btn.classList.add('bg-white', 'text-gray-600', 'border', 'border-gray-200');
                }
            });

            displayProperties(allProperties);
        }

        // 検索
        function searchProperties() {
            const keyword = document.getElementById('searchInput').value.toLowerCase();
            const area = document.getElementById('areaSelect').value;
            
            let filtered = allProperties;
            
            if (keyword) {
                filtered = filtered.filter(p => 
                    p.name.toLowerCase().includes(keyword) || 
                    p.location.toLowerCase().includes(keyword) ||
                    p.description.toLowerCase().includes(keyword)
                );
            }
            
            if (area) {
                filtered = filtered.filter(p => p.area === area);
            }
            
            displayProperties(filtered);
        }

        // データ取得
        async function fetchProperties() {
            const loading = document.getElementById('loading');
            const container = document.getElementById('propertyList');
            
            loading.classList.remove('hidden');
            container.innerHTML = '';

            try {
                const response = await fetch('/api/properties');
                const data = await response.json();
                allProperties = data.properties || [];
                
                document.getElementById('totalCount').textContent = allProperties.length;
                displayProperties(allProperties);
            } catch (err) {
                console.error('Error:', err);
                container.innerHTML = \`
                    <div class="col-span-full text-center py-16">
                        <i class="fas fa-exclamation-circle text-6xl text-red-300 mb-4"></i>
                        <p class="text-gray-500">データの取得に失敗しました</p>
                    </div>
                \`;
            } finally {
                loading.classList.add('hidden');
            }
        }

        // もっと見る（デモ用）
        function loadMore() {
            alert('実際のサービスでは、より多くの物件が読み込まれます');
        }

        // 初期化
        document.addEventListener('DOMContentLoaded', fetchProperties);
        
        // Enter キーで検索
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchProperties();
        });
    </script>
</body>
</html>
  `)
})

// API: 物件データを取得
app.get('/api/properties', async (c) => {
  const properties = generateProperties()
  return c.json({
    success: true,
    properties: properties,
    total: properties.length,
    lastUpdated: new Date().toISOString()
  })
})

// 物件データを生成
function generateProperties() {
  return [
    {
      id: 1,
      name: 'SOCIAL RESIDENCE 渋谷',
      location: '東京都渋谷区神南1丁目',
      area: 'tokyo',
      station: '渋谷駅 徒歩8分',
      rent: 65000,
      rooms: 80,
      capacity: 120,
      description: '渋谷駅徒歩8分の好立地。コワーキングスペース、ジム、シアタールーム完備。若いクリエイターやIT系の入居者が多く、刺激的なコミュニティが魅力。',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
      url: 'https://www.social-apartment.com/',
      tags: ['個室', 'Wi-Fi無料', 'ジム', 'コワーキング'],
      category: 'popular',
      isNew: false,
      isPopular: true
    },
    {
      id: 2,
      name: 'オークハウス目黒',
      location: '東京都目黒区目黒2丁目',
      area: 'tokyo',
      station: '目黒駅 徒歩5分',
      rent: 72000,
      rooms: 45,
      capacity: 60,
      description: '目黒駅から徒歩5分、閑静な住宅街に位置する落ち着いた雰囲気のシェアハウス。広々としたキッチンとリビングが自慢。',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop',
      url: 'https://www.oakhouse.jp/',
      tags: ['個室', 'オートロック', '駅近', '家具付き'],
      category: 'new',
      isNew: true,
      isPopular: false
    },
    {
      id: 3,
      name: 'シェアプレイス田園調布',
      location: '東京都大田区田園調布3丁目',
      area: 'tokyo',
      station: '田園調布駅 徒歩10分',
      rent: 85000,
      rooms: 30,
      capacity: 35,
      description: '高級住宅街・田園調布に位置するハイグレードシェアハウス。広い個室とホテルライクな共用部が特徴。',
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
      url: 'https://www.hituji.jp/',
      tags: ['高級', '広い個室', '防音', 'ラウンジ'],
      category: 'luxury',
      isNew: true,
      isPopular: true
    },
    {
      id: 4,
      name: 'SHARE HOUSE 福岡天神',
      location: '福岡県福岡市中央区天神2丁目',
      area: 'fukuoka',
      station: '天神駅 徒歩3分',
      rent: 42000,
      rooms: 50,
      capacity: 65,
      description: '天神駅徒歩3分の好アクセス。屋上テラスからは福岡の夜景が一望できます。国際色豊かな入居者と交流できます。',
      image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop',
      url: 'https://www.oakhouse.jp/',
      tags: ['駅近', '屋上テラス', '国際交流', '格安'],
      category: 'popular',
      isNew: false,
      isPopular: true
    },
    {
      id: 5,
      name: 'レディースシェア新宿',
      location: '東京都新宿区西新宿5丁目',
      area: 'tokyo',
      station: '西新宿駅 徒歩6分',
      rent: 58000,
      rooms: 35,
      capacity: 40,
      description: '女性専用のセキュリティ重視物件。オートロック、防犯カメラ、管理人常駐で安心。パウダールーム完備。',
      image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600&h=400&fit=crop',
      url: 'https://www.share-apartment.com/',
      tags: ['女性専用', 'オートロック', '管理人常駐', 'パウダールーム'],
      category: 'women',
      isNew: true,
      isPopular: false
    },
    {
      id: 6,
      name: 'ペットと暮らすシェアハウス中野',
      location: '東京都中野区中野3丁目',
      area: 'tokyo',
      station: '中野駅 徒歩7分',
      rent: 68000,
      rooms: 25,
      capacity: 30,
      description: '愛犬・愛猫と一緒に暮らせる貴重な物件。専用ドッグラン、猫部屋完備。ペット好きの仲間と出会えます。',
      image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop',
      url: 'https://www.hituji.jp/comret/search/pet',
      tags: ['ペット可', 'ドッグラン', '猫部屋', 'ペットシッター'],
      category: 'pet',
      isNew: false,
      isPopular: true
    },
    {
      id: 7,
      name: 'CROSS HOUSE 大阪梅田',
      location: '大阪府大阪市北区梅田1丁目',
      area: 'osaka',
      station: '梅田駅 徒歩5分',
      rent: 48000,
      rooms: 60,
      capacity: 80,
      description: '大阪の中心・梅田駅徒歩5分。仕事にもプライベートにも便利な立地。ビジネスパーソンに人気の物件。',
      image: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600&h=400&fit=crop',
      url: 'https://www.hituji.jp/comret/info/osaka',
      tags: ['駅近', 'ビジネス向け', 'Wi-Fi高速', '会議室'],
      category: 'popular',
      isNew: false,
      isPopular: true
    },
    {
      id: 8,
      name: 'ADDress 鎌倉邸',
      location: '神奈川県鎌倉市長谷2丁目',
      area: 'tokyo',
      station: '長谷駅 徒歩8分',
      rent: 55000,
      rooms: 15,
      capacity: 20,
      description: '古都・鎌倉で暮らす贅沢。海も山も徒歩圏内。リモートワーカーに人気の多拠点生活対応物件。',
      image: 'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=600&h=400&fit=crop',
      url: 'https://address.love/',
      tags: ['多拠点', '海近', '古民家風', 'リモートワーク'],
      category: 'new',
      isNew: true,
      isPopular: false
    },
    {
      id: 9,
      name: 'グローバルシェアハウス池袋',
      location: '東京都豊島区池袋2丁目',
      area: 'tokyo',
      station: '池袋駅 徒歩10分',
      rent: 52000,
      rooms: 70,
      capacity: 90,
      description: '20カ国以上からの入居者が暮らす国際色豊かなシェアハウス。毎週開催の国際交流イベントが好評。',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
      url: 'https://tokyosharehouse.com/',
      tags: ['国際交流', '語学', 'イベント多数', 'キッチン広い'],
      category: 'popular',
      isNew: false,
      isPopular: true
    },
    {
      id: 10,
      name: 'エコシェアハウス世田谷',
      location: '東京都世田谷区三軒茶屋1丁目',
      area: 'tokyo',
      station: '三軒茶屋駅 徒歩12分',
      rent: 60000,
      rooms: 20,
      capacity: 25,
      description: '太陽光発電、雨水利用、コンポストなど環境に配慮した設備を完備。サステナブルな暮らしを実践できます。',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop',
      url: 'https://www.social-apartment.com/',
      tags: ['エコ', '太陽光発電', '菜園', 'サステナブル'],
      category: 'new',
      isNew: true,
      isPopular: false
    },
    {
      id: 11,
      name: 'アーティストシェア下北沢',
      location: '東京都世田谷区北沢2丁目',
      area: 'tokyo',
      station: '下北沢駅 徒歩5分',
      rent: 62000,
      rooms: 25,
      capacity: 30,
      description: '音楽スタジオ、アトリエ完備のクリエイター向けシェアハウス。夢を追う仲間と刺激し合える環境。',
      image: 'https://images.unsplash.com/photo-1598928506311-c55ez5e0a4f?w=600&h=400&fit=crop',
      url: 'https://www.hituji.jp/',
      tags: ['音楽スタジオ', 'アトリエ', 'クリエイター', '防音'],
      category: 'popular',
      isNew: false,
      isPopular: true
    },
    {
      id: 12,
      name: 'シニアフレンドリーシェア吉祥寺',
      location: '東京都武蔵野市吉祥寺本町2丁目',
      area: 'tokyo',
      station: '吉祥寺駅 徒歩8分',
      rent: 70000,
      rooms: 30,
      capacity: 35,
      description: '多世代交流型のシェアハウス。バリアフリー設計で、若者からシニアまで幅広い世代が共に暮らしています。',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop',
      url: 'https://address.love/',
      tags: ['多世代交流', 'バリアフリー', '緑豊か', '見守り'],
      category: 'new',
      isNew: true,
      isPopular: false
    }
  ]
}

export default app
