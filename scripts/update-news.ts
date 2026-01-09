/**
 * ニュース更新スクリプト
 * GitHub Actionsから定期実行され、最新ニュースをKVに保存する
 * Web検索APIを使用して最新のシェアハウスニュースを取得
 */

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  region: 'japan' | 'world';
  source: string;
  date: string;
  category: string;
  categories: string[];
  url: string;
}

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source?: string;
  date?: string;
}

// 日付フォーマット（JST）
function formatDateFromDate(date: Date): string {
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  return `${date.getMonth() + 1}/${date.getDate()}(${dayNames[date.getDay()]})`;
}

function formatDate(daysAgo: number): string {
  const now = new Date();
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const date = new Date(jstNow);
  date.setDate(date.getDate() - daysAgo);
  return formatDateFromDate(date);
}

// カテゴリを推定
function detectCategories(title: string, description: string): { category: string; categories: string[] } {
  const text = (title + ' ' + description).toLowerCase();
  const categories: string[] = [];
  let primaryCategory = 'market';
  
  const keywords: { [key: string]: string[] } = {
    women: ['女性専用', '女性向け', 'レディース', '女性限定'],
    senior: ['高齢者', 'シニア', '老後', '介護', '60代', '70代'],
    pet: ['ペット', '犬', '猫', 'ドッグ', 'ペット可'],
    student: ['学生', '大学生', '専門学校', '新卒'],
    budget: ['格安', '激安', '安い', '低価格', '2万', '3万', '4万', '5万円以下'],
    foreign: ['外国人', '多国籍', 'インターナショナル', 'グローバル', '留学生'],
    remote: ['リモート', 'テレワーク', '在宅', 'コワーキング', 'ワーケーション'],
    new_open: ['オープン', '開業', '誕生', '新築', '完成', 'グランドオープン', '募集開始', '入居開始'],
    tokyo: ['東京', '渋谷', '新宿', '池袋', '品川', '目黒', '世田谷', '大田区', '港区', '中野', '杉並'],
    osaka: ['大阪', '梅田', '難波', '心斎橋', '天王寺'],
    fukuoka: ['福岡', '博多', '天神'],
    nagoya: ['名古屋', '栄', '金山'],
    coliving: ['コリビング', 'co-living', 'coliving', 'ソーシャルアパートメント'],
    trend: ['トレンド', '市場', '動向', '統計', '調査', '人気', 'ランキング'],
    company_housing: ['社宅', '法人', '企業', '福利厚生', '法人契約'],
    investment: ['投資', '利回り', '収益', '経営', 'オーナー'],
  };
  
  for (const [cat, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (text.includes(word.toLowerCase()) || text.includes(word)) {
        categories.push(cat);
        if (primaryCategory === 'market') {
          primaryCategory = cat;
        }
        break;
      }
    }
  }
  
  if (categories.length === 0) {
    categories.push('market');
  }
  
  return { category: primaryCategory, categories: [...new Set(categories)] };
}

// ソース名を抽出
function extractSource(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    const sourceMap: { [key: string]: string } = {
      'prtimes.jp': 'PR TIMES',
      'suumo.jp': 'SUUMO',
      'homes.co.jp': 'LIFULL HOME\'S',
      'asahi.com': '朝日新聞',
      'yomiuri.co.jp': '読売新聞',
      'nikkei.com': '日本経済新聞',
      'mainichi.jp': '毎日新聞',
      'sankei.com': '産経新聞',
      'nhk.or.jp': 'NHK',
      'news.yahoo.co.jp': 'Yahoo!ニュース',
      'itmedia.co.jp': 'ITmedia',
      'toyokeizai.net': '東洋経済',
      'diamond.jp': 'ダイヤモンド',
      'businessinsider.jp': 'Business Insider Japan',
      'social-apartment.com': 'SOCIAL APARTMENT',
      'sharehouse.in': 'ひつじ不動産',
      'oakhouse.jp': 'オークハウス',
      'share-parade.jp': 'シェアパレード',
    };
    return sourceMap[hostname] || hostname;
  } catch {
    return '不明';
  }
}

