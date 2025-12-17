import { ref, computed } from 'vue'
import * as turf from '@turf/turf'

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

// Calculate distance in km between source and restaurant
function calculateDistance(source, restaurant) {
  if (!source || !restaurant.latitude || !restaurant.longitude) return null
  const from = turf.point([source.lng, source.lat])
  const to = turf.point([restaurant.longitude, restaurant.latitude])
  return turf.distance(from, to, { units: 'kilometers' })
}

// Count violations within a time period
function countViolationsInPeriod(restaurant, months) {
  if (months === 0) {
    // All time - count all violations
    return (restaurant.inspections || []).reduce((sum, insp) => {
      return sum + (insp.violations?.length || 0)
    }, 0)
  }

  const cutoffDate = new Date()
  cutoffDate.setMonth(cutoffDate.getMonth() - months)

  const inspections = restaurant.inspections || []
  let total = 0

  inspections.forEach(insp => {
    const date = parseInspectionDate(insp.date || insp.inspection_date)
    if (date && date >= cutoffDate) {
      total += (insp.violations?.length || 0)
    }
  })

  return total
}

export function useRouletteState(allRestaurants) {
  // Filter toggle - when false, use all restaurants
  const useFilters = ref(false)

  // Location state
  const sourceLocation = ref(null) // { lat, lng }
  const locationMode = ref('none') // 'none' | 'geolocation' | 'manual'
  const maxDistance = ref(5) // km

  // Violation filter state
  const violationTimePeriod = ref(12) // months (0 = all time)
  const maxViolations = ref(null) // null = no limit

  // Hazard exclusion state
  const excludedHazardRatings = ref([]) // ['Low', 'Moderate', 'Unknown']

  // UI state
  const isSpinning = ref(false)
  const winner = ref(null)
  const winnerIndex = ref(null) // Index of winner in wheelRestaurants
  const hasSpun = ref(false)

  // Wheel display state
  const wheelSize = ref(8) // How many restaurants to show on wheel
  const wheelRestaurants = ref([]) // The actual restaurants on the wheel

  // Computed: filtered restaurants for roulette
  const eligibleRestaurants = computed(() => {
    // If filters are disabled, return all restaurants
    if (!useFilters.value) {
      return allRestaurants.value.map(r => ({
        ...r,
        distanceKm: null,
        rouletteViolationCount: countViolationsInPeriod(r, 12)
      }))
    }

    // Apply filters
    return allRestaurants.value.filter(r => {
      // Must have valid coordinates for distance filtering if location is set
      if (sourceLocation.value && (!r.latitude || !r.longitude)) return false

      // Distance filter
      if (sourceLocation.value && maxDistance.value > 0) {
        const distance = calculateDistance(sourceLocation.value, r)
        if (distance === null || distance > maxDistance.value) return false
      }

      // Hazard exclusion filter
      const rating = r.current_hazard_rating || r.hazard_rating || 'Unknown'
      if (excludedHazardRatings.value.includes(rating)) return false

      // Violation filter (within time period)
      if (maxViolations.value !== null) {
        const violations = countViolationsInPeriod(r, violationTimePeriod.value)
        if (violations > maxViolations.value) return false
      }

      return true
    }).map(r => {
      // Add distance to each restaurant
      const distance = sourceLocation.value ? calculateDistance(sourceLocation.value, r) : null
      const violationCount = countViolationsInPeriod(r, violationTimePeriod.value)
      return {
        ...r,
        distanceKm: distance,
        rouletteViolationCount: violationCount
      }
    })
  })

  // Set source from geolocation
  function setSourceFromGeolocation(position) {
    if (position) {
      sourceLocation.value = position
      locationMode.value = 'geolocation'
    }
  }

  // Set source from manual map click
  function setSourceFromMap(lngLat) {
    sourceLocation.value = { lat: lngLat.lat, lng: lngLat.lng }
    locationMode.value = 'manual'
  }

  // Clear source location
  function clearSourceLocation() {
    sourceLocation.value = null
    locationMode.value = 'none'
  }

  // Toggle hazard rating exclusion
  function toggleHazardExclusion(rating) {
    const index = excludedHazardRatings.value.indexOf(rating)
    if (index === -1) {
      excludedHazardRatings.value.push(rating)
    } else {
      excludedHazardRatings.value.splice(index, 1)
    }
  }

  // Shuffle array helper
  function shuffleArray(array) {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Populate wheel with random restaurants from eligible list
  function shuffleWheel() {
    const eligible = eligibleRestaurants.value
    if (eligible.length === 0) {
      wheelRestaurants.value = []
      return
    }

    // Take up to wheelSize random restaurants
    const shuffled = shuffleArray(eligible)
    wheelRestaurants.value = shuffled.slice(0, Math.min(wheelSize.value, eligible.length))
  }

  // Spin the wheel and select a winner from what's on the wheel
  function spin() {
    if (wheelRestaurants.value.length === 0) return null

    isSpinning.value = true
    hasSpun.value = true

    // Random selection from wheel restaurants only
    const idx = Math.floor(Math.random() * wheelRestaurants.value.length)
    winnerIndex.value = idx
    winner.value = wheelRestaurants.value[idx]

    return winner.value
  }

  // Complete spinning (called after animation)
  function completeSpinning() {
    isSpinning.value = false
  }

  // Reset for a new spin
  function resetSpin() {
    winner.value = null
    winnerIndex.value = null
    hasSpun.value = false
    isSpinning.value = false
  }

  // Reset all filters
  function resetFilters() {
    useFilters.value = false
    sourceLocation.value = null
    locationMode.value = 'none'
    maxDistance.value = 5
    violationTimePeriod.value = 12
    maxViolations.value = null
    excludedHazardRatings.value = []
    winner.value = null
    winnerIndex.value = null
    hasSpun.value = false
    isSpinning.value = false
    wheelSize.value = 8
    wheelRestaurants.value = []
  }

  return {
    // Filter toggle
    useFilters,
    // Location
    sourceLocation,
    locationMode,
    maxDistance,
    // Violations
    violationTimePeriod,
    maxViolations,
    // Hazard
    excludedHazardRatings,
    // UI
    isSpinning,
    winner,
    winnerIndex,
    hasSpun,
    // Wheel
    wheelSize,
    wheelRestaurants,
    // Computed
    eligibleRestaurants,
    // Methods
    setSourceFromGeolocation,
    setSourceFromMap,
    clearSourceLocation,
    toggleHazardExclusion,
    shuffleWheel,
    spin,
    completeSpinning,
    resetSpin,
    resetFilters
  }
}
