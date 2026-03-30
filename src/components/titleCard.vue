<template>
  <div class="w-full max-w-2xl mt-6 px-4">
    <div class="glass-card p-4 rounded-xl flex flex-col items-center text-center gap-1 border-white/5">
      <p class="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] mb-1">Now Playing</p>
      <h2 class="text-lg md:text-xl font-bold text-white line-clamp-1">
        {{ title }}
      </h2>
      <div class="w-12 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full mt-2"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: 'No Media Playing'
  }
})
</script>

<style scoped>
.glass-card {
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(8px);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
