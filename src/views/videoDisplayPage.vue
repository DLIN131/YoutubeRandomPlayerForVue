<template>
  <div class="relative h-full lg:flex lg:gap-6 p-4 md:p-6">
    <!-- Player Section -->
    <section class="player-column h-full flex-1 min-w-0 overflow-y-auto pb-24 lg:pb-2" aria-label="Player">
      <div class="w-full max-w-4xl mx-auto flex flex-col gap-4">
        <div class="player-container w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black" ref="playerContainerRef" :style="{ opacity: playerOpacity }">
          <audioPlayer
            v-if="isPrepare && audioTrack"
            :src="audioTrack.streamUrl"
            :cover="audioTrack.cover"
            :title="title"
            :initial-volume="lastVolume"
            ref="playerRef"
            @changeState="getPlayerState"
          />
          <youtubePlayer
            v-else-if="isPrepare"
            :width="'100%'"
            :height="'100%'"
            :vid="videoId"
            :title="title"
            :id="id"
            ref="playerRef"
            @changeState="getPlayerState"
          />
          <!-- 載入中 -->
          <div v-else-if="useYoutubeData.isFetching" class="empty-stage">
            <el-icon class="text-5xl is-loading text-indigo-400"><Loading /></el-icon>
            <p class="text-base font-semibold text-indigo-200">{{ useYoutubeData.isUpdating ? 'Checking new songs…' : 'Fetching playlist…' }}</p>
            <p class="text-sm font-mono text-indigo-300/80 tabular-nums">
              {{ useYoutubeData.fetchedCount }}{{ useYoutubeData.totalCount ? ` / ${useYoutubeData.totalCount}` : '' }}
            </p>
          </div>
          <!-- 清單已載入但還沒開始播 -->
          <div v-else-if="snippetData.length > 0" class="empty-stage">
            <div class="w-14 h-14 rounded-2xl bg-indigo-500/[0.15] text-indigo-300 flex items-center justify-center">
              <uiIcon name="music" :size="28" />
            </div>
            <div class="text-center">
              <p class="text-lg font-bold text-white">{{ useYoutubeData.currentListName || 'Playlist ready' }}</p>
              <p class="text-sm text-gray-400 tabular-nums">{{ snippetData.length }} songs</p>
            </div>
            <div class="flex flex-wrap justify-center gap-3">
              <button class="cta-primary" @click="playFromStart">
                <uiIcon name="play" :size="18" /> Play
              </button>
              <button class="cta-secondary" @click="setRandomPlay">
                <uiIcon name="shuffle" :size="18" /> Shuffle
              </button>
            </div>
          </div>
          <!-- 還沒有清單 -->
          <div v-else class="empty-stage px-6 text-center">
            <div class="w-14 h-14 rounded-2xl bg-white/5 text-gray-400 flex items-center justify-center">
              <uiIcon name="list" :size="26" />
            </div>
            <p class="text-lg font-bold text-white">No playlist loaded</p>
            <p class="text-sm text-gray-400 max-w-sm">
              Paste a YouTube playlist URL at the top, or pick one from Quick History.
              You can also browse Genres or Search on the right.
            </p>
          </div>
        </div>

        <!-- Now playing + controls -->
        <div v-if="isPrepare" id="controlArea" class="control-card w-full p-4 sm:p-5 rounded-2xl flex flex-col gap-4">
          <div class="min-w-0">
            <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-300/90 tabular-nums">
              Now playing<span v-if="queuePositionLabel" class="text-gray-500"> · {{ queuePositionLabel }}</span>
            </p>
            <div class="mt-1 flex items-start gap-2">
              <h2 class="flex-1 min-w-0 text-lg sm:text-xl font-bold text-white leading-snug line-clamp-2 select-text" :title="title">{{ title }}</h2>
              <button
                class="copy-btn"
                :class="{ 'is-copied': copied }"
                :aria-label="copied ? 'Title copied' : 'Copy song title'"
                :title="copied ? 'Copied' : 'Copy title'"
                @click="copyTitle"
              >
                <uiIcon :name="copied ? 'check' : 'copy'" :size="16" />
              </button>
            </div>
          </div>

          <div class="flex flex-col items-center gap-4">
            <!-- 上一首 / 播放 / 下一首 -->
            <div class="flex items-center gap-5">
              <button class="transport-btn" title="Previous (W)" aria-label="Previous song" @click="changeToPrev">
                <uiIcon name="prev" :size="20" />
              </button>
              <button
                class="play-btn"
                :title="isPlaying ? 'Pause (Space)' : 'Play (Space)'"
                :aria-label="isPlaying ? 'Pause' : 'Play'"
                @click="isPlaying ? pauseVideo() : playVideo()"
              >
                <uiIcon :name="isPlaying ? 'pause' : 'play'" :size="28" />
              </button>
              <button class="transport-btn" title="Next (S)" aria-label="Next song" @click="changeToNext">
                <uiIcon name="next" :size="20" />
              </button>
            </div>

            <!-- 播放順序、在清單裡找歌 -->
            <div class="w-full flex flex-wrap items-center justify-between gap-3">
              <div class="mode-toggle" role="radiogroup" aria-label="Play order">
                <button
                  role="radio"
                  :aria-checked="!isShuffled"
                  :class="['mode-option', { 'is-active': !isShuffled }]"
                  :disabled="snippetData.length === 0"
                  title="Play in playlist order"
                  @click="setOrderPlay"
                >
                  <uiIcon name="ordered" :size="16" /> <span>Order</span>
                </button>
                <button
                  role="radio"
                  :aria-checked="isShuffled"
                  :class="['mode-option', { 'is-active': isShuffled }]"
                  :disabled="!useYoutubeData.isLoaded || snippetData.length === 0"
                  title="Shuffle the playlist"
                  @click="setRandomPlay"
                >
                  <uiIcon name="shuffle" :size="16" /> <span>Shuffle</span>
                </button>
              </div>
              <button class="chip-btn" :disabled="snippetData.length === 0" title="Find a song in this playlist" @click="showSearching(true)">
                <uiIcon name="search" :size="16" /> <span>Find in list</span>
              </button>
            </div>
          </div>

          <!-- 音量、影片透明度 -->
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-3 pt-3 border-t border-white/5">
            <div class="slider-row">
              <button
                type="button"
                class="slider-icon"
                :aria-label="Number(volumeRange) === 0 ? 'Unmute' : 'Mute'"
                @click="toggleMute"
              >
                <uiIcon :name="Number(volumeRange) === 0 ? 'mute' : 'volume'" :size="18" />
              </button>
              <input v-model="volumeRange" @input="handleVolumeChange" type="range" min="0" max="100" class="flex-1" aria-label="Volume">
              <span class="slider-value">{{ volumeRange }}%</span>
            </div>
            <div class="slider-row" title="Dim the video">
              <span class="slider-icon" aria-hidden="true"><uiIcon name="eye" :size="18" /></span>
              <input v-model="playerOpacity" type="range" min="0" max="1" step="0.01" class="flex-1" aria-label="Video opacity">
              <span class="slider-value">{{ Math.round(playerOpacity * 100) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Playlist Section (Desktop Side Panel / Mobile Slide-Over Drawer) -->
    <aside
      id="playlistScrollContainer"
      :class="[
        'fixed inset-y-0 right-0 w-full max-w-sm glass-panel z-40 lg:static lg:max-w-none lg:w-[340px] xl:w-[400px] lg:shrink-0 lg:bg-transparent lg:border-none lg:translate-x-0 lg:backdrop-blur-none lg:shadow-none transition-transform duration-300 flex flex-col',
        isMobilePlaylistOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'
      ]"
      aria-label="Playlist"
    >
      <div class="p-4 lg:p-0 h-full flex flex-col">
        <div class="flex items-center gap-2 mb-4 shrink-0">
          <div class="panel-tabs" role="tablist" aria-label="Playlist panel">
            <button
              v-for="tab in panelTabs"
              :key="tab.key"
              role="tab"
              :aria-selected="activeTab === tab.key"
              :class="['panel-tab', { 'is-active': activeTab === tab.key }]"
              @click="selectTab(tab.key)"
            >
              {{ tab.label }}
              <span v-if="tab.key === 'queue'" class="panel-tab-count tabular-nums">
                {{ useYoutubeData.isFetching ? useYoutubeData.fetchedCount : snippetData.length }}
              </span>
            </button>
          </div>

          <!-- Mobile Close Button for Playlist Drawer -->
          <button
            @click="isMobilePlaylistOpen = false"
            class="lg:hidden w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            aria-label="Close playlist"
          >
            <el-icon size="18"><Close /></el-icon>
          </button>
        </div>

        <template v-if="activeTab === 'queue'">
          <div v-if="useYoutubeData.isFetching && snippetData.length === 0" class="flex-1 flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <el-icon class="is-loading text-4xl text-indigo-400"><Loading /></el-icon>
            <p class="text-sm font-semibold text-gray-300">Fetching videos…</p>
            <p class="text-xs text-indigo-300 font-mono tabular-nums">
              {{ useYoutubeData.fetchedCount }} {{ useYoutubeData.totalCount ? `/ ${useYoutubeData.totalCount}` : 'items' }}
            </p>
          </div>
          <div v-else-if="snippetData.length === 0" class="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center gap-2">
            <uiIcon name="list" :size="32" class="text-gray-600" />
            <p class="text-sm font-semibold text-gray-300">This list is empty</p>
            <p class="text-xs text-gray-500">Load a playlist to see its songs here.</p>
          </div>
          <virtualList
            v-else
            ref="scrollRef"
            class="flex-1"
            container-class="virtual-list flex-1 -mx-2 px-2"
            max-height="calc(100vh - 150px)"
            :items="snippetData"
            :item-height="96"
            :item-key="getQueueItemKey"
          >
            <template #default="{ item, index }">
              <div class="pb-2">
                <div
                  role="button"
                  tabindex="0"
                  :aria-current="clickIndex === index ? 'true' : undefined"
                  @click="loadVideo(item, index)"
                  @keydown.enter.self="loadVideo(item, index)"
                  :class="[
                    'queue-item group',
                    clickIndex === index ? 'is-playing' : ''
                  ]"
                >
                  <div class="relative w-[104px] h-[58px] flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
                    <img
                      :src="item.snippet.thumbnails.medium.url"
                      alt=""
                      loading="lazy"
                      decoding="async"
                      class="w-full h-full object-cover"
                    >
                    <div v-if="clickIndex === index" class="absolute inset-0 bg-black/[0.55] flex items-center justify-center" aria-hidden="true">
                      <span :class="['eq', { 'is-paused': !isPlaying }]"><i></i><i></i><i></i></span>
                    </div>
                  </div>

                  <div class="flex flex-col justify-center min-w-0 flex-1">
                    <p :class="['text-[13px] font-semibold leading-snug line-clamp-2', clickIndex === index ? 'text-indigo-200' : 'text-gray-100']">
                      {{ item.snippet.title }}
                    </p>
                    <p class="text-[11px] text-gray-500 mt-1 tabular-nums">#{{ index + 1 }}</p>
                  </div>

                  <div class="item-actions flex flex-col justify-center gap-1.5">
                    <button
                      @click.stop="download(item, index)"
                      :class="['item-action', isDownloading[index] ? 'is-busy' : '']"
                      :aria-label="`Download ${item.snippet.title}`"
                      title="Download MP3"
                    >
                      <el-icon size="14" v-if="!isDownloading[index]"><Download /></el-icon>
                      <el-icon size="14" v-else class="is-loading"><Loading /></el-icon>
                    </button>
                    <button
                      @click.stop="deleteVideo(item.id)"
                      class="item-action is-danger"
                      :aria-label="`Remove ${item.snippet.title} from playlist`"
                      title="Remove from YouTube playlist"
                    >
                      <el-icon size="14"><Delete /></el-icon>
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </virtualList>
        </template>

        <template v-else-if="activeTab === 'discovery'">
          <recommendationList :currentTitle="title" @loadVideo="loadVideo" />
        </template>

        <!-- 第一次打開才載入，之後切換分頁保留搜尋結果 -->
        <genreExplore
          v-if="genresVisited"
          v-show="activeTab === 'genres'"
          :playing-id="audioTrack?.id ?? ''"
          @playTracks="playExploreTracks"
        />

        <youtubeSearch
          v-if="searchVisited"
          v-show="activeTab === 'search'"
          :query="searchQuery"
          :playing-video-id="audioTrack ? '' : videoId"
          @loadVideo="loadVideo"
        />
      </div>
    </aside>

    <!-- Mobile Playlist Backdrop Overlay -->
    <transition name="fade">
      <div
        v-if="isMobilePlaylistOpen"
        @click="isMobilePlaylistOpen = false"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
      ></div>
    </transition>

    <searchCard v-if="isSearching" @handleClose="showSearching(false)" @loadVideo="loadVideo" :dataArr="snippetData" />

    <!-- 手機版：打開清單的按鈕 -->
    <button
      v-show="!isMobilePlaylistOpen"
      @click="isMobilePlaylistOpen = true"
      class="mobile-list-btn lg:hidden"
      aria-label="Open playlist"
    >
      <uiIcon name="list" :size="18" />
      <span>List</span>
      <span v-if="snippetData.length" class="text-indigo-200/80 tabular-nums">{{ snippetData.length }}</span>
    </button>

    <!-- 在其他頁時的迷你播放列：音樂繼續播，可以控制或回到播放頁 -->
    <Teleport to="body">
      <transition name="mini">
        <div v-if="showMiniPlayer" class="mini-player" role="region" aria-label="Now playing">
          <button class="flex items-center gap-3 min-w-0 flex-1 text-left rounded-xl" @click="router.push('/player')" title="Open player">
            <img :src="nowPlayingCover" alt="" class="w-11 h-11 rounded-lg object-cover bg-white/5 shrink-0">
            <span class="min-w-0">
              <span class="block text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-300">{{ isPlaying ? 'Now playing' : 'Paused' }}</span>
              <span class="block text-sm font-semibold text-white truncate">{{ title }}</span>
            </span>
          </button>
          <button class="mini-btn" aria-label="Previous song" @click="changeToPrev"><uiIcon name="prev" :size="16" /></button>
          <button class="mini-btn is-main" :aria-label="isPlaying ? 'Pause' : 'Play'" @click="isPlaying ? pauseVideo() : playVideo()">
            <uiIcon :name="isPlaying ? 'pause' : 'play'" :size="18" />
          </button>
          <button class="mini-btn" aria-label="Next song" @click="changeToNext"><uiIcon name="next" :size="16" /></button>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { useYoutubeDataStore, usePlaylistStore, useUserStore } from '../stores'
