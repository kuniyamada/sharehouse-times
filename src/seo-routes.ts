/**
 * SEO対策ルート
 * - ニュース個別ページ (/news/:id)
 * - 動的サイトマップ (/sitemap.xml)
 * - Google News用サイトマップ (/sitemap-news.xml)
 * - RSS/Atomフィード (/feed.xml, /atom.xml)
 */

import { Hono } from 'hono'

// Cloudflare Bindings型定義
type Bindings = {
  NEWS_KV: KVNamespace
}

// カテゴリーラベル
const categoryLabels: Record<string, string> = {
  'new_open': '新規オープン', 'women': '女性専用', 'senior': '高齢者向け',
  'pet': 'ペット可', 'foreign': '外国人向け', 'student': '学生向け',
  'budget': '格安', 'remote': 'リモートワーク', 'tokyo': '東京',
  'osaka': '大阪', 'fukuoka': '福岡', 'nagoya': '名古屋', 'kyoto': '京都',
  'trend': '賃貸トレンド', 'tokyo_life': '東京一人暮らし', 'coliving': 'コリビング',
  'rural': '地方移住', 'investment': '投資', 'desk_tour': 'デスクツアー',
  'company_housing': '社宅', 'market': '市場動向', 'policy': '政策',
  'uk': 'イギリス', 'us': 'アメリカ', 'asia': 'アジア'
}

// デフォルトニュースを取得するヘルパー
async function getNewsData(env: { NEWS_KV?: KVNamespace }) {
  let cachedData: { news: any[], lastUpdated: string | null } | null = null
  if (env?.NEWS_KV) {
    cachedData = await env.NEWS_KV.get('news_data', 'json')
  }
  return {
    news: cachedData?.news || [],
    lastUpdated: cachedData?.lastUpdated || new Date().toISOString()
  }
}

// ブログデータを取得するヘルパー
async function getBlogData(env: { NEWS_KV?: KVNamespace }) {
  let blogData: { posts: any[], lastUpdated: string | null } | null = null
  if (env?.NEWS_KV) {
    blogData = await env.NEWS_KV.get('blog_data', 'json')
  }
  return {
    posts: blogData?.posts?.filter((p: any) => p.status === 'published') || [],
    lastUpdated: blogData?.lastUpdated || new Date().toISOString()
  }
}

