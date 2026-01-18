import { useState, useMemo, useCallback } from 'react'
// @ts-expect-error - turf types issue with package exports
import * as turf from '@turf/turf'
import type { Restaurant, HazardRating, SourceLocation, SpinnerMode, RouletteRestaurant } from '@/types'

// Parse date string like "18-Mar-2024" or "March 18, 2024"
function parseInspectionDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null

  // Try "DD-MMM-YYYY" format
  const shortMatch = dateStr.match(/(\d{1,2})-(\w{3})-(\d{4})/)
  if (shortMatch) {
    const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }
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
function calculateDistance(source: SourceLocation, restaurant: Restaurant): number | null {
  if (!source || !restaurant.latitude || !restaurant.longitude) return null
  const from = turf.point([source.lng, source.lat])
  const to = turf.point([restaurant.longitude, restaurant.latitude])
  return turf.distance(from, to, { units: 'kilometers' })
}

// Count violations within a time period
function countViolationsInPeriod(restaurant: Restaurant, months: number): number {
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

// Shuffle array helper
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function useRouletteState(allRestaurants: Restaurant[]) {
  // Filter toggle - when false, use all restaurants
  const [useFilters, setUseFilters] = useState(false)

  // Location state
  const [sourceLocation, setSourceLocation] = useState<SourceLocation | null>(null)
  const [locationMode, setLocationMode] = useState<'none' | 'geolocation' | 'manual'>('none')
  const [maxDistance, setMaxDistance] = useState(5) // km

  // Violation filter state
  const [violationTimePeriod, setViolationTimePeriod] = useState(12) // months (0 = all time)
  const [maxViolations, setMaxViolations] = useState<number | null>(null) // null = no limit

  // Hazard exclusion state
  const [excludedHazardRatings, setExcludedHazardRatings] = useState<HazardRating[]>([])

  // UI state
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState<RouletteRestaurant | null>(null)
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null)
  const [hasSpun, setHasSpun] = useState(false)
  const [spinnerMode, setSpinnerMode] = useState<SpinnerMode>('wheel')

  // Wheel display state
  const [wheelSize, setWheelSize] = useState(65)
  const [wheelRestaurants, setWheelRestaurants] = useState<RouletteRestaurant[]>([])

  // Computed: filtered restaurants for roulette
  const eligibleRestaurants = useMemo<RouletteRestaurant[]>(() => {
    // If filters are disabled, return all restaurants
    if (!useFilters) {
      return allRestaurants.map(r => ({
        ...r,
        distanceKm: null,
        rouletteViolationCount: countViolationsInPeriod(r, 12)
      }))
    }

    // Apply filters
    return allRestaurants.filter(r => {
      // Must have valid coordinates for distance filtering if location is set
      if (sourceLocation && (!r.latitude || !r.longitude)) return false

      // Distance filter
      if (sourceLocation && maxDistance > 0) {
        const distance = calculateDistance(sourceLocation, r)
        if (distance === null || distance > maxDistance) return false
      }

      // Hazard exclusion filter
      const rating = (r.current_hazard_rating || r.hazard_rating || 'Unknown') as HazardRating
      if (excludedHazardRatings.includes(rating)) return false

      // Violation filter (within time period)
      if (maxViolations !== null) {
        const violations = countViolationsInPeriod(r, violationTimePeriod)
        if (violations > maxViolations) return false
      }

      return true
    }).map(r => {
      // Add distance to each restaurant
      const distance = sourceLocation ? calculateDistance(sourceLocation, r) : null
      const violationCount = countViolationsInPeriod(r, violationTimePeriod)
      return {
        ...r,
        distanceKm: distance,
        rouletteViolationCount: violationCount
      }
    })
  }, [allRestaurants, useFilters, sourceLocation, maxDistance, excludedHazardRatings, maxViolations, violationTimePeriod])

  // Set source from geolocation
  const setSourceFromGeolocation = useCallback((position: SourceLocation) => {
    if (position) {
      setSourceLocation(position)
      setLocationMode('geolocation')
    }
  }, [])

  // Set source from manual map click
  const setSourceFromMap = useCallback((lngLat: SourceLocation) => {
    setSourceLocation({ lat: lngLat.lat, lng: lngLat.lng })
    setLocationMode('manual')
  }, [])

  // Clear source location
  const clearSourceLocation = useCallback(() => {
    setSourceLocation(null)
    setLocationMode('none')
  }, [])

  // Toggle hazard rating exclusion
  const toggleHazardExclusion = useCallback((rating: HazardRating) => {
    setExcludedHazardRatings(prev => {
      const index = prev.indexOf(rating)
      if (index === -1) {
        return [...prev, rating]
      } else {
        return prev.filter(r => r !== rating)
      }
    })
  }, [])

  // Populate wheel with random restaurants from eligible list
  const shuffleWheel = useCallback(() => {
    const eligible = eligibleRestaurants
    if (eligible.length === 0) {
      setWheelRestaurants([])
      return
    }

    // Take up to wheelSize random restaurants (0 means all)
    const shuffled = shuffleArray(eligible)
    const count = wheelSize === 0 ? eligible.length : Math.min(wheelSize, eligible.length)
    setWheelRestaurants(shuffled.slice(0, count))
  }, [eligibleRestaurants, wheelSize])

  // Spin the wheel and select a winner
  const spin = useCallback(() => {
    setIsSpinning(true)
    setHasSpun(true)

    if (spinnerMode === 'slot') {
      // Slot mode: pick from all eligible restaurants
      if (eligibleRestaurants.length === 0) return null
      const idx = Math.floor(Math.random() * eligibleRestaurants.length)
      setWinnerIndex(idx)
      setWinner(eligibleRestaurants[idx])
      return eligibleRestaurants[idx]
    } else {
      // Wheel mode: pick from wheel restaurants only
      if (wheelRestaurants.length === 0) return null
      const idx = Math.floor(Math.random() * wheelRestaurants.length)
      setWinnerIndex(idx)
      setWinner(wheelRestaurants[idx])
      return wheelRestaurants[idx]
    }
  }, [spinnerMode, eligibleRestaurants, wheelRestaurants])

  // Start spinning without picking winner (for wheel mode where wheel picks)
  const startSpinning = useCallback(() => {
    setIsSpinning(true)
    setHasSpun(true)
  }, [])

  // Complete spinning with winner from wheel
  const completeSpinningWithWinner = useCallback((winnerRestaurant: RouletteRestaurant) => {
    setWinner(winnerRestaurant)
    setIsSpinning(false)
  }, [])

  // Complete spinning (called after animation)
  const completeSpinning = useCallback(() => {
    setIsSpinning(false)
  }, [])

  // Reset for a new spin
  const resetSpin = useCallback(() => {
    setWinner(null)
    setWinnerIndex(null)
    setHasSpun(false)
    setIsSpinning(false)
  }, [])

  // Reset all filters
  const resetFilters = useCallback(() => {
    setUseFilters(false)
    setSourceLocation(null)
    setLocationMode('none')
    setMaxDistance(5)
    setViolationTimePeriod(12)
    setMaxViolations(null)
    setExcludedHazardRatings([])
    setWinner(null)
    setWinnerIndex(null)
    setHasSpun(false)
    setIsSpinning(false)
    setWheelSize(65)
    setWheelRestaurants([])
  }, [])

  return {
    // Filter toggle
    useFilters,
    setUseFilters,
    // Location
    sourceLocation,
    locationMode,
    maxDistance,
    setMaxDistance,
    // Violations
    violationTimePeriod,
    setViolationTimePeriod,
    maxViolations,
    setMaxViolations,
    // Hazard
    excludedHazardRatings,
    // UI
    isSpinning,
    winner,
    winnerIndex,
    hasSpun,
    spinnerMode,
    setSpinnerMode,
    // Wheel
    wheelSize,
    setWheelSize,
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
    startSpinning,
    completeSpinning,
    completeSpinningWithWinner,
    resetSpin,
    resetFilters
  }
}
