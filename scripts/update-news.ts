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
}

// 日付フォーマット（JST）
function formatDate(daysAgo: number): string {
  const now = new Date();
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const date = new Date(jstNow);
  date.setDate(date.getDate() - daysAgo);
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  return `${date.getMonth() + 1}/${date.getDate()}(${dayNames[date.getDay()]})`;
}

// HTMLタグとエンティティを除去
function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // HTMLタグ除去
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ') // 連続空白を1つに
    .trim();
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
    tokyo: ['東京', '渋谷', '新宿', '池袋', '品川', '目黒', '世田谷', '大田区', '港区', '中野', '杉並', '五反田'],
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
      'businessinsider.jp': 'Business Insider',
      'social-apartment.com': 'ソーシャルアパートメント',
      'sharehouse.in': 'ひつじ不動産',
      'oakhouse.jp': 'オークハウス',
      'share-parade.jp': 'シェアパレード',
      'tokyosharehouse.com': '東京シェアハウス',
      're-port.net': 'R.E.port',
      'share-park.com': 'シェアパーク',
      'daiwahouse.co.jp': '大和ハウス',
      'digitalpr.jp': 'Digital PR',
      'travelspot.jp': 'TravelSpot',
    };
    return sourceMap[hostname] || hostname.split('.')[0];
  } catch {
    return 'Web';
  }
}

// Brave Search API（無料枠あり）
async function searchBrave(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    // Brave Search Web Scraping（APIキー不要）
    const url = `https://search.brave.com/search?q=${encodeURIComponent(query)}&source=web`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja,en;q=0.9',
      }
    });
    
    if (!response.ok) {
      console.log(`Brave search failed: ${response.status}`);
      return results;
    }
    
    const html = await response.text();
    
    // 結果をパース（data-type="web"の結果）
    const resultRegex = /<a[^>]*class="[^"]*result-header[^"]*"[^>]*href="([^"]*)"[^>]*>[\s\S]*?<span[^>]*class="[^"]*snippet-title[^"]*"[^>]*>([^<]*)<\/span>/gi;
    const snippetRegex = /<p[^>]*class="[^"]*snippet-description[^"]*"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/p>/gi;
    
    const links: string[] = [];
    const titles: string[] = [];
    const snippets: string[] = [];
    
    let match;
    while ((match = resultRegex.exec(html)) !== null) {
      links.push(match[1]);
      titles.push(cleanText(match[2]));
    }
    
    while ((match = snippetRegex.exec(html)) !== null) {
      snippets.push(cleanText(match[1]));
    }
    
    for (let i = 0; i < Math.min(links.length, 10); i++) {
      if (links[i] && titles[i]) {
        results.push({
          title: titles[i],
          link: links[i],
          snippet: snippets[i] || titles[i],
          source: extractSource(links[i])
        });
      }
    }
  } catch (error) {
    console.log('Brave search error:', error);
  }
  
  return results;
}

