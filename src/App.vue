<script setup>
import { ref, computed } from 'vue'
import RestaurantMap from './components/RestaurantMap.vue'
import Sidebar from './components/Sidebar.vue'
import InspectionPanel from './components/InspectionPanel.vue'
import { useRestaurantData } from './composables/useRestaurantData'
import { useDarkMode } from './composables/useDarkMode'

const { isDark, toggleDarkMode } = useDarkMode()

const selectedHazardRatings = ref(['Low', 'Moderate', 'Unknown'])
const selectedFacilityTypes = ref(['Restaurant', 'Institutional Kitchen', 'Store', 'Unknown', 'Other'])
const searchQuery = ref('')
const selectedRestaurant = ref(null)
const showSidebar = ref(true)
const showInspectionPanel = ref(false)

// Visualization mode: 'hazard' or 'violations'
const visualizationMode = ref('violations')

// Timeline filter - default to past year
const timelineMonths = ref(12)
const cutoffDate = computed(() => {
  if (timelineMonths.value === 0) return null // All time
  const date = new Date()
  date.setMonth(date.getMonth() - timelineMonths.value)
  return date
})

const { restaurants, loading, error, stats } = useRestaurantData()

// Parse date string like "18-Mar-2024" or "March 18, 2024"
function parseInspectionDate(dateStr) {
  if (!dateStr) return null

  // Try "DD-MMM-YYYY" format
  const shortMatch = dateStr.match(/(\d{1,2})-(\w{3})-(\d{4})/)
  if (shortMatch) {
    const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }
    return new Date(parseInt(shortMatch[3]), months[shortMatch[2]], parseInt(shortMatch[1]))
  }

  // Try "Month DD, YYYY" format
  const longMatch = dateStr.match(/(\w+)\s+(\d{1,2}),\s+(\d{4})/)
  if (longMatch) {
    return new Date(dateStr)
  }

  return null
}

// Compute violation stats for each restaurant within the timeline
const restaurantsWithStats = computed(() => {
  return restaurants.value.map(r => {
    const inspections = r.inspections || []

    // Filter inspections by cutoff date
    const filteredInspections = cutoffDate.value
      ? inspections.filter(insp => {
          const date = parseInspectionDate(insp.date || insp.inspection_date)
          return date && date >= cutoffDate.value
        })
      : inspections

    // Calculate violation stats
    let totalViolations = 0
    let criticalViolations = 0
    let nonCriticalViolations = 0

    filteredInspections.forEach(insp => {
      totalViolations += (insp.violations?.length || 0)
      criticalViolations += (insp.critical_violations_count || 0)
      nonCriticalViolations += (insp.non_critical_violations_count || 0)
    })

    return {
      ...r,
      filteredInspections,
      violationStats: {
        total: totalViolations,
        critical: criticalViolations,
        nonCritical: nonCriticalViolations,
        inspectionCount: filteredInspections.length
      }
    }
  })
})

const filteredRestaurants = computed(() => {
  return restaurantsWithStats.value.filter(r => {
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

// Stats for the current timeline
const timelineStats = computed(() => {
  const all = restaurantsWithStats.value
  return {
    totalViolations: all.reduce((sum, r) => sum + r.violationStats.total, 0),
    criticalViolations: all.reduce((sum, r) => sum + r.violationStats.critical, 0),
    totalInspections: all.reduce((sum, r) => sum + r.violationStats.inspectionCount, 0),
    restaurantsWithViolations: all.filter(r => r.violationStats.total > 0).length
  }
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
  showInspectionPanel.value = false
}

function openInspectionPanel() {
  showInspectionPanel.value = true
}
</script>

<template>
  <div class="flex h-screen w-screen bg-white dark:bg-gray-900">
    <!-- Sidebar -->
    <Sidebar
      v-if="showSidebar"
      :restaurants="filteredRestaurants"
      :geocoded-restaurants="geocodedRestaurants"
      :loading="loading"
      :error="error"
      :stats="stats"
      :timeline-stats="timelineStats"
      :selected-restaurant="selectedRestaurant"
      :search-query="searchQuery"
      :selected-hazard-ratings="selectedHazardRatings"
      :selected-facility-types="selectedFacilityTypes"
      :timeline-months="timelineMonths"
      :visualization-mode="visualizationMode"
      :is-dark="isDark"
      @update:search-query="searchQuery = $event"
      @update:selected-hazard-ratings="selectedHazardRatings = $event"
      @update:selected-facility-types="selectedFacilityTypes = $event"
      @update:timeline-months="timelineMonths = $event"
      @update:visualization-mode="visualizationMode = $event"
      @restaurant-click="handleRestaurantClick"
      @clear-selection="clearSelection"
      @open-inspection-panel="openInspectionPanel"
      @toggle-dark-mode="toggleDarkMode"
    />

    <!-- Toggle sidebar button -->
    <button
      @click="showSidebar = !showSidebar"
      class="absolute top-4 left-4 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      :class="{ 'left-[360px]': showSidebar }"
    >
      <svg v-if="showSidebar" class="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
      </svg>
      <svg v-else class="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    </button>

    <!-- Map -->
    <div class="flex-1 relative">
      <RestaurantMap
        :restaurants="geocodedRestaurants"
        :selected-restaurant="selectedRestaurant"
        :timeline-months="timelineMonths"
        :visualization-mode="visualizationMode"
        :is-dark="isDark"
        @restaurant-click="handleMapRestaurantClick"
      />

      <!-- Map Legend -->
      <div class="absolute bottom-6 right-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-10">
        <h4 class="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">
          {{ visualizationMode === 'violations'
            ? `Violations (${timelineMonths === 0 ? 'All Time' : `Past ${timelineMonths}mo`})`
            : 'Hazard Rating' }}
        </h4>

        <!-- Violations legend -->
        <div v-if="visualizationMode === 'violations'" class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 rounded-full bg-green-500"></span>
            <span class="text-xs text-gray-600 dark:text-gray-300">0 violations</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 rounded-full bg-yellow-500"></span>
            <span class="text-xs text-gray-600 dark:text-gray-300">1-3 violations</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 rounded-full bg-orange-500"></span>
            <span class="text-xs text-gray-600 dark:text-gray-300">4-6 violations</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 rounded-full bg-red-500"></span>
            <span class="text-xs text-gray-600 dark:text-gray-300">7+ violations</span>
          </div>
        </div>

        <!-- Hazard rating legend -->
        <div v-else class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 rounded-full bg-green-500"></span>
            <span class="text-xs text-gray-600 dark:text-gray-300">Low</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 rounded-full bg-amber-500"></span>
            <span class="text-xs text-gray-600 dark:text-gray-300">Moderate</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 rounded-full bg-gray-500"></span>
            <span class="text-xs text-gray-600 dark:text-gray-300">Unknown</span>
          </div>
        </div>

        <div v-if="visualizationMode === 'violations'" class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full border-2 border-gray-400"></span>
            <span class="text-xs text-gray-600 dark:text-gray-300">Size = count</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Inspection Detail Panel -->
    <InspectionPanel
      v-if="showInspectionPanel && selectedRestaurant"
      :restaurant="selectedRestaurant"
      :is-dark="isDark"
      @close="showInspectionPanel = false"
    />
  </div>
</template>
