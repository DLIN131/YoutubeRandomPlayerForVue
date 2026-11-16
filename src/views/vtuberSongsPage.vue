<template>
  <div class="p-4 lg:p-6 h-full flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden">
    <!-- 左側（手機版在下方）：歌曲清單 -->
    <div class="order-2 lg:order-1 flex-1 min-w-0 min-h-0 flex flex-col gap-4">
      <div class="flex flex-wrap items-end justify-between gap-3 shrink-0">
        <div>
          <h2 class="text-2xl font-bold text-white">VTuber Songs</h2>
          <p class="text-xs text-gray-400 mt-1">原創曲與翻唱，由新到舊 · 資料來源 Holodex</p>
        </div>
        <div class="flex items-center gap-3">
          <span v-if="hasKey" class="text-xs text-gray-400 font-mono">{{ songs.length }} songs</span>
          <button
            v-if="hasKey"
            @click="isEditingKey = !isEditingKey"
            class="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all"
          >
            API key
          </button>
        </div>
      </div>

      <!-- 金鑰設定 -->
      <div v-if="!hasKey || isEditingKey" class="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3 shrink-0">
        <p class="text-sm font-semibold text-gray-100">需要 Holodex API 金鑰</p>
        <ol class="text-xs text-gray-300 list-decimal pl-5 space-y-1">
          <li>
            到
            <a href="https://holodex.net/login" target="_blank" rel="noopener noreferrer" class="text-indigo-300 hover:underline">holodex.net</a>
            登入（可用 Google、Twitter 或 Discord 帳號）
          </li>
          <li>打開帳號設定頁（Account Settings），按下產生 API Key</li>
          <li>把金鑰貼在下面。金鑰只會存在這台瀏覽器裡</li>
        </ol>
        <div class="flex gap-2">
          <input
            v-model="keyInput"
            type="password"
            placeholder="Holodex API key"
            autocomplete="off"
            class="flex-1 min-w-0 h-10 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:border-indigo-500/50 focus:bg-white/10 outline-none transition-all"
            @keyup.enter="saveKey"
          >
          <button
            @click="saveKey"
            :disabled="!keyInput.trim()"
            class="px-4 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm font-semibold text-white transition-all"
          >
            Save
          </button>
        </div>
      </div>

      <!-- 篩選 -->
      <div v-if="hasKey" class="flex flex-wrap items-center gap-3 shrink-0">
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="item in ORG_OPTIONS"
            :key="item.value"
            @click="org = item.value"
            :class="[
              'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all',
              org === item.value
                ? 'bg-indigo-500 text-white border-indigo-400'
                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
            ]"
          >
            {{ item.label }}
          </button>
        </div>
        <div class="flex rounded-xl border border-white/10 overflow-hidden">
          <button
            v-for="item in TOPIC_OPTIONS"
            :key="item.value"
            @click="topic = item.value"
            :class="[
              'px-3 h-8 text-xs font-semibold transition-all',
              topic === item.value ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            ]"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <!-- 清單 -->
      <virtualList
        v-if="hasKey"
        class="flex-1 min-h-0"
        container-class="virtual-list -mx-2 px-2"
        :items="songs"
        :item-height="96"
        :item-key="(item) => item.id"
        @rangeChange="handleRangeChange"
      >
        <template #empty>
          <div class="py-20 flex flex-col items-center justify-center text-gray-400 gap-4">
            <el-icon v-if="loading" class="is-loading text-4xl text-indigo-400"><Loading /></el-icon>
            <el-icon v-else class="text-5xl opacity-20"><Headset /></el-icon>
            <p class="text-sm font-medium">{{ loading ? 'Loading songs...' : errorMessage || 'No songs found' }}</p>
            <button v-if="!loading && errorMessage" @click="reload" class="text-indigo-300 text-sm hover:underline">Retry</button>
          </div>
        </template>

        <template #default="{ item }">
          <div class="pb-2">
            <div
              @click="playSong(item)"
              :class="[
                'group relative flex gap-3 p-2 rounded-xl border transition-all duration-300 cursor-pointer h-[88px]',
                item.id === playingId
                  ? 'bg-indigo-500/10 border-indigo-500/30'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
              ]"
            >
              <div class="relative w-24 sm:w-28 h-16 flex-shrink-0 self-center">
                <img
                  :src="item.snippet.thumbnails.medium.url"
                  :alt="`Video thumbnail: ${item.snippet.title}`"
                  loading="lazy"
                  decoding="async"
                  class="w-full h-full object-cover rounded-lg shadow-lg"
                >
                <div class="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                  <el-icon class="text-white text-xl"><VideoPlay /></el-icon>
                </div>
              </div>

              <div class="flex flex-col justify-center min-w-0 flex-1 gap-1">
                <p :class="['text-xs font-bold leading-tight line-clamp-1 sm:line-clamp-2', item.id === playingId ? 'text-indigo-300' : 'text-gray-100']">
                  {{ item.snippet.title }}
                </p>
                <p class="text-[11px] text-gray-400 truncate">{{ item.channelName }}</p>
                <p class="flex items-center gap-2 text-[10px] text-gray-400 whitespace-nowrap overflow-hidden">
                  <span
                    :class="[
                      'shrink-0 px-1.5 py-0.5 rounded font-bold',
                      item.topic === 'Original_Song' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-cyan-500/20 text-cyan-300'
                    ]"
                  >
                    {{ item.topic === 'Original_Song' ? '原創' : '翻唱' }}
                  </span>
                  <span>{{ item.orgLabel }}</span>
                  <span class="font-mono">{{ item.dateLabel }}</span>
                </p>
              </div>

              <button
                @click.stop="addDialog.open(item)"
                class="w-8 h-8 flex-shrink-0 self-center flex items-center justify-center rounded-lg bg-white/5 text-gray-300 hover:bg-indigo-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                :title="`Add ${item.snippet.title} to playlist`"
              >
                <el-icon><Plus /></el-icon>
              </button>
            </div>
          </div>
        </template>
      </virtualList>
    </div>

    <!-- 右側（手機版在上方）：播放器 -->
    <aside class="order-1 lg:order-2 shrink-0 lg:w-[380px] xl:w-[440px] flex flex-col gap-3">
      <div class="w-full aspect-video max-h-[30vh] lg:max-h-none rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black">
        <youtubePlayer
          v-if="playingId"
          :width="'100%'"
          :height="'100%'"
          :vid="playingId"
          :title="playingTitle"
          :id="PLAYER_ID"
          @changeState="handlePlayerState"
        />
        <div v-else class="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
          <el-icon class="text-4xl"><VideoPlay /></el-icon>
          <span class="text-sm">點清單裡的歌曲開始播放</span>
        </div>
      </div>
      <div v-if="playingTitle" class="px-1">
        <p class="text-sm font-bold text-gray-100 line-clamp-2">{{ playingTitle }}</p>
        <p class="text-xs text-gray-400 mt-1 truncate">{{ playingChannel }}</p>
      </div>
    </aside>

    <addToPlaylistDialog ref="addDialog" />
  </div>
