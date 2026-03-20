<template>
  <div class="md:flex md:justify-between relative p-2">
    <div class="flex flex-col md:w-8/12 items-center">
      <div class="player" ref="playerContainerRef" :style="{ opacity: playerOpacity }">
        <youtubePlayer
          v-if="isPrepare"
          :width="playerSize.width"
          :height="playerSize.height"
          :vid="videoId"
          :title="title"
          :id="id"
          ref="playerRef"
          @changeState="getPlayerState"
        />
        <div v-else class="text-white">waiting fo video...</div>
      </div>

      <div
        v-if="isPrepare"
        id="buttonArea"
        class="bg-transparent/[.7] shadow-inner shadow-gray-600 w-full md:w-8/12 min-w-fit mt-10 flex flex-col justify-center items-center rounded-xl p-5"
      >
        <div class="text-white flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span>音量</span>
            <input
              v-model="volumeRange"
              @change="handleVolumeChange"
              type="range"
              name="volume"
              min="0"
              max="100"
              class="flex-1"
            >
          </div>
          <div class="flex items-center justify-between">
            <span>透明度</span>
            <input v-model="playerOpacity" type="range" min="0" max="1" step="0.01" class="flex-1">
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button @click="changeToPrev"><el-icon><ArrowLeftBold /></el-icon></button>
          <button v-if="isPlaying" @click="pauseVideo" class="w-24 h-24 text-5xl rounded-full">
            <el-icon><VideoPause /></el-icon>
          </button>
          <button v-else @click="playVideo" class="w-24 h-24 text-5xl rounded-full">
            <el-icon><VideoPlay /></el-icon>
          </button>
          <button @click="changeToNext"><el-icon><ArrowRightBold /></el-icon></button>
        </div>

        <div class="flex items-center mt-2 gap-2 flex-wrap">
          <button @click="setRandomPlay" :disabled="!useYoutubeData.isLoaded">R</button>
          <button @click="setOrderPlay"><el-icon><Sort class="rotate-90" /></el-icon></button>
          <button @click="showSearching"><el-icon><Search /></el-icon></button>
        </div>
      </div>
    </div>

    <searchCard v-if="isSearching" @handleClose="showSearching(message)" @loadVideo="loadVideo" :dataArr="snippetData" />
    <!-- 搜尋彈窗 -->

    <div
      id="playlistScrollContainer"
      class="translate-x-[110%] transition-all md:translate-x-0 md:static absolute right-1 top-0 w-fit overflow-x-hidden"
    >
      <el-scrollbar ref="scrollRef" class="relative md:flex flex-col" max-height="92vh" always native>
        <div v-if="!useYoutubeData.isLoaded" class="text-white">[{{ useYoutubeData.snippetData.length }}]</div>
        <div
          v-for="(item, index) in snippetData"
          :key="index"
          @click="loadVideo(item, index)"
          :ref="listItems(index)"
          :class="[
            `flex place-items-start gap-3 h-32 overflow-ellipsis overflow-hidden p-2 items-center relative
             bg-black w-full min-w-[7rem] cursor-pointer border border-white bg-transparent/[.5] shadow-inner shadow-md shadow-white text-white`,
            { colorBackground: clickIndex === index }
          ]"
        >
          <img :src="item.snippet.thumbnails.medium.url" class="w-28 h-24 rounded-md shadow-2">
          {{ item.snippet.position + ' ' + item.snippet.title }}
          <span
            :class="`flex justify-center items-center absolute w-7 h-7 right-12 bottom-5 rounded-full bg-red-100/[.5] hover:bg-blue-400/[.5]`"
            @click.stop="deleteVideo(item.id)"
          >
            X
          </span>
          <span
            :class="[
              `flex justify-center items-center absolute w-7 h-7 right-3 bottom-5 rounded-full bg-red-400/[.5] hover:bg-black/[.5]`,
              { downloadBg: isDownloading[index] }
            ]"
            @click.stop="download(item, index)"
          >
            <el-icon><Download /></el-icon>
          </span>
        </div>
      </el-scrollbar>
    </div>

    <div
      @click="togglePlaylist"
      class="md:hidden flex items-center absolute w-4 h-10 bg-slate-200/[.3] rounded-s-md border-2 text-black right-0 top-28 z-20 cursor-pointer"
    >
      <el-icon id="toggleListBtn" class="transition-transform"><ArrowLeftBold /></el-icon>
    </div>
  </div>