// XMLエスケープ
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function createSeoRoutes() {
  const seo = new Hono<{ Bindings: Bindings }>()

  // ========================================
  // ニュース個別ページ
  // ========================================
  seo.get('/news/:id', async (c) => {
    const id = parseInt(c.req.param('id'))
    const { news: allNews } = await getNewsData(c.env)
    const article = allNews.find((n: any) => n.id === id)
    
    if (!article) {
      return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>記事が見つかりません | SHARE HOUSE TIMES</title>
    <meta name="robots" content="noindex">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen flex items-center justify-center">
    <div class="text-center p-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-4">404</h1>
        <p class="text-gray-600 mb-6">お探しの記事が見つかりませんでした</p>
        <a href="/" class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">トップページへ戻る</a>
    </div>
</body>
</html>`, 404)
    }
    
    const catLabel = categoryLabels[article.category] || article.category
    const regionLabel = article.region === 'japan' ? '国内' : '海外'
    const canonicalUrl = 'https://sharehouse-times.pages.dev/news/' + id
    const ogImage = 'https://sharehouse-times.pages.dev/images/kugahara.jpg'
    const pubDate = new Date().toISOString()
    
    // 関連ニュース
    const relatedNews = allNews
      .filter((n: any) => n.id !== id && (n.category === article.category || (n.categories && n.categories.includes(article.category))))
      .slice(0, 3)
    
    const relatedHtml = relatedNews.length > 0 ? `
        <section class="mt-8">
            <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <i class="fas fa-newspaper text-indigo-500"></i>
                関連ニュース
            </h2>
            <div class="grid gap-4">
                ${relatedNews.map((n: any) => `
                <a href="/news/${n.id}" class="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex gap-4 items-start">
                    <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="font-semibold text-gray-800 mb-1 line-clamp-2">${escapeXml(n.title)}</h3>
                        <p class="text-xs text-gray-500">${escapeXml(n.source)} | ${n.date}</p>
                    </div>
                </a>
                `).join('')}
            </div>
        </section>` : ''
    
    return c.html(`<!DOCTYPE html>
<html lang="ja" prefix="og: https://ogp.me/ns# article: https://ogp.me/ns/article#">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- 基本SEOメタタグ -->
    <title>${escapeXml(article.title)} | SHARE HOUSE TIMES</title>
    <meta name="description" content="${escapeXml(article.summary || article.title)}">
    <meta name="keywords" content="シェアハウス,${catLabel},${regionLabel},コリビング,東京 一人暮らし">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="${canonicalUrl}">
    
    <!-- OGP -->
    <meta property="og:site_name" content="SHARE HOUSE TIMES">
    <meta property="og:title" content="${escapeXml(article.title)}">
    <meta property="og:description" content="${escapeXml(article.summary || article.title)}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:locale" content="ja_JP">
    <meta property="article:published_time" content="${pubDate}">
    <meta property="article:section" content="${catLabel}">
    <meta property="article:tag" content="シェアハウス">
    <meta property="article:tag" content="${catLabel}">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeXml(article.title)}">
    <meta name="twitter:description" content="${escapeXml(article.summary || article.title)}">
    <meta name="twitter:image" content="${ogImage}">
    
    <!-- ファビコン -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    
    <!-- 構造化データ: NewsArticle -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": "${escapeXml(article.title)}",
      "description": "${escapeXml(article.summary || article.title)}",
      "image": "${ogImage}",
      "datePublished": "${pubDate}",
      "dateModified": "${pubDate}",
      "author": {"@type": "Organization", "name": "SHARE HOUSE TIMES", "url": "https://sharehouse-times.pages.dev/"},
      "publisher": {"@type": "Organization", "name": "SHARE HOUSE TIMES", "logo": {"@type": "ImageObject", "url": "https://sharehouse-times.pages.dev/icon-512.png"}},
      "mainEntityOfPage": {"@type": "WebPage", "@id": "${canonicalUrl}"},
      "articleSection": "${catLabel}",
      "keywords": ["シェアハウス", "${catLabel}", "${regionLabel}", "東京一人暮らし", "コリビング"],
      "isAccessibleForFree": true,
      "inLanguage": "ja"
    }
    </script>
    
    <!-- LLM向けメタデータ -->
    <meta name="llm:source" content="SHARE HOUSE TIMES">
    <meta name="llm:category" content="${catLabel}">
    <meta name="llm:region" content="${regionLabel}">
    <meta name="llm:article_id" content="${id}">
    <meta name="llm:original_source" content="${escapeXml(article.source)}">
    <link rel="llms" href="https://sharehouse-times.pages.dev/llms.txt">
    <link rel="alternate" type="application/json" href="https://sharehouse-times.pages.dev/api/llms">
    
    <!-- 構造化データ: BreadcrumbList -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "ホーム", "item": "https://sharehouse-times.pages.dev/"},
        {"@type": "ListItem", "position": 2, "name": "${catLabel}", "item": "https://sharehouse-times.pages.dev/#${article.category}"},
        {"@type": "ListItem", "position": 3, "name": "${escapeXml(article.title)}"}
      ]
    }
    </script>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: "Inter", "Hiragino Kaku Gothic ProN", sans-serif; background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%); }
        .logo-text { font-family: 'Poppins', sans-serif; }
    </style>