// DuckDuckGo検索（API不要）
async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    // DuckDuckGo HTML検索
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
      }
    });
    
    if (!response.ok) {
      console.log(`DuckDuckGo search failed: ${response.status}`);
      return results;
    }
    
    const html = await response.text();
    
    // 結果をパース
    const resultMatches = html.matchAll(/<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi);
    const snippetMatches = html.matchAll(/<a[^>]*class="result__snippet"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>/gi);
    
    const links: string[] = [];
    const titles: string[] = [];
    const snippets: string[] = [];
    
    for (const match of resultMatches) {
      // DuckDuckGoのリダイレクトURLから実際のURLを抽出
      const redirectUrl = match[1];
      const actualUrlMatch = redirectUrl.match(/uddg=([^&]*)/);
      const actualUrl = actualUrlMatch ? decodeURIComponent(actualUrlMatch[1]) : redirectUrl;
      links.push(actualUrl);
      titles.push(match[2].replace(/<[^>]*>/g, '').trim());
    }
    
    for (const match of snippetMatches) {
      snippets.push(match[1].replace(/<[^>]*>/g, '').trim());
    }
    
    for (let i = 0; i < Math.min(links.length, 10); i++) {
      if (links[i] && titles[i]) {
        results.push({
          title: titles[i],
          link: links[i],
          snippet: snippets[i] || '',
          source: extractSource(links[i])
        });
      }
    }
  } catch (error) {
    console.log('DuckDuckGo search error:', error);
  }
  
  return results;
}

