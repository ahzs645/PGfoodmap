<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps({
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  currentDate: {
    type: Date,
    required: true
  },
  isDark: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:currentDate'])

const isPlaying = ref(false)
const playSpeed = ref(1000)
const interval = ref('month')
let playInterval = null

const speedOptions = [
  { value: 2000, label: '0.5x' },
  { value: 1000, label: '1x' },
  { value: 500, label: '2x' },
  { value: 250, label: '4x' }
]

const progress = computed(() => {
  const total = props.endDate.getTime() - props.startDate.getTime()
  const current = props.currentDate.getTime() - props.startDate.getTime()
  return Math.max(0, Math.min(100, (current / total) * 100))
})

const formattedDate = computed(() => {
  return props.currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  })
})

const formattedStartDate = computed(() => {
  return props.startDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short'
  })
})

const formattedEndDate = computed(() => {
  return props.endDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short'
  })
})

// Generate year markers for the timeline
const yearMarkers = computed(() => {
  const markers = []
  const startYear = props.startDate.getFullYear()
  const endYear = props.endDate.getFullYear()
  const totalTime = props.endDate.getTime() - props.startDate.getTime()

  for (let year = startYear; year <= endYear; year++) {
    const yearStart = new Date(year, 0, 1)
    if (yearStart >= props.startDate && yearStart <= props.endDate) {
      const position = ((yearStart.getTime() - props.startDate.getTime()) / totalTime) * 100
      markers.push({ year, position })
    }
  }
  return markers
})

// Snap a date to the first of the month
function snapToMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function handleSliderChange(e) {
  const progressValue = parseFloat(e.target.value)
  const total = props.endDate.getTime() - props.startDate.getTime()
  const newTime = props.startDate.getTime() + (total * progressValue / 100)
  // Snap to first of month
  emit('update:currentDate', snapToMonth(new Date(newTime)))
}

function stepBackward() {
  const newDate = new Date(props.currentDate)
  newDate.setMonth(newDate.getMonth() - 1)
  newDate.setDate(1) // First of month
  if (newDate >= props.startDate) {
    emit('update:currentDate', newDate)
  }
}

function stepForward() {
  const newDate = new Date(props.currentDate)
  newDate.setMonth(newDate.getMonth() + 1)
  newDate.setDate(1) // First of month
  if (newDate <= props.endDate) {
    emit('update:currentDate', newDate)
  } else {
    isPlaying.value = false
  }
}

function skipToStart() {
  emit('update:currentDate', snapToMonth(new Date(props.startDate)))
}

function skipToEnd() {
  emit('update:currentDate', snapToMonth(new Date(props.endDate)))
}

function togglePlay() {
  isPlaying.value = !isPlaying.value
}

// Watch for play state changes
watch(isPlaying, (playing) => {
  if (playing) {
    playInterval = setInterval(stepForward, playSpeed.value)
  } else {
    if (playInterval) {
      clearInterval(playInterval)
      playInterval = null
    }
  }
})

// Watch for speed changes while playing
watch(playSpeed, (speed) => {
  if (isPlaying.value) {
    clearInterval(playInterval)
    playInterval = setInterval(stepForward, speed)
  }
})

onUnmounted(() => {
  if (playInterval) {
    clearInterval(playInterval)
  }
})
</script>

<template>
  <div class="timeline-container bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg p-4">
    <!-- Current Date Display -->
    <div class="text-center mb-3">
      <span class="text-lg font-bold text-gray-900 dark:text-white">{{ formattedDate }}</span>
    </div>

    <!-- Controls Row -->
    <div class="flex items-center justify-center gap-2 mb-3">
      <!-- Step Backward -->
      <button
        @click="stepBackward"
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Previous month"
      >
        <svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
        </svg>
      </button>

      <!-- Play/Pause -->
      <button
        @click="togglePlay"
        class="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
        :title="isPlaying ? 'Pause' : 'Play'"
      >
        <svg v-if="!isPlaying" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
        <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
      </button>

      <!-- Step Forward -->
      <button
        @click="stepForward"
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Next month"
      >
        <svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
        </svg>
      </button>

      <!-- Speed Control (inline) -->
      <select
        v-model="playSpeed"
        class="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded px-2 py-1.5 text-xs border-0 focus:ring-1 focus:ring-blue-500"
        title="Playback speed"
      >
        <option v-for="opt in speedOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- Slider -->
    <div class="relative mb-2">
      <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
        <span>{{ formattedStartDate }}</span>
        <span>{{ formattedEndDate }}</span>
      </div>

      <div class="relative">
        <!-- Progress bar background -->
        <div class="relative h-4 flex items-center">
          <div class="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div
              class="h-full bg-blue-500 transition-all duration-100"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>

          <!-- Custom thumb -->
          <div
            class="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md pointer-events-none transition-all"
            :style="{ left: `${progress}%` }"
          ></div>

          <!-- Slider input (invisible, for interaction) -->
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            :value="progress"
            @input="handleSliderChange"
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        <!-- Year markers (below the track) -->
        <div class="relative h-4 mt-1">
          <div
            v-for="marker in yearMarkers"
            :key="marker.year"
            class="absolute transform -translate-x-1/2 flex flex-col items-center"
            :style="{ left: `${marker.position}%` }"
          >
            <div class="w-0.5 h-2 bg-gray-400 dark:bg-gray-500"></div>
            <span class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{{ marker.year }}</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.timeline-container {
  min-width: 320px;
}

/* Custom range input styling */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: transparent;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: transparent;
  cursor: pointer;
  border: none;
}
</style>
