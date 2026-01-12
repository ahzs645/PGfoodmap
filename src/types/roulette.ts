import type { Restaurant, HazardRating } from './restaurant'

export type LocationMode = 'none' | 'geolocation' | 'manual'
export type SpinnerMode = 'wheel' | 'slot'

export interface SourceLocation {
  lat: number
  lng: number
}

export interface RouletteRestaurant extends Restaurant {
  distanceKm: number | null
  rouletteViolationCount: number
}

export interface RouletteFilters {
  useFilters: boolean
  sourceLocation: SourceLocation | null
  locationMode: LocationMode
  maxDistance: number
  violationTimePeriod: number
  maxViolations: number | null
  excludedHazardRatings: HazardRating[]
}

export interface RouletteUIState {
  isSpinning: boolean
  winner: RouletteRestaurant | null
  winnerIndex: number | null
  hasSpun: boolean
  spinnerMode: SpinnerMode
  wheelSize: number
  wheelRestaurants: RouletteRestaurant[]
}

export interface RouletteState extends RouletteFilters, RouletteUIState {
  eligibleRestaurants: RouletteRestaurant[]
}
