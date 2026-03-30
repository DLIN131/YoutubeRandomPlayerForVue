<template>
  <transition name="modal-fade">
    <div v-if="!isClose" class="fixed inset-0 flex items-center justify-center z-[100] p-4 bg-black/60 backdrop-blur-md" @click="handleClose">
      <div
        class="glass-panel w-full max-w-2xl max-h-[80vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl relative"
        @click.stop
      >
        <!-- Header -->
        <div class="p-6 border-b border-white/5 flex items-center justify-between gap-4">
          <div class="relative flex-1 group flex items-center">
            <el-icon class="absolute left-4 text-gray-500 text-lg group-focus-within:text-indigo-400 transition-colors z-10"><Search /></el-icon>
            <input
              v-model="inputValue"
              @input="handleInputChange"
              type="text"
              class="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 pl-11 text-sm focus:border-indigo-500/50 focus:bg-white/10 outline-none transition-all"
              placeholder="Search tracks in this playlist..."
            >
          </div>
          <button
            @click="handleClose"
            class="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/5"
          >
            <el-icon size="18"><Close /></el-icon>
          </button>
        </div>

        <!-- Body -->
        <el-scrollbar height="400px" class="flex-1">
          <div class="p-4 pr-6 flex flex-col gap-2">
            <div v-if="result.length === 0" class="py-12 flex flex-col items-center justify-center text-gray-500 gap-4">
              <el-icon class="text-5xl opacity-20"><Search /></el-icon>
              <p class="text-sm font-medium">{{ inputValue ? 'No tracks found' : 'Type to search tracks' }}</p>
            </div>

            <div
              v-for="(item, index) in result"
              :key="index"
              @click="loadVideoFromSearchCard(item)"
              class="group flex items-center gap-4 p-3 rounded-xl border border-transparent hover:border-indigo-500/30 hover:bg-white/5 transition-all cursor-pointer"
            >
              <div class="relative w-20 h-14 flex-shrink-0">
                <img :src="item.snippet.thumbnails.medium.url" class="w-full h-full object-cover rounded-lg shadow-md group-hover:scale-105 transition-transform">
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-200 truncate group-hover:text-indigo-300 transition-colors">
                  {{ item.snippet.title }}
                </p>
                <p class="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Position #{{ item.snippet.position }}</p>
              </div>
              <el-icon class="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"><VideoPlay /></el-icon>
            </div>
          </div>
        </el-scrollbar>

        <!-- Footer -->
        <div class="p-4 border-t border-white/5 bg-white/5 flex justify-end">
          <p class="text-[10px] text-gray-500 py-1 px-3 bg-white/5 rounded-full uppercase tracking-tighter">
            Found {{ result.length }} results
          </p>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search, Close, VideoPlay } from '@element-plus/icons-vue'

const props = defineProps({
  dataArr: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['handleClose', 'loadVideo'])
const inputValue = ref('')
const result = ref([])
const isClose = ref(false)

const searchDataResult = computed(() => {
  if (!inputValue.value) return []
  const query = inputValue.value.toLowerCase()
  return props.dataArr.filter((item) => {
    return item.snippet.title.toLowerCase().includes(query)
  })
})

const handleInputChange = () => {
  result.value = searchDataResult.value
}

const handleClose = () => {
  inputValue.value = ''
  result.value = []
  emit('handleClose', false)
}

const loadVideoFromSearchCard = (item) => {
  const index = props.dataArr.indexOf(item)
  emit('loadVideo', item, index)
  handleClose()
}
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
