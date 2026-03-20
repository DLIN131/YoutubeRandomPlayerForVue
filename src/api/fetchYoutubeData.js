import request from '../utils/request'
import { API_KEY } from '../utils/apiKey'
import { useUserStore } from '../stores'

export const fetchYoutubeData = (url, params) => {
  return request.get(url, { params })
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
