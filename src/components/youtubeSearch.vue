<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Search box -->
    <div class="relative mb-3 px-2 shrink-0">
      <input
        v-model="keyword"
        type="text"
        placeholder="Search YouTube..."
        class="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-4 pr-20 text-sm focus:border-indigo-500/50 focus:bg-white/10 outline-none transition-all"
        @keydown.stop
        @keyup.enter="search"
      >
      <button
        v-if="keyword"
        @click="clearSearch"
        class="absolute right-12 top-1 bottom-1 w-8 flex items-center justify-center text-gray-500 hover:text-white transition-all"
        title="Clear search"
      >
        <el-icon><Close /></el-icon>
      </button>
      <button
        @click="search"
        :disabled="loading"
        class="absolute right-3 top-1 bottom-1 w-9 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white transition-all"
        title="Search"
      >
        <el-icon :class="{ 'is-loading': loading }"><Loading v-if="loading" /><Search v-else /></el-icon>
      </button>
    </div>

    <p class="px-2 mb-2 text-[11px] font-bold text-gray-500 uppercase tracking-widest truncate shrink-0">
      {{ searchedQuery ? `Results: ${searchedQuery}` : 'Trending music in Japan' }}
    </p>

    <!-- Results -->
    <virtualList
      class="flex-1"
      container-class="virtual-list flex-1 -mx-2 px-2"
      max-height="calc(100vh - 230px)"
      :items="results"
      :item-height="96"
      :item-key="(item) => item.id"
    >
      <template #empty>
        <div class="py-20 flex flex-col items-center justify-center text-gray-500 gap-4">
          <el-icon v-if="loading" class="is-loading text-4xl text-indigo-400"><Loading /></el-icon>
          <el-icon v-else class="text-5xl opacity-10"><Search /></el-icon>
          <p class="text-sm font-medium opacity-50">
            {{ loading ? 'Loading...' : errorMessage || 'No videos found' }}
          </p>
        </div>
      </template>

      <template #default="{ item }">
        <div class="pb-2">
          <div
            @click="$emit('loadVideo', item, -1)"
            :class="[
              'group relative flex gap-3 p-2 rounded-xl border transition-all duration-300 cursor-pointer h-[88px]',
              item.id === playingVideoId
                ? 'bg-indigo-500/10 border-indigo-500/30'
                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
            ]"
          >
            <div class="relative w-24 h-16 flex-shrink-0 self-center">
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

            <div class="flex flex-col justify-center min-w-0 flex-1">
              <p :class="['text-xs font-bold leading-tight line-clamp-2', item.id === playingVideoId ? 'text-indigo-300' : 'text-gray-200']">
                {{ item.snippet.title }}
              </p>
              <p class="text-[10px] text-gray-500 mt-1 truncate">{{ item.channelTitle }}</p>
            </div>

            <button
              @click.stop="addDialog.open(item)"
              class="w-8 h-8 flex-shrink-0 self-center flex items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:bg-indigo-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
              :title="`Add ${item.snippet.title} to playlist`"
            >
              <el-icon><Plus /></el-icon>
            </button>
          </div>
        </div>
      </template>
    </virtualList>

    <addToPlaylistDialog ref="addDialog" />
  </div>
</template>

<script setup>
// YouTube 搜尋分頁：沒有搜尋時顯示日本地區的熱門音樂
import { ref, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useYoutubeDataStore } from '../stores'
import virtualList from './virtualList.vue'
import addToPlaylistDialog from './addToPlaylistDialog.vue'
import { Search, Close, Loading, VideoPlay, Plus } from '@element-plus/icons-vue'

const props = defineProps({
  // 從其他頁面帶進來的搜尋關鍵字（例如動畫 OP/ED 頁）
  query: { type: String, default: '' },
  // 正在播放的影片 id，用來標示清單中的項目
  playingVideoId: { type: String, default: '' }
})

defineEmits(['loadVideo'])

const youtubeStore = useYoutubeDataStore()
const { searchResults, popularVideos } = storeToRefs(youtubeStore)

const addDialog = ref(null)
const keyword = ref('')
// 目前顯示的是哪個關鍵字的結果；空字串代表顯示熱門音樂
const searchedQuery = ref('')
const loading = ref(false)
const errorMessage = ref('')

const results = computed(() => (searchedQuery.value ? searchResults.value : popularVideos.value))

const run = async (action) => {
  loading.value = true
  errorMessage.value = ''
  const ok = await action()
  if (!ok) errorMessage.value = 'YouTube 載入失敗'
  loading.value = false
}

const search = async () => {
  const text = keyword.value.trim()
  if (!text) return clearSearch()
  if (loading.value) return
  searchedQuery.value = text
  searchResults.value = []
  await run(() => youtubeStore.searchVideos(text))
}

const clearSearch = async () => {
  keyword.value = ''
  searchedQuery.value = ''
  if (popularVideos.value.length === 0) await run(() => youtubeStore.getPopularMusic())
}

const applyQuery = (text) => {
  keyword.value = text
  search()
}

watch(() => props.query, (text) => {
  if (text) applyQuery(text)
})

onMounted(() => {
  props.query ? applyQuery(props.query) : clearSearch()
})
</script>

<style scoped>
.virtual-list {
  scrollbar-gutter: stable;
}
</style>