</template>

<script setup>
import { useYoutubeDataStore, usePlaylistStore, useUserStore } from '../stores'
import { ref, onBeforeUnmount, onMounted, watch } from 'vue'
import youtubePlayer from '../components/youtubePlayer.vue'
import searchCard from '../components/searchCard.vue'
import { downloadData } from '../api/downloadData'
import { googleTokenLogin } from 'vue3-google-login'
import {
  ArrowLeftBold,
  ArrowRightBold,
  VideoPlay,
  VideoPause,
  Search,
  Sort,
  Download
} from '@element-plus/icons-vue'

const useYoutubeData = useYoutubeDataStore()
const usePlaylist = usePlaylistStore()
const userStore = useUserStore()

const snippetData = ref([])
const volumeRange = ref(0)
const title = ref('')
const videoId = ref('')
const id = ref(0)
const playerSize = ref({
  width: window.innerWidth > 600 ? 600 : window.innerWidth - 10,
  height: window.innerWidth > 600 ? 400 : window.innerHeight / 2
})
const isPrepare = ref(false)
const isPlaying = ref(false)
const playerRef = ref(null)
const playerContainerRef = ref(null)
const scrollRef = ref(null)
const clickIndex = ref(-1)
const isDownloading = ref([])
let timeOut = null
const next = ref({
  prevItem: Object,
  prevIndex: Number,
  nextItem: Object,
  nextIndex: Number
})
const listItemsRef = ref([])
const isSearching = ref(false)
const playerOpacity = ref(0)

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
  if (!state) {
    isSearching.value = false
    window.addEventListener('keydown', handleGlobalKeyDown)
    return
  }
  isSearching.value = true
  window.removeEventListener('keydown', handleGlobalKeyDown)
}

const changeToNext = () => {
  if (next.value.nextIndex > snippetData.value.length - 1) {
    next.value.nextIndex = 0
    next.value.nextItem = snippetData.value[0]
  }
  loadVideo(next.value.nextItem, next.value.nextIndex)
}

const changeToPrev = () => {
  if (next.value.prevIndex < 0) {
    next.value.prevIndex = snippetData.value.length - 1
    next.value.prevItem = snippetData.value[snippetData.value.length - 1]
  }
  loadVideo(next.value.prevItem, next.value.prevIndex)
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
  let currentTime = await playerRef.value.getCurrentTime()
  currentTime += seconds
  playerRef.value.seekTo(currentTime)
}

const setVolume = async (volume) => {
  let currentVolume = await playerRef.value.getVolume()
  currentVolume += volume
  volumeRange.value = currentVolume
  playerRef.value.setVolume(currentVolume)
}

const handleVolumeChange = () => {
  playerRef.value.setVolume(volumeRange.value)
}

const setRandomPlay = () => {
  for (let i = snippetData.value.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[snippetData.value[i], snippetData.value[j]] = [snippetData.value[j], snippetData.value[i]]
  }
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
  scrollEle.classList.toggle('translate-x-[110%]')
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
  loadVideo(snippetData.value[useYoutubeData.latestIndex], useYoutubeData.latestIndex)
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
.colorBackground {
  background-color: rgba(0, 218, 247, 0.308);
  border-left: 4px solid rgb(149, 149, 236);
}

button {
  background: black;
  box-shadow: 0px 3px 0px rgba(163, 26, 26, 1);
}

.player {
  transition: opacity 0.3s ease;
}

.downloadBg {
  background-color: green;
}

@media screen and (max-width: 768px) {
  button {
    width: 5rem;
    height: 1.75rem;
    font-size: 100%;
  }
}

button:hover {
  border-color: #646cff;
}

input[type='range'] {
  cursor: pointer;
  accent-color: #646cff;
}
</style>