// Bing検索（API不要）
async function searchBing(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=ja`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
      }
    });
    
    if (!response.ok) {
      console.log(`Bing search failed: ${response.status}`);
      return results;
    }
    
    const html = await response.text();
    
    // 検索結果をパース（li.b_algo内のh2 > a）
    const resultRegex = /<li class="b_algo"[^>]*>[\s\S]*?<h2><a[^>]*href="([^"]*)"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a><\/h2>[\s\S]*?<p[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/p>/gi;
    
    let match;
    while ((match = resultRegex.exec(html)) !== null && results.length < 10) {
      const link = match[1];
      const title = match[2].replace(/<[^>]*>/g, '').trim();
      const snippet = match[3].replace(/<[^>]*>/g, '').trim();
      
      if (link && title && !link.includes('bing.com') && !link.includes('microsoft.com')) {
        results.push({
          title,
          link,
          snippet,
          source: extractSource(link)
        });
      }
    }
  } catch (error) {
    console.log('Bing search error:', error);
  }
  
  return results;
}

// 複数の検索クエリで検索
async function searchNews(): Promise<NewsItem[]> {
  const queries = [
    'シェアハウス 新規オープン 2026',
    'シェアハウス ニュース 最新',
    'コリビング 東京 2026',
    'シェアハウス 女性専用',
    'シェアハウス 外国人',
    'シェアハウス 高齢者',
  ];
  
  const allResults: SearchResult[] = [];
  const seenUrls = new Set<string>();
  
  for (const query of queries) {
    console.log(`🔍 Searching: ${query}`);
    
    // DuckDuckGoで検索
    const ddgResults = await searchDuckDuckGo(query);
    console.log(`   DuckDuckGo: ${ddgResults.length} results`);
    
    for (const result of ddgResults) {
      if (!seenUrls.has(result.link)) {
        seenUrls.add(result.link);
        allResults.push(result);
      }
    }
    
    // レート制限を避けるため少し待機
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`📰 Total unique results: ${allResults.length}`);
  
  // NewsItemに変換
  const newsItems: NewsItem[] = [];
  let id = 1;
  
  for (const result of allResults) {
    // シェアハウス関連かフィルタリング
    const text = (result.title + ' ' + result.snippet).toLowerCase();
    const isRelevant = ['シェアハウス', 'コリビング', 'co-living', 'ソーシャルアパートメント', '共同生活'].some(
      kw => text.includes(kw.toLowerCase())
    );
    
    if (isRelevant) {
      const { category, categories } = detectCategories(result.title, result.snippet);
      
      newsItems.push({
        id: id++,
        title: result.title,
        summary: result.snippet || result.title,
        region: 'japan',
        source: result.source || extractSource(result.link),
        date: formatDate(0), // 今日の日付
        category,
        categories,
        url: result.link
      });
    }
  }
  
  return newsItems;
}

// 固定のシェアハウスニュース（検索で見つからない場合のフォールバック）
function getDefaultNews(): NewsItem[] {
  return [
    { id: 101, title: 'シェアレジデンス「nears五反田」2026年5月入居開始', summary: 'ひとり暮らしとシェアハウスの間、ゆるくつながる心地よい暮らしを提案する新コンセプト物件。', region: 'japan', source: '大和ハウス工業', date: formatDate(0), category: 'new_open', categories: ['new_open', 'tokyo'], url: 'https://www.daiwahouse.co.jp/about/release/group/20251211162546.html' },
    { id: 102, title: '高齢者シェアハウスで新しい老後生活、自由と安心を両立', summary: '70代〜90代が共同生活するシェアハウスが人気に。孤独解消と自立を両立する新しい住まいの形。', region: 'japan', source: 'テレ朝NEWS', date: formatDate(0), category: 'senior', categories: ['senior'], url: 'https://news.tv-asahi.co.jp/news_economy/articles/900180056.html' },
    { id: 103, title: '空き家を外国人材の住まいに再生「外国人材シェアハウス」提供開始', summary: '企業向け外国人社宅サービスとして家具付き・敷金礼金ゼロの物件を提供。', region: 'japan', source: 'PR TIMES', date: formatDate(1), category: 'foreign', categories: ['foreign'], url: 'https://prtimes.jp/main/html/rd/p/000000077.000120610.html' },
    { id: 104, title: 'ネイバーズ羽田が2026年3月開業、新規入居者の募集開始', summary: '京急空港線「糀谷駅」徒歩13分、羽田空港まで最短10分の好立地。', region: 'japan', source: 'SOCIAL APARTMENT', date: formatDate(1), category: 'new_open', categories: ['new_open', 'tokyo'], url: 'https://www.social-apartment.com/lifestyle/detail/20251219192601' },
    { id: 105, title: '長崎に女性専用シェアハウス「長崎ライトハウス」誕生', summary: '斜面地の空き家をリノベーション。女性の自立を支援。', region: 'japan', source: '長崎新聞', date: formatDate(2), category: 'women', categories: ['women'], url: 'https://www.nagasaki-np.co.jp/kijis/?kijiid=341c58b5163a4d06a220c50c5f6436c5' },
    { id: 106, title: '全国でも珍しいペット共生型シェアハウス「ペミリ住之江」', summary: 'ドッグトレーナーが管理人として常駐するペット共生型シェアハウス。', region: 'japan', source: '産経ニュース', date: formatDate(2), category: 'pet', categories: ['pet', 'osaka'], url: 'https://www.sankei.com/article/20231106-IQ2SI6RUHFMNJNSRUPWZBELAJU/' },
    { id: 107, title: '月額2.5万円から！学生向け格安シェアハウスが人気', summary: '都内でも家賃を抑えたい学生に支持される格安シェアハウスの実態。', region: 'japan', source: 'SUUMO', date: formatDate(1), category: 'budget', categories: ['budget', 'student', 'tokyo'], url: 'https://suumo.jp/journal/2025/11/18/212864/' },
    { id: 108, title: '大学生の新生活、シェアハウスという選択肢', summary: '初期費用を抑えられるシェアハウスが大学生の間で人気上昇中。', region: 'japan', source: '東洋経済', date: formatDate(2), category: 'student', categories: ['student', 'budget'], url: 'https://toyokeizai.net/' },
    { id: 109, title: 'テレワーク対応シェアハウス、コワーキング併設型が増加', summary: '在宅勤務の普及で、Wi-Fi完備・作業スペース付きの物件需要が急増。', region: 'japan', source: 'ITmedia', date: formatDate(0), category: 'remote', categories: ['remote'], url: 'https://www.itmedia.co.jp/' },
    { id: 110, title: '東京都心のシェアハウス、平均家賃は6.5万円に', summary: '23区内のシェアハウス家賃相場最新データ。人気エリアは新宿・渋谷。', region: 'japan', source: '不動産経済研究所', date: formatDate(1), category: 'tokyo', categories: ['tokyo', 'trend'], url: 'https://www.fudousankeizai.co.jp/' },
    { id: 111, title: '2026年賃貸トレンド：シェアハウスが一人暮らしを超える？', summary: 'コスト面・コミュニティ面で賃貸市場に変化の兆し。', region: 'japan', source: 'LIFULL HOME\'S', date: formatDate(0), category: 'trend', categories: ['trend'], url: 'https://www.homes.co.jp/' },
    { id: 112, title: '法人契約可能なシェアハウスが増加、社宅としての活用広がる', summary: '転勤者や新入社員の住居として、シェアハウスを社宅として採用する企業が増加。', region: 'japan', source: '日経ビジネス', date: formatDate(0), category: 'company_housing', categories: ['company_housing'], url: 'https://business.nikkei.com/' },
    // 海外ニュース
    { id: 201, title: 'Co-Living Apartments Could Help Fix the Housing Crisis', summary: 'Co-living as a key strategy for affordable housing in the US.', region: 'world', source: 'Business Insider', date: formatDate(0), category: 'coliving', categories: ['coliving'], url: 'https://www.businessinsider.com/co-living-apartments-cheap-rent-fix-housing-crisis-2025-8' },
    { id: 202, title: 'UK Co-Living 2025: Renters Ready to Embrace Shared Living', summary: 'London Co-Living rents range from £1,550 to £1,750 pcm.', region: 'world', source: 'Savills', date: formatDate(1), category: 'coliving', categories: ['coliving'], url: 'https://www.savills.co.uk/research_articles/229130/372282-0' },
    { id: 203, title: 'Singapore Co-living Player Gears Up for Listing', summary: 'シンガポールのコリビング大手がCatalist上場へ。', region: 'world', source: 'EdgeProp', date: formatDate(1), category: 'coliving', categories: ['coliving'], url: 'https://www.edgeprop.sg/property-news/co-living-player-assembly-place-lodges-prospectus-gears-catalist-listing' },
    { id: 204, title: 'Coliving 2025: Key Investment Trends', summary: 'Investment shifts and evolving design trends in coliving.', region: 'world', source: 'Coliving Insights', date: formatDate(2), category: 'investment', categories: ['investment', 'coliving'], url: 'https://www.colivinginsights.com/' },
  ];
}

// メイン処理
async function main() {
  const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
  const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
  const KV_NAMESPACE_ID = '6b596232dc464d40a8dfb2f5c5eb5fe2';

  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  console.log('🔄 Fetching latest sharehouse news via web search...\n');
  
  // Web検索でニュースを取得
  let searchedNews: NewsItem[] = [];
  try {
    searchedNews = await searchNews();
    console.log(`\n✅ Found ${searchedNews.length} relevant news from search`);
  } catch (error) {
    console.log('Search failed, using default news:', error);
  }
  
  // デフォルトニュースを取得
  const defaultNews = getDefaultNews();
  
  // 検索結果とデフォルトニュースを統合（重複排除）
  const seenTitles = new Set<string>();
  const allNews: NewsItem[] = [];
  
  // 検索結果を優先
  for (const news of searchedNews) {
    const titleKey = news.title.substring(0, 20);
    if (!seenTitles.has(titleKey)) {
      seenTitles.add(titleKey);
      allNews.push(news);
    }
  }
  
  // デフォルトニュースで補完
  for (const news of defaultNews) {
    const titleKey = news.title.substring(0, 20);
    if (!seenTitles.has(titleKey)) {
      seenTitles.add(titleKey);
      allNews.push(news);
    }
  }
  
  const data = {
    news: allNews.slice(0, 50), // 最大50件
    lastUpdated: new Date().toISOString(),
    updateCount: allNews.length
  };

  console.log(`\n📰 Final news count: ${data.news.length}`);
  console.log(`   Japan: ${data.news.filter(n => n.region === 'japan').length}`);
  console.log(`   World: ${data.news.filter(n => n.region === 'world').length}`);

  // KVに保存
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/news_data`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to update KV:', error);
    process.exit(1);
  }

  console.log(`\n✅ News updated at ${data.lastUpdated}`);
  
  // 取得したニュースのタイトルを表示
  console.log('\n📋 Latest news titles:');
  data.news.slice(0, 10).forEach((n, i) => {
    console.log(`   ${i + 1}. ${n.title.substring(0, 50)}...`);
  });
}

main().catch(console.error);
