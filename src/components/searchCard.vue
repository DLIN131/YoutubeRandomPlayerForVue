<template >
  <div @click="handleClose" v-if="!isClose"
    class=" w-screen  h-screen md:inset-0  fixed left-0 top-0 flex items-center justify-center z-20">

     <!-- 外層容器，只作邊框 -->
    <div class="relative p-[3px] rounded-xl w-[90%] h-[80%] min-w-[20rem] overflow-hidden">
      <!-- 流動 RGB 邊框層，z-0 在最底層 -->
      <div class="absolute inset-0 z-0 rounded-xl bg-[linear-gradient(270deg,red,orange,yellow,green,cyan,blue,purple,red)] animate-border-move"></div>

    <div @click.stop=""
      class="relative search-container p-6 flex justify-center flex-col gap-2 w-full h-full min-w-[20rem]  bg-black shadow-[10px_10px_10px_rgba(255,255,255,0.5)] rounded-xl z-20">
      <div class="w-full h-8 flex gap-3 justify-between">
        <div class="flex justify-center w-full">
          <input v-model="inputValue" @change="handleInputChange" type="text" class="w-8/12 h-8 rounded-xl px-2" placeholder="video name">
        </div>
        <span @click="handleClose"
          class=" w-8 h-8 flex items-center justify-center hover:bg-red-400/[.8]  bg-slate-400 rounded-md cursor-pointer">X</span>
      </div>

      <el-scrollbar max-heigh="400">
        <h1 v-if="!result[0]" class="text-white mt-4"></h1>
        <div v-for="(item, index) in result" :key="index" @click="loadVideoFromSearchCard(item)" class="flex place-items-start gap-3 h-10 overflow-ellipsis overflow-y-hidden overflow-x-hidden p-2 items-center
                     bg-black  w-full cursor-pointer border border-white hover:bg-green-500/30 text-white">
          <img :src="item.snippet.thumbnails.medium.url" class=" w-8 h-8 rounded-md">
          {{ item.snippet.position + " " + item.snippet.title }}
        </div>
      </el-scrollbar>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
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

// method
const searchDataResult = computed(() => {
  return props.dataArr.filter((item) => {
    return item.snippet.title.toLowerCase().match(inputValue.value.toLowerCase())
  })
})
const handleInputChange = (e) => {
  result.value = searchDataResult.value
}
const handleClose = () => {
  inputValue.value = ''
  result.value = []
  emit('handleClose', false)
}

const loadVideoFromSearchCard = (item) => {
  const index = props.dataArr.indexOf(item)
  console.log(props.dataArr[index].snippet.title + index)
  emit('loadVideo', item, index)
}
</script>

<style scoped>
@keyframes border-move {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

.animate-border-move {
  background: linear-gradient(
    270deg,
    red 0%,
    orangered 10%,
    orange 20%,
    gold 30%,
    yellow 40%,
    yellowgreen 50%,
    green 60%,
    cyan 70%,
    deepskyblue 80%,
    blueviolet 90%,
    red 100%
  );
  background-size: 200% 200%; /* 注意要比100%大，讓動畫平滑循環 */
  animation: border-move 6s linear infinite;
  filter: blur(4px);
}
</style>
