<script setup>
import { computed } from 'vue'

const props = defineProps({
  restaurant: {
    type: Object,
    required: true
  },
  isDark: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const inspections = computed(() => {
  return props.restaurant.inspections || []
})

const totalViolations = computed(() => {
  return inspections.value.reduce((sum, insp) => {
    return sum + (insp.violations?.length || 0)
  }, 0)
})

const totalCritical = computed(() => {
  return inspections.value.reduce((sum, insp) => {
    return sum + (insp.critical_violations_count || 0)
  }, 0)
})

function getInspectionTypeColor(type) {
  const t = (type || '').toLowerCase()
  if (t.includes('routine')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
  if (t.includes('follow')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
  if (t.includes('complaint')) return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
  if (t.includes('initial')) return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
}

function getHazardColor(rating) {
  if (rating === 'Low') return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
  if (rating === 'Moderate') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
}
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="p-6 border-b border-gray-200 dark:border-gray-700 bg-blue-600 dark:bg-gray-700 rounded-t-xl">
        <div class="flex items-start justify-between">
          <div class="text-white">
            <h2 class="text-xl font-bold">{{ restaurant.name }}</h2>
            <p class="text-blue-100 dark:text-gray-400 text-sm mt-1">{{ restaurant.full_address || restaurant.address }}</p>
          </div>
          <button
            @click="emit('close')"
            class="text-white hover:bg-blue-700 dark:hover:bg-gray-600 rounded-lg p-2 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Summary stats -->
        <div class="flex gap-6 mt-4">
          <div>
            <div class="text-2xl font-bold text-white">{{ inspections.length }}</div>
            <div class="text-xs text-blue-200 dark:text-gray-400">Inspections</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-white">{{ totalViolations }}</div>
            <div class="text-xs text-blue-200 dark:text-gray-400">Total Violations</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-red-300 dark:text-red-400">{{ totalCritical }}</div>
            <div class="text-xs text-blue-200 dark:text-gray-400">Critical</div>
          </div>
          <div>
            <div class="text-sm font-medium px-3 py-1 rounded-full"
                 :class="getHazardColor(restaurant.current_hazard_rating || restaurant.hazard_rating)">
              {{ restaurant.current_hazard_rating || restaurant.hazard_rating || 'Unknown' }}
            </div>
            <div class="text-xs text-blue-200 dark:text-gray-400 mt-1">Current Rating</div>
          </div>
        </div>
      </div>

      <!-- Inspection list -->
      <div class="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
        <div v-if="inspections.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-8">
          No inspection records available
        </div>

        <div v-else class="space-y-6">
          <div
            v-for="(inspection, index) in inspections"
            :key="index"
            class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800"
          >
            <!-- Inspection header -->
            <div class="bg-gray-50 dark:bg-gray-700 p-4 flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-3">
                <span class="text-sm font-medium px-3 py-1 rounded-full"
                      :class="getInspectionTypeColor(inspection.inspection_type || inspection.type)">
                  {{ inspection.inspection_type || inspection.type }}
                </span>
                <span class="text-sm text-gray-600 dark:text-gray-300">
                  {{ inspection.inspection_date || inspection.date }}
                </span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm px-2 py-1 rounded"
                      :class="getHazardColor(inspection.hazard_rating)">
                  {{ inspection.hazard_rating }}
                </span>
                <span v-if="inspection.follow_up_required === 'Yes'"
                      class="text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 font-medium">
                  Follow-up Required
                </span>
              </div>
            </div>

            <!-- Violation summary -->
            <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-4 text-sm">
              <span class="text-gray-600 dark:text-gray-300">
                <span class="font-medium text-red-600 dark:text-red-400">{{ inspection.critical_violations_count || 0 }}</span>
                critical
              </span>
              <span class="text-gray-400 dark:text-gray-500">|</span>
              <span class="text-gray-600 dark:text-gray-300">
                <span class="font-medium text-amber-600 dark:text-amber-400">{{ inspection.non_critical_violations_count || 0 }}</span>
                non-critical
              </span>
              <span class="text-gray-400 dark:text-gray-500">|</span>
              <span class="text-gray-600 dark:text-gray-300">
                <span class="font-medium">{{ inspection.violations?.length || 0 }}</span>
                total violations
              </span>
            </div>

            <!-- Violations list -->
            <div v-if="inspection.violations?.length" class="p-4 space-y-3">
              <div
                v-for="(violation, vIndex) in inspection.violations"
                :key="vIndex"
                class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-xs font-mono px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {{ violation.code }}
                      </span>
                      <span v-if="violation.corrected_during_inspection"
                            class="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                        Corrected
                      </span>
                    </div>
                    <div class="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                      {{ violation.description }}
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      <span class="font-medium">Observation:</span>
                      {{ violation.observation }}
                    </div>
                    <div v-if="violation.corrective_action" class="text-sm text-gray-600 dark:text-gray-300">
                      <span class="font-medium">Corrective Action:</span>
                      {{ violation.corrective_action }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="p-4 text-sm text-gray-500 dark:text-gray-400 italic">
              No violations recorded for this inspection
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-xl flex items-center justify-between">
        <div class="text-xs text-gray-500 dark:text-gray-400">
          Data from Northern Health Authority HealthSpace
        </div>
        <div class="flex gap-3">
          <a
            :href="restaurant.details_url"
            target="_blank"
            class="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
          >
            View on HealthSpace
          </a>
          <button
            @click="emit('close')"
            class="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
