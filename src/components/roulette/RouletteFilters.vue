<script setup>
import RouletteLocationPicker from './RouletteLocationPicker.vue'

const props = defineProps({
  sourceLocation: Object,
  locationMode: String,
  maxDistance: Number,
  violationTimePeriod: Number,
  maxViolations: [Number, null],
  excludedHazardRatings: Array,
  geoLoading: Boolean,
  geoError: String,
  isDark: Boolean
})

const emit = defineEmits([
  'get-location',
  'clear-location',
  'map-click',
  'update:max-distance',
  'update:violation-time-period',
  'update:max-violations',
  'toggle-hazard'
])

const hazardOptions = ['Low', 'Moderate', 'Unknown']
const hazardColors = {
  'Low': { active: 'bg-green-500', inactive: 'border-green-500 text-green-600 dark:text-green-400' },
  'Moderate': { active: 'bg-amber-500', inactive: 'border-amber-500 text-amber-600 dark:text-amber-400' },
  'Unknown': { active: 'bg-gray-500', inactive: 'border-gray-500 text-gray-600 dark:text-gray-400' }
}

const timeOptions = [
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 12, label: '1 year' },
  { value: 24, label: '2 years' },
  { value: 0, label: 'All time' }
]

function handleMaxViolationsChange(e) {
  const val = e.target.value
  emit('update:max-violations', val === '' ? null : parseInt(val))
}
</script>

<template>
  <div class="space-y-4">
    <!-- Location Section -->
    <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Location
      </h3>

      <!-- Location buttons -->
      <div class="flex gap-2 mb-3">
        <button
          @click="emit('get-location')"
          :disabled="geoLoading"
          class="flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
          :class="locationMode === 'geolocation'
            ? 'bg-blue-500 text-white'
            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'"
        >
          <svg v-if="geoLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          My Location
        </button>
        <button
          v-if="sourceLocation"
          @click="emit('clear-location')"
          class="py-2 px-3 text-sm font-medium rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
        >
          Clear
        </button>
      </div>

      <!-- Geolocation error -->
      <p v-if="geoError" class="text-xs text-red-500 mb-3">{{ geoError }}</p>

      <!-- Location picker map -->
      <RouletteLocationPicker
        :source-location="sourceLocation"
        :max-distance="maxDistance"
        :is-dark="isDark"
        @location-selected="emit('map-click', $event)"
      />

      <!-- Distance slider -->
      <div v-if="sourceLocation" class="mt-3">
        <div class="flex items-center justify-between text-sm mb-1">
          <span class="text-gray-600 dark:text-gray-400">Distance</span>
          <span class="font-medium text-gray-900 dark:text-white">{{ maxDistance }} km</span>
        </div>
        <input
          type="range"
          min="1"
          max="20"
          :value="maxDistance"
          @input="emit('update:max-distance', parseInt($event.target.value))"
          class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div class="flex justify-between text-xs text-gray-400 mt-1">
          <span>1 km</span>
          <span>20 km</span>
        </div>
      </div>

      <p v-if="!sourceLocation" class="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Click the map or use "My Location" to filter by distance
      </p>
    </div>

    <!-- Violations Section -->
    <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Violations
      </h3>

      <div class="space-y-3">
        <!-- Time period -->
        <div>
          <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Time Period</label>
          <select
            :value="violationTimePeriod"
            @change="emit('update:violation-time-period', parseInt($event.target.value))"
            class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="opt in timeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Max violations -->
        <div>
          <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Max Violations</label>
          <div class="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="50"
              :value="maxViolations ?? ''"
              @input="handleMaxViolationsChange"
              placeholder="No limit"
              class="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              v-if="maxViolations !== null"
              @click="emit('update:max-violations', null)"
              class="px-3 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Hazard Exclusion Section -->
    <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        Exclude Hazard Ratings
      </h3>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="hazard in hazardOptions"
          :key="hazard"
          @click="emit('toggle-hazard', hazard)"
          class="px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all"
          :class="excludedHazardRatings.includes(hazard)
            ? `${hazardColors[hazard].active} text-white border-transparent line-through opacity-75`
            : `${hazardColors[hazard].inactive} bg-white dark:bg-gray-700 border-current`"
        >
          {{ hazard }}
        </button>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Click to exclude ratings from the roulette
      </p>
    </div>
  </div>
</template>
