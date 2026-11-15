import { googleSdkLoaded } from 'vue3-google-login'
import { GOOGLE_CLIENT_ID } from '../config/env'

// 讀寫 YouTube 播放清單需要的權限
const YOUTUBE_SCOPE = 'profile email https://www.googleapis.com/auth/youtube.force-ssl'

// 開啟 Google 授權畫面，取得可以存取 YouTube 的 access token。
// 不用 vue3-google-login 的 googleTokenLogin：它固定只要求 email profile openid，
// 傳進去的 scope 會被忽略，拿到的 token 無法存取 YouTube。
export const requestYoutubeToken = (scope = YOUTUBE_SCOPE) => {
  return new Promise((resolve, reject) => {
    googleSdkLoaded((google) => {
      google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope,
        prompt: 'consent',
        callback: (res) => {
          res.access_token ? resolve(res.access_token) : reject(res)
        },
        error_callback: reject
      }).requestAccessToken()
    })
  })
}
