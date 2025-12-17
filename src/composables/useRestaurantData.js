import { ref, reactive, onMounted, computed } from 'vue'

export function useRestaurantData() {
  const state = reactive({
    restaurants: [],
    loading: true,
    error: null
  })

  async function loadData() {
    state.loading = true
    state.error = null

    try {
      const response = await fetch('/data/restaurants.json')
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status}`)
      }
      const data = await response.json()
      state.restaurants = data
    } catch (err) {
      console.error('Error loading restaurant data:', err)
      state.error = err.message
    } finally {
      state.loading = false
    }
  }

  const stats = computed(() => {
    const total = state.restaurants.length
    const geocoded = state.restaurants.filter(r => r.latitude && r.longitude).length

    const byHazard = state.restaurants.reduce((acc, r) => {
      const rating = r.current_hazard_rating || r.hazard_rating || 'Unknown'
      acc[rating] = (acc[rating] || 0) + 1
      return acc
    }, {})

    const byFacilityType = state.restaurants.reduce((acc, r) => {
      const type = r.facility_type || 'Unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    const totalInspections = state.restaurants.reduce((acc, r) => {
      return acc + (r.inspections?.length || 0)
    }, 0)

    const totalViolations = state.restaurants.reduce((acc, r) => {
      return acc + (r.inspections || []).reduce((sum, insp) => {
        return sum + (insp.violations?.length || 0)
      }, 0)
    }, 0)

    return {
      total,
      geocoded,
      byHazard,
      byFacilityType,
      totalInspections,
      totalViolations
    }
  })

  onMounted(() => {
    loadData()
  })

  return {
    restaurants: computed(() => state.restaurants),
    loading: computed(() => state.loading),
    error: computed(() => state.error),
    stats,
    reload: loadData
  }
}
