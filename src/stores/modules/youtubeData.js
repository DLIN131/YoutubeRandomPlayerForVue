import { defineStore } from 'pinia'
import {
  fetchPlaylistPage,
  fetchPlaylistPageIds,
  fetchPlayListName,
  deleteListItem,
  fetchMyPlaylists,
  searchYoutube,
  insertListItem,
  checkVideoInPlaylist
} from '../../api/fetchYoutubeData'
import { useUserStore } from './user'
import { ref } from 'vue'
import { API_KEY } from '../../config/env'
import { loadPlaylistCache, savePlaylistCache } from '../../utils/playlistCache'
// user module token and setToken removeToken

// 把 playlistItems API 的項目轉成清單用的精簡格式；已刪除、私人影片回傳 null
const toQueueItem = (item) => {
  const title = item.snippet?.title
  const videoId = item.snippet?.resourceId?.videoId
  if (title === 'Deleted video' || title === 'Private video' || !videoId) return null
  return {
    id: item.id,
    snippet: {
      position: item.snippet.position,
      resourceId: {
        videoId
      },
      thumbnails: {
        medium: {
          url: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || ''
        }
      },
      title
    }
  }
}

// 抓一頁清單；itemIds 包含已刪除、私人的項目
const fetchPage = async (playlistId, pageToken = '') => {
  const res = await fetchPlaylistPage(playlistId, pageToken)
  const items = res.data?.items ?? []
  return {
    videos: items.map(toQueueItem).filter(Boolean),
    itemIds: items.map((item) => item.id),
    nextPageToken: res.data?.nextPageToken,
    total: res.data?.pageInfo?.totalResults ?? 0
  }
}

// 從上次的最後一頁（startToken）讀到結尾。
// 這一頁已經沒有任何已知的歌，或 token 失效（400），代表清單變動太大，回傳 null 改用掃描。
const readTail = async (playlistId, startToken, known, seen) => {
  const videos = []
  const tailSeen = new Set()
  let pageToken = startToken
  let lastPageToken = null
  let first = true
  try {
    while (pageToken) {
      const page = await fetchPage(playlistId, pageToken)
      if (first && page.itemIds.length > 0 && !page.itemIds.some((itemId) => known.has(itemId))) {
        return null
      }
      first = false
      for (const video of page.videos) {
        if (!seen.has(video.id) && !tailSeen.has(video.id)) videos.push(video)
        tailSeen.add(video.id)
      }
      page.itemIds.forEach((itemId) => tailSeen.add(itemId))
      lastPageToken = pageToken
      pageToken = page.nextPageToken
    }
  } catch (error) {
    if (error.response?.status === 400) return null
    throw error
  }
  tailSeen.forEach((itemId) => seen.add(itemId))
  return { videos, lastPageToken }
}