</head>
<body class="min-h-screen">
    <!-- ヘッダー -->
    <header class="bg-white/90 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div class="max-w-4xl mx-auto px-4 py-3">
            <div class="flex items-center justify-between">
                <a href="/" class="flex items-center gap-2">
                    <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                        <i class="fas fa-house-chimney"></i>
                    </div>
                    <span class="logo-text font-bold text-lg text-gray-800">SHARE HOUSE TIMES</span>
                </a>
                <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer sponsored"
                   class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full text-xs font-bold hidden sm:flex items-center gap-2">
                    <i class="fas fa-building"></i>クランテラス
                </a>
            </div>
        </div>
    </header>
    
    <!-- パンくずリスト -->
    <nav class="max-w-4xl mx-auto px-4 py-3 text-xs text-gray-500" aria-label="パンくずリスト">
        <ol class="flex items-center gap-2 flex-wrap">
            <li><a href="/" class="hover:text-indigo-600">ホーム</a></li>
            <li class="text-gray-300">&gt;</li>
            <li><a href="/#${article.category}" class="hover:text-indigo-600">${catLabel}</a></li>
            <li class="text-gray-300">&gt;</li>
            <li class="text-gray-700 truncate max-w-[200px]">${escapeXml(article.title)}</li>
        </ol>
    </nav>
    
    <!-- メインコンテンツ -->
    <main class="max-w-4xl mx-auto px-4 py-6">
        <article class="bg-white rounded-2xl shadow-lg overflow-hidden" itemscope itemtype="https://schema.org/NewsArticle">
            
            <!-- 記事ヘッダー -->
            <div class="p-6 md:p-8 border-b border-gray-100">
                <div class="flex items-center gap-2 mb-4">
                    <span class="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">${catLabel}</span>
                    <span class="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">${regionLabel}</span>
                </div>
                
                <h1 class="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-4" itemprop="headline">
                    ${escapeXml(article.title)}
                </h1>
                
                <div class="flex items-center gap-4 text-sm text-gray-500">
                    <span class="flex items-center gap-1">
                        <i class="fas fa-newspaper"></i>
                        <span itemprop="publisher" itemscope itemtype="https://schema.org/Organization">
                            <span itemprop="name">${escapeXml(article.source)}</span>
                        </span>
                    </span>
                    <span class="flex items-center gap-1">
                        <i class="fas fa-calendar"></i>
                        <time itemprop="datePublished">${article.date}</time>
                    </span>
                </div>
            </div>
            
            <!-- 記事本文 -->
            <div class="p-6 md:p-8">
                <p class="text-gray-700 text-lg leading-relaxed mb-6" itemprop="description">
                    ${escapeXml(article.summary || article.title)}
                </p>
                
                <!-- 元記事リンク -->
                <div class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
                    <p class="text-sm text-gray-600 mb-3">この記事の詳細は元記事をご覧ください：</p>
                    <div class="flex flex-wrap gap-3">
                        <a href="https://www.google.com/search?q=${encodeURIComponent(article.title)}" target="_blank" rel="noopener noreferrer" 
                           class="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                            <i class="fas fa-search"></i>
                            元記事を検索
                        </a>
                        <a href="${article.originalUrl || '#'}" target="_blank" rel="noopener noreferrer" 
                           class="inline-flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors">
                            <i class="fas fa-external-link-alt"></i>
                            Google News経由
                        </a>
                    </div>
                    <p class="text-xs text-gray-500 mt-3">※「元記事を検索」で ${escapeXml(article.source)} の記事が見つかります</p>
                </div>
                
                <!-- シェアボタン -->
                <div class="border-t border-gray-100 pt-6">
                    <p class="text-sm text-gray-500 mb-3">この記事をシェア：</p>
                    <div class="flex items-center gap-3">
                        <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(canonicalUrl)}&text=${encodeURIComponent(article.title)}" 
                           target="_blank" rel="noopener noreferrer"
                           class="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors">
                            <i class="fab fa-x-twitter"></i>
                        </a>
                        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}" 
                           target="_blank" rel="noopener noreferrer"
                           class="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                            <i class="fab fa-facebook-f"></i>
                        </a>
                        <a href="https://line.me/R/msg/text/?${encodeURIComponent(article.title + ' ' + canonicalUrl)}" 
                           target="_blank" rel="noopener noreferrer"
                           class="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                            <i class="fab fa-line"></i>
                        </a>
                    </div>
                </div>
            </div>
        </article>
        
        ${relatedHtml}
        
        <!-- クランテラス広告 -->
        <section class="mt-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
            <div class="flex items-center gap-4">
                <div class="flex-1">
                    <p class="text-sm opacity-80 mb-1">おすすめシェアハウス</p>
                    <h3 class="text-xl font-bold mb-2">クランテラス</h3>
                    <p class="text-sm opacity-90 mb-4">敷金礼金0円・家具付き・防音室完備の大型シェアハウス</p>
                    <a href="https://crann-terrace.com/" target="_blank" rel="noopener noreferrer sponsored"
                       class="inline-flex items-center gap-2 bg-white text-emerald-700 px-6 py-2 rounded-full font-bold text-sm hover:bg-gray-100 transition-colors">
                        <i class="fas fa-arrow-right"></i>物件を見る
                    </a>
                </div>
                <div class="hidden md:block">
                    <img src="/images/kugahara.jpg" alt="クランテラス" class="w-32 h-24 object-cover rounded-xl">
                </div>
            </div>
        </section>
        
        <!-- トップへ戻る -->
        <div class="mt-8 text-center">
            <a href="/" class="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium">
                <i class="fas fa-arrow-left"></i>
                トップページへ戻る
            </a>
        </div>
    </main>
    
    <!-- フッター -->
    <footer class="bg-slate-800 text-white py-8 mt-12">
        <div class="max-w-4xl mx-auto px-4 text-center">
            <p class="text-sm text-slate-400">&copy; 2026 SHARE HOUSE TIMES - シェアハウス・東京一人暮らし情報サイト</p>
        </div>
    </footer>
