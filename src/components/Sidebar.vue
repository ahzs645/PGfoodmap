<script setup>
import { ref, computed } from 'vue'
import RestaurantCard from './RestaurantCard.vue'

const props = defineProps({
  restaurants: Array,
  geocodedRestaurants: Array,
  loading: Boolean,
  error: String,
  stats: Object,
  selectedRestaurant: Object,
  searchQuery: String,
  selectedHazardRatings: Array,
  selectedFacilityTypes: Array
})

const emit = defineEmits([
  'update:search-query',
  'update:selected-hazard-ratings',
  'update:selected-facility-types',
  'restaurant-click',
  'clear-selection'
])

const showFilters = ref(false)

const hazardOptions = ['Low', 'Moderate', 'Unknown']
const facilityOptions = ['Restaurant', 'Institutional Kitchen', 'Store', 'Unknown', 'Other']

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
  <div class="w-[350px] h-full bg-white shadow-lg flex flex-col border-r border-gray-200 z-10">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200">
      <h1 class="text-xl font-bold text-gray-900">PG Food Map</h1>
      <p class="text-sm text-gray-600">Prince George Restaurant Health Inspections</p>
    </div>

    <!-- Stats -->
    <div class="p-4 bg-gray-50 border-b border-gray-200">
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span class="text-gray-500">Total:</span>
          <span class="font-medium ml-1">{{ stats?.total || 0 }}</span>
        </div>
        <div>
          <span class="text-gray-500">On Map:</span>
          <span class="font-medium ml-1">{{ geocodedRestaurants?.length || 0 }}</span>
        </div>
        <div>
          <span class="text-gray-500">Inspections:</span>
          <span class="font-medium ml-1">{{ stats?.totalInspections || 0 }}</span>
        </div>
        <div>
          <span class="text-gray-500">Violations:</span>
          <span class="font-medium ml-1">{{ stats?.totalViolations || 0 }}</span>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="p-4 border-b border-gray-200">
      <input
        type="text"
        :value="searchQuery"
        @input="emit('update:search-query', $event.target.value)"
        placeholder="Search restaurants..."
        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <!-- Filters toggle -->
    <button
      @click="showFilters = !showFilters"
      class="px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-between border-b border-gray-200"
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
    <div v-if="showFilters" class="p-4 bg-gray-50 border-b border-gray-200 space-y-4">
      <!-- Hazard Rating Filter -->
      <div>
        <h3 class="text-sm font-medium text-gray-700 mb-2">Hazard Rating</h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="hazard in hazardOptions"
            :key="hazard"
            @click="toggleHazard(hazard)"
            class="px-3 py-1 text-xs rounded-full border transition-colors"
            :class="selectedHazardRatings.includes(hazard)
              ? `${hazardColors[hazard]} text-white border-transparent`
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'"
          >
            {{ hazard }}
            <span class="ml-1 opacity-75">({{ stats?.byHazard?.[hazard] || 0 }})</span>
          </button>
        </div>
      </div>

      <!-- Facility Type Filter -->
      <div>
        <h3 class="text-sm font-medium text-gray-700 mb-2">Facility Type</h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="facility in facilityOptions"
            :key="facility"
            @click="toggleFacility(facility)"
            class="px-3 py-1 text-xs rounded-full border transition-colors"
            :class="selectedFacilityTypes.includes(facility)
              ? 'bg-blue-500 text-white border-transparent'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'"
          >
            {{ facility }}
            <span class="ml-1 opacity-75">({{ stats?.byFacilityType?.[facility] || 0 }})</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Selected restaurant detail -->
    <div v-if="selectedRestaurant" class="p-4 bg-blue-50 border-b border-blue-200">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-blue-900">Selected Restaurant</span>
        <button @click="emit('clear-selection')" class="text-blue-600 hover:text-blue-800">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <RestaurantCard :restaurant="selectedRestaurant" :expanded="true" />
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-gray-500">Loading restaurants...</div>
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
      <div class="p-2 text-xs text-gray-500 sticky top-0 bg-white border-b">
        Showing {{ restaurants.length }} restaurants
        <span v-if="geocodedRestaurants.length < restaurants.length" class="text-amber-600">
          ({{ geocodedRestaurants.length }} on map)
        </span>
      </div>
      <div class="divide-y divide-gray-100">
        <RestaurantCard
          v-for="restaurant in restaurants"
          :key="restaurant.details_url"
          :restaurant="restaurant"
          :is-selected="selectedRestaurant?.details_url === restaurant.details_url"
          @click="emit('restaurant-click', restaurant)"
        />
      </div>
    </div>
  </div>
</template>
