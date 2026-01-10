/**
 * Google Newsからシェアハウス関連ニュースを取得するモジュール
 */

interface NewsItem {
  id: number
  title: string
  summary: string
  url: string
  originalUrl: string
  source: string
  date: string
  region: 'japan' | 'world'
  category: string
  categories: string[]
  imageUrl?: string
}

interface FetchResult {
  news: NewsItem[]
  lastUpdated: string
  source: string
}

// Google News RSS URLを生成
function getGoogleNewsRssUrl(query: string, lang: string = 'ja', region: string = 'JP'): string {
  const encodedQuery = encodeURIComponent(query)
  return `https://news.google.com/rss/search?q=${encodedQuery}&hl=${lang}&gl=${region}&ceid=${region}:${lang}`
}

// カテゴリーを判定
function categorizeNews(title: string, summary: string): { category: string, categories: string[] } {
  const text = (title + ' ' + summary).toLowerCase()
  const categories: string[] = []
  
  // キーワードマッピング
  const categoryKeywords: Record<string, string[]> = {
    'women': ['女性専用', '女性向け', 'レディース', '女子'],
    'senior': ['高齢者', 'シニア', '老後', '老人'],
    'pet': ['ペット可', 'ペット', '犬', '猫'],
    'foreign': ['外国人', '多国籍', 'インターナショナル', '留学生'],
    'student': ['学生', '大学生', '専門学校'],
    'budget': ['格安', '安い', '低価格', '3万円', '4万円'],
    'remote': ['リモートワーク', 'テレワーク', 'ワーケーション', '在宅'],
    'tokyo': ['東京', '渋谷', '新宿', '池袋', '品川', '港区', '目黒', '世田谷'],
    'osaka': ['大阪', '梅田', '難波', '心斎橋'],
    'fukuoka': ['福岡', '博多', '天神'],
    'nagoya': ['名古屋', '栄', '金山'],
    'kyoto': ['京都'],
    'new_open': ['オープン', '開業', '新規', '誕生', '開設', '入居開始'],
    'coliving': ['コリビング', 'co-living'],
    'market': ['市場', '動向', '統計', '調査', 'レポート'],
    'trend': ['トレンド', '人気', '注目'],
    'investment': ['投資', '不動産投資', '利回り'],
    'rural': ['地方', '移住', '田舎', '郊外'],
  }
  
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => text.includes(kw.toLowerCase()))) {
      categories.push(cat)
    }
  }
  
  // メインカテゴリー決定（優先度順）
  const priorityOrder = ['new_open', 'women', 'senior', 'pet', 'foreign', 'student', 'budget', 'remote', 'tokyo', 'osaka', 'market', 'coliving']
  const mainCategory = priorityOrder.find(cat => categories.includes(cat)) || categories[0] || 'market'
  
  return { category: mainCategory, categories: categories.length > 0 ? categories : ['market'] }
}

// 地域を判定
function determineRegion(title: string, summary: string): 'japan' | 'world' {
  const text = (title + ' ' + summary).toLowerCase()
  const worldKeywords = ['海外', '米国', 'アメリカ', '欧州', 'ヨーロッパ', '中国', '韓国', 'アジア', '世界']
  return worldKeywords.some(kw => text.includes(kw)) ? 'world' : 'japan'
}

// 日付をフォーマット
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
    return `${month}/${day}(${dayOfWeek})`
  } catch {
    return new Date().toLocaleDateString('ja-JP')
  }
}

// ソース名を抽出
function extractSource(title: string): { cleanTitle: string, source: string } {
  // " - ソース名" パターンを探す
  const match = title.match(/^(.+?)\s*[-–—]\s*([^-–—]+)$/)
  if (match) {
    return { cleanTitle: match[1].trim(), source: match[2].trim() }
  }
  return { cleanTitle: title, source: 'ニュース' }
}

// XMLをパース（簡易実装）
function parseRssXml(xml: string): Array<{ title: string, link: string, pubDate: string, description?: string }> {
  const items: Array<{ title: string, link: string, pubDate: string, description?: string }> = []
  
  // <item>タグを抽出
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1]
    
    const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)
    const linkMatch = itemXml.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/)
    const pubDateMatch = itemXml.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/)
    const descMatch = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)
    
    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1].trim().replace(/<!\[CDATA\[|\]\]>/g, ''),
        link: linkMatch[1].trim().replace(/<!\[CDATA\[|\]\]>/g, ''),
        pubDate: pubDateMatch ? pubDateMatch[1].trim().replace(/<!\[CDATA\[|\]\]>/g, '') : new Date().toISOString(),
        description: descMatch ? descMatch[1].trim().replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '') : undefined
      })
    }
  }
  
  return items
}

// Google Newsからニュースを取得
export async function fetchGoogleNews(): Promise<FetchResult> {
  const searchQueries = [
    'シェアハウス',
    'コリビング 賃貸',
    '東京 一人暮らし シェア',
  ]
  
  const allNews: NewsItem[] = []
  const seenTitles = new Set<string>()
  let id = 1
  
  for (const query of searchQueries) {
    try {
      const rssUrl = getGoogleNewsRssUrl(query)
      const response = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ShareHouseTimes/1.0)',
          'Accept': 'application/rss+xml, application/xml, text/xml'
        }
      })
      
      if (!response.ok) continue
      
      const xml = await response.text()
      const items = parseRssXml(xml)
      
      for (const item of items) {
        // 重複チェック
        const titleKey = item.title.substring(0, 50)
        if (seenTitles.has(titleKey)) continue
        seenTitles.add(titleKey)
        
        const { cleanTitle, source } = extractSource(item.title)
        const { category, categories } = categorizeNews(item.title, item.description || '')
        const region = determineRegion(item.title, item.description || '')
        
        allNews.push({
          id: id++,
          title: item.title,
          summary: item.description || cleanTitle.substring(0, 100),
          url: `/news/${id - 1}`,
          originalUrl: item.link,
          source,
          date: formatDate(item.pubDate),
          region,
          category,
          categories,
        })
        
        if (allNews.length >= 50) break
      }
      
      if (allNews.length >= 50) break
    } catch (error) {
      console.error(`Failed to fetch news for query "${query}":`, error)
    }
  }
  
  // ニュースが取得できなかった場合のフォールバック
  if (allNews.length === 0) {
    return {
      news: [],
      lastUpdated: new Date().toISOString(),
      source: 'google-news-empty'
    }
  }
  
  return {
    news: allNews,
    lastUpdated: new Date().toISOString(),
    source: 'google-news'
  }
}

// ニュース更新が必要かチェック（6時間以上経過していれば更新）
export function shouldUpdateNews(lastUpdated: string | null): boolean {
  if (!lastUpdated) return true
  
  const lastUpdate = new Date(lastUpdated).getTime()
  const now = Date.now()
  const sixHours = 6 * 60 * 60 * 1000
  
  return (now - lastUpdate) > sixHours
}
