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
    <virtualList
      class="flex-1"
      container-class="virtual-list flex-1 -mx-2 px-2"
      max-height="calc(100vh - 180px)"
      :items="recommendedVideos"
      :item-height="96"
      :item-key="getRecommendationKey"
    >
      <template #empty>
        <div class="py-20 flex flex-col items-center justify-center text-gray-500 gap-4">
          <el-icon class="text-5xl opacity-10"><Compass /></el-icon>
          <p class="text-sm font-medium opacity-50">Click refresh to discovery music</p>
        </div>
      </template>

      <template #default="{ item }">
        <div class="pb-2">
        <div
          @click="$emit('loadVideo', item, -1)"
          class="group relative flex gap-3 p-2 rounded-xl border bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 cursor-pointer h-[88px]"
        >
          <div class="relative w-24 h-16 flex-shrink-0">
            <img
              :src="item.snippet.thumbnails.medium.url"
              :alt="`Recommended video thumbnail: ${item.snippet.title}`"
              loading="lazy"
              decoding="async"
              class="w-full h-full object-cover rounded-lg shadow-lg"
            >
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
            @click.stop="addDialog.open(item)"
            class="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:bg-indigo-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
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
import { ref } from 'vue'
import { useYoutubeDataStore } from '../stores'
import { storeToRefs } from 'pinia'
import virtualList from './virtualList.vue'
import addToPlaylistDialog from './addToPlaylistDialog.vue'
import { Refresh, VideoPlay, Compass, Plus } from '@element-plus/icons-vue'

const props = defineProps({
  currentTitle: {
    type: String,
    default: ''
  }
})

defineEmits(['loadVideo'])

const youtubeStore = useYoutubeDataStore()
const { recommendedVideos } = storeToRefs(youtubeStore)
const loading = ref(false)
const addDialog = ref(null)

const getRecommendationKey = (item, index) => item?.id?.videoId ?? item?.etag ?? `${item?.snippet?.title ?? 'recommended'}-${index}`

const handleRefresh = async () => {
  if (!props.currentTitle) return
  loading.value = true
  try {
    await youtubeStore.getRecommendations(props.currentTitle)
  } finally {
    loading.value = false
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

.virtual-list {
  scrollbar-gutter: stable;
}
</style>
