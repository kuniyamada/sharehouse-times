/**
 * バックアップ機能のルート定義
 * - バックアップ作成
 * - バックアップ一覧・プレビュー
 * - バックアップ復元
 */

import { Hono } from 'hono'

type Bindings = {
  NEWS_KV: KVNamespace
}

// バックアップデータの型定義
interface BackupData {
  id: string
  name: string
  createdAt: string
  description: string
  data: {
    news?: any
    blog?: any
  }
  size: number
}

interface BackupList {
  backups: BackupData[]
  lastUpdated: string
}

const ADMIN_PASSWORD = 'sharehouse2026'

// スタイル定義
const backupStyles = `
  .backup-container { max-width: 1000px; margin: 0 auto; padding: 20px; }
  .backup-card { background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .backup-item { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid #e5e7eb; }
  .backup-item:last-child { border-bottom: none; }
  .backup-item:hover { background: #f9fafb; }
  .btn { display: inline-block; padding: 8px 16px; border-radius: 8px; font-weight: 500; text-decoration: none; cursor: pointer; border: none; font-size: 0.875rem; }
  .btn-primary { background: #6366f1; color: white; }
  .btn-primary:hover { background: #4f46e5; }
  .btn-secondary { background: #e5e7eb; color: #374151; }
  .btn-secondary:hover { background: #d1d5db; }
  .btn-success { background: #10b981; color: white; }
  .btn-success:hover { background: #059669; }
  .btn-danger { background: #ef4444; color: white; }
  .btn-danger:hover { background: #dc2626; }
  .btn-sm { padding: 6px 12px; font-size: 0.75rem; }
  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-weight: 500; margin-bottom: 8px; color: #374151; }
  .form-input { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.875rem; }
  .form-input:focus { outline: none; border-color: #6366f1; }
  .preview-section { background: #f9fafb; border-radius: 8px; padding: 16px; margin-top: 16px; max-height: 400px; overflow-y: auto; }
  .preview-title { font-weight: 600; color: #374151; margin-bottom: 12px; }
  .preview-item { background: white; padding: 12px; border-radius: 6px; margin-bottom: 8px; border: 1px solid #e5e7eb; }
  .preview-item-title { font-weight: 500; color: #1f2937; }
  .preview-item-meta { font-size: 0.75rem; color: #6b7280; margin-top: 4px; }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .stat-card { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 16px; border-radius: 12px; text-align: center; }
  .stat-value { font-size: 1.5rem; font-weight: bold; }
  .stat-label { font-size: 0.75rem; opacity: 0.8; }
  .tab-container { display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
  .tab-btn { padding: 8px 16px; border: none; background: none; cursor: pointer; font-weight: 500; color: #6b7280; border-radius: 8px 8px 0 0; }
  .tab-btn.active { color: #6366f1; background: #eef2ff; }
  .tab-content { display: none; }
  .tab-content.active { display: block; }
  .empty-state { text-align: center; padding: 40px 20px; color: #6b7280; }
  .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; }
  .modal.show { display: flex; }
  .modal-content { background: white; border-radius: 16px; padding: 24px; max-width: 800px; width: 90%; max-height: 80vh; overflow-y: auto; }
  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280; }
`

// バックアップ一覧を取得
async function getBackupList(kv: KVNamespace): Promise<BackupList> {
  try {
    const data = await kv.get('backup_list', 'json') as BackupList | null
    return data || { backups: [], lastUpdated: new Date().toISOString() }
  } catch {
    return { backups: [], lastUpdated: new Date().toISOString() }
  }
}

// バックアップ一覧を保存
async function saveBackupList(kv: KVNamespace, data: BackupList): Promise<void> {
  await kv.put('backup_list', JSON.stringify(data))
}

// 個別バックアップデータを取得
async function getBackupData(kv: KVNamespace, backupId: string): Promise<BackupData | null> {
  try {
    const data = await kv.get(`backup_${backupId}`, 'json') as BackupData | null
    return data
  } catch {
    return null
  }
}

// 個別バックアップデータを保存
async function saveBackupData(kv: KVNamespace, backup: BackupData): Promise<void> {
  await kv.put(`backup_${backup.id}`, JSON.stringify(backup))
}

