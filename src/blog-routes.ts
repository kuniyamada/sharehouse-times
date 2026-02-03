/**
 * ブログ機能のルート定義
 * - ブログ一覧・詳細ページ
 * - 管理画面（投稿・編集・削除）
 * - API エンドポイント
 */

import { Hono } from 'hono'

// ブログ記事の型定義
interface BlogPost {
  id: string
  slug: string
  title: string
  content: string
  excerpt: string
  category: string
  tags: string[]
  author: string
  publishedAt: string
  updatedAt: string
  status: 'draft' | 'published'
  metaDescription?: string
  ogImage?: string
}

interface BlogData {
  posts: BlogPost[]
  lastUpdated: string
}

type Bindings = {
  NEWS_KV: KVNamespace
}

// スタイル定義
const blogStyles = `
  .blog-container { max-width: 800px; margin: 0 auto; padding: 20px; }
  .blog-card { background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .blog-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
  .blog-title { font-size: 1.5rem; font-weight: bold; color: #1a1a1a; margin-bottom: 12px; }
  .blog-title a { color: inherit; text-decoration: none; }
  .blog-title a:hover { color: #6366f1; }
  .blog-meta { color: #666; font-size: 0.875rem; margin-bottom: 12px; }
  .blog-excerpt { color: #444; line-height: 1.6; }
  .blog-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
  .blog-tag { background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 16px; font-size: 0.75rem; }
  .blog-content { line-height: 1.8; color: #333; }
  .blog-content h2 { font-size: 1.5rem; font-weight: bold; margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
  .blog-content h3 { font-size: 1.25rem; font-weight: bold; margin: 24px 0 12px; }
  .blog-content p { margin-bottom: 16px; }
  .blog-content ul, .blog-content ol { margin-bottom: 16px; padding-left: 24px; }
  .blog-content li { margin-bottom: 8px; }
  .blog-content blockquote { border-left: 4px solid #6366f1; padding-left: 16px; margin: 16px 0; color: #555; font-style: italic; }
  .blog-content code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
  .blog-content pre { background: #1f2937; color: #e5e7eb; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 16px 0; }
  .blog-content pre code { background: none; padding: 0; }
  .category-badge { display: inline-block; background: #6366f1; color: white; padding: 4px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: 500; }
  .btn { display: inline-block; padding: 10px 20px; border-radius: 8px; font-weight: 500; text-decoration: none; cursor: pointer; border: none; }
  .btn-primary { background: #6366f1; color: white; }
  .btn-primary:hover { background: #4f46e5; }
  .btn-secondary { background: #e5e7eb; color: #374151; }
  .btn-secondary:hover { background: #d1d5db; }
  .btn-danger { background: #ef4444; color: white; }
  .btn-danger:hover { background: #dc2626; }
  .form-group { margin-bottom: 20px; }
  .form-label { display: block; font-weight: 500; margin-bottom: 8px; color: #374151; }
  .form-input { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem; }
  .form-input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }
  .form-textarea { min-height: 300px; font-family: inherit; resize: vertical; }
  .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .post-list { background: white; border-radius: 12px; overflow: hidden; }
  .post-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
  .post-item:last-child { border-bottom: none; }
  .post-item:hover { background: #f9fafb; }
  .post-status { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 500; }
  .status-published { background: #d1fae5; color: #065f46; }
  .status-draft { background: #fef3c7; color: #92400e; }
  .action-buttons { display: flex; gap: 8px; }
  .empty-state { text-align: center; padding: 60px 20px; color: #6b7280; }
`

// Markdown簡易パーサー
function parseMarkdown(text: string): string {
  return text
    // コードブロック
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    // インラインコード
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // 見出し
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // 太字・斜体
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // リンク
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // 引用
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // リスト
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // 段落
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, (match) => {
      if (match.startsWith('<')) return match
      return match
    })
}

