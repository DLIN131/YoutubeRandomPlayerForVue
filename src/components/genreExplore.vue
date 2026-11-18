<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3 px-2 shrink-0">
      <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
        Genres
        <el-tag size="small" type="info" effect="dark" class="opacity-50 hidden xl:inline-flex">Audius</el-tag>
      </h3>
      <button
        @click="shuffleTracks"
        :disabled="tracks.length < 2"
        class="shrink-0 text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all border border-indigo-500/20 disabled:opacity-40"
      >
        <el-icon><Sort /></el-icon>
        <span>Shuffle</span>
      </button>
    </div>

    <!-- Search + time range -->
    <div class="flex flex-wrap gap-2 mb-3 px-2 shrink-0">
      <input
        v-model="query"
        type="text"
        placeholder="Search tracks (optional)..."
        class="flex-1 basis-40 min-w-0 h-9 bg-white/5 border border-white/10 rounded-xl px-3 text-xs focus:border-indigo-500/50 focus:bg-white/10 outline-none transition-all"
        @keydown.stop
        @keyup.enter="reload"
      >
      <select
        v-model="time"
        :disabled="!!query.trim()"
        @change="reload"
        class="h-9 bg-white/5 border border-white/10 rounded-xl px-2 text-xs text-gray-300 outline-none disabled:opacity-40"
        aria-label="Trending period"
      >
        <option v-for="option in TIME_OPTIONS" :key="option.value" :value="option.value" class="bg-[#111827]">
          {{ option.label }}
        </option>
      </select>
    </div>

    <!-- Genre chips -->
    <div class="flex gap-1.5 mb-3 px-2 pb-1 overflow-x-auto shrink-0 genre-scroll">
      <button
        v-for="item in genreOptions"
        :key="item.value"
        @click="selectGenre(item.value)"
        :class="[
          'px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-all',
          genre === item.value
            ? 'bg-indigo-500 text-white border-indigo-400'
            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
        ]"
      >
        {{ item.label }}
      </button>
    </div>

    <!-- Results -->
    <virtualList
      class="flex-1"
      container-class="virtual-list flex-1 -mx-2 px-2"
      max-height="calc(100vh - 270px)"
      :items="tracks"
      :item-height="96"
      :item-key="(item) => item.id"
      @rangeChange="handleRangeChange"
    >
      <template #empty>
        <div class="py-20 flex flex-col items-center justify-center text-gray-500 gap-4">
          <el-icon v-if="loading" class="is-loading text-4xl text-indigo-400"><Loading /></el-icon>
          <el-icon v-else class="text-5xl opacity-10"><Headset /></el-icon>
          <p class="text-sm font-medium opacity-50">
            {{ loading ? 'Loading tracks...' : errorMessage || 'No tracks found' }}
          </p>
        </div>
      </template>

      <template #default="{ item, index }">
        <div class="pb-2">
          <div
            @click="$emit('playTracks', tracks, index)"
            :class="[
              'group relative flex gap-3 p-2 rounded-xl border transition-all duration-300 cursor-pointer h-[88px]',
              item.id === playingId
                ? 'bg-indigo-500/10 border-indigo-500/30'
                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
            ]"
          >
            <div class="relative w-16 h-16 flex-shrink-0 self-center rounded-lg bg-white/5 flex items-center justify-center text-gray-600">
              <!-- 沒有封面時顯示音符 -->
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
              <img
                v-if="item.snippet.thumbnails.medium.url"
                :src="item.snippet.thumbnails.medium.url"
                :alt="`Cover: ${item.snippet.title}`"
                loading="lazy"
                decoding="async"
                class="absolute inset-0 w-full h-full object-cover rounded-lg shadow-lg"
              >
              <div class="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                <el-icon class="text-white text-xl"><VideoPlay /></el-icon>
              </div>
            </div>

            <div class="flex flex-col justify-center min-w-0 flex-1">
              <p :class="['text-xs font-bold leading-tight line-clamp-2', item.id === playingId ? 'text-indigo-300' : 'text-gray-200']">
                {{ item.snippet.title }}
              </p>
              <p class="text-[10px] text-gray-400 mt-1 truncate">{{ item.artist }}</p>
              <p class="text-[10px] text-gray-500 uppercase tracking-tighter truncate">
                {{ item.genre }} · {{ formatDuration(item.duration) }}
              </p>
            </div>

            <a
              :href="item.pageUrl"
              target="_blank"
              rel="noopener noreferrer"
              @click.stop
              class="w-8 h-8 flex-shrink-0 self-center flex items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:bg-indigo-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
              :title="`Open ${item.snippet.title} on Audius`"
            >
              <el-icon><Link /></el-icon>
            </a>
          </div>
        </div>
      </template>
    </virtualList>
  </div>
