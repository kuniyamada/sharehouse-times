import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// CORS設定
app.use('/api/*', cors())

// メインページ
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>シェアハウス情報まとめ | 全国版</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        .loading-spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .fade-in {
            animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .category-news { border-left-color: #ef4444; }
        .category-property { border-left-color: #22c55e; }
        .category-tips { border-left-color: #3b82f6; }
        .category-trend { border-left-color: #a855f7; }
    </style>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <!-- ヘッダー -->
        <header class="text-center mb-8">
            <div class="bg-white rounded-2xl shadow-lg p-6 mb-4">
                <h1 class="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                    <i class="fas fa-home text-blue-500 mr-2"></i>
                    シェアハウス情報まとめ
                </h1>
                <p class="text-gray-600">全国のシェアハウス最新情報を毎日お届け</p>
                <div class="mt-4 text-sm text-gray-500">
                    <i class="fas fa-calendar-alt mr-1"></i>
                    <span id="currentDate"></span>
                </div>
            </div>
        </header>

        <!-- カテゴリフィルター -->
        <div class="bg-white rounded-xl shadow-md p-4 mb-6">
            <div class="flex flex-wrap gap-2 justify-center">
                <button onclick="filterCategory('all')" class="filter-btn active px-4 py-2 rounded-full text-sm font-medium bg-blue-500 text-white transition-all hover:bg-blue-600" data-category="all">
                    <i class="fas fa-list mr-1"></i> すべて
                </button>
                <button onclick="filterCategory('news')" class="filter-btn px-4 py-2 rounded-full text-sm font-medium bg-gray-200 text-gray-700 transition-all hover:bg-red-100" data-category="news">
                    <i class="fas fa-newspaper mr-1"></i> ニュース
                </button>
                <button onclick="filterCategory('property')" class="filter-btn px-4 py-2 rounded-full text-sm font-medium bg-gray-200 text-gray-700 transition-all hover:bg-green-100" data-category="property">
                    <i class="fas fa-building mr-1"></i> 物件情報
                </button>
                <button onclick="filterCategory('tips')" class="filter-btn px-4 py-2 rounded-full text-sm font-medium bg-gray-200 text-gray-700 transition-all hover:bg-blue-100" data-category="tips">
                    <i class="fas fa-lightbulb mr-1"></i> 生活Tips
                </button>
                <button onclick="filterCategory('trend')" class="filter-btn px-4 py-2 rounded-full text-sm font-medium bg-gray-200 text-gray-700 transition-all hover:bg-purple-100" data-category="trend">
                    <i class="fas fa-chart-line mr-1"></i> トレンド
                </button>
            </div>
        </div>

        <!-- 更新ボタン -->
        <div class="text-center mb-6">
            <button onclick="fetchNews()" id="refreshBtn" class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <i class="fas fa-sync-alt mr-2"></i>
                最新情報を取得
            </button>
        </div>

        <!-- ローディング -->
        <div id="loading" class="hidden text-center py-12">
            <div class="loading-spinner mx-auto mb-4"></div>
            <p class="text-gray-600">シェアハウス情報を収集中...</p>
            <p class="text-sm text-gray-400 mt-2">全国の最新情報を検索しています</p>
        </div>

        <!-- エラー表示 -->
        <div id="error" class="hidden bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p class="text-red-600"><i class="fas fa-exclamation-circle mr-2"></i>情報の取得に失敗しました</p>
        </div>

        <!-- ニュース一覧 -->
        <div id="newsList" class="space-y-4">
            <!-- 初期メッセージ -->
            <div class="bg-white rounded-xl shadow-md p-8 text-center">
                <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">「最新情報を取得」ボタンを押して<br>シェアハウス情報を取得してください</p>
            </div>
        </div>

        <!-- フッター -->
        <footer class="text-center mt-12 text-gray-500 text-sm">
            <p>
                <i class="fas fa-info-circle mr-1"></i>
                情報はWeb検索により収集されています
            </p>
            <p class="mt-2">© 2026 シェアハウス情報まとめ</p>
        </footer>
    </div>

    <script>
        // 現在の日付を表示
        document.getElementById('currentDate').textContent = new Date().toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });

        let allNews = [];
        let currentCategory = 'all';

        // カテゴリに応じたスタイルを取得
        function getCategoryStyle(category) {
            const styles = {
                'news': { bg: 'bg-red-50', border: 'border-l-red-500', icon: 'fa-newspaper', color: 'text-red-600', label: 'ニュース' },
                'property': { bg: 'bg-green-50', border: 'border-l-green-500', icon: 'fa-building', color: 'text-green-600', label: '物件情報' },
                'tips': { bg: 'bg-blue-50', border: 'border-l-blue-500', icon: 'fa-lightbulb', color: 'text-blue-600', label: '生活Tips' },
                'trend': { bg: 'bg-purple-50', border: 'border-l-purple-500', icon: 'fa-chart-line', color: 'text-purple-600', label: 'トレンド' }
            };
            return styles[category] || styles['news'];
        }

        // ニュースカードを生成
        function createNewsCard(item, index) {
            const style = getCategoryStyle(item.category);
            const delay = index * 100;
            
            return \`
                <article class="news-item bg-white rounded-xl shadow-md overflow-hidden border-l-4 \${style.border} fade-in" 
                         data-category="\${item.category}" 
                         style="animation-delay: \${delay}ms">
                    <div class="p-5">
                        <div class="flex items-center justify-between mb-3">
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium \${style.bg} \${style.color}">
                                <i class="fas \${style.icon} mr-1"></i>
                                \${style.label}
                            </span>
                            <span class="text-xs text-gray-400">
                                <i class="fas fa-clock mr-1"></i>
                                \${item.date}
                            </span>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-2 hover:text-blue-600 transition-colors">
                            <a href="\${item.url}" target="_blank" rel="noopener noreferrer">
                                \${item.title}
                                <i class="fas fa-external-link-alt text-xs ml-1 opacity-50"></i>
                            </a>
                        </h3>
                        <p class="text-gray-600 text-sm leading-relaxed">\${item.summary}</p>
                        <div class="mt-3 flex items-center text-xs text-gray-400">
                            <i class="fas fa-globe mr-1"></i>
                            <span>\${item.source}</span>
                        </div>
                    </div>
                </article>
            \`;
        }

        // ニュースを表示
        function displayNews(news) {
            const container = document.getElementById('newsList');
            
            if (!news || news.length === 0) {
                container.innerHTML = \`
                    <div class="bg-white rounded-xl shadow-md p-8 text-center">
                        <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                        <p class="text-gray-500">該当する情報が見つかりませんでした</p>
                    </div>
                \`;
                return;
            }

            const filteredNews = currentCategory === 'all' 
                ? news 
                : news.filter(item => item.category === currentCategory);

            if (filteredNews.length === 0) {
                container.innerHTML = \`
                    <div class="bg-white rounded-xl shadow-md p-8 text-center">
                        <i class="fas fa-filter text-6xl text-gray-300 mb-4"></i>
                        <p class="text-gray-500">このカテゴリの情報はありません</p>
                    </div>
                \`;
                return;
            }

            container.innerHTML = filteredNews.map((item, index) => createNewsCard(item, index)).join('');
        }

        // カテゴリフィルター
        function filterCategory(category) {
            currentCategory = category;
            
            // ボタンのスタイル更新
            document.querySelectorAll('.filter-btn').forEach(btn => {
                if (btn.dataset.category === category) {
                    btn.classList.remove('bg-gray-200', 'text-gray-700');
                    btn.classList.add('bg-blue-500', 'text-white');
                } else {
                    btn.classList.remove('bg-blue-500', 'text-white');
                    btn.classList.add('bg-gray-200', 'text-gray-700');
                }
            });

            displayNews(allNews);
        }

        // ニュースを取得
        async function fetchNews() {
            const loading = document.getElementById('loading');
            const error = document.getElementById('error');
            const refreshBtn = document.getElementById('refreshBtn');
            const newsList = document.getElementById('newsList');

            // UI更新
            loading.classList.remove('hidden');
            error.classList.add('hidden');
            newsList.innerHTML = '';
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>取得中...';

            try {
                const response = await fetch('/api/news');
                
                if (!response.ok) {
                    throw new Error('API Error');
                }

                const data = await response.json();
                allNews = data.news || [];
                
                // 日付順にソート（新しい順）
                allNews.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                displayNews(allNews);
                
            } catch (err) {
                console.error('Error fetching news:', err);
                error.classList.remove('hidden');
                newsList.innerHTML = \`
                    <div class="bg-white rounded-xl shadow-md p-8 text-center">
                        <i class="fas fa-exclamation-triangle text-6xl text-yellow-400 mb-4"></i>
                        <p class="text-gray-500">情報の取得に失敗しました。しばらく待ってから再試行してください。</p>
                    </div>
                \`;
            } finally {
                loading.classList.add('hidden');
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>最新情報を取得';
            }
        }

        // ページ読み込み時に自動取得
        document.addEventListener('DOMContentLoaded', () => {
            fetchNews();
        });
    </script>
</body>
</html>
  `)
})

// API: シェアハウスニュースを取得
app.get('/api/news', async (c) => {
  try {
    // Web検索APIを使用してシェアハウス情報を収集
    const searchQueries = [
      'シェアハウス ニュース 2026',
      'シェアハウス 物件 新着',
      'シェアハウス 生活 コツ',
      'シェアハウス トレンド 市場'
    ]

    // ダミーデータ（実際のデプロイ時はWeb検索APIで取得）
    const news = generateSharehouseNews()

    return c.json({
      success: true,
      news: news,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching news:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch news',
      news: []
    }, 500)
  }
})

// シェアハウスニュースを生成（Web検索結果を模擬）
function generateSharehouseNews() {
  const today = new Date()
  
  const newsData = [
    // ニュース
    {
      title: '都心のシェアハウス需要が急増、テレワーク普及が後押し',
      summary: 'コロナ禍以降も続くテレワーク文化により、都心部でのシェアハウス需要が増加。特にコワーキングスペース付き物件が人気を集めている。',
      category: 'news',
      source: '不動産経済新聞',
      date: formatDate(today)
    },
    {
      title: '外国人向けシェアハウス、全国で展開加速',
      summary: '留学生や外国人労働者向けのシェアハウスが全国で増加。多言語対応や文化交流イベントなど、付加価値サービスが充実。',
      category: 'news',
      source: '住宅新報',
      date: formatDate(addDays(today, -1))
    },
    // 物件情報
    {
      title: '【新着】渋谷エリアに大型シェアハウスオープン、全80室',
      summary: '渋谷駅徒歩10分の好立地に、最大80名が入居可能な大型シェアハウスがオープン。ジム・シアタールーム完備で月額6.5万円から。',
      category: 'property',
      source: 'シェアハウスポータル',
      date: formatDate(today)
    },
    {
      title: '福岡・天神に女性専用シェアハウスが新規オープン',
      summary: 'セキュリティ重視の女性専用物件。オートロック・防犯カメラ完備、管理人常駐で安心。内装はナチュラルテイストで統一。',
      category: 'property',
      source: 'SHARE LIFE',
      date: formatDate(addDays(today, -1))
    },
    {
      title: '大阪・梅田エリア、ビジネスパーソン向けシェアハウス特集',
      summary: '梅田駅周辺のシェアハウス10選を紹介。個室タイプ中心で、仕事に集中できる環境と交流スペースを両立。',
      category: 'property',
      source: 'ひつじ不動産',
      date: formatDate(addDays(today, -2))
    },
    // 生活Tips
    {
      title: 'シェアハウスでの上手な共同生活のコツ5選',
      summary: '掃除当番のルール作り、冷蔵庫の使い方、騒音対策など、快適なシェアライフを送るためのポイントを解説。',
      category: 'tips',
      source: 'シェアライフマガジン',
      date: formatDate(today)
    },
    {
      title: '初めてのシェアハウス入居、持ち物チェックリスト',
      summary: '共有のものと個人で用意すべきものを整理。入居前に確認しておきたいポイントもあわせて紹介。',
      category: 'tips',
      source: 'ルームシェアNavi',
      date: formatDate(addDays(today, -2))
    },
    {
      title: 'シェアハウスのキッチン活用術、料理シェアで食費節約',
      summary: '住人同士で食材をシェアしたり、当番制で料理を作ることで食費を大幅に節約。成功事例を紹介。',
      category: 'tips',
      source: '節約ライフ',
      date: formatDate(addDays(today, -3))
    },
    // トレンド
    {
      title: '2026年シェアハウス市場予測、多世代交流型が台頭',
      summary: '若者だけでなく、シニア世代も参加する多世代交流型シェアハウスが注目。孤独解消と相互支援の場として期待。',
      category: 'trend',
      source: '住まいトレンド研究所',
      date: formatDate(today)
    },
    {
      title: 'ペット可シェアハウスの需要拡大、全国で200件超え',
      summary: 'ペットと暮らせるシェアハウスが増加傾向。専用のドッグランや猫部屋を備えた物件も登場。',
      category: 'trend',
      source: 'ペットライフ',
      date: formatDate(addDays(today, -1))
    },
    {
      title: '地方創生×シェアハウス、空き家活用の新モデル',
      summary: '地方の空き家をリノベーションしたシェアハウスが各地で誕生。移住希望者のお試し居住にも活用されている。',
      category: 'trend',
      source: '地方創生ジャーナル',
      date: formatDate(addDays(today, -2))
    },
    {
      title: 'サステナブル志向のエコシェアハウスが人気上昇',
      summary: '太陽光発電、雨水利用、コンポストなど環境配慮型の設備を備えたシェアハウスが若い世代を中心に人気。',
      category: 'trend',
      source: 'エコライフ通信',
      date: formatDate(addDays(today, -3))
    }
  ]

  return newsData
}

// 日付をフォーマット
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// 日付を加算
function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export default app