export const useYoutubeDataStore = defineStore('data', () => {
  // state
  const snippetData = ref([])
  const listNameData = ref([])
  const latestIndex = ref(0)
  const isLoaded = ref(true)
  const isFetching = ref(false)
  const fetchedCount = ref(0)
  const totalCount = ref(0)
  const currentPlaylistId = ref('')
  const currentListName = ref('')
  const myPlaylistData = ref([])
  const recommendedVideos = ref([])
  // 清單最後一頁的 pageToken，「更新歌曲」從這裡接著讀
  const resumeToken = ref(null)
  // true：正在「更新歌曲」（只檢查新歌）；false：完整載入
  const isUpdating = ref(false)
  // 每次清單內容變動 version 就加一，播放頁依 mode 決定整份換掉還是合併
  // mode: 'full' 完整載入、'update' 新增歌曲、'restore' 從快取切換清單、'resume' 開網頁時接續上次
  const lastSync = ref({ version: 0, playlistId: '', mode: '', added: [] })
  // 清單裡已刪除、私人影片的 item id。不會出現在 snippetData，但要記住，
  // 「更新歌曲」才不會把有這些項目的頁面當成有新歌而重新下載
  let skippedIds = []
  const userStore = useUserStore()

  // methods
  const markSynced = (mode, added = []) => {
    lastSync.value = {
      version: lastSync.value.version + 1,
      playlistId: currentPlaylistId.value,
      mode,
      added
    }
  }

  const saveCurrentCache = () => savePlaylistCache(currentPlaylistId.value, {
    items: snippetData.value,
    resumeToken: resumeToken.value,
    skippedIds
  })

  // seen 裡所有 id 扣掉目前清單的歌，就是已刪除、私人的項目
  const collectSkippedIds = (seen) => {
    const playable = new Set(snippetData.value.map((item) => item.id))
    return [...seen].filter((itemId) => !playable.has(itemId))
  }

  // 完整載入：全部歌曲重抓，可反映刪除與排序變更。成功回傳 true
  const getSnippetData = async (id) => {
    const buffer = []
    const seen = new Set()
    let pageToken = ''
    let lastPageToken = null
    isLoaded.value = false
    isFetching.value = true
    isUpdating.value = false
    fetchedCount.value = 0
    totalCount.value = 0
    try {
      do {
        const page = await fetchPage(id, pageToken)
        if (page.total) totalCount.value = page.total
        buffer.push(...page.videos)
        page.itemIds.forEach((itemId) => seen.add(itemId))
        fetchedCount.value = buffer.length
        lastPageToken = pageToken || null
        pageToken = page.nextPageToken
      } while (pageToken)
    } catch (err) {
      // 失敗時保留原本的清單
      console.log(err)
      alert('抓取清單發生錯誤')
      return false
    } finally {
      isLoaded.value = true
      isFetching.value = false
    }
    currentPlaylistId.value = id
    snippetData.value = buffer
    resumeToken.value = lastPageToken
    skippedIds = collectSkippedIds(seen)
    markSynced('full')
    await saveCurrentCache()
    return true
  }

  // 從本機快取讀出清單，不打任何 API
  const restoreFromCache = async (id, mode) => {
    const cache = await loadPlaylistCache(id)
    if (!cache?.items?.length) return false
    // 等待讀取期間已經載入了其他清單，就不要覆蓋
    if (mode === 'resume' && snippetData.value.length > 0) return false
    currentPlaylistId.value = id
    snippetData.value = cache.items
    resumeToken.value = cache.resumeToken ?? null
    skippedIds = cache.skippedIds ?? []
    isLoaded.value = true
    markSynced(mode)
    return true
  }

  // 開網頁時接續上次的清單
  const restoreLastPlaylist = async () => {
    if (snippetData.value.length > 0 || !currentPlaylistId.value) return false
    return restoreFromCache(currentPlaylistId.value, 'resume')
  }

  // 「更新歌曲」：只抓上次載入之後新增的歌曲。
  // 新歌可能在清單最上方（設定成新增到頂端的清單）或最後面：
  // 1. 從第一頁讀到出現已知的歌為止，前面的就是加在最上方的新歌
  // 2. 從上次的最後一頁接著讀到結尾
  // 3. 接不上時，只用 id 掃描剩下的頁，有新 id 的頁才完整下載
  // 中間插入、刪除、排序變更偵測不到，要用完整載入。
  // 回傳 { mode, added }，失敗回傳 null
  const updateSnippetData = async (id) => {
    if (isFetching.value) return null
    if (id !== currentPlaylistId.value || snippetData.value.length === 0) {
      const restored = await restoreFromCache(id, 'restore')
      if (!restored) {
        // 沒有快取可以接續，改做完整載入
        const ok = await getSnippetData(id)
        return ok ? { mode: 'full', added: snippetData.value.length } : null
      }
    }

    const known = new Set([...snippetData.value.map((item) => item.id), ...skippedIds])
    const seen = new Set(known)
    const atTop = []
    const atEnd = []
    let checked = 0
    const addProgress = (count, total) => {
      checked += count
      fetchedCount.value = checked
      totalCount.value = Math.max(totalCount.value, total, checked)
    }

    isFetching.value = true
    isUpdating.value = true
    fetchedCount.value = 0
    totalCount.value = 0
    try {
      // 1. 清單最上方
      let pageToken = ''
      let lastPageToken = null
      let reachedKnown = false
      let page
      while (true) {
        page = await fetchPage(id, pageToken)
        addProgress(page.itemIds.length, page.total)
        for (const video of page.videos) {
          if (known.has(video.id)) {
            reachedKnown = true
          } else if (!seen.has(video.id)) {
            // 第一首已知的歌之前：加在最上方；之後（同一頁）：加在後面
            (reachedKnown ? atEnd : atTop).push(video)
          }
          seen.add(video.id)
        }
        page.itemIds.forEach((itemId) => seen.add(itemId))
        lastPageToken = pageToken || null
        if (reachedKnown || !page.nextPageToken) break
        pageToken = page.nextPageToken
      }

      if (page.nextPageToken) {
        // 2. 從上次的最後一頁接著讀
        const tail = resumeToken.value
          ? await readTail(id, resumeToken.value, known, seen)
          : null
        if (tail) {
          atEnd.push(...tail.videos)
          lastPageToken = tail.lastPageToken
          fetchedCount.value = totalCount.value
        } else {
          // 3. 只用 id 掃描剩下的頁
          pageToken = page.nextPageToken
          while (pageToken) {
            const res = await fetchPlaylistPageIds(id, pageToken)
            const itemIds = (res.data?.items ?? []).map((item) => item.id)
            addProgress(itemIds.length, res.data?.pageInfo?.totalResults ?? 0)
            if (itemIds.some((itemId) => !seen.has(itemId))) {
              const full = await fetchPage(id, pageToken)
              for (const video of full.videos) {
                if (!seen.has(video.id)) atEnd.push(video)
                seen.add(video.id)
              }
              full.itemIds.forEach((itemId) => seen.add(itemId))
            }
            lastPageToken = pageToken
            pageToken = res.data?.nextPageToken
          }
        }
      }

      const added = [...atTop, ...atEnd]
      if (added.length > 0) {
        snippetData.value = [...atTop, ...snippetData.value, ...atEnd]
        snippetData.value.forEach((item, index) => {
          item.snippet.position = index
        })
      }
      resumeToken.value = lastPageToken ?? resumeToken.value
      skippedIds = collectSkippedIds(seen)
      if (added.length > 0) markSynced('update', added)
      await saveCurrentCache()
      return { mode: 'update', added: added.length }
    } catch (err) {
      console.log(err)
      alert('更新清單發生錯誤')
      return null
    } finally {
      isFetching.value = false
      isUpdating.value = false
    }
  }

  const getListName = async (listId) => {
    const params = ref({
      part: 'snippet',
      id: listId,
      key: API_KEY
    })
    try {
      const res = await fetchPlayListName('/playlists', params.value)
      const listIdData = {
        name: res.data.items[0].snippet.title,
        value: listId
      }
      currentListName.value = listIdData.name // 儲存最近的一次清單名字資料
      let isExist = false
      listNameData.value.forEach((item) => {
        if (item.value === listIdData.value) {
          isExist = true
        }
      })
      if (!isExist) {
        listNameData.value.push(listIdData)
      }
    } catch (err) {
      console.log(err)
    }
  }

  const getCompleteData = () => {
    return isLoaded.value ? snippetData.value : []
  }

  const deleteItem = async (id) => {
    try {
      const res = await deleteListItem('/playlistItems', id)
      if (res) {
        const removeIndex = snippetData.value.findIndex((item) => item.id === id)
        if (removeIndex !== -1) {
          snippetData.value.splice(removeIndex, 1)
          saveCurrentCache()
        }
        return true
      }
      return false
    } catch (error) {
      console.log('delete item error')
      return false
    }
  }

  const getMyPlaylistData = async (oauthToken) => {
    if (!oauthToken) {
      myPlaylistData.value = []
      return
    }
    const playlistBuffer = []
    let pageToken = ''
    do {
      try {
        const res = await fetchMyPlaylists(oauthToken, pageToken)
        res.data.items.forEach((item) => {
          if (item.status?.privacyStatus !== 'public') return
          playlistBuffer.push({
            name: item.snippet.title,
            value: item.id
          })
        })
        pageToken = res.data.nextPageToken
      } catch (error) {
        console.log('fetch my youtube playlists failed', error)
        myPlaylistData.value = []
        if (error.response?.status === 401) {
          return 401
        }
        return
      }
    } while (pageToken !== undefined)
    myPlaylistData.value = playlistBuffer
  }

  const getRecommendations = async (title) => {
    // Clean title: remove common suffixes like (Official Video), [MV], etc.
    const cleanTitle = title
      .replace(/\(Official.*?\)/gi, '')
      .replace(/\[MV\]/gi, '')
      .replace(/【.*?】/g, '')
      .replace(/Official Video/gi, '')
      .trim()

    try {
      const res = await searchYoutube(cleanTitle)
      recommendedVideos.value = res.data.items.map((item) => ({
        id: item.id.videoId,
        snippet: {
          title: item.snippet.title,
          thumbnails: {
            medium: {
              url: item.snippet.thumbnails.medium.url
            }
          },
          resourceId: {
            videoId: item.id.videoId
          }
        }
      }))
    } catch (error) {
      console.error('Fetch recommendations failed', error)
      recommendedVideos.value = []
    }
  }

  const addVideoToPlaylist = async (item, targetId) => {
    const playlistId = targetId || currentPlaylistId.value
    if (!playlistId) {
      return false
    }

    try {
      // ALWAYS perform cloud-side duplicate check
      const checkRes = await checkVideoInPlaylist(playlistId, item.id)
      if (checkRes.data && checkRes.data.items.length > 0) {
        return 'exists'
      }

      const res = await insertListItem(playlistId, item.id)
      const isCurrentPlaylist = playlistId === currentPlaylistId.value
      if (res.data && isCurrentPlaylist) {
        // Add to local state (Queue)
        const newItem = {
          id: res.data.id,
          snippet: {
            position: snippetData.value.length,
            title: res.data.snippet.title,
            thumbnails: {
              medium: {
                url: res.data.snippet.thumbnails.medium.url
              }
            },
            resourceId: {
              videoId: res.data.snippet.resourceId.videoId
            }
          }
        }
        snippetData.value.push(newItem)
        markSynced('update', [newItem])
        saveCurrentCache()
      }
      return true
    } catch (error) {
      console.error('Add to playlist failed', error)
      if (error.response?.status === 401) {
        userStore.clearOauthToken()
        alert('認證已過期，請重新點擊側邊欄 Connect Account')
      } else {
        alert('加入清單失敗')
      }
      return false
    }
  }

  // return
  return {
    currentListName,
    listNameData,
    myPlaylistData,
    getListName,
    snippetData,
    getSnippetData,
    updateSnippetData,
    restoreLastPlaylist,
    lastSync,
    getMyPlaylistData,
    latestIndex,
    isLoaded,
    isFetching,
    isUpdating,
    fetchedCount,
    totalCount,
    getCompleteData,
    deleteItem,
    recommendedVideos,
    getRecommendations,
    currentPlaylistId,
    addVideoToPlaylist
  }
}, {
  // pinia-plugin-persistedstate v3 的寫法；清單本身存在 IndexedDB（utils/playlistCache.js）
  persist: {
    storage: localStorage,
    paths: ['listNameData', 'latestIndex', 'currentListName', 'currentPlaylistId'],
    // 舊版會把整個 state 存起來（包含載入中的狀態），還原後重設
    afterRestore: ({ store }) => {
      store.isFetching = false
      store.isUpdating = false
      store.isLoaded = true
    }
  }
})
