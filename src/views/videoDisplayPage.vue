<template>
  <div class="md:flex md:justify-between relative p-4 h-full gap-6">
    <!-- Player Section -->
    <div class="flex flex-col md:w-8/12 items-center flex-1">
      <div class="player-container w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black" ref="playerContainerRef" :style="{ opacity: playerOpacity }">
        <youtubePlayer
          v-if="isPrepare"
          :width="'100%'"
          :height="'100%'"
          :vid="videoId"
          :title="title"
          :id="id"
          ref="playerRef"
          @changeState="getPlayerState"
        />
        <div v-else class="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-4">
          <el-icon class="text-6xl animate-pulse"><VideoPlay /></el-icon>
          <span class="text-lg font-medium">Waiting for video...</span>
        </div>
      </div>

      <titleCard v-if="isPrepare" :title="title" />

      <div
        v-if="isPrepare"
        id="controlArea"
        class="glass-card w-full mt-8 p-6 rounded-2xl flex flex-col items-center gap-6"
      >
        <div class="w-full grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>Volume</span>
              <span class="text-indigo-400">{{ volumeRange }}%</span>
            </div>
            <input
              v-model="volumeRange"
              @change="handleVolumeChange"
              type="range"
              min="0"
              max="100"
              class="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            >
          </div>
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>Player Opacity</span>
              <span class="text-indigo-400">{{ Math.round(playerOpacity * 100) }}%</span>
            </div>
            <input
              v-model="playerOpacity"
              type="range"
              min="0"
              max="1"
              step="0.01"
              class="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            >
          </div>
        </div>

        <div class="flex items-center gap-6">
          <button @click="changeToPrev" class="control-btn-secondary">
            <el-icon><ArrowLeftBold /></el-icon>
          </button>
          
          <button v-if="isPlaying" @click="pauseVideo" class="control-btn-main">
            <el-icon><VideoPause /></el-icon>
          </button>
          <button v-else @click="playVideo" class="control-btn-main">
            <el-icon class="ml-1"><VideoPlay /></el-icon>
          </button>
          
          <button @click="changeToNext" class="control-btn-secondary">
            <el-icon><ArrowRightBold /></el-icon>
          </button>
        </div>

        <div class="flex items-center gap-4">
          <button @click="setRandomPlay" :disabled="!useYoutubeData.isLoaded" class="action-btn" title="Shuffle">
            <span class="text-sm font-bold">SHUFFLE</span>
          </button>
          <button @click="setOrderPlay" class="action-btn" title="Sequential">
            <el-icon class="rotate-90"><Sort /></el-icon>
          </button>
          <button @click="showSearching(true)" class="action-btn" title="Search">
            <el-icon><Search /></el-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- Playlist Section -->
    <div
      id="playlistScrollContainer"
      class="fixed inset-y-0 right-0 w-80 glass-panel md:static md:w-4/12 md:bg-transparent md:border-none translate-x-full md:translate-x-0 transition-transform duration-300 z-30"
    >
      <div class="p-4 h-full flex flex-col">
        <div class="flex items-center justify-between mb-4 px-2">
          <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest">Next Tracks</h3>
          <span class="text-xs bg-white/5 px-2 py-1 rounded text-gray-500">{{ snippetData.length }} Items</span>
        </div>
        
        <el-scrollbar ref="scrollRef" class="flex-1 -mx-2 px-2" max-height="calc(100vh - 120px)">
          <div class="flex flex-col gap-2 pb-10">
            <div
              v-for="(item, index) in snippetData"
              :key="index"
              @click="loadVideo(item, index)"
              :ref="listItems(index)"
              :class="[
                'group relative flex gap-3 p-2 rounded-xl border transition-all duration-300 cursor-pointer',
                clickIndex === index 
                  ? 'bg-indigo-500/10 border-indigo-500/30' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
              ]"
            >
              <div class="relative w-24 h-16 flex-shrink-0">
                <img :src="item.snippet.thumbnails.medium.url" class="w-full h-full object-cover rounded-lg shadow-lg">
                <div v-if="clickIndex === index" class="absolute inset-0 bg-indigo-500/20 flex items-center justify-center rounded-lg">
                  <el-icon class="text-indigo-400 animate-spin-slow"><Loading /></el-icon>
                </div>
              </div>
              
              <div class="flex flex-col justify-center min-w-0 pr-12">
                <p :class="['text-xs font-bold leading-tight line-clamp-2', clickIndex === index ? 'text-indigo-300' : 'text-gray-200']">
                  {{ item.snippet.title }}
                </p>
                <p class="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">Pos: {{ item.snippet.position }}</p>
              </div>

              <div class="absolute right-2 top-0 bottom-0 flex flex-col justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  @click.stop="deleteVideo(item.id)"
                  class="w-7 h-7 flex items-center justify-center rounded-full bg-red-400/10 text-red-400 hover:bg-red-400 hover:text-white transition-all"
                >
                  <el-icon size="12"><Close /></el-icon>
                </button>
                <button
                  @click.stop="download(item, index)"
                  :class="[
                    'w-7 h-7 flex items-center justify-center rounded-full transition-all',
                    isDownloading[index] ? 'bg-green-500 text-white' : 'bg-indigo-400/10 text-indigo-400 hover:bg-indigo-400 hover:text-white'
                  ]"
                >
                  <el-icon size="12" v-if="!isDownloading[index]"><Download /></el-icon>
                  <el-icon size="12" v-else class="is-loading"><Loading /></el-icon>
                </button>
              </div>
            </div>
          </div>
        </el-scrollbar>
      </div>
    </div>

    <searchCard v-if="isSearching" @handleClose="showSearching(false)" @loadVideo="loadVideo" :dataArr="snippetData" />

    <!-- Mobile Playlist Toggle -->
    <div
      @click="togglePlaylist"
      class="md:hidden fixed right-0 top-1/2 -translate-y-1/2 w-8 h-16 glass-panel rounded-l-xl flex items-center justify-center z-40 cursor-pointer text-indigo-400"
    >
      <el-icon id="toggleListBtn" class="transition-transform duration-300"><ArrowLeftBold /></el-icon>
    </div>
  </div>
