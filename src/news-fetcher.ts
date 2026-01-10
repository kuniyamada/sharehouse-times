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

// HTMLタグとエンティティを完全に除去
function stripHtml(text: string): string {
  if (!text) return ''
  return text
    // HTMLタグを除去
    .replace(/<[^>]*>/g, '')
    // HTMLエンティティをデコード
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // 残ったHTMLタグを再度除去（エンティティデコード後）
    .replace(/<[^>]*>/g, '')
    // 余分な空白を整理
    .replace(/\s+/g, ' ')
    .trim()
}

// 無関係なニュースをフィルタリング（ドラマ、バラエティ、アニメなど）
function isRelevantNews(title: string, summary: string): boolean {
  const text = (title + ' ' + summary).toLowerCase()
  
  // 除外キーワード（シェアハウスという単語を含むが、不動産とは無関係なコンテンツ）
  const excludeKeywords = [
    // テレビ番組・ドラマ
    'ドラマ', 'バラエティ', 'リアリティショー', 'リアリティーショー',
    '番組', '放送', '配信', 'fod', 'netflix', 'amazon prime', 'hulu',
    'テラスハウス', 'あいのり', '恋愛', 'bl', 'ボーイズラブ',
    // アニメ・漫画・ゲーム
    'アニメ', '漫画', 'マンガ', 'ゲーム', 'キャラクター', 'グッズ',
    'くじ', 'エニマイ', 'カリスマ',
    // 芸能
    'アイドル', 'タレント', '俳優', '女優', 'youtuber',
    // その他
    '映画', '小説', 'ライトノベル'
  ]
  
  // 除外キーワードが含まれている場合は除外
  if (excludeKeywords.some(kw => text.includes(kw))) {
    return false
  }
  
  // 必須キーワード（少なくとも1つ含まれている必要がある）
  const requiredKeywords = [
    // 不動産・住居関連
    '賃貸', '物件', '入居', '家賃', '共益費', '敷金', '礼金',
    '不動産', '住まい', '住居', '居住', '暮らし', '生活',
    'オープン', '開業', '開設', '新規', '募集',
    // シェアハウス関連
    'シェアハウス', 'コリビング', 'ソーシャルアパートメント',
    'ゲストハウス', 'シェアレジデンス',
    // 地域・エリア
    '東京', '大阪', '名古屋', '福岡', '京都', '神奈川', '埼玉', '千葉',
    // ターゲット
    '女性専用', '高齢者', '学生', '外国人', 'ペット可'
  ]
  
  return requiredKeywords.some(kw => text.includes(kw))
}

// カテゴリーを判定
function categorizeNews(title: string, summary: string): { category: string, categories: string[] } {
  const text = (title + ' ' + summary).toLowerCase()
  const categories: string[] = []
  
  // キーワードマッピング
  const categoryKeywords: Record<string, string[]> = {
    'women': ['女性専用', '女性向け', 'レディース', '女子専用'],
    'senior': ['高齢者', 'シニア', '老後', '高齢'],
    'pet': ['ペット可', 'ペット', '犬ok', '猫ok'],
    'foreign': ['外国人', '多国籍', 'インターナショナル', '留学生'],
    'student': ['学生向け', '大学生', '専門学校生'],
    'budget': ['格安', '低価格', '3万円台', '4万円台', '5万円以下'],
    'remote': ['リモートワーク', 'テレワーク', 'ワーケーション', '在宅勤務'],
    'tokyo': ['東京', '渋谷', '新宿', '池袋', '品川', '港区', '目黒区', '世田谷区', '大田区'],
    'osaka': ['大阪', '梅田', '難波', '心斎橋', '天王寺'],
    'fukuoka': ['福岡', '博多', '天神'],
    'nagoya': ['名古屋', '栄', '金山'],
    'kyoto': ['京都市', '京都府'],
    'new_open': ['オープン', '開業', '新規オープン', '誕生', '開設', '入居開始', '募集開始'],
    'coliving': ['コリビング', 'co-living', 'ソーシャルアパートメント'],
    'market': ['市場', '動向', '統計', '調査', 'レポート', '相場'],
    'trend': ['トレンド', '人気', '注目', '話題'],
    'investment': ['投資', '不動産投資', '利回り', 'オーナー'],
    'rural': ['地方移住', '移住', '田舎暮らし', '郊外'],
  }
  
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => text.includes(kw.toLowerCase()))) {
      categories.push(cat)
    }
  }
  
  // メインカテゴリー決定（優先度順）
  const priorityOrder = ['new_open', 'women', 'senior', 'pet', 'foreign', 'student', 'budget', 'remote', 'tokyo', 'osaka', 'fukuoka', 'market', 'coliving']
  const mainCategory = priorityOrder.find(cat => categories.includes(cat)) || categories[0] || 'market'
  
  return { category: mainCategory, categories: categories.length > 0 ? categories : ['market'] }
}

// 地域を判定（より精密に）
function determineRegion(title: string, summary: string): 'japan' | 'world' {
  const text = (title + ' ' + summary)
  
  // 明確に海外の不動産・住居ニュースを示すキーワード
  const worldRealEstateKeywords = [
    '海外のシェアハウス', '海外物件', '海外不動産',
    'アメリカのシェアハウス', '欧州のシェアハウス',
    'ニューヨーク', 'ロンドン', 'パリ', 'シンガポール', '香港',
    '海外移住', '海外生活'
  ]
  
  // 海外不動産キーワードが含まれている場合のみworld
  if (worldRealEstateKeywords.some(kw => text.includes(kw))) {
    return 'world'
  }
  
  // デフォルトは国内ニュース（日本語のGoogle Newsは基本的に国内ニュース）
  return 'japan'
}

// 日付をフォーマット
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return formatCurrentDate()
    }
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
    return `${month}/${day}(${dayOfWeek})`
  } catch {
    return formatCurrentDate()
  }
}

function formatCurrentDate(): string {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][now.getDay()]
  return `${month}/${day}(${dayOfWeek})`
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
      // タイトルとdescriptionからHTMLを除去
      const cleanTitle = stripHtml(titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, ''))
      const cleanDesc = descMatch 
        ? stripHtml(descMatch[1].replace(/<!\[CDATA\[|\]\]>/g, ''))
        : undefined
      
      items.push({
        title: cleanTitle,
        link: linkMatch[1].trim().replace(/<!\[CDATA\[|\]\]>/g, ''),
        pubDate: pubDateMatch ? pubDateMatch[1].trim().replace(/<!\[CDATA\[|\]\]>/g, '') : new Date().toISOString(),
        description: cleanDesc
      })
    }
  }
  
  return items
}

// Google Newsからニュースを取得
export async function fetchGoogleNews(): Promise<FetchResult> {
  const searchQueries = [
    'シェアハウス 賃貸',
    'シェアハウス オープン',
    'コリビング 物件',
    'シェアハウス 入居',
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
        
        // 関連性チェック（ドラマ、バラエティなどを除外）
        if (!isRelevantNews(item.title, item.description || '')) {
          continue
        }
        
        seenTitles.add(titleKey)
        
        const { cleanTitle, source } = extractSource(item.title)
        const { category, categories } = categorizeNews(item.title, item.description || '')
        const region = determineRegion(item.title, item.description || '')
        
        // summaryを生成（HTMLなしのクリーンなテキスト）
        let summary = item.description || cleanTitle
        if (summary.length > 150) {
          summary = summary.substring(0, 147) + '...'
        }
        
        allNews.push({
          id: id++,
          title: item.title,
          summary,
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
