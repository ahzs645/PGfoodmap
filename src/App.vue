<script setup>
import { ref, computed, watch } from 'vue'
import RestaurantMap from './components/RestaurantMap.vue'
import Sidebar from './components/Sidebar.vue'
import { useRestaurantData } from './composables/useRestaurantData'

const selectedHazardRatings = ref(['Low', 'Moderate', 'Unknown'])
const selectedFacilityTypes = ref(['Restaurant', 'Institutional Kitchen', 'Store', 'Unknown', 'Other'])
const searchQuery = ref('')
const selectedRestaurant = ref(null)
const showSidebar = ref(true)

const { restaurants, loading, error, stats } = useRestaurantData()

const filteredRestaurants = computed(() => {
  return restaurants.value.filter(r => {
    const matchesHazard = selectedHazardRatings.value.includes(r.current_hazard_rating || r.hazard_rating || 'Unknown')
    const matchesFacility = selectedFacilityTypes.value.includes(r.facility_type || 'Unknown')
    const matchesSearch = !searchQuery.value ||
      r.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      r.address.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchesHazard && matchesFacility && matchesSearch
  })
})

const geocodedRestaurants = computed(() => {
  return filteredRestaurants.value.filter(r => r.latitude && r.longitude)
})

function handleRestaurantClick(restaurant) {
  selectedRestaurant.value = restaurant
}

function handleMapRestaurantClick(restaurant) {
  selectedRestaurant.value = restaurant
  showSidebar.value = true
}

function clearSelection() {
  selectedRestaurant.value = null
}
</script>

<template>
  <div class="flex h-screen w-screen">
    <!-- Sidebar -->
    <Sidebar
      v-if="showSidebar"
      :restaurants="filteredRestaurants"
      :geocoded-restaurants="geocodedRestaurants"
      :loading="loading"
      :error="error"
      :stats="stats"
      :selected-restaurant="selectedRestaurant"
      :search-query="searchQuery"
      :selected-hazard-ratings="selectedHazardRatings"
      :selected-facility-types="selectedFacilityTypes"
      @update:search-query="searchQuery = $event"
      @update:selected-hazard-ratings="selectedHazardRatings = $event"
      @update:selected-facility-types="selectedFacilityTypes = $event"
      @restaurant-click="handleRestaurantClick"
      @clear-selection="clearSelection"
    />

    <!-- Toggle sidebar button -->
    <button
      @click="showSidebar = !showSidebar"
      class="absolute top-4 left-4 z-20 bg-white rounded-lg shadow-lg p-2 hover:bg-gray-100"
      :class="{ 'left-[360px]': showSidebar }"
    >
      <svg v-if="showSidebar" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
      </svg>
      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    </button>

    <!-- Map -->
    <div class="flex-1 relative">
      <RestaurantMap
        :restaurants="geocodedRestaurants"
        :selected-restaurant="selectedRestaurant"
        @restaurant-click="handleMapRestaurantClick"
      />
    </div>
  </div>
</template>