// 個別バックアップデータを削除
async function deleteBackupData(kv: KVNamespace, backupId: string): Promise<void> {
  await kv.delete(`backup_${backupId}`)
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

// サイズをフォーマット
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function createBackupRoutes() {
  const backup = new Hono<{ Bindings: Bindings }>()

  // ============================================
  // 管理画面
  // ============================================

  // バックアップ管理画面
  backup.get('/admin/backup', async (c) => {
    const { NEWS_KV } = c.env
    const backupList = await getBackupList(NEWS_KV)
    const backups = backupList.backups.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    const backupsHtml = backups.length > 0
      ? backups.map(b => `
          <div class="backup-item">
            <div>
              <div style="font-weight: 600; color: #1f2937;">${escapeHtml(b.name)}</div>
              <div style="font-size: 0.75rem; color: #6b7280; margin-top: 4px;">
                ${new Date(b.createdAt).toLocaleString('ja-JP')} • ${formatSize(b.size)}
              </div>
              ${b.description ? `<div style="font-size: 0.75rem; color: #9ca3af; margin-top: 2px;">${escapeHtml(b.description)}</div>` : ''}
            </div>
            <div style="display: flex; gap: 8px;">
              <button onclick="previewBackup('${b.id}')" class="btn btn-secondary btn-sm">
                <i class="fas fa-eye mr-1"></i>プレビュー
              </button>
              <button onclick="restoreBackup('${b.id}')" class="btn btn-success btn-sm">
                <i class="fas fa-undo mr-1"></i>復元
              </button>
              <button onclick="deleteBackup('${b.id}')" class="btn btn-danger btn-sm">
                <i class="fas fa-trash mr-1"></i>削除
              </button>
            </div>
          </div>
        `).join('')
      : `<div class="empty-state">
          <i class="fas fa-archive" style="font-size: 2rem; margin-bottom: 12px; color: #d1d5db;"></i>
          <p>まだバックアップがありません</p>
        </div>`

    return c.html(`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>バックアップ管理 | SHARE HOUSE TIMES</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>${backupStyles}</style>
      </head>
      <body style="background: #f3f4f6; min-height: 100vh;">
        <div id="loginScreen" style="display: flex; align-items: center; justify-content: center; min-height: 100vh;">
          <div class="backup-card" style="width: 100%; max-width: 400px;">
            <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 24px; text-align: center;">
              <i class="fas fa-archive mr-2 text-indigo-500"></i>バックアップ管理
            </h1>
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
            <div class="backup-container" style="display: flex; justify-content: space-between; align-items: center;">
              <a href="/admin" style="font-size: 1.25rem; font-weight: bold; color: #6366f1; text-decoration: none;">
                ← 管理画面
              </a>
              <button onclick="logout()" class="btn btn-secondary" style="padding: 6px 12px;">ログアウト</button>
            </div>
          </header>
          
          <main class="backup-container" style="padding-top: 24px; padding-bottom: 60px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
              <h1 style="font-size: 1.5rem; font-weight: bold;">
                <i class="fas fa-archive mr-2 text-indigo-500"></i>バックアップ管理
              </h1>
              <button onclick="showCreateModal()" class="btn btn-primary">
                <i class="fas fa-plus mr-2"></i>新規バックアップ
              </button>
            </div>
            
            <!-- 統計 -->
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${backups.length}</div>
                <div class="stat-label">バックアップ数</div>
              </div>
              <div class="stat-card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                <div class="stat-value">${formatSize(backups.reduce((sum, b) => sum + b.size, 0))}</div>
                <div class="stat-label">合計サイズ</div>
              </div>
              <div class="stat-card" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                <div class="stat-value">${backups.length > 0 ? new Date(backups[0].createdAt).toLocaleDateString('ja-JP') : '-'}</div>
                <div class="stat-label">最新バックアップ</div>
              </div>
            </div>
            
            <!-- バックアップ一覧 -->
            <div class="backup-card">
              <h2 style="font-size: 1rem; font-weight: 600; margin-bottom: 16px;">
                <i class="fas fa-list mr-2"></i>バックアップ一覧
              </h2>
              <div id="backupList">
                ${backupsHtml}
              </div>
            </div>
          </main>
        </div>
        
        <!-- 新規バックアップモーダル -->
        <div id="createModal" class="modal">
          <div class="modal-content">
            <div class="modal-header">
              <h2 style="font-size: 1.25rem; font-weight: bold;">
                <i class="fas fa-plus-circle mr-2 text-indigo-500"></i>新規バックアップ
              </h2>
              <button onclick="closeModal('createModal')" class="modal-close">&times;</button>
            </div>
            <form id="createForm">
              <div class="form-group">
                <label class="form-label">バックアップ名 *</label>
                <input type="text" id="backupName" class="form-input" placeholder="例: 2026年1月の定期バックアップ" required>
              </div>
              <div class="form-group">
                <label class="form-label">説明（任意）</label>
                <textarea id="backupDesc" class="form-input" rows="2" placeholder="バックアップの説明..."></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">バックアップ対象</label>
                <div style="display: flex; gap: 16px;">
                  <label style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" id="includeNews" checked> ニュースデータ
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" id="includeBlog" checked> ブログ記事
                  </label>
                </div>
              </div>
              <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
                <button type="button" onclick="closeModal('createModal')" class="btn btn-secondary">キャンセル</button>
                <button type="submit" class="btn btn-primary">
                  <i class="fas fa-save mr-2"></i>バックアップ作成
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <!-- プレビューモーダル -->
        <div id="previewModal" class="modal">
          <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header">
              <h2 id="previewTitle" style="font-size: 1.25rem; font-weight: bold;">
                <i class="fas fa-eye mr-2 text-indigo-500"></i>バックアッププレビュー
              </h2>
              <button onclick="closeModal('previewModal')" class="modal-close">&times;</button>
            </div>
            <div id="previewContent">
              <div class="empty-state">読み込み中...</div>
            </div>
          </div>
        </div>
        
        <script>
          const ADMIN_PASSWORD = '${ADMIN_PASSWORD}';
          
          // ログイン処理
          document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;
            if (password === ADMIN_PASSWORD) {
              sessionStorage.setItem('backupAuth', 'true');
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
            sessionStorage.removeItem('backupAuth');
            location.reload();
          }
          
          function showCreateModal() {
            document.getElementById('createModal').classList.add('show');
          }
          
          function closeModal(id) {
            document.getElementById(id).classList.remove('show');
          }
          
          // 新規バックアップ作成
          document.getElementById('createForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('backupName').value;
            const description = document.getElementById('backupDesc').value;
            const includeNews = document.getElementById('includeNews').checked;
            const includeBlog = document.getElementById('includeBlog').checked;
            
            if (!name) {
              alert('バックアップ名を入力してください');
              return;
            }
            
            try {
              const res = await fetch('/api/backup', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Admin-Password': ADMIN_PASSWORD
                },
                body: JSON.stringify({ name, description, includeNews, includeBlog })
              });
              
              if (res.ok) {
                alert('バックアップを作成しました');
                location.reload();
              } else {
                const err = await res.json();
                alert('エラー: ' + (err.message || '作成に失敗しました'));
              }
            } catch (e) {
              alert('エラー: ' + e.message);
            }
          });
          
          // プレビュー
          async function previewBackup(id) {
            document.getElementById('previewModal').classList.add('show');
            document.getElementById('previewContent').innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i> 読み込み中...</div>';
            
            try {
              const res = await fetch('/api/backup/' + id, {
                headers: { 'X-Admin-Password': ADMIN_PASSWORD }
              });
              
              if (res.ok) {
                const data = await res.json();
                renderPreview(data.backup);
              } else {
                document.getElementById('previewContent').innerHTML = '<div class="empty-state">読み込みに失敗しました</div>';
              }
            } catch (e) {
              document.getElementById('previewContent').innerHTML = '<div class="empty-state">エラー: ' + e.message + '</div>';
            }
          }
          
          function renderPreview(backup) {
            document.getElementById('previewTitle').innerHTML = '<i class="fas fa-eye mr-2 text-indigo-500"></i>' + backup.name;
            
            let html = '<div style="margin-bottom: 16px; padding: 12px; background: #eef2ff; border-radius: 8px;">';
            html += '<div><strong>作成日時:</strong> ' + new Date(backup.createdAt).toLocaleString('ja-JP') + '</div>';
            html += '<div><strong>サイズ:</strong> ' + formatSize(backup.size) + '</div>';
            if (backup.description) {
              html += '<div><strong>説明:</strong> ' + escapeHtml(backup.description) + '</div>';
            }
            html += '</div>';
            
            html += '<div class="tab-container">';
            if (backup.data.news) {
              html += '<button class="tab-btn active" onclick="showTab(\\'news\\')">ニュース (' + (backup.data.news.news?.length || 0) + '件)</button>';
            }
            if (backup.data.blog) {
              html += '<button class="tab-btn' + (!backup.data.news ? ' active' : '') + '" onclick="showTab(\\'blog\\')">ブログ (' + (backup.data.blog.posts?.length || 0) + '件)</button>';
            }
            html += '</div>';
            
            // ニュースタブ
            if (backup.data.news) {
              html += '<div id="tab-news" class="tab-content active">';
              html += '<div class="preview-section">';
              const news = backup.data.news.news || [];
              if (news.length > 0) {
                news.slice(0, 20).forEach((n, i) => {
                  html += '<div class="preview-item">';
                  html += '<div class="preview-item-title">' + (i + 1) + '. ' + escapeHtml(n.title || '無題') + '</div>';
                  html += '<div class="preview-item-meta">' + (n.date || '-') + ' • ' + escapeHtml(n.source || '-') + '</div>';
                  html += '</div>';
                });
                if (news.length > 20) {
                  html += '<div style="text-align: center; color: #6b7280; padding: 12px;">他 ' + (news.length - 20) + ' 件...</div>';
                }
              } else {
                html += '<div class="empty-state">ニュースデータがありません</div>';
              }
              html += '</div></div>';
            }
            
            // ブログタブ
            if (backup.data.blog) {
              html += '<div id="tab-blog" class="tab-content' + (!backup.data.news ? ' active' : '') + '">';
              html += '<div class="preview-section">';
              const posts = backup.data.blog.posts || [];
              if (posts.length > 0) {
                posts.forEach((p, i) => {
                  html += '<div class="preview-item">';
                  html += '<div class="preview-item-title">' + (i + 1) + '. ' + escapeHtml(p.title || '無題') + '</div>';
                  html += '<div class="preview-item-meta">' + (p.status === 'published' ? '公開' : '下書き') + ' • ' + escapeHtml(p.category || '-') + ' • ' + escapeHtml(p.author || '-') + '</div>';
                  html += '</div>';
                });
              } else {
                html += '<div class="empty-state">ブログ記事がありません</div>';
              }
              html += '</div></div>';
            }
            
            document.getElementById('previewContent').innerHTML = html;
          }
          
          function showTab(tabName) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.querySelector('.tab-btn[onclick*="' + tabName + '"]').classList.add('active');
            document.getElementById('tab-' + tabName).classList.add('active');
          }
          
          function formatSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
          }
          
          function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
          }
          
          // 復元
          async function restoreBackup(id) {
            if (!confirm('このバックアップからデータを復元しますか？\\n現在のデータは上書きされます。')) return;
            
            try {
              const res = await fetch('/api/backup/' + id + '/restore', {
                method: 'POST',
                headers: { 'X-Admin-Password': ADMIN_PASSWORD }
              });
              
              if (res.ok) {
                alert('復元が完了しました');
                location.reload();
              } else {
                const err = await res.json();
                alert('エラー: ' + (err.message || '復元に失敗しました'));
              }
            } catch (e) {
              alert('エラー: ' + e.message);
            }
          }
          
          // 削除
          async function deleteBackup(id) {
            if (!confirm('このバックアップを削除しますか？')) return;
            
            try {
              const res = await fetch('/api/backup/' + id, {
                method: 'DELETE',
                headers: { 'X-Admin-Password': ADMIN_PASSWORD }
              });
              
              if (res.ok) {
                alert('削除しました');
                location.reload();
              } else {
                alert('削除に失敗しました');
              }
            } catch (e) {
              alert('エラー: ' + e.message);
            }
          }
          
          // 初期化
          if (sessionStorage.getItem('backupAuth') === 'true') {
            showDashboard();
          }
        </script>
      </body>
      </html>
    `)
  })

  // ============================================
  // API エンドポイント
  // ============================================

  // バックアップ一覧取得
  backup.get('/api/backup', async (c) => {
    const password = c.req.header('X-Admin-Password')
    if (password !== ADMIN_PASSWORD) {
      return c.json({ success: false, message: 'Unauthorized' }, 401)
    }

    const { NEWS_KV } = c.env
    const backupList = await getBackupList(NEWS_KV)
    
    return c.json({ 
      success: true, 
      backups: backupList.backups.map(b => ({
        id: b.id,
        name: b.name,
        createdAt: b.createdAt,
        description: b.description,
        size: b.size
      }))
    })
  })

  // バックアップ作成
  backup.post('/api/backup', async (c) => {
    const password = c.req.header('X-Admin-Password')
    if (password !== ADMIN_PASSWORD) {
      return c.json({ success: false, message: 'Unauthorized' }, 401)
    }

    const { NEWS_KV } = c.env
    const body = await c.req.json()
    const { name, description, includeNews, includeBlog } = body

    if (!name) {
      return c.json({ success: false, message: 'Name is required' }, 400)
    }

    // 現在のデータを取得
    const backupData: any = {}
    
    if (includeNews !== false) {
      const newsData = await NEWS_KV.get('news_data', 'json')
      if (newsData) {
        backupData.news = newsData
      }
    }
    
    if (includeBlog !== false) {
      const blogData = await NEWS_KV.get('blog_data', 'json')
      if (blogData) {
        backupData.blog = blogData
      }
    }

    const now = new Date().toISOString()
    const newBackup: BackupData = {
      id: crypto.randomUUID(),
      name,
      description: description || '',
      createdAt: now,
      data: backupData,
      size: JSON.stringify(backupData).length
    }

    // バックアップデータを保存
    await saveBackupData(NEWS_KV, newBackup)

    // バックアップ一覧を更新
    const backupList = await getBackupList(NEWS_KV)
    backupList.backups.push({
      id: newBackup.id,
      name: newBackup.name,
      createdAt: newBackup.createdAt,
      description: newBackup.description,
      data: {}, // 一覧には詳細データを含めない
      size: newBackup.size
    })
    backupList.lastUpdated = now
    await saveBackupList(NEWS_KV, backupList)

    return c.json({ success: true, backup: { id: newBackup.id, name: newBackup.name } })
  })

  // バックアップ詳細取得（プレビュー用）
  backup.get('/api/backup/:id', async (c) => {
    const password = c.req.header('X-Admin-Password')
    if (password !== ADMIN_PASSWORD) {
      return c.json({ success: false, message: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id')
    const { NEWS_KV } = c.env
    const backupData = await getBackupData(NEWS_KV, id)

    if (!backupData) {
      return c.json({ success: false, message: 'Backup not found' }, 404)
    }

    return c.json({ success: true, backup: backupData })
  })

  // バックアップ復元
  backup.post('/api/backup/:id/restore', async (c) => {
    const password = c.req.header('X-Admin-Password')
    if (password !== ADMIN_PASSWORD) {
      return c.json({ success: false, message: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id')
    const { NEWS_KV } = c.env
    const backupData = await getBackupData(NEWS_KV, id)

    if (!backupData) {
      return c.json({ success: false, message: 'Backup not found' }, 404)
    }

    // データを復元
    if (backupData.data.news) {
      await NEWS_KV.put('news_data', JSON.stringify(backupData.data.news))
    }
    if (backupData.data.blog) {
      await NEWS_KV.put('blog_data', JSON.stringify(backupData.data.blog))
    }

    return c.json({ success: true, message: 'Restored successfully' })
  })

  // バックアップ削除
  backup.delete('/api/backup/:id', async (c) => {
    const password = c.req.header('X-Admin-Password')
    if (password !== ADMIN_PASSWORD) {
      return c.json({ success: false, message: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id')
    const { NEWS_KV } = c.env

    // バックアップデータを削除
    await deleteBackupData(NEWS_KV, id)

    // バックアップ一覧から削除
    const backupList = await getBackupList(NEWS_KV)
    backupList.backups = backupList.backups.filter(b => b.id !== id)
    backupList.lastUpdated = new Date().toISOString()
    await saveBackupList(NEWS_KV, backupList)

    return c.json({ success: true })
  })

  return backup
}