import { ref, computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import youtubePlayer from '../components/youtubePlayer.vue'
import audioPlayer from '../components/audioPlayer.vue'
import genreExplore from '../components/genreExplore.vue'
import youtubeSearch from '../components/youtubeSearch.vue'
import { useRoute, useRouter } from 'vue-router'
import searchCard from '../components/searchCard.vue'
import uiIcon from '../components/uiIcon.vue'
import recommendationList from '../components/recommendationList.vue'
import virtualList from '../components/virtualList.vue'
import { downloadData } from '../api/downloadData'
import { requestYoutubeToken } from '../utils/youtubeAuth'
import { Download, Close, Loading, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'

const props = defineProps({
  // 目前是不是在播放頁；在其他頁時播放頁只是隱藏，音樂繼續播
  active: { type: Boolean, default: true }
})

// 迷你播放列出現時通知外層，讓其他頁底部留出空間不被擋住
const emit = defineEmits(['miniPlayerChange'])

const useYoutubeData = useYoutubeDataStore()
const usePlaylist = usePlaylistStore()
const userStore = useUserStore()

const snippetData = ref([])
const volumeRange = ref(0)
const title = ref('')
const videoId = ref('')
const id = ref(0)
const isPrepare = ref(false)
const isPlaying = ref(false)
const playerRef = ref(null)
const playerContainerRef = ref(null)
const scrollRef = ref(null)
const clickIndex = ref(-1)
const isDownloading = ref([])
let timeOut = null
const next = ref({
  prevItem: null,
  prevIndex: -1,
  nextItem: null,
  nextIndex: -1
})
const isSearching = ref(false)
const playerOpacity = ref(1)
const playerState = ref(-1) // -1: unstarted, 1: playing, 2: paused, 3: buffering
const activeTab = ref('queue')
const isMobilePlaylistOpen = ref(false)
const isShuffled = ref(false)
// 目前清單（snippetData）是哪個 YouTube 播放清單；伺服器存的清單為空字串
const queuePlaylistId = ref('')

// 正在播放的非 YouTube 歌曲（Genres 分頁的 Audius 歌曲）；播 YouTube 影片時為 null
const audioTrack = ref(null)
// 從 Genres 分頁開始播放時的清單，上一首／下一首在這個清單裡移動
const exploreQueue = ref([])
const exploreIndex = ref(-1)
const genresVisited = ref(false)
// 最近一次的音量，換播放器時沿用
const lastVolume = ref(100)

// 網址上的 ?q=（從動畫 OP/ED 頁點歌曲過來）會直接打開搜尋分頁並搜尋
const route = useRoute()
const router = useRouter()
const searchVisited = ref(false)
const searchQuery = ref('')

const openSearch = () => {
  searchVisited.value = true
  activeTab.value = 'search'
}

const openSearchFromRoute = () => {
  const text = typeof route.query.q === 'string' ? route.query.q.trim() : ''
  if (!text) return
  searchQuery.value = text
  openSearch()
  // 手機版清單是側邊抽屜，要一起打開才看得到結果
  isMobilePlaylistOpen.value = true
}

const openGenres = () => {
  genresVisited.value = true
  activeTab.value = 'genres'
}

const panelTabs = [
  { key: 'queue', label: 'List' },
  { key: 'discovery', label: 'Discovery' },
  { key: 'genres', label: 'Genres' },
  { key: 'search', label: 'Search' }
]

const selectTab = (key) => {
  if (key === 'genres') return openGenres()
  if (key === 'search') return openSearch()
  activeTab.value = key
}

// 「第 3 / 120 首」之類的位置說明
const queuePositionLabel = computed(() => {
  if (audioTrack.value && exploreQueue.value.length > 0) {
    return `Genres ${exploreIndex.value + 1} / ${exploreQueue.value.length}`
  }
  if (clickIndex.value >= 0) return `${clickIndex.value + 1} / ${snippetData.value.length}`
  return ''
})

const nowPlayingCover = computed(() => audioTrack.value?.cover ||
  (videoId.value ? `https://i.ytimg.com/vi/${videoId.value}/mqdefault.jpg` : ''))

const playFromStart = () => loadVideo(snippetData.value[0], 0)

// 複製目前的歌名；Clipboard API 不能用或被拒絕時（非 https、嵌入的頁面）改用舊的 execCommand
const copied = ref(false)
let copiedTimer = null
const copyWithExecCommand = (text) => {
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(area)
  if (!ok) throw new Error('execCommand copy failed')
}
const copyTitle = async () => {
  const text = title.value
  if (!text) return
  try {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      copyWithExecCommand(text)
    }
    copied.value = true
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => { copied.value = false }, 1500)
    ElMessage.success('已複製歌名')
  } catch (error) {
    console.log('copy title failed', error)
    ElMessage.error('複製失敗，請直接選取歌名複製')
  }
}

