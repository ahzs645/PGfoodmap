<script setup>
import { ref } from 'vue'
import RestaurantCard from './RestaurantCard.vue'

const props = defineProps({
  restaurants: Array,
  geocodedRestaurants: Array,
  loading: Boolean,
  error: String,
  stats: Object,
  timelineStats: Object,
  selectedRestaurant: Object,
  searchQuery: String,
  selectedHazardRatings: Array,
  selectedFacilityTypes: Array,
  timelineMonths: Number,
  visualizationMode: String,
  isDark: Boolean
})

const emit = defineEmits([
  'update:search-query',
  'update:selected-hazard-ratings',
  'update:selected-facility-types',
  'update:timeline-months',
  'update:visualization-mode',
  'restaurant-click',
  'clear-selection',
  'open-inspection-panel',
  'toggle-dark-mode'
])

const showFilters = ref(true)

const hazardOptions = ['Low', 'Moderate', 'Unknown']
const facilityOptions = ['Restaurant', 'Institutional Kitchen', 'Store', 'Unknown', 'Other']
const timelineOptions = [
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 12, label: '1 year' },
  { value: 24, label: '2 years' },
  { value: 0, label: 'All time' }
]

function toggleHazard(hazard) {
  const current = [...props.selectedHazardRatings]
  const index = current.indexOf(hazard)
  if (index > -1) {
    current.splice(index, 1)
  } else {
    current.push(hazard)
  }
  emit('update:selected-hazard-ratings', current)
}

function toggleFacility(facility) {
  const current = [...props.selectedFacilityTypes]
  const index = current.indexOf(facility)
  if (index > -1) {
    current.splice(index, 1)
  } else {
    current.push(facility)
  }
  emit('update:selected-facility-types', current)
}

const hazardColors = {
  'Low': 'bg-green-500',
  'Moderate': 'bg-amber-500',
  'Unknown': 'bg-gray-500'
}
</script>

