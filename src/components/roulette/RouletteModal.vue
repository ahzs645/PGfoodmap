<script setup>
import { ref, watch, onMounted } from 'vue'
import RouletteFilters from './RouletteFilters.vue'
import RouletteWheel from './RouletteWheel.vue'
import RouletteSlot from './RouletteSlot.vue'
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
  spinnerMode,
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
  // Check correct list based on mode
  if (spinnerMode.value === 'slot') {
    if (eligibleRestaurants.value.length === 0) return
  } else {
    if (wheelRestaurants.value.length === 0) return
  }
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

        <!-- Spinner Mode Toggle -->
        <div class="flex items-center justify-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-xl">
          <button
            @click="spinnerMode = 'wheel'"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="spinnerMode === 'wheel'
              ? 'bg-purple-500 text-white'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke-width="2"/>
              <path stroke-width="2" d="M12 2v10l7 7"/>
            </svg>
            Wheel
          </button>
          <button
            @click="spinnerMode = 'slot'"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="spinnerMode === 'slot'
              ? 'bg-purple-500 text-white'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke-width="2"/>
              <line x1="3" y1="12" x2="21" y2="12" stroke-width="2"/>
            </svg>
            Slot
          </button>
        </div>

        <!-- Wheel Size & Eligible Count (only for wheel mode) -->
        <div v-if="spinnerMode === 'wheel'" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
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

        <!-- Eligible count for slot mode -->
        <div v-else class="text-center py-2">
          <span
            class="text-sm"
            :class="eligibleRestaurants.length > 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'"
          >
            {{ eligibleRestaurants.length }} restaurants available
          </span>
        </div>

        <!-- Spinner or Result -->
        <div class="flex flex-col items-center">
          <!-- Wheel Mode: Show result popup -->
          <RouletteResult
            v-if="spinnerMode === 'wheel' && hasSpun && !isSpinning && winner"
            :winner="winner"
            :is-dark="isDark"
            @spin-again="handleSpinAgain"
            @view-on-map="handleViewOnMap"
          />

          <!-- Wheel Mode: Show wheel -->
          <RouletteWheel
            v-else-if="spinnerMode === 'wheel'"
            :restaurants="wheelRestaurants"
            :winner-index="winnerIndex"
            :is-spinning="isSpinning"
            :is-dark="isDark"
            @spin-complete="handleSpinComplete"
          />

          <!-- Slot Mode: Always show slot (has built-in winner display) -->
          <RouletteSlot
            v-else
            :restaurants="wheelRestaurants"
            :eligible-restaurants="eligibleRestaurants"
            :winner-index="winnerIndex"
            :is-spinning="isSpinning"
            :is-dark="isDark"
            @spin-complete="handleSpinComplete"
          />

          <!-- Slot Mode: Action buttons after spin -->
          <div
            v-if="spinnerMode === 'slot' && hasSpun && !isSpinning && winner"
            class="flex gap-3 mt-4"
          >
            <button
              @click="handleViewOnMap"
              class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              View on Map
            </button>
            <button
              @click="handleSpinAgain"
              class="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Spin Again
            </button>
          </div>

          <!-- Reshuffle button (only for wheel mode when not spinning) -->
          <button
            v-if="spinnerMode === 'wheel' && !hasSpun && !isSpinning && eligibleRestaurants.length > wheelSize"
            @click="shuffleWheel"
            class="mt-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Shuffle ({{ eligibleRestaurants.length - wheelSize }} more available)
          </button>

          <!-- Spin button: show when not spun yet, or while spinning -->
          <button
            v-if="!hasSpun || isSpinning"
            @click="handleSpin"
            :disabled="(spinnerMode === 'slot' ? eligibleRestaurants.length === 0 : wheelRestaurants.length === 0) || isSpinning"
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
