<template>
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
            @click="handleConfirmAdd(list)"
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
</template>

<script setup>
// 把 YouTube 影片加入自己的播放清單：選清單的對話框與結果提示。
// 用法：<addToPlaylistDialog ref="addDialog" />，再呼叫 addDialog.open(item)
import { ref, reactive } from 'vue'
import { useYoutubeDataStore, useUserStore } from '../stores'
import { storeToRefs } from 'pinia'
import { ArrowRight, List, CircleCheck, Warning } from '@element-plus/icons-vue'
import { requestYoutubeToken } from '../utils/youtubeAuth'

const youtubeStore = useYoutubeDataStore()
const userStore = useUserStore()
const { myPlaylistData } = storeToRefs(youtubeStore)
const isPlaylistDialogVisible = ref(false)
const selectedVideo = ref(null)

const toast = reactive({
  show: false,
  message: '',
  type: 'success'
})

let toastTimer = null
const showToast = (message, type = 'success') => {
  toast.message = message
  toast.type = type
  toast.show = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.show = false
  }, type === 'warning' ? 3500 : 2000)
}

const fetchMyPlaylists = async () => {
  if (!userStore.oauthToken) return
  await youtubeStore.getMyPlaylistData(userStore.oauthToken)
}

// 還沒登入就直接開 Google 的授權畫面
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

const open = async (item) => {
  const isAuthorized = await ensureOauthToken()
  if (!isAuthorized) {
    showToast('需要登入 Google 帳號才能加入清單', 'warning')
    return
  }

  selectedVideo.value = item
  if (myPlaylistData.value.length === 0) {
    await fetchMyPlaylists()
  }
  isPlaylistDialogVisible.value = true
}

const handleConfirmAdd = async (list) => {
  // 加入前會先向 YouTube 查這個清單有沒有這首歌，有的話不會重複加入
  const result = await youtubeStore.addVideoToPlaylist(selectedVideo.value, list.value)
  if (result === 'exists') {
    showToast(`「${list.name}」裡已經有這首歌，沒有重複加入`, 'warning')
  } else if (result) {
    showToast(`已加入「${list.name}」`, 'success')
    isPlaylistDialogVisible.value = false
  }
}

defineExpose({ open })
</script>

<style scoped>
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