const showMiniPlayer = computed(() => !props.active && isPrepare.value)
watch(showMiniPlayer, (visible) => emit('miniPlayerChange', visible), { immediate: true })

// 離開播放頁時收起手機版清單抽屜
watch(() => props.active, (active) => {
  if (!active) isMobilePlaylistOpen.value = false
})

const playExploreTracks = (tracks, index) => {
  exploreQueue.value = tracks
  exploreIndex.value = index
  loadVideo(tracks[index], -1)
}

const loadVideo = async (item, index) => {
  if (!item) return
  const isAudio = item.source === 'audius'
  if (!isAudio) exploreQueue.value = []
  audioTrack.value = isAudio ? item : null
  id.value = index
  title.value = isAudio && item.artist ? `${item.snippet.title} — ${item.artist}` : item.snippet.title
  isPrepare.value = true
  videoId.value = item.snippet.resourceId.videoId

  if (index !== -1) {
    changeIsPlayingItemBg(index)
    modifyListItemPos(index)
    next.value.prevIndex = index - 1
    next.value.prevItem = snippetData.value[index - 1]
    next.value.nextIndex = index + 1
    next.value.nextItem = snippetData.value[index + 1]
  } else {
    // Standalone playback from recommendations
    clickIndex.value = -1 // Deselect from queue
    // Leave next/prev as they are or reset them?
    // Usually better to leave them so 'Next' still plays from the original queue if user wants.
  }
}

