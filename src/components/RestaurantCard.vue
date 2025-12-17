<script setup>
import { computed } from 'vue'

const props = defineProps({
  restaurant: {
    type: Object,
    required: true
  },
  expanded: {
    type: Boolean,
    default: false
  },
  isSelected: {
    type: Boolean,
    default: false
  }
})

const rating = computed(() => {
  return props.restaurant.current_hazard_rating || props.restaurant.hazard_rating || 'Unknown'
})

const ratingClass = computed(() => {
  const classes = {
    'Low': 'bg-green-100 text-green-800',
    'Moderate': 'bg-amber-100 text-amber-800',
    'Unknown': 'bg-gray-100 text-gray-800'
  }
  return classes[rating.value] || classes['Unknown']
})

const dotClass = computed(() => {
  const classes = {
    'Low': 'bg-green-500',
    'Moderate': 'bg-amber-500',
    'Unknown': 'bg-gray-500'
  }
  return classes[rating.value] || classes['Unknown']
})

const hasLocation = computed(() => {
  return props.restaurant.latitude && props.restaurant.longitude
})

const latestInspection = computed(() => {
  return props.restaurant.inspections?.[0]
})

const totalViolations = computed(() => {
  return (props.restaurant.inspections || []).reduce((sum, insp) => {
    return sum + (insp.violations?.length || 0)
  }, 0)
})
</script>

<template>
  <div
    class="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
    :class="{ 'bg-blue-50': isSelected }"
  >
    <div class="flex items-start gap-2">
      <div class="flex-shrink-0 mt-1">
        <span class="w-2.5 h-2.5 rounded-full inline-block" :class="dotClass"></span>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-medium text-gray-900 truncate">{{ restaurant.name }}</h3>
          <span v-if="!hasLocation" class="text-xs text-gray-400" title="No map location">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
        </div>
        <p class="text-xs text-gray-500 truncate">{{ restaurant.address }}</p>
        <div class="flex items-center gap-2 mt-1">
          <span class="text-xs px-2 py-0.5 rounded" :class="ratingClass">{{ rating }}</span>
          <span class="text-xs text-gray-400">{{ restaurant.facility_type || 'Restaurant' }}</span>
        </div>

        <!-- Expanded details -->
        <div v-if="expanded" class="mt-3 pt-3 border-t border-gray-200 space-y-2">
          <div class="text-xs text-gray-600">
            <span class="font-medium">Full Address:</span>
            {{ restaurant.full_address || restaurant.address }}
          </div>

          <div class="text-xs text-gray-600">
            <span class="font-medium">Inspections:</span>
            {{ restaurant.inspections?.length || 0 }}
            <span class="text-gray-400 ml-2">|</span>
            <span class="ml-2 font-medium">Violations:</span>
            {{ totalViolations }}
          </div>

          <div v-if="latestInspection" class="text-xs">
            <div class="font-medium text-gray-700">Latest Inspection:</div>
            <div class="text-gray-600">
              {{ latestInspection.inspection_date || latestInspection.date }}
              - {{ latestInspection.inspection_type || latestInspection.type }}
            </div>
            <div v-if="latestInspection.critical_violations_count > 0" class="text-red-600">
              {{ latestInspection.critical_violations_count }} critical violation(s)
            </div>
          </div>

          <!-- Violation details if any -->
          <div v-if="latestInspection?.violations?.length" class="mt-2">
            <div class="text-xs font-medium text-gray-700 mb-1">Recent Violations:</div>
            <div class="space-y-1 max-h-32 overflow-y-auto">
              <div
                v-for="(violation, index) in latestInspection.violations.slice(0, 3)"
                :key="index"
                class="text-xs p-2 bg-red-50 rounded text-red-800"
              >
                <div class="font-medium">[{{ violation.code }}] {{ violation.description }}</div>
                <div class="text-red-600 mt-1">{{ violation.observation }}</div>
              </div>
              <div v-if="latestInspection.violations.length > 3" class="text-xs text-gray-500 italic">
                +{{ latestInspection.violations.length - 3 }} more violations
              </div>
            </div>
          </div>

          <a
            :href="restaurant.details_url"
            target="_blank"
            class="inline-flex items-center text-xs text-blue-600 hover:underline mt-2"
          >
            View on HealthSpace
            <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
