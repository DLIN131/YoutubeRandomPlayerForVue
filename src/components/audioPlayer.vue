<template>
  <div class="relative w-full h-full bg-black overflow-hidden">
    <img
      v-if="cover"
      :src="cover"
      alt=""
      class="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-40"
    >
    <div class="relative w-full h-full flex flex-col items-center justify-center gap-3 p-4">
      <img
        v-if="cover"
        :src="cover"
        :alt="`Cover: ${title}`"
        class="h-3/5 aspect-square object-cover rounded-2xl shadow-2xl border border-white/10"
      >
      <p class="text-xs text-gray-300 font-mono">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</p>
      <input
        type="range"
        min="0"
        :max="duration || 0"
        step="1"
        :value="currentTime"
        @input="seekTo(Number($event.target.value))"
        class="w-4/5 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        aria-label="Seek"
      >
    </div>
    <audio
      ref="audioRef"
      :src="src"
      autoplay
      @playing="onPlaying"
      @pause="onPause"
      @waiting="emitState(3)"
      @ended="emitState(0)"
      @error="emitState(-1)"
      @timeupdate="currentTime = $event.target.currentTime"
      @durationchange="duration = $event.target.duration || 0"
    ></audio>
  </div>
</template>

<script setup>
// 播放一般音檔（Audius 等非 YouTube 來源）。
// 對外的方法與 changeState 事件和 youtubePlayer 相同，播放頁可以用同一套控制。
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { claimPlayback, releasePlayback } from '../utils/playbackFocus'

const props = defineProps({
  src: { type: String, required: true },
  cover: { type: String, default: '' },
  title: { type: String, default: '' },
  // 0–100，沿用前一個播放器的音量
  initialVolume: { type: Number, default: 100 }
})

const emit = defineEmits(['changeState'])

const audioRef = ref(null)
const currentTime = ref(0)
const duration = ref(0)

const getVolume = () => Math.round((audioRef.value?.volume ?? 1) * 100)

// 狀態碼沿用 YouTube：-1 無法播放、0 結束、1 播放中、2 暫停、3 緩衝
const emitState = (data) => emit('changeState', { data, target: { getVolume } })

const onPause = () => {
  // 播完時瀏覽器也會先觸發 pause，交給 ended 處理
  if (!audioRef.value?.ended) emitState(2)
}

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

const play = () => audioRef.value?.play()
const pause = () => audioRef.value?.pause()
const seekTo = (seconds) => {
  if (audioRef.value) audioRef.value.currentTime = Math.max(0, seconds)
}
const getCurrentTime = () => audioRef.value?.currentTime ?? 0
const setVolume = (volume) => {
  if (audioRef.value) audioRef.value.volume = Math.min(1, Math.max(0, volume / 100))
}

const onPlaying = () => {
  claimPlayback(pause)
  emitState(1)
}

onMounted(() => setVolume(props.initialVolume))
onBeforeUnmount(() => releasePlayback(pause))

defineExpose({ play, pause, seekTo, getCurrentTime, getVolume, setVolume })
</script>