const changeIsPlayingItemBg = (newIndex) => {
  clickIndex.value = newIndex
  useYoutubeData.latestIndex = newIndex
}

// 清單可能剛換成新資料還沒畫出來，等下一個 tick 再捲
const modifyListItemPos = (index) => {
  nextTick(() => scrollRef.value?.scrollToIndex(index))
}

const showSearching = (state) => {
  isSearching.value = state === true
}

// 在 Genres 的清單裡往前或往後一首，到底就繞回另一端
const stepExplore = (step) => {
  const length = exploreQueue.value.length
  exploreIndex.value = (exploreIndex.value + step + length) % length
  loadVideo(exploreQueue.value[exploreIndex.value], -1)
}

const changeToNext = () => {
  if (audioTrack.value && exploreQueue.value.length > 0) return stepExplore(1)
  const nextIdx = next.value.nextIndex > snippetData.value.length - 1 ? 0 : next.value.nextIndex
  loadVideo(snippetData.value[nextIdx], nextIdx)
}

const changeToPrev = () => {
  if (audioTrack.value && exploreQueue.value.length > 0) return stepExplore(-1)
  const prevIdx = next.value.prevIndex < 0 ? snippetData.value.length - 1 : next.value.prevIndex
  loadVideo(snippetData.value[prevIdx], prevIdx)
}

