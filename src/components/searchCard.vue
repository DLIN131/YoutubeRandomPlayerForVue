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
          <input v-model="inputValue" @change="handleInputChange" type="text" class="w-full h-10 rounded-xl px-3 text-cyan-300 bg-black/60 border border-pink-500/70
             focus:border-fuchsia-400 outline-none
             shadow-[0_0_10px_#ff00ff,inset_0_0_6px_#ff00ff]
             focus:shadow-[0_0_10px_#ff00ff,0_0_30px_#ff66cc,inset_0_0_10px_#ff33cc]
             transition-all duration-300 placeholder-cyan-700" placeholder="video name">
        </div>
        <span @click="handleClose"
          class="cyberpunk-btn">X</span>
      </div>

      <el-scrollbar max-heigh="400" class="cyberpunk-scrollbar">
        <h1 v-if="!result[0]" class="text-cyan-400 mt-4 text-center tracking-widest opacity-70"></h1>
        <div v-for="(item, index) in result" :key="index" @click="loadVideoFromSearchCard(item)" class="cyberpunk-item">
          <div class="neon-scan"></div>
          <img :src="item.snippet.thumbnails.medium.url" class="thumb">
          <div class="title-text">
            {{ item.snippet.position + " " + item.snippet.title }}
          </div>
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

.cyberpunk-btn {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  background: linear-gradient(135deg, #0ff 0%, #f0f 100%);
  border: 2px solid #0ff;
  border-radius: 8px;
  color: #000;
  font-weight: bold;
  text-shadow: 0 0 8px #0ff, 0 0 12px #f0f;
  box-shadow: 0 0 10px #0ff, 0 0 20px #f0f, inset 0 0 10px #0ff;
  transition: all 0.25s ease-in-out;
}

.cyberpunk-btn:hover {
  background: linear-gradient(135deg, #f0f 0%, #0ff 100%);
  color: #fff;
  border-color: #f0f;
  box-shadow:
    0 0 15px #f0f,
    0 0 30px #0ff,
    inset 0 0 15px #0ff;
  transform: scale(1.1) rotate(-3deg);
}

.cyberpunk-btn:active {
  transform: scale(0.95) rotate(1deg);
  box-shadow: 0 0 5px #0ff, inset 0 0 10px #f0f;
}

/* 捲軸本身霓虹風格 */
.cyberpunk-scrollbar ::-webkit-scrollbar {
  width: 8px;
}
.cyberpunk-scrollbar ::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #0ff, #f0f);
  border-radius: 8px;
  box-shadow: 0 0 6px #0ff, 0 0 10px #f0f;
}
.cyberpunk-scrollbar ::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
}

/* 每個清單項目：半透明霓虹框 + 漸層邊 + hover 發光 */
.cyberpunk-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  margin: 0.3rem 0;
  cursor: pointer;
  width: 99%;

  background: rgba(10, 10, 20, 0.65);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-left: 4px solid #0ff;
  border-radius: 8px;

  color: #e0e0e0;
  font-weight: 500;
  text-shadow: 0 0 6px #0ff;

  box-shadow: inset 0 0 10px rgba(0, 255, 255, 0.15), 0 0 12px rgba(0, 255, 255, 0.25);
  transition: all 0.25s ease-in-out;
}

.cyberpunk-item:hover {
  border-color: #f0f;
  border-left-color: #ff00ff;
  background: rgba(30, 0, 40, 0.7);
  color: #fff;
  text-shadow: 0 0 10px #ff00ff, 0 0 20px #0ff;
  transform: translateX(5px);
}

.cyberpunk-item:active {
  transform: scale(0.98);
}

/* 縮圖區塊霓虹框 */
.thumb {
  width: 2rem;
  height: 2rem;
  border-radius: 4px;
  object-fit: cover;
  box-shadow: 0 0 10px #0ff;
  border: 1px solid #0ff;
  transition: all 0.25s ease;
}

.cyberpunk-item:hover .thumb {
  box-shadow: 0 0 15px #f0f, 0 0 25px #0ff;
  border-color: #f0f;
}

/* 文字效果 */
.title-text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex: 1;
}

/* ========= 流光掃描動畫 ========= */
.neon-scan {
  content: '';
  position: absolute;
  top: 0;
  left: -150%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    120deg,
    transparent 0%,
    rgba(0, 255, 255, 0.4) 50%,
    transparent 100%
  );
  transform: skewX(-25deg);
  pointer-events: none;
  opacity: 0;
}

.cyberpunk-item:hover .neon-scan {
  opacity: 1;
  animation: neonSweep 1.2s ease-in-out;
}

@keyframes neonSweep {
  0% {
    left: -100%;
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  100% {
    left: 150%;
    opacity: 0;
  }
}

</style>
