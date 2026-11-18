<template>
  <div class="h-full flex flex-col gap-6 p-4 md:p-6">
    <!-- Search Header -->
    <div class="flex flex-col gap-4 shrink-0">
      <div class="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 class="text-2xl font-bold text-white">Download Center</h2>
          <p class="text-sm text-gray-400 mt-1">
            {{ useYoutubeData.currentListName || 'Current playlist' }} ·
            <span class="tabular-nums">{{ filteredData.length }}</span>
            {{ inputValue.trim() ? 'matches' : 'songs' }}
          </p>
        </div>
      </div>
      <div class="relative max-w-2xl">
        <el-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none"><Search /></el-icon>
        <input
          v-model="inputValue"
          type="search"
          placeholder="Filter songs in the current playlist…"
          aria-label="Filter songs"
          class="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-indigo-500/60 focus:bg-white/10 outline-none transition-colors"
        >
      </div>
    </div>

    <!-- Results Grid -->
    <div ref="scrollRef" class="flex-1 min-h-0 overflow-y-auto -mx-2 px-2 pb-24">
      <div v-if="useYoutubeData.snippetData.length === 0" class="h-full flex flex-col items-center justify-center gap-2 text-center py-20">
        <el-icon class="text-4xl text-gray-600"><Download /></el-icon>
        <p class="text-sm font-semibold text-gray-300">No playlist loaded</p>
        <p class="text-xs text-gray-500">Load a playlist at the top to download its songs.</p>
      </div>
      <div v-else-if="filteredData.length === 0" class="flex flex-col items-center justify-center gap-2 text-center py-20">
        <p class="text-sm font-semibold text-gray-300">No songs match “{{ inputValue.trim() }}”</p>
        <button class="text-xs text-indigo-300 hover:text-indigo-200 underline underline-offset-4" @click="inputValue = ''">Clear filter</button>
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        <div
          v-for="item in visibleData"
          :key="item.id"
          class="download-card group p-3 rounded-2xl flex flex-col gap-3"
        >
          <div class="relative aspect-video rounded-xl overflow-hidden bg-white/5">
            <img
              :src="item.snippet.thumbnails.medium.url"
              alt=""
              loading="lazy"
              decoding="async"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            >
            <div class="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold text-gray-200 tabular-nums">
              #{{ item.snippet.position + 1 }}
            </div>
          </div>

          <h3 class="text-sm font-semibold text-gray-100 line-clamp-2 leading-snug flex-1" :title="item.snippet.title">
            {{ item.snippet.title }}
          </h3>

          <button
            @click.stop="download(item)"
            :class="[
              'w-full h-10 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors duration-150',
              isDownloading[item.id]
                ? 'bg-emerald-500 text-white cursor-wait'
                : 'bg-white/5 text-gray-200 hover:bg-indigo-500 hover:text-white'
            ]"
            :disabled="isDownloading[item.id]"
            :aria-label="`Download ${item.snippet.title} as MP3`"
          >
            <el-icon v-if="!isDownloading[item.id]"><Download /></el-icon>
            <el-icon v-else class="is-loading"><Loading /></el-icon>
            <span>{{ isDownloading[item.id] ? 'Downloading…' : 'Download MP3' }}</span>
          </button>
        </div>
      </div>
      <!-- 捲到底時再多顯示一批，避免一次畫出上千張卡片造成卡頓 -->
      <div ref="sentinelRef" class="h-px"></div>
    </div>
  </div>
</template>

<script setup>
import { useYoutubeDataStore } from '../stores'
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { downloadData } from '../api/downloadData'
import { Download, Search, Loading } from '@element-plus/icons-vue'

const PAGE_SIZE = 60

const useYoutubeData = useYoutubeDataStore()
const isDownloading = reactive({})
const inputValue = ref('')
const renderCount = ref(PAGE_SIZE)
const scrollRef = ref(null)
const sentinelRef = ref(null)

const filteredData = computed(() => {
  const query = inputValue.value.trim().toLowerCase()
  if (!query) return useYoutubeData.snippetData
  return useYoutubeData.snippetData.filter((item) => item.snippet.title.toLowerCase().includes(query))
})

const visibleData = computed(() => filteredData.value.slice(0, renderCount.value))

// 換篩選條件時回到頂端、從第一批開始
watch(inputValue, () => {
  renderCount.value = PAGE_SIZE
  scrollRef.value?.scrollTo({ top: 0 })
})

let observer = null
onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && renderCount.value < filteredData.value.length) {
      renderCount.value += PAGE_SIZE
      // 加完一批如果底部還在畫面內，重新觀察才會再觸發一次
      nextTick(() => {
        observer.unobserve(sentinelRef.value)
        observer.observe(sentinelRef.value)
      })
    }
  }, { root: scrollRef.value, rootMargin: '600px' })
  observer.observe(sentinelRef.value)
})

onBeforeUnmount(() => observer?.disconnect())

const download = async (item) => {
  try {
    isDownloading[item.id] = true
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
    isDownloading[item.id] = false
  }
}
</script>

<style scoped>
.download-card {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.download-card:hover {
  background: rgba(30, 41, 59, 0.6);
  border-color: rgba(129, 140, 248, 0.3);
}
</style>