const getPlayerState = (state) => {
  playerState.value = state.data
  volumeRange.value = state.target.getVolume()
  lastVolume.value = volumeRange.value
  clearTimeout(timeOut)
  if (state.data === 0) {
    changeToNext()
  } else if (state.data === 1) {
    isPlaying.value = true
  } else if (state.data === 2) {
    isPlaying.value = false
  } else {
    timeOut = setTimeout(() => {
      if (state.data === -1) {
        changeToNext()
      }
    }, 2000)
  }
}

const pauseVideo = () => {
  playerRef.value?.pause()
}

const playVideo = () => {
  playerRef.value?.play()
}

const seekTo = async (seconds) => {
  if (!playerRef.value) return
  let currentTime = await playerRef.value.getCurrentTime()
  currentTime += seconds
  playerRef.value.seekTo(currentTime)
}

const setVolume = async (volume) => {
  if (!playerRef.value) return
  let currentVolume = await playerRef.value.getVolume()
  currentVolume = Math.min(100, Math.max(0, currentVolume + volume))
  volumeRange.value = currentVolume
  playerRef.value.setVolume(currentVolume)
}

const handleVolumeChange = () => {
  lastVolume.value = Number(volumeRange.value)
  playerRef.value?.setVolume(Number(volumeRange.value))
}

// 靜音／取消靜音，取消時回到靜音前的音量
let volumeBeforeMute = 100
const toggleMute = () => {
  if (Number(volumeRange.value) > 0) {
    volumeBeforeMute = Number(volumeRange.value)
    volumeRange.value = 0
  } else {
    volumeRange.value = volumeBeforeMute || 100
  }
  handleVolumeChange()
}