</template>

<script setup>
import { useYoutubeDataStore, usePlaylistStore, useUserStore } from '../stores'
import { ref, onBeforeUnmount, onMounted, watch } from 'vue'
import youtubePlayer from '../components/youtubePlayer.vue'
import searchCard from '../components/searchCard.vue'
import titleCard from '../components/titleCard.vue'
import { downloadData } from '../api/downloadData'
import { googleTokenLogin } from 'vue3-google-login'
import {
  ArrowLeftBold,
  ArrowRightBold,
  VideoPlay,
  VideoPause,
  Search,
  Sort,
  Download,
  Close,
  Loading
} from '@element-plus/icons-vue'

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
const listItemsRef = ref([])
const isSearching = ref(false)
const playerOpacity = ref(1)

const loadVideo = async (item, index) => {
  if (!item) return
  id.value = index
  title.value = item.snippet.title
  isPrepare.value = true
  videoId.value = item.snippet.resourceId.videoId
  changeIsPlayingItemBg(index)
  modifyListItemPos(index)
  next.value.prevIndex = index - 1
  next.value.prevItem = snippetData.value[index - 1]
  next.value.nextIndex = index + 1
  next.value.nextItem = snippetData.value[index + 1]
}

const changeIsPlayingItemBg = (newIndex) => {
  clickIndex.value = newIndex
  useYoutubeData.latestIndex = newIndex
}

const modifyListItemPos = (index) => {
  if (!listItemsRef.value || !listItemsRef.value[index] || !scrollRef.value) return
  const item = listItemsRef.value[index]
  const container = scrollRef.value.$el || scrollRef.value
  const itemOffsetTop = item.offsetTop
  const containerHeight = container.clientHeight
  const itemHeight = item.offsetHeight
  const scrollTop = itemOffsetTop - containerHeight / 2 + itemHeight / 2
  scrollRef.value.setScrollTop(scrollTop)
}

const showSearching = (state) => {
  isSearching.value = state === true
  if (!isSearching.value) {
    window.addEventListener('keydown', handleGlobalKeyDown)
  } else {
    window.removeEventListener('keydown', handleGlobalKeyDown)
  }
}

const changeToNext = () => {
  const nextIdx = next.value.nextIndex > snippetData.value.length - 1 ? 0 : next.value.nextIndex
  loadVideo(snippetData.value[nextIdx], nextIdx)
}

const changeToPrev = () => {
  const prevIdx = next.value.prevIndex < 0 ? snippetData.value.length - 1 : next.value.prevIndex
  loadVideo(snippetData.value[prevIdx], prevIdx)
}

const getPlayerState = (state) => {
  volumeRange.value = state.target.getVolume()
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
  playerRef.value.pause()
}

const playVideo = () => {
  playerRef.value.play()
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
  playerRef.value.setVolume(volumeRange.value)
}

const setRandomPlay = () => {
  const arr = [...snippetData.value]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  snippetData.value = arr
  loadVideo(snippetData.value[0], 0)
}

const setOrderPlay = () => {
  snippetData.value = [...useYoutubeData.snippetData]
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
    const res = await googleTokenLogin({
      clientId: '959560237311-13dbj26mjffjcph7r49pq3c57lbvpgrr.apps.googleusercontent.com',
      scope: 'profile email https://www.googleapis.com/auth/youtube.force-ssl',
      prompt: 'consent'
    })
    userStore.setOauthToken(res.access_token)
    await userStore.getUserInfo(res.access_token)
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

const togglePlaylist = () => {
  const toggleBtn = document.getElementById('toggleListBtn')
  const scrollEle = document.getElementById('playlistScrollContainer')
  scrollEle.classList.toggle('translate-x-full')
  toggleBtn.classList.toggle('rotate-180')
}

const handleGlobalKeyDown = (e) => {
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
      playerRef.value.pause()
    } else {
      playerRef.value.play()
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

const listItems = (index) => (el) => {
  listItemsRef.value[index] = el
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeyDown)
  snippetData.value = [...useYoutubeData.snippetData]
  const latestIdx = useYoutubeData.latestIndex || 0
  if (snippetData.value.length > 0) {
    loadVideo(snippetData.value[latestIdx], latestIdx)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown)
  clearTimeout(timeOut)
})

watch(
  () => useYoutubeData.isLoaded,
  (newIsLoaded) => {
    if (newIsLoaded) {
      snippetData.value = [...useYoutubeData.snippetData]
      useYoutubeData.latestIndex = 0
    }
  }
)

watch(
  () => usePlaylist.playlist,
  (newPlaylist) => {
    if (newPlaylist) {
      snippetData.value = [...newPlaylist]
    }
  }
)
</script>

<style scoped>
.control-btn-main {
  @apply w-20 h-20 rounded-full bg-indigo-600 hover:bg-indigo-500 text-3xl flex items-center justify-center shadow-xl shadow-indigo-600/20 active:scale-90 transition-all;
}

.control-btn-secondary {
  @apply w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-xl flex items-center justify-center border border-white/5 active:scale-95 transition-all;
}

.action-btn {
  @apply px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 text-xs font-medium transition-all;
}

.animate-spin-slow {
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

input[type='range'] {
  @apply cursor-pointer accent-indigo-500;
}
</style>