</template>

<script setup>
// 依曲風探索音樂：資料來自 Audius 公開 API，歌曲用 audioPlayer 直接播放
import { ref, onMounted } from 'vue'
import virtualList from './virtualList.vue'
import { Sort, VideoPlay, Headset, Loading, Link } from '@element-plus/icons-vue'
import {
  AUDIUS_GENRES,
  fetchAudiusTrending,
  searchAudiusTracks,
  getAudiusStreamUrl
} from '../api/audius'

defineProps({
  // 正在播放的歌曲 id，用來標示清單中的項目
  playingId: { type: String, default: '' }
})

defineEmits(['playTracks'])

const PAGE_SIZE = 50
const TIME_OPTIONS = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
  { value: 'allTime', label: 'All time' }
]
const genreOptions = [
  { value: '', label: 'All' },
  ...AUDIUS_GENRES.map((name) => ({ value: name, label: name }))
]

const genre = ref('')
const time = ref('week')
const query = ref('')
const tracks = ref([])
const loading = ref(false)
const errorMessage = ref('')
let hasMore = true
// API 已經回傳的筆數（包含被濾掉、無法播放的歌），當作下一頁的 offset
let loadedCount = 0
// 每次重新查詢就加一，丟掉舊查詢晚到的結果
let requestId = 0

// 轉成和播放清單相同的格式，另外帶上音檔來源
const toTrackItem = (track) => ({
  id: `audius-${track.id}`,
  source: 'audius',
  streamUrl: getAudiusStreamUrl(track.id),
  artist: track.user?.name ?? '',
  genre: track.genre ?? '',
  duration: track.duration ?? 0,
  cover: track.artwork?.['480x480'] ?? '',
  pageUrl: `https://audius.co${track.permalink ?? ''}`,
  snippet: {
    title: track.title,
    thumbnails: {
      medium: {
        url: track.artwork?.['150x150'] ?? ''
      }
    },
    resourceId: {
      videoId: ''
    }
  }
})

const isPlayable = (track) => track.is_streamable !== false && !track.is_stream_gated && track.access?.stream !== false

const loadMore = async () => {
  if (loading.value || !hasMore) return
  const current = requestId
  loading.value = true
  errorMessage.value = ''
  try {
    const params = { genre: genre.value, limit: PAGE_SIZE, offset: loadedCount }
    const keyword = query.value.trim()
    const res = keyword
      ? await searchAudiusTracks({ ...params, query: keyword })
      : await fetchAudiusTrending({ ...params, time: time.value })
    if (current !== requestId) return
    const data = res.data?.data ?? []
    loadedCount += data.length
    hasMore = data.length === PAGE_SIZE
    const known = new Set(tracks.value.map((item) => item.id))
    const fresh = data.filter(isPlayable).map(toTrackItem).filter((item) => !known.has(item.id))
    tracks.value = [...tracks.value, ...fresh]
  } catch (error) {
    if (current !== requestId) return
    console.error('Fetch Audius tracks failed', error)
    errorMessage.value = 'Failed to load tracks'
    hasMore = false
  } finally {
    if (current === requestId) loading.value = false
  }
}

const reload = () => {
  requestId++
  tracks.value = []
  loadedCount = 0
  hasMore = true
  loading.value = false
  loadMore()
}

const selectGenre = (value) => {
  if (genre.value === value) return
  genre.value = value
  reload()
}

// 捲到接近底部時自動載入下一頁
const handleRangeChange = ({ end }) => {
  if (end >= tracks.value.length - 5) loadMore()
}

const shuffleTracks = () => {
  const arr = [...tracks.value]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  tracks.value = arr
}

const formatDuration = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

onMounted(reload)
</script>

<style scoped>
.virtual-list {
  scrollbar-gutter: stable;
}

.genre-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}
</style>