const shuffleInPlace = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// 隨機播放：正在播清單裡的歌時，這首留在第一個繼續播，其餘打亂；還沒播就打亂後從第一首開始
const setRandomPlay = () => {
  const current = clickIndex.value >= 0 ? snippetData.value[clickIndex.value] : null
  if (current) {
    const rest = snippetData.value.filter((_, index) => index !== clickIndex.value)
    snippetData.value = [current, ...shuffleInPlace(rest)]
    isShuffled.value = true
    relinkPlaying(current.id)
    modifyListItemPos(0)
    return
  }
  snippetData.value = shuffleInPlace([...snippetData.value])
  isShuffled.value = true
  loadVideo(snippetData.value[0], 0)
}

// 依序播放：回到清單原本的順序，正在播的歌不中斷，對到它在清單裡的位置
const setOrderPlay = () => {
  if (!isShuffled.value && clickIndex.value >= 0) return
  const current = clickIndex.value >= 0 ? snippetData.value[clickIndex.value] : null
  snippetData.value = [...useYoutubeData.snippetData]
  queuePlaylistId.value = useYoutubeData.currentPlaylistId
  isShuffled.value = false
  if (current) {
    relinkPlaying(current.id)
    if (clickIndex.value >= 0) modifyListItemPos(clickIndex.value)
    return
  }
  loadVideo(snippetData.value[0], 0)
}

