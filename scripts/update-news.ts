/**
 * ニュース更新スクリプト
 * GitHub Actionsから定期実行され、最新ニュースをKVに保存する
 * 複数のRSSフィードから実際のニュースを取得
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

interface RSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  source?: string;
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

// XMLパース（簡易版）
function parseXML(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemMatches = xml.match(/<item[^>]*>([\s\S]*?)<\/item>/gi) || [];
  
  for (const itemXml of itemMatches) {
    const titleMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const linkMatch = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    const descMatch = itemXml.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
    const dateMatch = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
    const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
    
    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1].trim().replace(/<[^>]+>/g, ''),
        link: linkMatch[1].trim(),
        description: descMatch ? descMatch[1].trim().replace(/<[^>]+>/g, '').substring(0, 200) : '',
        pubDate: dateMatch ? dateMatch[1].trim() : undefined,
        source: sourceMatch ? sourceMatch[1].trim().replace(/<[^>]+>/g, '') : undefined
      });
    }
  }
  
  return items;
}

// RSSフィードを取得
async function fetchRSS(url: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (!response.ok) {
      console.log(`RSS fetch failed for ${url}: ${response.status}`);
      return [];
    }
    const text = await response.text();
    return parseXML(text);
  } catch (error) {
    console.log(`RSS fetch error for ${url}:`, error);
    return [];
  }
}

// カテゴリを推定
function detectCategories(title: string, description: string): { category: string; categories: string[] } {
  const text = (title + ' ' + description).toLowerCase();
  const categories: string[] = [];
  let primaryCategory = 'market';
  
  // キーワードマッピング
  const keywords: { [key: string]: string[] } = {
    women: ['女性専用', '女性向け', 'レディース'],
    senior: ['高齢者', 'シニア', '老後', '介護'],
    pet: ['ペット', '犬', '猫', 'ドッグ'],
    student: ['学生', '大学生', '専門学校'],
    budget: ['格安', '激安', '安い', '低価格', '2万', '3万', '4万'],
    foreign: ['外国人', '多国籍', 'インターナショナル', 'グローバル'],
    remote: ['リモート', 'テレワーク', '在宅', 'コワーキング', 'ワーケーション'],
    new_open: ['オープン', '開業', '誕生', '新築', '完成', 'グランドオープン'],
    tokyo: ['東京', '渋谷', '新宿', '池袋', '品川', '目黒', '世田谷', '大田区'],
    osaka: ['大阪', '梅田', '難波', '心斎橋'],
    fukuoka: ['福岡', '博多', '天神'],
    coliving: ['コリビング', 'co-living', 'coliving'],
    trend: ['トレンド', '市場', '動向', '統計', '調査'],
    company_housing: ['社宅', '法人', '企業', '福利厚生'],
    investment: ['投資', '利回り', '収益', '経営'],
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

// 日付をパース
function parseDate(dateStr?: string): Date {
  if (!dateStr) return new Date();
  try {
    return new Date(dateStr);
  } catch {
    return new Date();
  }
}

// デフォルトニュース（RSSが取得できない場合のフォールバック）
function getDefaultNews(): NewsItem[] {
  return [
    { id: 1, title: 'シェアレジデンス「nears五反田」2026年5月入居開始', summary: 'ひとり暮らしとシェアハウスの間、ゆるくつながる心地よい暮らしを提案する新コンセプト物件。', region: 'japan', source: '大和ハウス工業', date: formatDate(0), category: 'new_open', categories: ['new_open', 'tokyo'], url: 'https://www.daiwahouse.co.jp/about/release/group/20251211162546.html' },
    { id: 2, title: '高齢者シェアハウスで新しい老後生活、自由と安心を両立', summary: '70代〜90代が共同生活するシェアハウスが人気に。孤独解消と自立を両立する新しい住まいの形。', region: 'japan', source: 'テレ朝NEWS', date: formatDate(0), category: 'senior', categories: ['senior'], url: 'https://news.tv-asahi.co.jp/news_economy/articles/900180056.html' },
    { id: 3, title: '空き家を外国人材の住まいに再生「外国人材シェアハウス」提供開始', summary: '企業向け外国人社宅サービスとして家具付き・敷金礼金ゼロの物件を提供。', region: 'japan', source: 'PR TIMES', date: formatDate(1), category: 'foreign', categories: ['foreign'], url: 'https://prtimes.jp/main/html/rd/p/000000077.000120610.html' },
    { id: 4, title: 'ネイバーズ羽田が2026年3月開業、新規入居者の募集開始', summary: '京急空港線「糀谷駅」徒歩13分、羽田空港まで最短10分の好立地。', region: 'japan', source: 'SOCIAL APARTMENT', date: formatDate(1), category: 'new_open', categories: ['new_open', 'tokyo'], url: 'https://www.social-apartment.com/lifestyle/detail/20251219192601' },
    { id: 5, title: '長崎に女性専用シェアハウス「長崎ライトハウス」誕生', summary: '斜面地の空き家をリノベーション。女性の自立を支援。', region: 'japan', source: '長崎新聞', date: formatDate(2), category: 'women', categories: ['women'], url: 'https://www.nagasaki-np.co.jp/kijis/?kijiid=341c58b5163a4d06a220c50c5f6436c5' },
    { id: 6, title: '全国でも珍しいペット共生型シェアハウス「ペミリ住之江」', summary: 'ドッグトレーナーが管理人として常駐するペット共生型シェアハウス。', region: 'japan', source: '産経ニュース', date: formatDate(2), category: 'pet', categories: ['pet', 'osaka'], url: 'https://www.sankei.com/article/20231106-IQ2SI6RUHFMNJNSRUPWZBELAJU/' },
    { id: 7, title: '月額2.5万円から！学生向け格安シェアハウスが人気', summary: '都内でも家賃を抑えたい学生に支持される格安シェアハウスの実態。', region: 'japan', source: 'SUUMO', date: formatDate(1), category: 'budget', categories: ['budget', 'student', 'tokyo'], url: 'https://suumo.jp/journal/2025/11/18/212864/' },
    { id: 8, title: '大学生の新生活、シェアハウスという選択肢', summary: '初期費用を抑えられるシェアハウスが大学生の間で人気上昇中。', region: 'japan', source: '東洋経済', date: formatDate(2), category: 'student', categories: ['student', 'budget'], url: 'https://toyokeizai.net/' },
    { id: 9, title: 'テレワーク対応シェアハウス、コワーキング併設型が増加', summary: '在宅勤務の普及で、Wi-Fi完備・作業スペース付きの物件需要が急増。', region: 'japan', source: 'ITmedia', date: formatDate(0), category: 'remote', categories: ['remote'], url: 'https://www.itmedia.co.jp/' },
    { id: 10, title: '東京都心のシェアハウス、平均家賃は6.5万円に', summary: '23区内のシェアハウス家賃相場最新データ。人気エリアは新宿・渋谷。', region: 'japan', source: '不動産経済研究所', date: formatDate(1), category: 'tokyo', categories: ['tokyo', 'trend'], url: 'https://www.fudousankeizai.co.jp/' },
    { id: 101, title: 'Co-Living Apartments Could Help Fix the Housing Crisis', summary: 'Co-living as a key strategy for affordable housing in the US.', region: 'world', source: 'Business Insider', date: formatDate(0), category: 'coliving', categories: ['coliving'], url: 'https://www.businessinsider.com/co-living-apartments-cheap-rent-fix-housing-crisis-2025-8' },
    { id: 102, title: 'UK Co-Living 2025: Renters Ready to Embrace Shared Living', summary: 'London Co-Living rents range from £1,550 to £1,750 pcm.', region: 'world', source: 'Savills', date: formatDate(1), category: 'coliving', categories: ['coliving'], url: 'https://www.savills.co.uk/research_articles/229130/372282-0' },
  ];
}

// 複数のRSSソースからニュースを取得
async function fetchAllNews(): Promise<NewsItem[]> {
  const rssFeeds = [
    // 日本のニュース
    { url: 'https://news.yahoo.co.jp/rss/topics/domestic.xml', region: 'japan' as const, defaultSource: 'Yahoo!ニュース' },
    { url: 'https://www.asahi.com/rss/asahi/newsheadlines.rdf', region: 'japan' as const, defaultSource: '朝日新聞' },
    { url: 'https://rss.itmedia.co.jp/rss/2.0/itmedia_all.xml', region: 'japan' as const, defaultSource: 'ITmedia' },
    // PR TIMES（不動産関連）
    { url: 'https://prtimes.jp/rss/keyword/share_house.rdf', region: 'japan' as const, defaultSource: 'PR TIMES' },
    // 海外ニュース
    { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', region: 'world' as const, defaultSource: 'BBC' },
  ];

  const allItems: NewsItem[] = [];
  let idCounter = 1;

  // シェアハウス関連キーワード
  const relevantKeywords = [
    'シェアハウス', 'シェアリング', 'コリビング', 'co-living', 'coliving',
    '賃貸', '一人暮らし', '住居', '住宅', '不動産', 'マンション',
    'share house', 'shared living', 'rental', 'housing'
  ];

  for (const feed of rssFeeds) {
    console.log(`Fetching: ${feed.url}`);
    const items = await fetchRSS(feed.url);
    console.log(`  Found ${items.length} items`);

    for (const item of items) {
      // 関連性チェック（タイトルまたは説明に関連キーワードが含まれているか）
      const text = (item.title + ' ' + (item.description || '')).toLowerCase();
      const isRelevant = relevantKeywords.some(kw => text.includes(kw.toLowerCase()));
      
      // 関連ニュースのみ追加（または各フィードから最大3件）
      if (isRelevant || allItems.filter(n => n.source === feed.defaultSource).length < 3) {
        const { category, categories } = detectCategories(item.title, item.description || '');
        const pubDate = parseDate(item.pubDate);
        
        allItems.push({
          id: feed.region === 'world' ? 100 + idCounter : idCounter,
          title: item.title,
          summary: item.description || item.title,
          region: feed.region,
          source: item.source || feed.defaultSource,
          date: formatDateFromDate(pubDate),
          category,
          categories,
          url: item.link
        });
        idCounter++;
      }
    }
  }

  // ニュースが少ない場合はデフォルトニュースで補完
  if (allItems.length < 10) {
    console.log('Not enough news from RSS, adding default news...');
    const defaultNews = getDefaultNews();
    for (const news of defaultNews) {
      if (!allItems.some(n => n.title === news.title)) {
        allItems.push({ ...news, id: idCounter++ });
      }
    }
  }

  // 日付でソート（新しい順）
  allItems.sort((a, b) => {
    const dateA = new Date(a.date.replace(/(\d+)\/(\d+)\(.\)/, '2026/$1/$2'));
    const dateB = new Date(b.date.replace(/(\d+)\/(\d+)\(.\)/, '2026/$1/$2'));
    return dateB.getTime() - dateA.getTime();
  });

  return allItems.slice(0, 50); // 最大50件
}

// メイン処理
async function main() {
  const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
  const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
  const KV_NAMESPACE_ID = '6b596232dc464d40a8dfb2f5c5eb5fe2';

  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
    console.error('Missing required environment variables: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID');
    process.exit(1);
  }

  console.log('🔄 Fetching news from RSS feeds...');
  let news: NewsItem[];
  
  try {
    news = await fetchAllNews();
  } catch (error) {
    console.error('Failed to fetch RSS, using default news:', error);
    news = getDefaultNews();
  }

  const data = {
    news,
    lastUpdated: new Date().toISOString(),
    updateCount: news.length
  };

  console.log(`📰 Total news items: ${news.length}`);
  console.log(`   Japan news: ${news.filter(n => n.region === 'japan').length}`);
  console.log(`   World news: ${news.filter(n => n.region === 'world').length}`);

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

  console.log(`✅ News updated successfully at ${data.lastUpdated}`);
}

main().catch(console.error);
