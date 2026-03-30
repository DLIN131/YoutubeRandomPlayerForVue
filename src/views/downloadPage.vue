<template>
  <div class="p-6 h-full flex flex-col gap-8">
    <!-- Search Header -->
    <div class="flex flex-col gap-4">
      <h2 class="text-2xl font-bold text-white">Download Center</h2>
      <div class="relative max-w-2xl">
        <input
          v-model="inputValue"
          type="text"
          placeholder="Search within current list..."
          class="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 pl-12 text-sm focus:border-indigo-500/50 focus:bg-white/10 outline-none transition-all shadow-lg"
          @keyup.enter="handleSearch"
        >
        <el-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"><Search /></el-icon>
      </div>
    </div>

    <!-- Results Grid -->
    <el-scrollbar class="flex-1 -mx-2 px-2">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-12">
        <div
          v-for="(item, index) in snippetData"
          :key="index"
          class="group glass-card p-3 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all duration-300 flex flex-col gap-3"
        >
          <div class="relative aspect-video rounded-xl overflow-hidden shadow-lg">
            <img :src="item.snippet.thumbnails.medium.url" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
            <div class="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
            <div class="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold text-gray-300">
              #{{ item.snippet.position }}
            </div>
          </div>

          <div class="flex flex-col gap-2 flex-1">
            <h3 class="text-sm font-semibold text-gray-200 line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors">
              {{ item.snippet.title }}
            </h3>
          </div>

          <button
            @click.stop="download(item, index)"
            :class="[
              'w-full h-10 mt-auto flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all',
              isDownloading[index]
                ? 'bg-green-500 text-white cursor-wait'
                : 'bg-white/5 text-gray-300 hover:bg-indigo-600 hover:text-white'
            ]"
            :disabled="isDownloading[index]"
          >
            <el-icon v-if="!isDownloading[index]"><Download /></el-icon>
            <el-icon v-else class="is-loading"><Loading /></el-icon>
            <span>{{ isDownloading[index] ? 'Downloading...' : 'Download MP3' }}</span>
          </button>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { useYoutubeDataStore } from '../stores'
import { ref, onMounted } from 'vue'
import { downloadData } from '../api/downloadData'
import { Download, Search, Loading } from '@element-plus/icons-vue'

const useYoutubeData = useYoutubeDataStore()
const snippetData = ref([])
const isDownloading = ref([])
const inputValue = ref('')

const handleSearch = () => {
  if (!inputValue.value.trim()) {
    snippetData.value = [...useYoutubeData.snippetData]
    return
  }
  const query = inputValue.value.toLowerCase()
  snippetData.value = useYoutubeData.snippetData.filter((item) => {
    return item.snippet.title.toLowerCase().includes(query)
  })
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
    console.error('Download error:', err)
  } finally {
    isDownloading.value[index] = false
  }
}

onMounted(() => {
  snippetData.value = [...useYoutubeData.snippetData]
})
</script>

<style scoped>
.glass-card {
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(8px);
}
</style>
