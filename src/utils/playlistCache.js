// 播放清單的本機快取（IndexedDB）
// 存 { playlistId, items, resumeToken, skippedIds, savedAt }，讓「更新歌曲」可以從上次的結果接著抓。
// 瀏覽器不支援或被封鎖（例如私密模式）時，讀取回傳 null、寫入靜默失敗，呼叫端會改用完整載入。

const DB_NAME = 'youtube-random-player'
const STORE_NAME = 'playlists'
const DB_VERSION = 1

let dbPromise = null

const openDb = () => {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME, { keyPath: 'playlistId' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  // 開啟失敗時允許下次重試
  dbPromise.catch(() => { dbPromise = null })
  return dbPromise
}

const run = async (mode, action) => {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode)
    const req = action(tx.objectStore(STORE_NAME))
    tx.oncomplete = () => resolve(req.result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export const loadPlaylistCache = async (playlistId) => {
  if (!playlistId) return null
  try {
    return (await run('readonly', (store) => store.get(playlistId))) ?? null
  } catch (error) {
    console.log('load playlist cache failed', error)
    return null
  }
}

export const savePlaylistCache = async (playlistId, { items = [], resumeToken = null, skippedIds = [] } = {}) => {
  if (!playlistId) return
  try {
    // 轉成純物件，避免把 Vue 的 reactive proxy 丟進 structuredClone
    const plainItems = JSON.parse(JSON.stringify(items))
    await run('readwrite', (store) => store.put({
      playlistId,
      items: plainItems,
      resumeToken,
      skippedIds: [...skippedIds],
      savedAt: Date.now()
    }))
  } catch (error) {
    console.log('save playlist cache failed', error)
  }
}