// HTMLエスケープ
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// スラッグ生成
function generateSlug(title: string): string {
  const timestamp = Date.now().toString(36)
  const simplified = title
    .toLowerCase()
    .replace(/[^\w\s\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)
  return `${simplified}-${timestamp}`
}

// ブログデータ取得
async function getBlogData(kv: KVNamespace): Promise<BlogData> {
  try {
    const data = await kv.get('blog_data', 'json') as BlogData | null
    return data || { posts: [], lastUpdated: new Date().toISOString() }
  } catch {
    return { posts: [], lastUpdated: new Date().toISOString() }
  }
}

// ブログデータ保存
async function saveBlogData(kv: KVNamespace, data: BlogData): Promise<void> {
  await kv.put('blog_data', JSON.stringify(data))
}

export function createBlogRoutes() {
  const blog = new Hono<{ Bindings: Bindings }>()

  // ============================================
  // 公開ページ
  // ============================================

  // ブログ一覧ページ
  blog.get('/blog', async (c) => {
    const { NEWS_KV } = c.env
    const blogData = await getBlogData(NEWS_KV)
    const publishedPosts = blogData.posts
      .filter(p => p.status === 'published')
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    const postsHtml = publishedPosts.length > 0
      ? publishedPosts.map(post => `
          <article class="blog-card">
            <span class="category-badge">${escapeHtml(post.category)}</span>
            <h2 class="blog-title" style="margin-top: 12px;">
              <a href="/blog/${escapeHtml(post.slug)}">${escapeHtml(post.title)}</a>
            </h2>
            <div class="blog-meta">
              <span>${new Date(post.publishedAt).toLocaleDateString('ja-JP')}</span>
              <span style="margin: 0 8px;">•</span>
              <span>${escapeHtml(post.author)}</span>
            </div>
            <p class="blog-excerpt">${escapeHtml(post.excerpt)}</p>
            <div class="blog-tags">
              ${post.tags.map(tag => `<span class="blog-tag">#${escapeHtml(tag)}</span>`).join('')}
            </div>
          </article>
        `).join('')
      : `<div class="empty-state">
          <p style="font-size: 1.25rem; margin-bottom: 8px;">📝 まだ記事がありません</p>
          <p>最初の記事を投稿してください</p>
        </div>`

    return c.html(`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ブログ | SHARE HOUSE TIMES</title>
        <meta name="description" content="シェアハウス・コリビングに関する最新情報、選び方のコツ、体験談などをお届けします。">
        <link rel="canonical" href="https://sharehouse-times.pages.dev/blog">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>${blogStyles}</style>
      </head>
      <body style="background: #f3f4f6; min-height: 100vh;">
        <header style="background: white; border-bottom: 1px solid #e5e7eb; padding: 16px 0;">
          <div class="blog-container" style="display: flex; justify-content: space-between; align-items: center;">
            <a href="/" style="font-size: 1.25rem; font-weight: bold; color: #6366f1; text-decoration: none;">
              ← SHARE HOUSE TIMES
            </a>
            <span style="color: #666;">ブログ</span>
          </div>
        </header>
        
        <main class="blog-container" style="padding-top: 40px; padding-bottom: 60px;">
          <h1 style="font-size: 2rem; font-weight: bold; margin-bottom: 32px;">📚 ブログ</h1>
          ${postsHtml}
        </main>
      </body>
      </html>
    `)
  })

  // ブログ詳細ページ
  blog.get('/blog/:slug', async (c) => {
    const slug = c.req.param('slug')
    const { NEWS_KV } = c.env
    const blogData = await getBlogData(NEWS_KV)
    const post = blogData.posts.find(p => p.slug === slug && p.status === 'published')

    if (!post) {
      return c.html(`
        <!DOCTYPE html>
        <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <title>記事が見つかりません | SHARE HOUSE TIMES</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body style="background: #f3f4f6; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
          <div style="text-align: center;">
            <h1 style="font-size: 2rem; margin-bottom: 16px;">📄 記事が見つかりません</h1>
            <a href="/blog" style="color: #6366f1;">ブログ一覧に戻る</a>
          </div>
        </body>
        </html>
      `, 404)
    }

    const contentHtml = parseMarkdown(post.content)

    return c.html(`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(post.title)} | SHARE HOUSE TIMES</title>
        <meta name="description" content="${escapeHtml(post.metaDescription || post.excerpt)}">
        <link rel="canonical" href="https://sharehouse-times.pages.dev/blog/${escapeHtml(post.slug)}">
        <meta property="og:title" content="${escapeHtml(post.title)}">
        <meta property="og:description" content="${escapeHtml(post.metaDescription || post.excerpt)}">
        <meta property="og:type" content="article">
        <meta property="og:url" content="https://sharehouse-times.pages.dev/blog/${escapeHtml(post.slug)}">
        ${post.ogImage ? `<meta property="og:image" content="${escapeHtml(post.ogImage)}">` : ''}
        <script src="https://cdn.tailwindcss.com"></script>
        <style>${blogStyles}</style>
      </head>
      <body style="background: #f3f4f6; min-height: 100vh;">
        <header style="background: white; border-bottom: 1px solid #e5e7eb; padding: 16px 0;">
          <div class="blog-container" style="display: flex; justify-content: space-between; align-items: center;">
            <a href="/blog" style="font-size: 1.25rem; font-weight: bold; color: #6366f1; text-decoration: none;">
              ← ブログ一覧
            </a>
          </div>
        </header>
        
        <main class="blog-container" style="padding-top: 40px; padding-bottom: 60px;">
          <article class="blog-card">
            <span class="category-badge">${escapeHtml(post.category)}</span>
            <h1 style="font-size: 2rem; font-weight: bold; margin: 16px 0;">${escapeHtml(post.title)}</h1>
            <div class="blog-meta" style="margin-bottom: 24px;">
              <span>📅 ${new Date(post.publishedAt).toLocaleDateString('ja-JP')}</span>
              <span style="margin: 0 8px;">•</span>
              <span>✍️ ${escapeHtml(post.author)}</span>
            </div>
            <div class="blog-content">
              <p>${contentHtml}</p>
            </div>
            <div class="blog-tags" style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              ${post.tags.map(tag => `<span class="blog-tag">#${escapeHtml(tag)}</span>`).join('')}
            </div>
          </article>
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="/blog" class="btn btn-secondary">← ブログ一覧に戻る</a>
          </div>
        </main>
      </body>
      </html>
    `)
  })

  // ============================================
  // 管理画面
  // ============================================

  const ADMIN_PASSWORD = 'sharehouse2026'

  // 管理画面トップ
  blog.get('/admin/blog', async (c) => {
    const { NEWS_KV } = c.env
    const blogData = await getBlogData(NEWS_KV)
    const posts = blogData.posts.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )

    const postsHtml = posts.length > 0
      ? posts.map(post => `
          <div class="post-item">
            <div>
              <div style="font-weight: 500; margin-bottom: 4px;">${escapeHtml(post.title)}</div>
              <div style="font-size: 0.875rem; color: #666;">
                ${new Date(post.updatedAt).toLocaleDateString('ja-JP')} • ${escapeHtml(post.category)}
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="post-status ${post.status === 'published' ? 'status-published' : 'status-draft'}">
                ${post.status === 'published' ? '公開中' : '下書き'}
              </span>
              <div class="action-buttons">
                <a href="/admin/blog/edit/${post.id}" class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.875rem;">編集</a>
                <button onclick="deletePost('${post.id}')" class="btn btn-danger" style="padding: 6px 12px; font-size: 0.875rem;">削除</button>
              </div>
            </div>
          </div>
        `).join('')
      : `<div class="empty-state">
          <p>まだ記事がありません</p>
        </div>`

    return c.html(`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ブログ管理 | SHARE HOUSE TIMES</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>${blogStyles}</style>
      </head>
      <body style="background: #f3f4f6; min-height: 100vh;">
        <div id="loginScreen" style="display: flex; align-items: center; justify-content: center; min-height: 100vh;">
          <div class="blog-card" style="width: 100%; max-width: 400px;">
            <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 24px; text-align: center;">🔐 ブログ管理</h1>
            <form id="loginForm">
              <div class="form-group">
                <label class="form-label">パスワード</label>
                <input type="password" id="password" class="form-input" placeholder="パスワードを入力">
              </div>
              <button type="submit" class="btn btn-primary" style="width: 100%;">ログイン</button>
            </form>
            <p id="loginError" style="color: #ef4444; text-align: center; margin-top: 12px; display: none;">パスワードが違います</p>
          </div>
        </div>
        
        <div id="dashboard" style="display: none;">
          <header style="background: white; border-bottom: 1px solid #e5e7eb; padding: 16px 0;">
            <div class="blog-container" style="display: flex; justify-content: space-between; align-items: center;">
              <a href="/admin" style="font-size: 1.25rem; font-weight: bold; color: #6366f1; text-decoration: none;">
                ← 管理画面
              </a>
              <button onclick="logout()" class="btn btn-secondary" style="padding: 6px 12px;">ログアウト</button>
            </div>
          </header>
          
          <main class="blog-container" style="padding-top: 40px; padding-bottom: 60px;">
            <div class="admin-header">
              <h1 style="font-size: 1.5rem; font-weight: bold;">📝 ブログ管理</h1>
              <a href="/admin/blog/new" class="btn btn-primary">+ 新規投稿</a>
            </div>
            
            <div class="post-list">
              ${postsHtml}
            </div>
          </main>
        </div>
        
        <script>
          const ADMIN_PASSWORD = '${ADMIN_PASSWORD}';
          
          // ログイン処理
          document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;
            if (password === ADMIN_PASSWORD) {
              sessionStorage.setItem('blogAuth', 'true');
              showDashboard();
            } else {
              document.getElementById('loginError').style.display = 'block';
            }
          });
          
          function showDashboard() {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
          }
          
          function logout() {
            sessionStorage.removeItem('blogAuth');
            location.reload();
          }
          
          async function deletePost(id) {
            if (!confirm('この記事を削除しますか？')) return;
            
            const res = await fetch('/api/blog/' + id, {
              method: 'DELETE',
              headers: { 'X-Admin-Password': ADMIN_PASSWORD }
            });
            
            if (res.ok) {
              location.reload();
            } else {
              alert('削除に失敗しました');
            }
          }
          
          // 初期化
          if (sessionStorage.getItem('blogAuth') === 'true') {
            showDashboard();
          }
        </script>
      </body>
      </html>
    `)
  })

  // 新規投稿画面
  blog.get('/admin/blog/new', async (c) => {
    return c.html(renderEditorPage(null))
  })

  // 編集画面
  blog.get('/admin/blog/edit/:id', async (c) => {
    const id = c.req.param('id')
    const { NEWS_KV } = c.env
    const blogData = await getBlogData(NEWS_KV)
    const post = blogData.posts.find(p => p.id === id)

    if (!post) {
      return c.redirect('/admin/blog')
    }

    return c.html(renderEditorPage(post))
  })

  // エディターページのHTML生成
  function renderEditorPage(post: BlogPost | null) {
    const isEdit = post !== null
    const title = isEdit ? '記事を編集' : '新規投稿'
    const ADMIN_PASSWORD = 'sharehouse2026'

    return `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} | SHARE HOUSE TIMES</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>${blogStyles}</style>
      </head>
      <body style="background: #f3f4f6; min-height: 100vh;">
        <header style="background: white; border-bottom: 1px solid #e5e7eb; padding: 16px 0;">
          <div class="blog-container" style="display: flex; justify-content: space-between; align-items: center;">
            <a href="/admin/blog" style="font-size: 1.25rem; font-weight: bold; color: #6366f1; text-decoration: none;">
              ← ブログ管理
            </a>
          </div>
        </header>
        
        <main class="blog-container" style="padding-top: 40px; padding-bottom: 60px;">
          <div class="blog-card">
            <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 24px;">✏️ ${title}</h1>
            
            <form id="postForm">
              <div class="form-group">
                <label class="form-label">タイトル *</label>
                <input type="text" id="title" class="form-input" value="${isEdit ? escapeHtml(post.title) : ''}" required>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-group">
                  <label class="form-label">カテゴリ *</label>
                  <select id="category" class="form-input" required>
                    <option value="入門ガイド" ${isEdit && post.category === '入門ガイド' ? 'selected' : ''}>入門ガイド</option>
                    <option value="選び方" ${isEdit && post.category === '選び方' ? 'selected' : ''}>選び方</option>
                    <option value="費用・相場" ${isEdit && post.category === '費用・相場' ? 'selected' : ''}>費用・相場</option>
                    <option value="エリア情報" ${isEdit && post.category === 'エリア情報' ? 'selected' : ''}>エリア情報</option>
                    <option value="体験談" ${isEdit && post.category === '体験談' ? 'selected' : ''}>体験談</option>
                    <option value="ニュース" ${isEdit && post.category === 'ニュース' ? 'selected' : ''}>ニュース</option>
                    <option value="コラム" ${isEdit && post.category === 'コラム' ? 'selected' : ''}>コラム</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label">著者名 *</label>
                  <input type="text" id="author" class="form-input" value="${isEdit ? escapeHtml(post.author) : '編集部'}" required>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">タグ（カンマ区切り）</label>
                <input type="text" id="tags" class="form-input" value="${isEdit ? post.tags.join(', ') : ''}" placeholder="シェアハウス, 東京, 一人暮らし">
              </div>
              
              <div class="form-group">
                <label class="form-label">抜粋（一覧表示用）</label>
                <textarea id="excerpt" class="form-input" rows="2" placeholder="記事の概要を入力...">${isEdit ? escapeHtml(post.excerpt) : ''}</textarea>
              </div>
              
              <div class="form-group">
                <label class="form-label">本文 *（Markdown対応）</label>
                <textarea id="content" class="form-input form-textarea" required placeholder="## 見出し

本文を入力...

- リスト項目1
- リスト項目2

**太字** や *斜体* も使えます。">${isEdit ? escapeHtml(post.content) : ''}</textarea>
              </div>
              
              <div class="form-group">
                <label class="form-label">メタディスクリプション（SEO用）</label>
                <textarea id="metaDescription" class="form-input" rows="2" placeholder="検索結果に表示される説明文...">${isEdit && post.metaDescription ? escapeHtml(post.metaDescription) : ''}</textarea>
              </div>
              
              <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 32px;">
                <button type="button" onclick="savePost('draft')" class="btn btn-secondary">下書き保存</button>
                <button type="button" onclick="savePost('published')" class="btn btn-primary">公開する</button>
              </div>
            </form>
          </div>
        </main>
        
        <script>
          const ADMIN_PASSWORD = '${ADMIN_PASSWORD}';
          const isEdit = ${isEdit};
          const postId = ${isEdit ? `'${post.id}'` : 'null'};
          
          async function savePost(status) {
            const data = {
              title: document.getElementById('title').value,
              category: document.getElementById('category').value,
              author: document.getElementById('author').value,
              tags: document.getElementById('tags').value.split(',').map(t => t.trim()).filter(t => t),
              excerpt: document.getElementById('excerpt').value,
              content: document.getElementById('content').value,
              metaDescription: document.getElementById('metaDescription').value,
              status: status
            };
            
            if (!data.title || !data.content) {
              alert('タイトルと本文は必須です');
              return;
            }
            
            const url = isEdit ? '/api/blog/' + postId : '/api/blog';
            const method = isEdit ? 'PUT' : 'POST';
            
            try {
              const res = await fetch(url, {
                method: method,
                headers: {
                  'Content-Type': 'application/json',
                  'X-Admin-Password': ADMIN_PASSWORD
                },
                body: JSON.stringify(data)
              });
              
              if (res.ok) {
                alert(status === 'published' ? '公開しました！' : '下書きを保存しました');
                location.href = '/admin/blog';
              } else {
                const err = await res.json();
                alert('エラー: ' + (err.message || '保存に失敗しました'));
              }
            } catch (e) {
              alert('エラー: ' + e.message);
            }
          }
        </script>
      </body>
      </html>
    `
  }

  // ============================================
  // API エンドポイント
  // ============================================

  // 記事一覧取得
  blog.get('/api/blog', async (c) => {
    const { NEWS_KV } = c.env
    const blogData = await getBlogData(NEWS_KV)
    const publishedPosts = blogData.posts
      .filter(p => p.status === 'published')
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    return c.json({ success: true, posts: publishedPosts, total: publishedPosts.length })
  })

  // 記事作成
  blog.post('/api/blog', async (c) => {
    const password = c.req.header('X-Admin-Password')
    if (password !== ADMIN_PASSWORD) {
      return c.json({ success: false, message: 'Unauthorized' }, 401)
    }

    const { NEWS_KV } = c.env
    const body = await c.req.json()
    const blogData = await getBlogData(NEWS_KV)

    const now = new Date().toISOString()
    const newPost: BlogPost = {
      id: crypto.randomUUID(),
      slug: generateSlug(body.title),
      title: body.title,
      content: body.content,
      excerpt: body.excerpt || body.content.substring(0, 150) + '...',
      category: body.category || '入門ガイド',
      tags: body.tags || [],
      author: body.author || '編集部',
      publishedAt: body.status === 'published' ? now : '',
      updatedAt: now,
      status: body.status || 'draft',
      metaDescription: body.metaDescription,
      ogImage: body.ogImage
    }

    blogData.posts.push(newPost)
    blogData.lastUpdated = now
    await saveBlogData(NEWS_KV, blogData)

    return c.json({ success: true, post: newPost })
  })

  // 記事更新
  blog.put('/api/blog/:id', async (c) => {
    const password = c.req.header('X-Admin-Password')
    if (password !== ADMIN_PASSWORD) {
      return c.json({ success: false, message: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id')
    const { NEWS_KV } = c.env
    const body = await c.req.json()
    const blogData = await getBlogData(NEWS_KV)

    const postIndex = blogData.posts.findIndex(p => p.id === id)
    if (postIndex === -1) {
      return c.json({ success: false, message: 'Post not found' }, 404)
    }

    const now = new Date().toISOString()
    const existingPost = blogData.posts[postIndex]
    
    blogData.posts[postIndex] = {
      ...existingPost,
      slug: body.slug || existingPost.slug,
      title: body.title || existingPost.title,
      content: body.content || existingPost.content,
      excerpt: body.excerpt || existingPost.excerpt,
      category: body.category || existingPost.category,
      tags: body.tags || existingPost.tags,
      author: body.author || existingPost.author,
      publishedAt: body.status === 'published' && !existingPost.publishedAt ? now : existingPost.publishedAt,
      updatedAt: now,
      status: body.status || existingPost.status,
      metaDescription: body.metaDescription,
      ogImage: body.ogImage
    }

    blogData.lastUpdated = now
    await saveBlogData(NEWS_KV, blogData)

    return c.json({ success: true, post: blogData.posts[postIndex] })
  })

  // 記事削除
  blog.delete('/api/blog/:id', async (c) => {
    const password = c.req.header('X-Admin-Password')
    if (password !== ADMIN_PASSWORD) {
      return c.json({ success: false, message: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id')
    const { NEWS_KV } = c.env
    const blogData = await getBlogData(NEWS_KV)

    const postIndex = blogData.posts.findIndex(p => p.id === id)
    if (postIndex === -1) {
      return c.json({ success: false, message: 'Post not found' }, 404)
    }

    blogData.posts.splice(postIndex, 1)
    blogData.lastUpdated = new Date().toISOString()
    await saveBlogData(NEWS_KV, blogData)

    return c.json({ success: true })
  })

  return blog
}
