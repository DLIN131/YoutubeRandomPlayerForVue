<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 px-2 shrink-0">
      <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
        Discovery
        <el-tag size="small" type="info" effect="dark" class="opacity-50">Beta</el-tag>
      </h3>
      <button
        @click="handleRefresh"
        :disabled="loading"
        class="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all border border-indigo-500/20"
      >
        <el-icon :class="{ 'animate-spin': loading }"><Refresh /></el-icon>
        <span>{{ loading ? 'Finding...' : 'Refresh' }}</span>
      </button>
    </div>

    <!-- Scrollable Content -->
    <el-scrollbar class="flex-1 -mx-2 px-2">
      <div v-if="recommendedVideos.length === 0" class="py-20 flex flex-col items-center justify-center text-gray-500 gap-4">
        <el-icon class="text-5xl opacity-10"><Compass /></el-icon>
        <p class="text-sm font-medium opacity-50">Click refresh to discovery music</p>
      </div>

      <div class="flex flex-col gap-2 pb-10">
        <div
          v-for="(item, index) in recommendedVideos"
          :key="index"
          @click="$emit('loadVideo', item, -1)"
          class="group relative flex gap-3 p-2 rounded-xl border bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 cursor-pointer"
        >
          <div class="relative w-24 h-16 flex-shrink-0">
            <img :src="item.snippet.thumbnails.medium.url" class="w-full h-full object-cover rounded-lg shadow-lg">
            <div class="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
              <el-icon class="text-white text-xl"><VideoPlay /></el-icon>
            </div>
          </div>

          <div class="flex flex-col justify-center min-w-0 flex-1">
            <p class="text-xs font-bold leading-tight line-clamp-2 text-gray-200 group-hover:text-indigo-300 transition-colors">
              {{ item.snippet.title }}
            </p>
            <p class="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter flex items-center gap-1">
              <el-icon><Compass /></el-icon> Recommended
            </p>
          </div>

          <button
            @click.stop="handleAdd(item)"
            class="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:bg-indigo-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
            title="Add to Playlist"
          >
            <el-icon><Plus /></el-icon>
          </button>
        </div>
      </div>
    </el-scrollbar>

    <!-- Playlist Selection Dialog -->
    <el-dialog
      v-model="isPlaylistDialogVisible"
      title="Select Playlist"
      width="400px"
      class="modern-dialog"
      append-to-body
      :show-close="false"
    >
      <div class="flex flex-col gap-3 py-2">
        <p class="text-xs text-gray-400 mb-2 uppercase tracking-widest font-bold">Your YouTube Playlists</p>

        <el-scrollbar max-height="300px">
          <div class="flex flex-col gap-2 pr-2">
            <div
              v-for="list in myPlaylistData"
              :key="list.value"
              @click="handleConfirmAdd(list.value)"
              class="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-indigo-500/10 hover:border-indigo-500/30 cursor-pointer transition-all flex items-center justify-between group"
            >
              <!-- Text color updated to text-gray-400 for better depth -->
              <span class="text-sm font-medium text-gray-400 group-hover:text-white truncate pr-4">{{ list.name }}</span>
              <el-icon class="text-gray-500 group-hover:text-indigo-400"><ArrowRight /></el-icon>
            </div>
          </div>
        </el-scrollbar>

        <div v-if="myPlaylistData.length === 0" class="py-10 flex flex-col items-center justify-center text-gray-500 gap-3">
          <el-icon class="text-4xl opacity-20"><List /></el-icon>
          <p class="text-xs">No playlists found</p>
          <button @click="fetchMyPlaylists" class="text-indigo-400 text-xs hover:underline">Refresh</button>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end p-2">
          <button @click="isPlaylistDialogVisible = false" class="text-sm text-gray-500 hover:text-white transition-colors">Cancel</button>
        </div>
      </template>
    </el-dialog>

    <!-- Custom Minimalist Toast -->
    <teleport to="body">
      <transition name="toast-fade">
        <div v-if="toast.show" class="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
          <div class="px-6 py-3 rounded-2xl bg-black/90 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300 pointer-events-auto">
            <el-icon :class="toast.type === 'success' ? 'text-green-400' : 'text-amber-400'" size="20">
              <CircleCheck v-if="toast.type === 'success'" />
              <Warning v-else />
            </el-icon>
            <span class="text-sm font-bold text-white tracking-wide">{{ toast.message }}</span>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useYoutubeDataStore, useUserStore } from '../stores'
import { storeToRefs } from 'pinia'
import {
  Refresh, VideoPlay, Compass, Plus, ArrowRight,
  List, CircleCheck, Warning
} from '@element-plus/icons-vue'

const props = defineProps({
  currentTitle: {
    type: String,
    default: ''
  }
})

defineEmits(['loadVideo'])

const youtubeStore = useYoutubeDataStore()
const userStore = useUserStore()
const { recommendedVideos, myPlaylistData } = storeToRefs(youtubeStore)
const loading = ref(false)
const isPlaylistDialogVisible = ref(false)
const selectedVideo = ref(null)

const toast = reactive({
  show: false,
  message: '',
  type: 'success'
})

const showToast = (message, type = 'success') => {
  toast.message = message
  toast.type = type
  toast.show = true
  setTimeout(() => {
    toast.show = false
  }, 2000)
}

const handleRefresh = async () => {
  if (!props.currentTitle) return
  loading.value = true
  try {
    await youtubeStore.getRecommendations(props.currentTitle)
  } finally {
    loading.value = false
  }
}

const fetchMyPlaylists = async () => {
  if (!userStore.oauthToken) return
  await youtubeStore.getMyPlaylistData(userStore.oauthToken)
}

const handleAdd = async (item) => {
  if (!userStore.oauthToken) {
    alert('請先點擊左側「Connect Account」登入 YouTube 帳號')
    return
  }

  selectedVideo.value = item
  if (myPlaylistData.value.length === 0) {
    await fetchMyPlaylists()
  }
  isPlaylistDialogVisible.value = true
}

const handleConfirmAdd = async (playlistId) => {
  const result = await youtubeStore.addVideoToPlaylist(selectedVideo.value, playlistId)
  if (result === 'exists') {
    showToast('影片已存在', 'warning')
  } else if (result) {
    showToast('加入成功', 'success')
    isPlaylistDialogVisible.value = false
  }
}
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.toast-fade-enter-active, .toast-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-fade-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}

:deep(.modern-dialog) {
  @apply !bg-[#0f172a]/95 !backdrop-blur-2xl !border-white/10 !rounded-[2rem] overflow-hidden;
}

:deep(.modern-dialog .el-dialog__header) {
  @apply !pt-6 !px-8 !pb-0;
}

:deep(.modern-dialog .el-dialog__title) {
  @apply !text-white !font-black !text-xl !tracking-tight;
}

:deep(.modern-dialog .el-dialog__body) {
  @apply !pt-6 !px-8 !pb-8;
}

:deep(.modern-dialog .el-dialog__footer) {
  @apply !px-8 !pb-6 !border-none;
}
</style>
