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
  },
  visualizationMode: {
    type: String,
    default: 'violations'
  }
})

const rating = computed(() => {
  return props.restaurant.current_hazard_rating || props.restaurant.hazard_rating || 'Unknown'
})

const ratingClass = computed(() => {
  const classes = {
    'Low': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'Moderate': 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    'Unknown': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
  return classes[rating.value] || classes['Unknown']
})

const violationStats = computed(() => {
  return props.restaurant.violationStats || { total: 0, critical: 0, inspectionCount: 0 }
})

const dotColorClass = computed(() => {
  if (props.visualizationMode === 'violations') {
    const total = violationStats.value.total
    if (total === 0) return 'bg-green-500'
    if (total <= 3) return 'bg-yellow-500'
    if (total <= 6) return 'bg-orange-500'
    return 'bg-red-500'
  } else {
    const classes = {
      'Low': 'bg-green-500',
      'Moderate': 'bg-amber-500',
      'Unknown': 'bg-gray-500'
    }
    return classes[rating.value] || classes['Unknown']
  }
})

const violationBadgeClass = computed(() => {
  const total = violationStats.value.total
  if (total === 0) return 'bg-green-500'
  if (total <= 3) return 'bg-yellow-500'
  if (total <= 6) return 'bg-orange-500'
  return 'bg-red-500'
})

const hasLocation = computed(() => {
  return props.restaurant.latitude && props.restaurant.longitude
})

const latestInspection = computed(() => {
  return props.restaurant.filteredInspections?.[0] || props.restaurant.inspections?.[0]
})
</script>

<template>
  <div
    class="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
    :class="{ 'bg-blue-50 dark:bg-blue-900/30': isSelected }"
  >
    <div class="flex items-start gap-2">
      <div class="flex-shrink-0 mt-1">
        <span class="w-3 h-3 rounded-full inline-block" :class="dotColorClass"></span>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ restaurant.name }}</h3>
          <span v-if="!hasLocation" class="text-xs text-gray-400 dark:text-gray-500" title="No map location">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ restaurant.address }}</p>

        <!-- Stats row -->
        <div class="flex items-center gap-2 mt-1.5 flex-wrap">
          <span class="text-xs px-2 py-0.5 rounded" :class="ratingClass">{{ rating }}</span>
          <span class="text-xs px-2 py-0.5 rounded text-white" :class="violationBadgeClass">
            {{ violationStats.total }} violation{{ violationStats.total !== 1 ? 's' : '' }}
          </span>
          <span v-if="violationStats.critical > 0" class="text-xs text-red-600 dark:text-red-400 font-medium">
            {{ violationStats.critical }} critical
          </span>
        </div>

        <div class="flex items-center gap-2 mt-1">
          <span class="text-xs text-gray-400 dark:text-gray-500">{{ restaurant.facility_type || 'Restaurant' }}</span>
          <span class="text-xs text-gray-400 dark:text-gray-500">{{ violationStats.inspectionCount }} insp.</span>
        </div>

        <!-- Expanded details -->
        <div v-if="expanded" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
          <div class="text-xs text-gray-600 dark:text-gray-300">
            <span class="font-medium">Full Address:</span>
            {{ restaurant.full_address || restaurant.address }}
          </div>

          <div v-if="latestInspection" class="text-xs">
            <div class="font-medium text-gray-700 dark:text-gray-200">Latest Inspection:</div>
            <div class="text-gray-600 dark:text-gray-300">
              {{ latestInspection.inspection_date || latestInspection.date }}
              - {{ latestInspection.inspection_type || latestInspection.type }}
            </div>
            <div v-if="latestInspection.critical_violations_count > 0" class="text-red-600 dark:text-red-400">
              {{ latestInspection.critical_violations_count }} critical violation(s)
            </div>
            <div v-if="latestInspection.follow_up_required === 'Yes'" class="text-orange-600 dark:text-orange-400 font-medium">
              Follow-up Required
            </div>
          </div>

          <!-- Recent violations preview -->
          <div v-if="latestInspection?.violations?.length" class="mt-2">
            <div class="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Recent Violations:</div>
            <div class="space-y-1 max-h-32 overflow-y-auto">
              <div
                v-for="(violation, index) in latestInspection.violations.slice(0, 2)"
                :key="index"
                class="text-xs p-2 bg-red-50 dark:bg-red-900/30 rounded text-red-800 dark:text-red-200 border border-red-100 dark:border-red-800"
              >
                <div class="font-medium">[{{ violation.code }}] {{ violation.description }}</div>
              </div>
              <div v-if="latestInspection.violations.length > 2" class="text-xs text-gray-500 dark:text-gray-400 italic">
                +{{ latestInspection.violations.length - 2 }} more violations
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