// Google News RSS検索（APIキー不要、ニュース特化）
async function searchGoogleNews(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    // Google News RSS フィード
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ja&gl=JP&ceid=JP:ja`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      }
    });
    
    if (!response.ok) {
      console.log(`   Google News failed: ${response.status}`);
      return results;
    }
    
    const xml = await response.text();
    
    // RSS XMLをパース
    // <item><title>...</title><link>...</link><description>...</description><source>...</source></item>
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    const titleRegex = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i;
    const linkRegex = /<link>([\s\S]*?)<\/link>/i;
    const descRegex = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i;
    const sourceRegex = /<source[^>]*>([\s\S]*?)<\/source>/i;
    
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1];
      
      const titleMatch = titleRegex.exec(item);
      const linkMatch = linkRegex.exec(item);
      const descMatch = descRegex.exec(item);
      const sourceMatch = sourceRegex.exec(item);
      
      if (titleMatch && linkMatch) {
        const title = cleanText(titleMatch[1]);
        let link = linkMatch[1].trim();
        const snippet = descMatch ? cleanText(descMatch[1]) : title;
        const sourceName = sourceMatch ? cleanText(sourceMatch[1]) : extractSource(link);
        
        // Google News のリダイレクトURLから実際のURLを取得する場合
        // （リダイレクト先を取得するのは負荷が高いのでそのまま使用）
        
        if (title && link && !title.includes('Google ニュース')) {
          results.push({
            title: title.substring(0, 100),
            link: link,
            snippet: snippet.substring(0, 200),
            source: sourceName
          });
        }
      }
    }
    
    if (results.length > 0) {
      console.log(`   Google News: ${results.length} results`);
    } else {
      console.log(`   Google News: No results for "${query}"`);
    }
  } catch (error) {
    console.log('   Google News error:', error);
  }
  
  return results;
}

// DuckDuckGo Instant Answer API（補助的に使用）
async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ShareHouseTimesBot/1.0 (News Aggregator)',
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) return results;
    
    const data = await response.json();
    
    if (data.AbstractURL && data.AbstractText) {
      results.push({
        title: data.Heading || query,
        link: data.AbstractURL,
        snippet: data.AbstractText.substring(0, 200),
        source: extractSource(data.AbstractURL)
      });
    }
    
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, 5)) {
        if (topic.FirstURL && topic.Text) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 80),
            link: topic.FirstURL,
            snippet: topic.Text.substring(0, 200),
            source: extractSource(topic.FirstURL)
          });
        }
      }
    }
    
    if (results.length > 0) {
      console.log(`   DuckDuckGo: ${results.length} results`);
    }
  } catch (error) {
    // エラーは無視
  }
  
  return results;
}

// 複数の検索クエリで検索
async function searchNews(): Promise<NewsItem[]> {
  // 日本語クエリ
  const japanQueries = [
    'シェアハウス',
    'シェアハウス 東京',
    'シェアハウス オープン',
    'シェアハウス 女性専用',
    'シェアハウス ペット可',
    'コリビング',
    'ソーシャルアパートメント',
    'シェアハウス 高齢者',
    'シェアハウス 格安',
  ];
  
  // 英語クエリ（海外ニュース用）
  const worldQueries = [
    'coliving real estate',
    'co-living investment',
    'shared housing trend',
  ];
  
  const queries = [...japanQueries, ...worldQueries];
  
  const allResults: SearchResult[] = [];
  const seenUrls = new Set<string>();
  
  for (const query of queries) {
    console.log(`🔍 Searching: ${query}`);
    
    // Google Newsで検索（メイン）
    const googleResults = await searchGoogleNews(query);
    for (const result of googleResults) {
      if (!seenUrls.has(result.link)) {
        seenUrls.add(result.link);
        allResults.push(result);
      }
    }
    
    // DuckDuckGoで補助検索
    const ddgResults = await searchDuckDuckGo(query);
    for (const result of ddgResults) {
      if (!seenUrls.has(result.link)) {
        seenUrls.add(result.link);
        allResults.push(result);
      }
    }
    
    // レート制限を避けるため待機
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log(`📰 Total unique results: ${allResults.length}`);
  
  // NewsItemに変換
  const newsItems: NewsItem[] = [];
  let id = 1;
  
  for (const result of allResults) {
    // シェアハウス関連かフィルタリング
    const text = (result.title + ' ' + result.snippet).toLowerCase();
    const isRelevant = ['シェアハウス', 'コリビング', 'co-living', 'ソーシャルアパートメント', '共同生活', 'share house'].some(
      kw => text.includes(kw.toLowerCase())
    );
    
    if (isRelevant && result.title.length > 5) {
      const { category, categories } = detectCategories(result.title, result.snippet);
      
      // タイトルとサマリーをクリーンアップ
      const cleanTitle = result.title.substring(0, 100);
      const cleanSummary = result.snippet.substring(0, 200);
      
      // 地域判定
      // - 日本語が含まれていれば日本
      // - .jpドメインなら日本
      // - 英語のみかつ海外ドメインなら海外
      const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(cleanTitle);
      const hostname = new URL(result.link).hostname;
      const isJapanDomain = hostname.includes('.jp') || hostname.includes('japan') || hostname.includes('yahoo.co');
      const region: 'japan' | 'world' = (hasJapanese || isJapanDomain) ? 'japan' : 'world';
      
      newsItems.push({
        id: id++,
        title: cleanTitle,
        summary: cleanSummary || cleanTitle,
        region,
        source: result.source || extractSource(result.link),
        date: formatDate(0),
        category,
        categories,
        url: result.link
      });
    }
  }
  
  return newsItems;
}

// 固定のシェアハウスニュース
function getDefaultNews(): NewsItem[] {
  return [
    { id: 101, title: 'シェアレジデンス「nears五反田」2026年5月入居開始', summary: 'ひとり暮らしとシェアハウスの間、ゆるくつながる心地よい暮らしを提案する新コンセプト物件が五反田にオープン。', region: 'japan', source: '大和ハウス工業', date: formatDate(0), category: 'new_open', categories: ['new_open', 'tokyo'], url: 'https://www.daiwahouse.co.jp/about/release/group/20251211162546.html' },
    { id: 102, title: '高齢者シェアハウスで新しい老後生活、自由と安心を両立', summary: '70代〜90代が共同生活するシェアハウスが人気。孤独解消と自立を両立する新しい住まいの形として注目。', region: 'japan', source: 'テレ朝NEWS', date: formatDate(0), category: 'senior', categories: ['senior'], url: 'https://news.tv-asahi.co.jp/news_economy/articles/900180056.html' },
    { id: 103, title: '空き家を外国人材の住まいに再生「外国人材シェアハウス」提供開始', summary: '企業向け外国人社宅サービスとして家具付き・敷金礼金ゼロの物件を全国で提供開始。', region: 'japan', source: 'PR TIMES', date: formatDate(1), category: 'foreign', categories: ['foreign'], url: 'https://prtimes.jp/main/html/rd/p/000000077.000120610.html' },
    { id: 104, title: 'ネイバーズ羽田が2026年3月開業、新規入居者の募集開始', summary: '京急空港線「糀谷駅」徒歩13分、羽田空港まで最短10分の好立地にソーシャルアパートメントがオープン。', region: 'japan', source: 'ソーシャルアパートメント', date: formatDate(1), category: 'new_open', categories: ['new_open', 'tokyo'], url: 'https://www.social-apartment.com/lifestyle/detail/20251219192601' },
    { id: 105, title: '長崎に女性専用シェアハウス「長崎ライトハウス」誕生', summary: '斜面地の空き家をリノベーション。女性の自立と安心を支援する新しいシェアハウスが長崎に誕生。', region: 'japan', source: '長崎新聞', date: formatDate(2), category: 'women', categories: ['women'], url: 'https://www.nagasaki-np.co.jp/' },
    { id: 106, title: '全国でも珍しいペット共生型シェアハウス「ペミリ住之江」', summary: 'ドッグトレーナーが管理人として常駐。ペットと暮らせるシェアハウスが大阪に登場。', region: 'japan', source: '産経ニュース', date: formatDate(2), category: 'pet', categories: ['pet', 'osaka'], url: 'https://www.sankei.com/' },
    { id: 107, title: '月額2.5万円から！学生向け格安シェアハウスが人気', summary: '都内でも家賃を抑えたい学生に支持される格安シェアハウスの実態を調査。', region: 'japan', source: 'SUUMO', date: formatDate(1), category: 'budget', categories: ['budget', 'student', 'tokyo'], url: 'https://suumo.jp/' },
    { id: 108, title: '大学生の新生活、シェアハウスという選択肢', summary: '初期費用を抑えられるシェアハウスが大学生の間で人気上昇中。メリットとデメリットを解説。', region: 'japan', source: '東洋経済', date: formatDate(2), category: 'student', categories: ['student', 'budget'], url: 'https://toyokeizai.net/' },
    { id: 109, title: 'テレワーク対応シェアハウス、コワーキング併設型が増加', summary: '在宅勤務の普及で、Wi-Fi完備・作業スペース付きの物件需要が急増している。', region: 'japan', source: 'ITmedia', date: formatDate(0), category: 'remote', categories: ['remote'], url: 'https://www.itmedia.co.jp/' },
    { id: 110, title: '東京都心のシェアハウス、平均家賃は6.5万円に', summary: '23区内のシェアハウス家賃相場最新データ。人気エリアは新宿・渋谷・池袋。', region: 'japan', source: '不動産経済研究所', date: formatDate(1), category: 'tokyo', categories: ['tokyo', 'trend'], url: 'https://www.fudousankeizai.co.jp/' },
    { id: 111, title: '2026年賃貸トレンド：シェアハウスが一人暮らしを超える？', summary: 'コスト面・コミュニティ面で賃貸市場に変化の兆し。専門家が2026年のトレンドを予測。', region: 'japan', source: 'LIFULL HOME\'S', date: formatDate(0), category: 'trend', categories: ['trend'], url: 'https://www.homes.co.jp/' },
    { id: 112, title: '法人契約可能なシェアハウスが増加、社宅としての活用広がる', summary: '転勤者や新入社員の住居として、シェアハウスを社宅として採用する企業が増加中。', region: 'japan', source: '日経ビジネス', date: formatDate(0), category: 'company_housing', categories: ['company_housing'], url: 'https://business.nikkei.com/' },
    { id: 113, title: 'シェアハウス人気、家賃高騰が背景 訪日外国人の利用も', summary: '家賃高騰を背景にシェアハウス人気が上昇。ホテル代わりに利用する訪日外国人も増加。', region: 'japan', source: '朝日新聞', date: formatDate(0), category: 'trend', categories: ['trend', 'foreign'], url: 'https://www.asahi.com/' },
    { id: 114, title: '政府、高齢者シェアハウス整備へ 介護も提供、3年間で100カ所', summary: '独居高齢者の孤独死防止・生活支援を目的に、政府が高齢者シェアハウス整備を推進。', region: 'japan', source: '共同通信', date: formatDate(1), category: 'senior', categories: ['senior'], url: 'https://nordot.app/' },
    // 海外ニュース
    { id: 201, title: 'Co-Living Apartments Could Help Fix the Housing Crisis', summary: 'Co-living is emerging as a key strategy for affordable housing in the US market.', region: 'world', source: 'Business Insider', date: formatDate(0), category: 'coliving', categories: ['coliving'], url: 'https://www.businessinsider.com/' },
    { id: 202, title: 'UK Co-Living 2025: Renters Ready to Embrace Shared Living', summary: 'London Co-Living rents range from £1,550 to £1,750 pcm. Demand grows among young professionals.', region: 'world', source: 'Savills', date: formatDate(1), category: 'coliving', categories: ['coliving'], url: 'https://www.savills.co.uk/' },
    { id: 203, title: 'Singapore Co-living Player Gears Up for Listing', summary: 'Major Singapore co-living operator prepares for Catalist listing amid growing market.', region: 'world', source: 'EdgeProp', date: formatDate(1), category: 'coliving', categories: ['coliving'], url: 'https://www.edgeprop.sg/' },
    { id: 204, title: 'Coliving 2025: Key Investment Trends', summary: 'Investment shifts and evolving design trends in coliving sector for 2025.', region: 'world', source: 'Coliving Insights', date: formatDate(2), category: 'investment', categories: ['investment', 'coliving'], url: 'https://www.colivinginsights.com/' },
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

  console.log('🔄 Fetching latest sharehouse news...\n');
  
  // Web検索でニュースを取得
  let searchedNews: NewsItem[] = [];
  try {
    searchedNews = await searchNews();
    console.log(`\n✅ Found ${searchedNews.length} relevant news from search`);
  } catch (error) {
    console.log('Search failed:', error);
  }
  
  // デフォルトニュースを取得
  const defaultNews = getDefaultNews();
  
  // 統合（地域バランスを考慮）
  const seenTitles = new Set<string>();
  const japanNews: NewsItem[] = [];
  const worldNews: NewsItem[] = [];
  
  // 検索結果を地域別に分類
  for (const news of searchedNews) {
    const titleKey = news.title.substring(0, 15);
    if (!seenTitles.has(titleKey)) {
      seenTitles.add(titleKey);
      if (news.region === 'world') {
        worldNews.push(news);
      } else {
        japanNews.push(news);
      }
    }
  }
  
  // デフォルトニュースを追加（重複排除）
  for (const news of defaultNews) {
    const titleKey = news.title.substring(0, 15);
    if (!seenTitles.has(titleKey)) {
      seenTitles.add(titleKey);
      if (news.region === 'world') {
        worldNews.push(news);
      } else {
        japanNews.push(news);
      }
    }
  }
  
  // 日本ニュース45件 + 海外ニュース5件（最大50件）
  const allNews: NewsItem[] = [
    ...japanNews.slice(0, 45),
    ...worldNews.slice(0, 5)
  ];
  
  const data = {
    news: allNews,
    lastUpdated: new Date().toISOString(),
    updateCount: japanNews.length + worldNews.length
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
  
  // 取得したニュースを表示
  console.log('\n📋 News titles:');
  data.news.slice(0, 10).forEach((n, i) => {
    console.log(`   ${i + 1}. [${n.source}] ${n.title.substring(0, 45)}...`);
  });
}

main().catch(console.error);
