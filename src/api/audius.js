import axios from 'axios'

// Audius 公開 API：不需要金鑰，可依曲風瀏覽熱門歌曲並完整播放
const APP_NAME = 'YoutubeRandomPlayer'

const audius = axios.create({
  baseURL: 'https://api.audius.co/v1',
  params: { app_name: APP_NAME }
})

// Audius 固定的曲風名稱（value 要和 API 的 genre 完全一致）
export const AUDIUS_GENRES = [
  'Electronic', 'Pop', 'Rock', 'Hip-Hop/Rap', 'R&B/Soul', 'Lo-Fi', 'Jazz', 'Classical',
  'Ambient', 'Acoustic', 'Alternative', 'Metal', 'Punk', 'Folk', 'Funk', 'Blues',
  'Country', 'Reggae', 'Latin', 'World', 'Soundtrack', 'Experimental', 'Hyperpop', 'Dancehall',
  'House', 'Deep House', 'Tech House', 'Progressive House', 'Future House', 'Tropical House',
  'Techno', 'Trance', 'Dubstep', 'Drum & Bass', 'Future Bass', 'Trap', 'Downtempo',
  'Disco', 'Electro', 'Jungle', 'Hardstyle', 'Glitch Hop', 'Jersey Club', 'Vaporwave', 'Moombahton'
]

// 某個曲風的熱門歌曲；time: week | month | year | allTime
export const fetchAudiusTrending = ({ genre = '', time = 'week', limit = 50, offset = 0 } = {}) => {
  return audius.get('/tracks/trending', {
    params: { genre: genre || undefined, time, limit, offset }
  })
}

export const searchAudiusTracks = ({ query, genre = '', limit = 50, offset = 0 }) => {
  return audius.get('/tracks/search', {
    params: { query, genre: genre || undefined, limit, offset }
  })
}

// 每次播放都向 API 要新的串流網址（會轉址到實際的音檔）
export const getAudiusStreamUrl = (trackId) =>
  `https://api.audius.co/v1/tracks/${trackId}/stream?app_name=${APP_NAME}`
