import request from '../utils/request'
import { API_KEY } from '../config/env'
import { useUserStore } from '../stores'

export const fetchYoutubeData = (url, params) => {
  return request.get(url, { params })
}

// 播放清單的一頁（最多 50 首），含標題、縮圖等完整資料
export const fetchPlaylistPage = (playlistId, pageToken = '') => {
  return request.get('/playlistItems', {
    params: {
      part: 'contentDetails,id,snippet,status',
      playlistId,
      maxResults: 50,
      pageToken,
      key: API_KEY
    }
  })
}

// 只取一頁的 item id，回應很小，給「更新歌曲」快速掃描用
export const fetchPlaylistPageIds = (playlistId, pageToken = '') => {
  return request.get('/playlistItems', {
    params: {
      part: 'id',
      fields: 'nextPageToken,pageInfo/totalResults,items/id',
      playlistId,
      maxResults: 50,
      pageToken,
      key: API_KEY
    }
  })
}

export const fetchPlayListName = (url, params) => {
  return request.get(url, { params })
}

export const deleteListItem = (url, id) => {
  const userStore = useUserStore()
  return request.delete(`${url}?id=${id}&key=${API_KEY}`, {
    headers: {
      Authorization: `Bearer ${userStore.oauthToken}`,
      Accept: 'application/json'
    }
  })
}

export const fetchMyPlaylists = (oauthToken, pageToken = '') => {
  return request.get('/playlists', {
    params: {
      part: 'snippet,status',
      mine: true,
      maxResults: 50,
      pageToken
    },
    headers: {
      Authorization: `Bearer ${oauthToken}`,
      Accept: 'application/json'
    }
  })
}
export const searchYoutube = (q, maxResults = 15) => {
  return request.get('/search', {
    params: {
      part: 'snippet',
      q,
      type: 'video',
      videoCategoryId: '10', // Music
      maxResults,
      key: API_KEY
    }
  })
}

// 某個地區的熱門音樂影片（只花 1 quota，搜尋要 100）
export const fetchPopularMusic = (regionCode = 'JP') => {
  return request.get('/videos', {
    params: {
      part: 'snippet',
      chart: 'mostPopular',
      videoCategoryId: '10', // Music
      regionCode,
      maxResults: 50,
      key: API_KEY
    }
  })
}
export const insertListItem = (playlistId, videoId) => {
  const userStore = useUserStore()
  return request.post(
    '/playlistItems?part=snippet',
    {
      snippet: {
        playlistId,
        resourceId: {
          kind: 'youtube#video',
          videoId
        }
      }
    },
    {
      headers: {
        Authorization: `Bearer ${userStore.oauthToken}`,
        Accept: 'application/json'
      }
    }
  )
}

export const checkVideoInPlaylist = (playlistId, videoId) => {
  return request.get('/playlistItems', {
    params: {
      part: 'id',
      playlistId,
      videoId,
      key: API_KEY
    }
  })
}
