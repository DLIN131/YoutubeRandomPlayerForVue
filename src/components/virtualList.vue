<template>
  <div
    ref="containerRef"
    :class="containerClass"
    :style="containerStyle"
    @scroll="handleScroll"
  >
    <slot v-if="!items.length" name="empty" />
    <div v-else :style="{ height: `${totalHeight}px`, position: 'relative' }">
      <div
        v-for="item in visibleItems"
        :key="getItemKey(item.item, item.index)"
        :style="getItemStyle(item.index)"
      >
        <slot :item="item.item" :index="item.index" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  itemHeight: {
    type: Number,
    required: true
  },
  overscan: {
    type: Number,
    default: 5
  },
  containerClass: {
    type: String,
    default: ''
  },
  maxHeight: {
    type: String,
    default: ''
  },
  itemKey: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['rangeChange'])

const containerRef = ref(null)
const scrollTop = ref(0)
const viewportHeight = ref(0)

const containerStyle = computed(() => ({
  overflowY: 'auto',
  maxHeight: props.maxHeight || undefined
}))

const totalHeight = computed(() => props.items.length * props.itemHeight)

const visibleCount = computed(() => {
  if (!viewportHeight.value) return props.overscan * 2 + 1
  return Math.ceil(viewportHeight.value / props.itemHeight)
})

const startIndex = computed(() => Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.overscan))
const endIndex = computed(() => Math.min(
  props.items.length,
  startIndex.value + visibleCount.value + props.overscan * 2
))

const visibleItems = computed(() => props.items
  .slice(startIndex.value, endIndex.value)
  .map((item, offset) => ({
    item,
    index: startIndex.value + offset
  })))

const getItemStyle = (index) => ({
  position: 'absolute',
  top: `${index * props.itemHeight}px`,
  left: '0',
  right: '0',
  height: `${props.itemHeight}px`
})

const getItemKey = (item, index) => {
  if (props.itemKey) return props.itemKey(item, index)
  return item?.id ?? index
}

const updateViewportHeight = () => {
  viewportHeight.value = containerRef.value?.clientHeight ?? 0
}

const handleScroll = (event) => {
  scrollTop.value = event.target.scrollTop
}

const scrollToIndex = async (index, align = 'center') => {
  if (!containerRef.value) return
  await nextTick()
  const maxScrollTop = Math.max(0, totalHeight.value - containerRef.value.clientHeight)
  let nextScrollTop = index * props.itemHeight

  if (align === 'center') {
    nextScrollTop -= Math.max(0, (containerRef.value.clientHeight - props.itemHeight) / 2)
  } else if (align === 'end') {
    nextScrollTop -= Math.max(0, containerRef.value.clientHeight - props.itemHeight)
  }

  containerRef.value.scrollTop = Math.min(maxScrollTop, Math.max(0, nextScrollTop))
  scrollTop.value = containerRef.value.scrollTop
}

watch([startIndex, endIndex], ([start, end]) => {
  emit('rangeChange', { start, end })
}, { immediate: true })

onMounted(() => {
  updateViewportHeight()
  window.addEventListener('resize', updateViewportHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportHeight)
})

defineExpose({
  scrollToIndex,
  containerRef
})
</script>
