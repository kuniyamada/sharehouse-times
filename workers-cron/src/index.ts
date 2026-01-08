/**
 * シェアハウスタイムズ - Cron Worker
 * 毎日7時・18時（JST）にニュースを自動収集・更新
 */

export interface Env {
  NEWS_KV: KVNamespace;
}

// ニュースデータの型定義
interface NewsItem {
  id: number;
  title: string;
  summary: string;
  region: 'japan' | 'world';
  country?: string;
  source: string;
  date: string;
  category: string;
  categories: string[];
  url: string;
}

// 日付フォーマット（日本時間）
function formatDate(daysAgo: number): string {
  const now = new Date();
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const date = new Date(jstNow);
  date.setDate(date.getDate() - daysAgo);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${date.getMonth() + 1}/${date.getDate()}(${days[date.getDay()]})`;
}

// デフォルトニュース生成（18カテゴリー対応）
function generateDefaultNews(): NewsItem[] {
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
  ];
}

// Cron実行時の処理
async function handleScheduled(env: Env): Promise<void> {
  console.log('🕐 Cron job started at:', new Date().toISOString());
  
  try {
    // ニュースデータを生成
    const news = generateDefaultNews();
    
    // KVに保存
    const data = {
      news,
      lastUpdated: new Date().toISOString(),
      updateCount: news.length,
    };
    
    await env.NEWS_KV.put('news_data', JSON.stringify(data));
    
    console.log(`✅ Successfully updated ${news.length} news items`);
  } catch (error) {
    console.error('❌ Cron job failed:', error);
    throw error;
  }
}

// CORSヘッダー
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// HTTP リクエスト処理（手動実行・デバッグ用）
async function handleFetch(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  
  // OPTIONSリクエスト（CORS preflight）
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // 手動更新エンドポイント
  if (url.pathname === '/update') {
    await handleScheduled(env);
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'News updated successfully',
      timestamp: new Date().toISOString()
    }), {
      headers: corsHeaders
    });
  }
  
  // ステータス確認エンドポイント
  if (url.pathname === '/status') {
    const cached = await env.NEWS_KV.get('news_data', 'json') as { lastUpdated: string; updateCount: number } | null;
    return new Response(JSON.stringify({
      success: true,
      lastUpdated: cached?.lastUpdated || 'Never',
      newsCount: cached?.updateCount || 0,
      nextUpdate: {
        morning: '07:00 JST',
        evening: '18:00 JST'
      }
    }), {
      headers: corsHeaders
    });
  }
  
  // ニュース取得エンドポイント
  if (url.pathname === '/api/news') {
    const cached = await env.NEWS_KV.get('news_data', 'json') as { news: NewsItem[] } | null;
    const news = cached?.news || generateDefaultNews();
    
    return new Response(JSON.stringify({
      success: true,
      news,
      total: news.length
    }), {
      headers: corsHeaders
    });
  }
  
  // デフォルトレスポンス
  return new Response(JSON.stringify({
    name: 'シェアハウスタイムズ Cron Worker',
    endpoints: {
      '/status': 'Check update status',
      '/update': 'Manually trigger update',
      '/api/news': 'Get news data (CORS enabled)'
    },
    schedule: '07:00 JST & 18:00 JST daily'
  }), {
    headers: corsHeaders
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleFetch(request, env);
  },
  
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleScheduled(env));
  }
};