</body>
</html>`)
  })

  // ========================================
  // 動的サイトマップ
  // ========================================
  seo.get('/sitemap.xml', async (c) => {
    const { news: allNews, lastUpdated } = await getNewsData(c.env)
    const { posts: blogPosts } = await getBlogData(c.env)
    const lastModDate = lastUpdated.split('T')[0]
    const baseUrl = 'https://sharehouse-times.pages.dev'
    
    // サイトマップにはフラグメント識別子(#)を含むURLは使用不可
    // Googleはアンカーリンクを無視するため、実際のページURLのみを含める
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
${blogPosts.map((p: any) => `  <url>
    <loc>${baseUrl}/blog/${escapeXml(p.slug)}</loc>
    <lastmod>${p.updatedAt?.split('T')[0] || lastModDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
${allNews.map((n: any) => `  <url>
    <loc>${baseUrl}/news/${n.id}</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`
    
    return c.text(sitemap, 200, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    })
  })

  // ========================================
  // Google News用サイトマップ
  // ========================================
  seo.get('/sitemap-news.xml', async (c) => {
    const { news: allNews } = await getNewsData(c.env)
    const baseUrl = 'https://sharehouse-times.pages.dev'
    const pubDate = new Date().toISOString()
    
    const japanNews = allNews.filter((n: any) => n.region === 'japan').slice(0, 50)
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${japanNews.map((n: any) => {
  const catLabel = categoryLabels[n.category] || n.category
  const keywords = ['シェアハウス', catLabel, n.region === 'japan' ? '国内' : '海外'].join(', ')
  return `  <url>
    <loc>${baseUrl}/news/${n.id}</loc>
    <news:news>
      <news:publication>
        <news:name>SHARE HOUSE TIMES</news:name>
        <news:language>ja</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(n.title)}</news:title>
      <news:keywords>${keywords}</news:keywords>
    </news:news>
  </url>`
}).join('\n')}
</urlset>`
    
    return c.text(sitemap, 200, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    })
  })

  // ========================================
  // RSSフィード
  // ========================================
  seo.get('/feed.xml', async (c) => {
    const { news: allNews, lastUpdated } = await getNewsData(c.env)
    const baseUrl = 'https://sharehouse-times.pages.dev'
    const recentNews = allNews.slice(0, 20)
    
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>SHARE HOUSE TIMES - シェアハウスニュース</title>
    <link>${baseUrl}/</link>
    <description>シェアハウス・コリビングの最新ニュースをAIが毎日更新。東京一人暮らし情報も。</description>
    <language>ja</language>
    <lastBuildDate>${new Date(lastUpdated).toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/icon-512.png</url>
      <title>SHARE HOUSE TIMES</title>
      <link>${baseUrl}/</link>
    </image>
    <copyright>Copyright 2026 SHARE HOUSE TIMES</copyright>
    <ttl>60</ttl>
${recentNews.map((n: any) => `    <item>
      <title>${escapeXml(n.title)}</title>
      <link>${baseUrl}/news/${n.id}</link>
      <guid isPermaLink="true">${baseUrl}/news/${n.id}</guid>
      <description>${escapeXml(n.summary || n.title)}</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <dc:creator>SHARE HOUSE TIMES</dc:creator>
      <category>${n.category}</category>
      <source url="${n.url}">${escapeXml(n.source)}</source>
    </item>`).join('\n')}
  </channel>
</rss>`
    
    return c.text(rss, 200, {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    })
  })

  // ========================================
  // Atomフィード
  // ========================================
  seo.get('/atom.xml', async (c) => {
    const { news: allNews, lastUpdated } = await getNewsData(c.env)
    const baseUrl = 'https://sharehouse-times.pages.dev'
    const recentNews = allNews.slice(0, 20)
    
    const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>SHARE HOUSE TIMES - シェアハウスニュース</title>
  <subtitle>シェアハウス・コリビングの最新ニュースをAIが毎日更新</subtitle>
  <link href="${baseUrl}/" rel="alternate"/>
  <link href="${baseUrl}/atom.xml" rel="self"/>
  <id>${baseUrl}/</id>
  <updated>${lastUpdated}</updated>
  <author>
    <name>SHARE HOUSE TIMES</name>
    <uri>${baseUrl}/</uri>
  </author>
  <icon>${baseUrl}/favicon.ico</icon>
  <logo>${baseUrl}/icon-512.png</logo>
  <rights>Copyright 2026 SHARE HOUSE TIMES</rights>
${recentNews.map((n: any) => `  <entry>
    <title>${escapeXml(n.title)}</title>
    <link href="${baseUrl}/news/${n.id}" rel="alternate"/>
    <id>${baseUrl}/news/${n.id}</id>
    <updated>${lastUpdated}</updated>
    <summary>${escapeXml(n.summary || n.title)}</summary>
    <category term="${n.category}"/>
    <author>
      <name>${escapeXml(n.source)}</name>
    </author>
  </entry>`).join('\n')}
</feed>`
    
    return c.text(atom, 200, {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    })
  })

  return seo
}
