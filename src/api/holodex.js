import axios from 'axios'

// Holodex：VTuber 影片資料庫，可依組織與主題（原創曲、翻唱）列出影片。
// 需要 API 金鑰：到 https://holodex.net 登入後，在帳號設定頁取得。
const KEY_STORAGE = 'holodexApiKey'

// 金鑰優先用使用者在頁面上輸入的（存在這台瀏覽器），沒有才用建置時的環境變數
export const getHolodexKey = () => {
  try {
    const saved = localStorage.getItem(KEY_STORAGE)
    if (saved) return saved
  } catch (error) {
    // 瀏覽器封鎖 localStorage 時改用環境變數
  }
  return import.meta.env.VITE_HOLODEX_API_KEY || ''
}

export const setHolodexKey = (key) => {
  try {
    key ? localStorage.setItem(KEY_STORAGE, key) : localStorage.removeItem(KEY_STORAGE)
  } catch (error) {
    console.log('save holodex key failed', error)
  }
}

// 某個組織、某個主題的影片，依公開時間由新到舊。
// org: Hololive | Nijisanji | VSpo | Independents；topic: Original_Song | Music_Cover
export const fetchHolodexVideos = ({ org, topic, offset = 0, limit = 50 }) => {
  return axios.get('https://holodex.net/api/v2/videos', {
    params: {
      org,
      topic,
      type: 'stream',
      sort: 'available_at',
      order: 'desc',
      limit,
      offset
    },
    headers: { 'X-APIKEY': getHolodexKey() }
  })
}