</template>

<script>
// 寫在模組層級：切到別頁再回來時保留已載入的歌曲與上次的篩選
// key 是「組織|主題」，值是 { items, offset, done }
const streamCache = new Map()
const lastSelection = { org: '', topic: '' }
</script>

<script setup>
// 日本 VTuber 的原創曲與翻唱，依公開時間由新到舊。資料來自 Holodex，影片直接用 YouTube 播放
import { ref, computed, watch, onMounted } from 'vue'
import { Loading, Headset, VideoPlay, Plus } from '@element-plus/icons-vue'
import virtualList from '../components/virtualList.vue'
import youtubePlayer from '../components/youtubePlayer.vue'
import addToPlaylistDialog from '../components/addToPlaylistDialog.vue'
import { fetchHolodexVideos, getHolodexKey, setHolodexKey } from '../api/holodex'

// youtubePlayer 用 id 組出播放器元素的 id，取一個不會和其他頁重複的值
const PLAYER_ID = -3
const PAGE_SIZE = 50

const ORGS = [
  { value: 'Hololive', label: 'hololive' },
  { value: 'Nijisanji', label: '彩虹社' },
  { value: 'VSpo', label: 'VSPO!' },
  { value: 'Independents', label: '個人勢' }
]
const TOPICS = [
  { value: 'Original_Song', label: '原創曲' },
  { value: 'Music_Cover', label: '翻唱' }
]
const ORG_OPTIONS = [{ value: '', label: '全部' }, ...ORGS]
const TOPIC_OPTIONS = [{ value: '', label: '全部' }, ...TOPICS]

const org = ref(lastSelection.org)
const topic = ref(lastSelection.topic)
const hasKey = ref(!!getHolodexKey())
const isEditingKey = ref(false)
const keyInput = ref('')
const loading = ref(false)
const errorMessage = ref('')
// 每次有新資料就加一，讓 songs 重新計算（streamCache 本身不是響應式的）
const version = ref(0)
const addDialog = ref(null)

const playingId = ref('')
const playingTitle = ref('')
const playingChannel = ref('')

// 目前的篩選會用到哪些「組織 + 主題」的組合，每個組合是 Holodex 的一個查詢
const activeStreams = computed(() => {
  const orgs = org.value ? [org.value] : ORGS.map((item) => item.value)
  const topics = topic.value ? [topic.value] : TOPICS.map((item) => item.value)
  return orgs.flatMap((orgValue) => topics.map((topicValue) => ({
    key: `${orgValue}|${topicValue}`,
    org: orgValue,
    topic: topicValue
  })))
})

const getStream = (key) => {
  if (!streamCache.has(key)) streamCache.set(key, { items: [], offset: 0, done: false })
  return streamCache.get(key)
}

const orgLabel = (value) => ORGS.find((item) => item.value === value)?.label ?? value

