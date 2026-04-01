import { defineStore } from 'pinia'
import {
  fetchYoutubeData,
  fetchPlayListName,
  deleteListItem,
  fetchMyPlaylists,
  searchYoutube,
  insertListItem,
  checkVideoInPlaylist
} from '../../api/fetchYoutubeData'
import { ref } from 'vue'
import { API_KEY } from '../../utils/apiKey'
// user module token and setToken removeToken

export const useYoutubeDataStore = defineStore('data', () => {
  // state
  const snippetData = ref([])
  const listNameData = ref([])
  const latestIndex = ref(0)
  const isLoaded = ref(true)
  const currentPlaylistId = ref('')
  const currentListName = ref('')
  const myPlaylistData = ref([])
  const recommendedVideos = ref([])

  // methods
  const getSnippetData = async (id) => {
    currentPlaylistId.value = id
    const params = ref({
      part: 'contentDetails,id,snippet,status', // 必填，把需要的資訊列出來
      playlistId: id, // 播放清單的id
      maxResults: 50, // 預設為五筆資料，可以設定1~50
      pageToken: '',
      key: API_KEY
    })
    snippetData.value = []
    isLoaded.value = false
    do {
      // 持續獲取清單的內容
      // 如果nextpagetoken為undefined則不繼續抓取資料
      try {
        const res = await fetchYoutubeData('/playlistItems', params.value)
        res.data.items.forEach(item => {
          if (item.snippet.title !== 'Deleted video' &&
            item.snippet.title !== 'Private video') {
            const filterData = {
              id: item.id,
              snippet: {
                position: item.snippet.position,
                resourceId: {
                  videoId: item.snippet.resourceId.videoId
                },
                thumbnails: {
                  medium: {
                    url: item.snippet.thumbnails.medium.url
                  }
                },
                title: item.snippet.title
              }
            }
            snippetData.value.push(filterData)
          }
        })
        params.value.pageToken = res.data.nextPageToken
      } catch (err) {
        console.log(err)
        alert('抓取清單發生錯誤')
        return
      }
    } while (params.value.pageToken !== undefined)
    isLoaded.value = true
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
      }
      return true
    } catch (error) {
      console.error('Add to playlist failed', error)
      if (error.response?.status === 401) {
        alert('請先點擊側邊欄 Connect Account 進行 Google 認證')
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
    getMyPlaylistData,
    latestIndex,
    isLoaded,
    getCompleteData,
    deleteItem,
    recommendedVideos,
    getRecommendations,
    currentPlaylistId,
    addVideoToPlaylist
  }
}, {
  persist: {
    enabled: true,
    strategies: [
      {
        storage: localStorage,
        paths: ['listNameData', 'latestIndex', 'currentListName']
      }
    ]
  }
})