const download = async (item, index) => {
  try {
    isDownloading.value[index] = true
    const res = await downloadData(item.snippet.resourceId.videoId)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${item.snippet.title}.mp3`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err) {
    console.log(err)
  } finally {
    isDownloading.value[index] = false
  }
}

const ensureOauthToken = async () => {
  if (userStore.oauthToken) return true
  try {
    const token = await requestYoutubeToken()
    userStore.setOauthToken(token)
    await userStore.getUserInfo(token)
    return true
  } catch (error) {
    console.log('google oauth login failed', error)
    return false
  }
}

const deleteVideo = async (id) => {
  if (!confirm('Delete this track from YouTube playlist?')) return
  const isAuthorized = await ensureOauthToken()
  if (!isAuthorized) return

  const isDeleted = await useYoutubeData.deleteItem(id)
  if (isDeleted) {
    const index = snippetData.value.findIndex((item) => item.id === id)
    if (index !== -1) snippetData.value.splice(index, 1)
  }
}

// 正在輸入文字（網址、搜尋框、滑桿）時不要觸發快捷鍵
const isEditableTarget = (el) => el instanceof HTMLElement &&
  (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))

const handleGlobalKeyDown = (e) => {
  if (!props.active || isSearching.value || !isPrepare.value) return
  if (e.ctrlKey || e.metaKey || e.altKey || isEditableTarget(e.target)) return
  // 焦點在按鈕上時，空白鍵交給按鈕本身
  if (e.keyCode === 32 && e.target instanceof HTMLElement && e.target.closest('button, [role="button"], a')) return
  if (e.keyCode === 87) {
    changeToPrev()
  } else if (e.keyCode === 83) {
    changeToNext()
  } else if (e.keyCode === 65) {
    seekTo(-5)
  } else if (e.keyCode === 68) {
    seekTo(5)
  } else if (e.keyCode === 32) {
    e.preventDefault()
    if (isPlaying.value) {
      pauseVideo()
    } else {
      playVideo()
    }
  } else if (e.keyCode === 38) {
    e.preventDefault()
    setVolume(5)
  } else if (e.keyCode === 40) {
    e.preventDefault()
    setVolume(-5)
  } else if (e.keyCode === 37) {
    seekTo(-5)
  } else if (e.keyCode === 39) {
    seekTo(5)
  }
}

const getQueueItemKey = (item, index) => item?.id ?? `${item?.snippet?.resourceId?.videoId ?? 'video'}-${index}`

const resumeLatest = () => {
  snippetData.value = [...useYoutubeData.snippetData]
  queuePlaylistId.value = useYoutubeData.currentPlaylistId
  isShuffled.value = false
  const latestIdx = Math.min(useYoutubeData.latestIndex || 0, snippetData.value.length - 1)
  if (snippetData.value.length > 0) {
    loadVideo(snippetData.value[latestIdx], latestIdx)
  }
}

// 換成另一個清單：維持原本的行為，不自動播放，下一首從第一首開始
const replaceQueue = (playlistId) => {
  snippetData.value = [...useYoutubeData.snippetData]
  queuePlaylistId.value = playlistId
  isShuffled.value = false
  clickIndex.value = -1
  next.value.nextIndex = 0
  next.value.prevIndex = -1
  useYoutubeData.latestIndex = 0
}

// 清單內容換了但正在播的歌不中斷：重新對到正在播的那首，修正高亮與上下首
const relinkPlaying = (playingItemId) => {
  if (id.value === -1 || clickIndex.value === -1) return
  let playingIndex = snippetData.value.findIndex((item) => item.id === playingItemId)
  if (playingIndex === -1) {
    playingIndex = snippetData.value.findIndex((item) => item.snippet.resourceId.videoId === videoId.value)
  }
  clickIndex.value = playingIndex
  id.value = playingIndex
  if (playingIndex === -1) return
  useYoutubeData.latestIndex = playingIndex
  next.value.prevIndex = playingIndex - 1
  next.value.prevItem = snippetData.value[playingIndex - 1]
  next.value.nextIndex = playingIndex + 1
  next.value.nextItem = snippetData.value[playingIndex + 1]
}

const handleSync = ({ playlistId, mode, added }) => {
  const isSameQueue = playlistId === queuePlaylistId.value && snippetData.value.length > 0

  if (mode === 'resume') {
    isPrepare.value ? replaceQueue(playlistId) : resumeLatest()
    return
  }
  if (!isSameQueue) {
    replaceQueue(playlistId)
    return
  }

  const playingItemId = snippetData.value[clickIndex.value]?.id

  if (mode === 'update' && isShuffled.value) {
    // 隨機播放：新歌隨機插進目前這首之後，還沒播到的部分
    const arr = [...snippetData.value]
    const start = clickIndex.value + 1
    added.forEach((video) => {
      const at = start + Math.floor(Math.random() * (arr.length - start + 1))
      arr.splice(at, 0, video)
    })
    snippetData.value = arr
  } else {
    // 依序播放的更新，或同一個清單的完整載入：換成 store 的新順序
    snippetData.value = [...useYoutubeData.snippetData]
    isShuffled.value = false
  }
  relinkPlaying(playingItemId)
}

watch(() => route.query.q, openSearchFromRoute)

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeyDown)
  openSearchFromRoute()
  if (useYoutubeData.snippetData.length > 0) {
    resumeLatest()
  } else {
    // 重新整理網頁後，從本機快取接續上次的清單（完成時由 handleSync 接著播）
    useYoutubeData.restoreLastPlaylist()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown)
  clearTimeout(timeOut)
})

watch(
  () => useYoutubeData.lastSync.version,
  () => handleSync(useYoutubeData.lastSync)
)

watch(
  () => usePlaylist.playlist,
  (newPlaylist) => {
    if (newPlaylist) {
      snippetData.value = [...newPlaylist]
      queuePlaylistId.value = ''
      isShuffled.value = false
    }
  }
)
</script>

<style scoped>
.player-column {
  scrollbar-gutter: stable;
}

.player-container {
  transition: opacity 0.2s ease;
}

/* 播放器還沒開始時的畫面 */
.empty-stage {
  @apply w-full h-full flex flex-col items-center justify-center gap-4 text-gray-400;
  background: radial-gradient(120% 90% at 50% 0%, rgba(99, 102, 241, 0.12), transparent 60%), #000;
}

.cta-primary,
.cta-secondary {
  @apply h-11 px-5 rounded-xl inline-flex items-center gap-2 text-sm font-semibold transition-colors duration-150;
}

.cta-primary {
  @apply bg-indigo-500 text-white hover:bg-indigo-400 active:bg-indigo-600;
}

.cta-secondary {
  @apply bg-white/10 text-gray-100 border border-white/10 hover:bg-white/[0.15] active:bg-white/5;
}

/* 正在播放 + 控制 */
.control-card {
  background: rgba(30, 41, 59, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 40px -20px rgba(0, 0, 0, 0.6);
}

.mode-toggle {
  @apply inline-flex p-1 rounded-xl bg-black/30 border border-white/5;
}

.mode-option {
  @apply h-9 px-3 rounded-lg inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 transition-colors duration-150;
}

.mode-option:not(:disabled):hover {
  @apply text-white;
}

.mode-option.is-active {
  @apply bg-indigo-500/25 text-indigo-100;
}

.mode-option:disabled {
  @apply opacity-40 cursor-not-allowed;
}

.transport-btn {
  @apply w-12 h-12 rounded-full flex items-center justify-center text-gray-200 bg-white/5 border border-white/10 transition-colors duration-150;
}

.transport-btn:hover {
  @apply bg-white/10 text-white;
}

.transport-btn:active,
.play-btn:active,
.mini-btn:active {
  transform: scale(0.94);
}

.play-btn {
  @apply w-16 h-16 rounded-full flex items-center justify-center text-white transition-[filter,transform] duration-150;
  background: linear-gradient(145deg, #6366f1, #4f46e5);
  box-shadow: 0 10px 30px -8px rgba(99, 102, 241, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.25);
}

.play-btn:hover {
  filter: brightness(1.1);
}

.chip-btn {
  @apply h-9 px-3 rounded-lg inline-flex items-center gap-1.5 text-xs font-semibold text-gray-300 bg-white/5 border border-white/10 transition-colors duration-150;
}

.chip-btn:not(:disabled):hover {
  @apply bg-white/10 text-white;
}

.chip-btn:disabled {
  @apply opacity-40 cursor-not-allowed;
}

.copy-btn {
  @apply w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-gray-400 bg-white/5 border border-white/10 transition-colors duration-150;
}

.copy-btn:hover {
  @apply bg-white/10 text-white;
}

.copy-btn.is-copied {
  @apply text-emerald-300 border-emerald-400/30 bg-emerald-500/10;
}

.slider-row {
  @apply flex items-center gap-3 min-w-0;
}

.slider-icon {
  @apply w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-gray-400 transition-colors duration-150;
}

button.slider-icon:hover {
  @apply bg-white/5 text-white;
}

.slider-value {
  @apply w-11 text-right text-xs font-semibold text-gray-400 tabular-nums;
}

input[type='range'] {
  @apply h-1.5 rounded-full cursor-pointer appearance-none bg-white/10 accent-indigo-500;
}

/* 右側分頁 */
.panel-tabs {
  @apply flex-1 min-w-0 flex gap-1 p-1 rounded-xl bg-white/5 border border-white/5 overflow-x-auto;
  scrollbar-width: none;
}

.panel-tabs::-webkit-scrollbar {
  display: none;
}

.panel-tab {
  @apply shrink-0 h-9 px-3 rounded-lg inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 whitespace-nowrap transition-colors duration-150;
}

.panel-tab:hover {
  @apply text-white;
}

.panel-tab.is-active {
  @apply bg-indigo-500/25 text-indigo-100;
}

.panel-tab-count {
  @apply px-1.5 py-px rounded-md bg-black/30 text-[10px] text-gray-300;
}

/* 清單項目 */
.queue-item {
  @apply relative flex items-center gap-3 p-2 pr-2.5 rounded-xl border cursor-pointer h-[88px] bg-white/[0.04] border-white/5 transition-colors duration-150;
}

.queue-item:hover {
  @apply bg-white/[0.08] border-white/10;
}

.queue-item.is-playing {
  @apply bg-indigo-500/[0.15] border-indigo-400/30;
}

.item-action {
  @apply w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 bg-white/5 transition-colors duration-150;
}

.item-action:hover {
  @apply bg-indigo-500 text-white;
}

.item-action.is-danger:hover {
  @apply bg-red-500 text-white;
}

.item-action.is-busy {
  @apply bg-emerald-500 text-white;
}

/* 有滑鼠的裝置：滑過或鍵盤聚焦才顯示；觸控裝置一直顯示 */
@media (hover: hover) {
  .item-actions {
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .queue-item:hover .item-actions,
  .queue-item:focus-within .item-actions {
    opacity: 1;
  }
}

/* 正在播放的跳動音量條 */
.eq {
  @apply flex items-end gap-[3px] h-4;
}

.eq i {
  @apply block w-[3px] rounded-full bg-indigo-300;
  height: 100%;
  animation: eq 0.9s ease-in-out infinite;
}

.eq i:nth-child(2) { animation-delay: -0.3s; }
.eq i:nth-child(3) { animation-delay: -0.6s; }

.eq.is-paused i {
  animation-play-state: paused;
  height: 40%;
}

@keyframes eq {
  0%, 100% { transform: scaleY(0.35); transform-origin: bottom; }
  50% { transform: scaleY(1); transform-origin: bottom; }
}

/* 手機版清單按鈕 */
.mobile-list-btn {
  @apply fixed right-4 z-30 h-12 px-4 rounded-full inline-flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 border border-white/10 transition-colors duration-150;
  bottom: calc(1rem + env(safe-area-inset-bottom));
  box-shadow: 0 12px 30px -8px rgba(79, 70, 229, 0.7);
}

.mobile-list-btn:active {
  @apply bg-indigo-700;
}

@media (min-width: 1024px) {
  .mobile-list-btn {
    display: none;
  }
}

/* 其他頁的迷你播放列 */
.mini-player {
  @apply fixed z-[60] left-1/2 flex items-center gap-2 p-2 pr-3 rounded-2xl border border-white/10;
  bottom: calc(1rem + env(safe-area-inset-bottom));
  width: min(560px, calc(100vw - 2rem));
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
}

.mini-btn {
  @apply w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-gray-200 hover:bg-white/10 hover:text-white transition-colors duration-150;
}

.mini-btn.is-main {
  @apply bg-indigo-500 text-white hover:bg-indigo-400;
}

.mini-enter-active,
.mini-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.mini-enter-from,
.mini-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.virtual-list {
  scrollbar-gutter: stable;
}

@media (prefers-reduced-motion: reduce) {
  .eq i {
    animation: none;
  }
}
</style>
