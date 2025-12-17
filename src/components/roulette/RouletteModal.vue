<script setup>
import { ref, watch, onMounted } from 'vue'
import RouletteFilters from './RouletteFilters.vue'
import RouletteWheel from './RouletteWheel.vue'
import RouletteResult from './RouletteResult.vue'
import { useRouletteState } from '../../composables/useRouletteState'
import { useGeolocation } from '../../composables/useGeolocation'

const props = defineProps({
  restaurants: Array,
  isDark: Boolean
})

const emit = defineEmits(['close', 'select-on-map'])

// Initialize roulette state with restaurant data
const restaurantsRef = ref(props.restaurants)
watch(() => props.restaurants, (newVal) => {
  restaurantsRef.value = newVal
})

const {
  useFilters,
  sourceLocation,
  locationMode,
  maxDistance,
  violationTimePeriod,
  maxViolations,
  excludedHazardRatings,
  isSpinning,
  winner,
  winnerIndex,
  hasSpun,
  wheelSize,
  wheelRestaurants,
  eligibleRestaurants,
  setSourceFromGeolocation,
  setSourceFromMap,
  clearSourceLocation,
  toggleHazardExclusion,
  shuffleWheel,
  spin,
  completeSpinning,
  resetSpin,
  resetFilters
} = useRouletteState(restaurantsRef)

// Wheel size options
const wheelSizeOptions = [4, 6, 8, 10]

// Shuffle wheel on mount and when filters/size change
onMounted(() => {
  shuffleWheel()
})

// Re-shuffle when eligible restaurants or wheel size changes
watch([eligibleRestaurants, wheelSize], () => {
  if (!isSpinning.value && !hasSpun.value) {
    shuffleWheel()
  }
}, { deep: true })

const {
  position: geoPosition,
  error: geoError,
  loading: geoLoading,
  status: geoStatus,
  getCurrentPosition,
  clearPosition: clearGeoPosition
} = useGeolocation()

// Handle geolocation request
async function handleGetLocation() {
  const pos = await getCurrentPosition()
  if (pos) {
    setSourceFromGeolocation(pos)
  }
}

// Handle map click for manual location
function handleMapClick(lngLat) {
  setSourceFromMap(lngLat)
}

// Clear location
function handleClearLocation() {
  clearSourceLocation()
  clearGeoPosition()
}

// Start spinning
function handleSpin() {
  if (wheelRestaurants.value.length === 0) return
  spin()
}

// Animation complete
function handleSpinComplete() {
  completeSpinning()
}

// Spin again
function handleSpinAgain() {
  resetSpin()
  shuffleWheel() // Get new random restaurants on wheel
}

// View winner on map
function handleViewOnMap() {
  if (winner.value) {
    emit('select-on-map', winner.value)
  }
}

// Close modal
function handleClose() {
  resetFilters()
  emit('close')
}

// Handle escape key
function handleKeydown(e) {
  if (e.key === 'Escape') {
    handleClose()
  }
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    @click.self="handleClose"
    @keydown="handleKeydown"
    tabindex="0"
  >
    <div
      class="w-full max-w-lg max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
    >
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
        <div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="text-2xl">🎰</span>
            Restaurant Roulette
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">Spin to pick a random restaurant</p>
        </div>
        <button
          @click="handleClose"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- Filter Toggle -->
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
          <div>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Use Filters</span>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ useFilters ? 'Narrow down by location, violations & hazard' : 'All restaurants included' }}
            </p>
          </div>
          <button
            @click="useFilters = !useFilters"
            class="relative w-12 h-6 rounded-full transition-colors"
            :class="useFilters ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'"
          >
            <span
              class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
              :class="useFilters ? 'translate-x-6' : 'translate-x-0'"
            ></span>
          </button>
        </div>

        <!-- Filters (collapsible) -->
        <RouletteFilters
          v-if="useFilters"
          :source-location="sourceLocation"
          :location-mode="locationMode"
          :max-distance="maxDistance"
          :violation-time-period="violationTimePeriod"
          :max-violations="maxViolations"
          :excluded-hazard-ratings="excludedHazardRatings"
          :geo-loading="geoLoading"
          :geo-error="geoError"
          :is-dark="isDark"
          @get-location="handleGetLocation"
          @clear-location="handleClearLocation"
          @map-click="handleMapClick"
          @update:max-distance="maxDistance = $event"
          @update:violation-time-period="violationTimePeriod = $event"
          @update:max-violations="maxViolations = $event"
          @toggle-hazard="toggleHazardExclusion"
        />

        <!-- Wheel Size & Eligible Count -->
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
          <!-- Wheel size selector -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">Options:</span>
            <div class="flex gap-1">
              <button
                v-for="size in wheelSizeOptions"
                :key="size"
                @click="wheelSize = size"
                class="w-8 h-8 text-sm font-medium rounded-lg transition-colors"
                :class="wheelSize === size
                  ? 'bg-purple-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'"
              >
                {{ size }}
              </button>
            </div>
          </div>

          <!-- Eligible count -->
          <span
            class="text-sm"
            :class="eligibleRestaurants.length > 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'"
          >
            {{ eligibleRestaurants.length }} available
          </span>
        </div>

        <!-- Wheel or Result -->
        <div class="flex flex-col items-center">
          <RouletteResult
            v-if="hasSpun && !isSpinning && winner"
            :winner="winner"
            :is-dark="isDark"
            @spin-again="handleSpinAgain"
            @view-on-map="handleViewOnMap"
          />

          <RouletteWheel
            v-else
            :restaurants="wheelRestaurants"
            :winner-index="winnerIndex"
            :is-spinning="isSpinning"
            :is-dark="isDark"
            @spin-complete="handleSpinComplete"
          />

          <!-- Reshuffle button (only when not spinning and wheel is visible) -->
          <button
            v-if="!hasSpun && !isSpinning && eligibleRestaurants.length > wheelSize"
            @click="shuffleWheel"
            class="mt-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Shuffle ({{ eligibleRestaurants.length - wheelSize }} more available)
          </button>

          <!-- Spin button -->
          <button
            v-if="!hasSpun || isSpinning"
            @click="handleSpin"
            :disabled="wheelRestaurants.length === 0 || isSpinning"
            class="mt-6 px-8 py-4 text-xl font-bold rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white shadow-lg transform transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100"
          >
            <span v-if="isSpinning" class="animate-pulse">Spinning...</span>
            <span v-else>SPIN!</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