// 轉成和播放清單相同的格式（id 就是 YouTube 影片 id），另外帶上日期等資訊
const toSong = (video, stream) => {
  const time = Date.parse(video.available_at || video.published_at || '') || 0
  return {
    id: video.id,
    time,
    dateLabel: time ? new Date(time).toLocaleDateString('sv-SE') : '',
    topic: stream.topic,
    orgLabel: orgLabel(stream.org),
    channelName: video.channel?.name ?? '',
    snippet: {
      title: video.title,
      thumbnails: {
        medium: {
          url: `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`
        }
      },
      resourceId: {
        videoId: video.id
      }
    }
  }
}

// 還沒公開的首播、已經消失的影片不列出來
const isListed = (video) => video.status !== 'upcoming' && video.status !== 'missing'

// 多個查詢各自由新到舊，合併時只能顯示到「還有下一頁的查詢中，最晚載到的那個日期」為止，
// 更舊的要等那個查詢載入下一頁，才能確定中間沒有漏掉的歌
const cutoffTime = () => {
  const pending = activeStreams.value.map((stream) => getStream(stream.key)).filter((state) => !state.done)
  if (pending.length === 0) return -Infinity
  return Math.max(...pending.map((state) => state.items.at(-1)?.time ?? Infinity))
}

const songs = computed(() => {
  version.value // eslint-disable-line no-unused-expressions
  const cutoff = cutoffTime()
  if (cutoff === Infinity) return []
  const seen = new Set()
  const merged = []
  activeStreams.value.forEach((stream) => {
    getStream(stream.key).items.forEach((song) => {
      if (song.time >= cutoff && !seen.has(song.id)) {
        seen.add(song.id)
        merged.push(song)
      }
    })
  })
  return merged.sort((a, b) => b.time - a.time)
})

const hasMore = computed(() => {
  version.value // eslint-disable-line no-unused-expressions
  return activeStreams.value.some((stream) => !getStream(stream.key).done)
})

const fetchNextPage = async (stream) => {
  const state = getStream(stream.key)
  const res = await fetchHolodexVideos({ org: stream.org, topic: stream.topic, offset: state.offset, limit: PAGE_SIZE })
  const videos = Array.isArray(res.data) ? res.data : (res.data?.items ?? [])
  state.offset += videos.length
  state.done = videos.length < PAGE_SIZE
  state.items.push(...videos.filter(isListed).map((video) => toSong(video, stream)))
}

// 每次重新篩選就加一，丟掉舊篩選晚到的結果
let requestId = 0

const loadMore = async () => {
  if (loading.value || !hasKey.value || !hasMore.value) return
  const current = ++requestId
  loading.value = true
  errorMessage.value = ''
  try {
    const before = songs.value.length
    // 一次載入可能不會讓清單變長（新的一頁都比界線舊），最多多試幾次
    for (let round = 0; round < 5 && hasMore.value; round++) {
      const cutoff = cutoffTime()
      // 先載還沒載過的查詢；都載過了就載卡住界線的那個
      const targets = activeStreams.value.filter((stream) => {
        const state = getStream(stream.key)
        if (state.done) return false
        return state.items.length === 0 || state.items.at(-1).time === cutoff
      })
      await Promise.all(targets.map(fetchNextPage))
      if (current !== requestId) return
      version.value++
      if (songs.value.length > before) break
    }
  } catch (error) {
    if (current !== requestId) return
    console.error('Fetch holodex videos failed', error)
    const status = error.response?.status
    errorMessage.value = status === 401 || status === 403
      ? 'API 金鑰無效，請按右上角的 API key 重新設定'
      : '載入失敗，請稍後再試'
  } finally {
    if (current === requestId) loading.value = false
  }
}

const reload = () => {
  requestId++
  loading.value = false
  errorMessage.value = ''
  if (songs.value.length === 0) loadMore()
}

const saveKey = () => {
  const key = keyInput.value.trim()
  if (!key) return
  setHolodexKey(key)
  keyInput.value = ''
  isEditingKey.value = false
  hasKey.value = true
  // 換金鑰後清掉之前失敗或用舊金鑰載入的資料
  streamCache.clear()
  version.value++
  reload()
}

// 捲到接近底部時自動載入更舊的歌
const handleRangeChange = ({ end }) => {
  if (songs.value.length > 0 && end >= songs.value.length - 5) loadMore()
}

const playSong = (song) => {
  playingId.value = song.id
  playingTitle.value = song.snippet.title
  playingChannel.value = song.channelName
}

// 播完自動接清單裡的下一首（state 0 = 播放結束）
const handlePlayerState = (state) => {
  if (state.data !== 0) return
  const index = songs.value.findIndex((song) => song.id === playingId.value)
  const next = songs.value[index + 1]
  if (next) playSong(next)
}

watch([org, topic], () => {
  lastSelection.org = org.value
  lastSelection.topic = topic.value
  reload()
})

onMounted(reload)
</script>

<style scoped>
.virtual-list {
  scrollbar-gutter: stable;
}
</style>