<template>
  <div class="w-[350px] h-full bg-white dark:bg-gray-800 shadow-lg flex flex-col border-r border-gray-200 dark:border-gray-700 z-10">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-blue-700">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-white">PG Food Map</h1>
          <p class="text-sm text-blue-100">Prince George Restaurant Inspections</p>
        </div>
        <!-- Dark mode toggle -->
        <button
          @click="emit('toggle-dark-mode')"
          class="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <svg v-if="isDark" class="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
          </svg>
          <svg v-else class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Visualization Mode Toggle -->
    <div class="p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div class="flex rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
        <button
          @click="emit('update:visualization-mode', 'violations')"
          class="flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors"
          :class="visualizationMode === 'violations'
            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'"
        >
          Violations
        </button>
        <button
          @click="emit('update:visualization-mode', 'hazard')"
          class="flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors"
          :class="visualizationMode === 'hazard'
            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'"
        >
          Hazard Rating
        </button>
      </div>
    </div>

    <!-- Timeline Stats (only show in violations mode) -->
    <div v-if="visualizationMode === 'violations'" class="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Time Period</span>
        <select
          :value="timelineMonths"
          @change="emit('update:timeline-months', parseInt($event.target.value))"
          class="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option v-for="opt in timelineOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="bg-white dark:bg-gray-800 p-2 rounded shadow-sm">
          <div class="text-2xl font-bold text-red-600">{{ timelineStats?.totalViolations || 0 }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Total Violations</div>
        </div>
        <div class="bg-white dark:bg-gray-800 p-2 rounded shadow-sm">
          <div class="text-2xl font-bold text-orange-600">{{ timelineStats?.criticalViolations || 0 }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Critical</div>
        </div>
        <div class="bg-white dark:bg-gray-800 p-2 rounded shadow-sm">
          <div class="text-2xl font-bold text-blue-600">{{ timelineStats?.totalInspections || 0 }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Inspections</div>
        </div>
        <div class="bg-white dark:bg-gray-800 p-2 rounded shadow-sm">
          <div class="text-2xl font-bold text-gray-700 dark:text-gray-300">{{ timelineStats?.restaurantsWithViolations || 0 }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">With Violations</div>
        </div>
      </div>
    </div>

    <!-- Simple stats for hazard mode -->
    <div v-else class="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div class="grid grid-cols-3 gap-2 text-sm">
        <div class="bg-white dark:bg-gray-800 p-2 rounded shadow-sm text-center">
          <div class="text-xl font-bold text-green-600">{{ stats?.byHazard?.Low || 0 }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Low</div>
        </div>
        <div class="bg-white dark:bg-gray-800 p-2 rounded shadow-sm text-center">
          <div class="text-xl font-bold text-amber-600">{{ stats?.byHazard?.Moderate || 0 }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Moderate</div>
        </div>
        <div class="bg-white dark:bg-gray-800 p-2 rounded shadow-sm text-center">
          <div class="text-xl font-bold text-gray-600">{{ stats?.byHazard?.Unknown || 0 }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Unknown</div>
        </div>
      </div>
    </div>

    <!-- Map count -->
    <div class="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {{ geocodedRestaurants?.length || 0 }} of {{ restaurants?.length || 0 }} restaurants on map
    </div>

    <!-- Search -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <input
        type="text"
        :value="searchQuery"
        @input="emit('update:search-query', $event.target.value)"
        placeholder="Search restaurants..."
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <!-- Filters toggle -->
    <button
      @click="showFilters = !showFilters"
      class="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between border-b border-gray-200 dark:border-gray-700"
    >
      <span>Filters</span>
      <svg
        class="w-4 h-4 transform transition-transform"
        :class="{ 'rotate-180': showFilters }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Filters panel -->
    <div v-if="showFilters" class="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 space-y-4">
      <!-- Hazard Rating Filter -->
      <div>
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Hazard Rating</h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="hazard in hazardOptions"
            :key="hazard"
            @click="toggleHazard(hazard)"
            class="px-3 py-1 text-xs rounded-full border transition-colors"
            :class="selectedHazardRatings.includes(hazard)
              ? `${hazardColors[hazard]} text-white border-transparent`
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'"
          >
            {{ hazard }}
            <span class="ml-1 opacity-75">({{ stats?.byHazard?.[hazard] || 0 }})</span>
          </button>
        </div>
      </div>

      <!-- Facility Type Filter -->
      <div>
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Facility Type</h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="facility in facilityOptions"
            :key="facility"
            @click="toggleFacility(facility)"
            class="px-3 py-1 text-xs rounded-full border transition-colors"
            :class="selectedFacilityTypes.includes(facility)
              ? 'bg-blue-500 text-white border-transparent'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'"
          >
            {{ facility }}
            <span class="ml-1 opacity-75">({{ stats?.byFacilityType?.[facility] || 0 }})</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Selected restaurant detail -->
    <div v-if="selectedRestaurant" class="p-4 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-blue-900 dark:text-blue-200">Selected Restaurant</span>
        <button @click="emit('clear-selection')" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <RestaurantCard :restaurant="selectedRestaurant" :expanded="true" :visualization-mode="visualizationMode" />
      <button
        @click="emit('open-inspection-panel')"
        class="mt-3 w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        View All Inspections
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-gray-500 dark:text-gray-400">Loading restaurants...</div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex-1 flex items-center justify-center p-4">
      <div class="text-red-500 text-center">
        <p class="font-medium">Error loading data</p>
        <p class="text-sm">{{ error }}</p>
      </div>
    </div>

    <!-- Restaurant list -->
    <div v-else class="flex-1 overflow-y-auto">
      <div class="p-2 text-xs text-gray-500 dark:text-gray-400 sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <span>{{ restaurants.length }} restaurants</span>
        <span class="text-gray-400 dark:text-gray-500">Click for details</span>
      </div>
      <div class="divide-y divide-gray-100 dark:divide-gray-700">
        <RestaurantCard
          v-for="restaurant in restaurants"
          :key="restaurant.details_url"
          :restaurant="restaurant"
          :is-selected="selectedRestaurant?.details_url === restaurant.details_url"
          :visualization-mode="visualizationMode"
          @click="emit('restaurant-click', restaurant)"
        />
      </div>
    </div>
  </div>
</template>
