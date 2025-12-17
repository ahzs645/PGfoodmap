<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  restaurants: Array,
  eligibleRestaurants: Array,
  winnerIndex: Number,
  isSpinning: Boolean,
  isDark: Boolean
})

const emit = defineEmits(['spin-complete'])

// Visible cards in the slot (7 cards visible, center is selected)
const visibleCards = ref([])
const isAnimating = ref(false)
const showWinner = ref(false)

// Hazard rating colors
const hazardColors = {
  'Low': { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-500' },
  'Moderate': { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-500' },
  'Unknown': { bg: 'bg-gray-500', border: 'border-gray-500', text: 'text-gray-500' }
}

function getHazardRating(restaurant) {
  return restaurant.current_hazard_rating || restaurant.hazard_rating || 'Unknown'
}

function getHazardColors(restaurant) {
  const rating = getHazardRating(restaurant)
  return hazardColors[rating] || hazardColors['Unknown']
}

// Get difficulty indicator like the reference (!, !!, !!!, !?!)
function getDifficultyIndicator(restaurant) {
  const rating = getHazardRating(restaurant)
  switch (rating) {
    case 'Low': return '!'
    case 'Moderate': return '!!'
    case 'Unknown': return '!?'
    default: return '?'
  }
}

// Initialize with placeholder cards
function initializeCards() {
  if (props.eligibleRestaurants.length === 0) {
    visibleCards.value = []
    return
  }

  // Show 7 random cards
  const cards = []
  for (let i = 0; i < 7; i++) {
    const idx = Math.floor(Math.random() * props.eligibleRestaurants.length)
    cards.push({
      ...props.eligibleRestaurants[idx],
      id: `init-${i}-${Date.now()}`
    })
  }
  visibleCards.value = cards
  showWinner.value = false
}

// Watch for spinning
watch(() => props.isSpinning, async (spinning) => {
  if (spinning && props.eligibleRestaurants.length > 0 && props.winnerIndex !== null) {
    isAnimating.value = true
    showWinner.value = false

    // Generate 40-60 random cards to scroll through
    const scrollCount = 40 + Math.floor(Math.random() * 20)
    const winner = props.eligibleRestaurants[props.winnerIndex]

    // Animate cards with easing - start fast, slow down at end
    let baseDelay = 40
    for (let i = 0; i < scrollCount; i++) {
      const progress = i / scrollCount
      // Cubic ease out - slow down towards end
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const delay = baseDelay + (easeOut * 180)

      await new Promise(resolve => setTimeout(resolve, delay))

      // Pick random card or winner at the end
      let newCard
      if (i >= scrollCount - 4) {
        // Last 4 cards: position winner in center (index 3)
        const posFromEnd = scrollCount - 1 - i
        if (posFromEnd === 3) {
          newCard = { ...winner, id: `winner-${Date.now()}` }
        } else {
          const idx = Math.floor(Math.random() * props.eligibleRestaurants.length)
          newCard = { ...props.eligibleRestaurants[idx], id: `spin-${i}-${Date.now()}` }
        }
      } else {
        const idx = Math.floor(Math.random() * props.eligibleRestaurants.length)
        newCard = { ...props.eligibleRestaurants[idx], id: `spin-${i}-${Date.now()}` }
      }

      // Add new card at top, remove from bottom
      visibleCards.value = [newCard, ...visibleCards.value.slice(0, 6)]
    }

    // Mark animation complete
    await new Promise(resolve => setTimeout(resolve, 300))
    isAnimating.value = false
    showWinner.value = true
    emit('spin-complete')
  }
})

// Initialize on mount and when restaurants change
onMounted(initializeCards)
watch(() => props.eligibleRestaurants, initializeCards, { deep: true })
</script>

<template>
  <div class="relative w-full max-w-md">
    <!-- No restaurants message -->
    <div
      v-if="eligibleRestaurants.length === 0"
      class="h-80 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-xl"
    >
      <div class="text-center p-4">
        <svg class="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-sm text-gray-500 dark:text-gray-400">No restaurants match your filters</p>
      </div>
    </div>

    <!-- Slot machine container -->
    <div v-else class="relative h-96 overflow-hidden">
      <!-- Gradient overlays for depth effect -->
      <div class="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white dark:from-gray-800 via-white/80 dark:via-gray-800/80 to-transparent z-20 pointer-events-none"></div>
      <div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white dark:from-gray-800 via-white/80 dark:via-gray-800/80 to-transparent z-20 pointer-events-none"></div>

      <!-- Cards stack -->
      <div class="absolute inset-0 flex flex-col items-center justify-center gap-1 py-4">
        <div
          v-for="(card, index) in visibleCards"
          :key="card.id"
          class="slot-card w-full max-w-sm px-4 py-3 rounded-xl border-2 transition-all duration-150"
          :class="[
            // Center card (index 3) is the selected one
            index === 3
              ? showWinner
                ? 'scale-100 opacity-100 bg-white dark:bg-gray-700 border-purple-500 shadow-lg shadow-purple-500/20 z-10'
                : 'scale-100 opacity-100 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 shadow-lg z-10'
              : index === 2 || index === 4
                ? 'scale-95 opacity-70 bg-white/80 dark:bg-gray-700/80 border-transparent'
                : index === 1 || index === 5
                  ? 'scale-90 opacity-50 bg-white/60 dark:bg-gray-700/60 border-transparent'
                  : 'scale-85 opacity-30 bg-white/40 dark:bg-gray-700/40 border-transparent'
          ]"
        >
          <div class="flex items-center gap-3">
            <!-- Difficulty indicator (like reference) -->
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0"
              :class="getHazardColors(card).bg"
            >
              {{ getDifficultyIndicator(card) }}
            </div>

            <!-- Restaurant info -->
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-gray-900 dark:text-white text-sm truncate">
                {{ card.name }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ card.address }}
              </div>
            </div>

            <!-- Violation count badge -->
            <div
              v-if="card.rouletteViolationCount !== undefined"
              class="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 shrink-0"
            >
              {{ card.rouletteViolationCount }} violations
            </div>
          </div>
        </div>
      </div>

      <!-- Winner highlight effect -->
      <div
        v-if="showWinner"
        class="absolute inset-x-4 top-1/2 -translate-y-1/2 h-[72px] rounded-xl pointer-events-none z-30"
      >
        <div class="absolute inset-0 border-2 border-purple-500 rounded-xl animate-pulse"></div>
        <div class="absolute -left-1 top-1/2 -translate-y-1/2">
          <div class="w-3 h-8 bg-purple-500 rounded-r-full"></div>
        </div>
        <div class="absolute -right-1 top-1/2 -translate-y-1/2">
          <div class="w-3 h-8 bg-purple-500 rounded-l-full"></div>
        </div>
      </div>
    </div>

    <!-- Winner info panel (shows below spinner instead of popup) -->
    <div
      v-if="showWinner && eligibleRestaurants[winnerIndex]"
      class="mt-4 p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white"
    >
      <div class="flex items-center gap-2 mb-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span class="font-bold">Winner!</span>
      </div>
      <div class="text-lg font-semibold">{{ eligibleRestaurants[winnerIndex].name }}</div>
      <div class="text-purple-100 text-sm">{{ eligibleRestaurants[winnerIndex].full_address || eligibleRestaurants[winnerIndex].address }}</div>
    </div>
  </div>
</template>

<style scoped>
.slot-card {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.scale-85 {
  transform: scale(0.85);
}
</style>
