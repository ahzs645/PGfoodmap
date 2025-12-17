<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  restaurants: Array,
  winnerIndex: Number,
  isSpinning: Boolean,
  isDark: Boolean
})

const emit = defineEmits(['spin-complete'])

const rotation = ref(0)

// Truncate restaurant name for display
function truncateName(name, maxLength = 15) {
  if (name.length <= maxLength) return name
  return name.substring(0, maxLength - 2) + '...'
}

// Segment colors
const segmentColorValues = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#6366f1', // indigo
  '#06b6d4', // cyan
  '#14b8a6', // teal
  '#7c3aed', // violet
  '#d946ef', // fuchsia
  '#0ea5e9', // sky
  '#f43f5e'  // rose
]

// Helper function: polar to cartesian
function polarToCartesian(cx, cy, r, angle) {
  const rad = (angle - 90) * Math.PI / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  }
}

// Get SVG path for a segment
function getSegmentPath(index, total) {
  const cx = 50
  const cy = 50
  const r = 50
  const anglePerSegment = 360 / total
  const startAngle = index * anglePerSegment
  const endAngle = startAngle + anglePerSegment

  const start = polarToCartesian(cx, cy, r, startAngle)
  const end = polarToCartesian(cx, cy, r, endAngle)

  const largeArc = anglePerSegment > 180 ? 1 : 0

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    'Z'
  ].join(' ')
}

// Get text transform for segment label
function getTextTransform(index, total) {
  const cx = 50
  const cy = 50
  const r = 35 // Position text at 70% of radius
  const anglePerSegment = 360 / total
  const midAngle = index * anglePerSegment + anglePerSegment / 2

  const pos = polarToCartesian(cx, cy, r, midAngle)
  return `translate(${pos.x}, ${pos.y}) rotate(${midAngle + 90})`
}

// Get fill color for segment
function getSegmentFill(index) {
  return segmentColorValues[index % segmentColorValues.length]
}

// Watch for spinning to start
watch(() => props.isSpinning, (spinning) => {
  if (spinning && props.restaurants.length > 0 && props.winnerIndex !== null) {
    const total = props.restaurants.length
    const segmentAngle = 360 / total

    // Calculate angle to land on the winning segment
    // The pointer is at top (0°). Segment i's middle is at (i + 0.5) * segmentAngle
    // To make the pointer point to segment i, we rotate so that angle is at top
    // Add small random offset within the segment for natural feel (avoid exact center)
    const randomOffset = (Math.random() - 0.5) * segmentAngle * 0.6 // ±30% of segment
    const targetAngle = (props.winnerIndex + 0.5) * segmentAngle + randomOffset

    // Full rotations for effect (5-8 spins)
    const fullRotations = 5 + Math.floor(Math.random() * 3)

    // Final rotation: current + full spins + angle to land on winner
    // We subtract targetAngle because rotating clockwise brings higher angles to the pointer
    const finalRotation = rotation.value + (fullRotations * 360) + (360 - targetAngle)
    rotation.value = finalRotation

    // Emit completion after animation
    setTimeout(() => {
      emit('spin-complete')
    }, 4000)
  }
})
</script>

<template>
  <div class="relative w-72 h-72">
    <!-- No restaurants message -->
    <div
      v-if="restaurants.length === 0"
      class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full"
    >
      <div class="text-center p-4">
        <svg class="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-sm text-gray-500 dark:text-gray-400">No restaurants match your filters</p>
      </div>
    </div>

    <!-- Pointer arrow -->
    <div
      v-if="restaurants.length > 0"
      class="absolute -top-2 left-1/2 -translate-x-1/2 z-20"
    >
      <svg class="w-8 h-8 text-red-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L8 10h8L12 2z"/>
      </svg>
    </div>

    <!-- Wheel -->
    <div
      v-if="restaurants.length > 0"
      class="w-full h-full rounded-full overflow-hidden shadow-2xl border-4 border-gray-200 dark:border-gray-600"
      :style="{
        transform: `rotate(${rotation}deg)`,
        transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
      }"
    >
      <!-- SVG-based wheel for proper segment rendering -->
      <svg viewBox="0 0 100 100" class="w-full h-full">
        <!-- Background circle -->
        <circle cx="50" cy="50" r="50" class="fill-gray-200 dark:fill-gray-700" />

        <!-- Segments -->
        <g v-for="(restaurant, index) in restaurants" :key="restaurant.details_url || index">
          <path
            :d="getSegmentPath(index, restaurants.length)"
            :fill="getSegmentFill(index)"
            class="stroke-white dark:stroke-gray-800"
            stroke-width="0.5"
          />
          <!-- Text on segment -->
          <text
            :transform="getTextTransform(index, restaurants.length)"
            text-anchor="middle"
            class="fill-white text-[3px] font-semibold"
            style="text-shadow: 0 0.5px 1px rgba(0,0,0,0.5);"
          >
            {{ truncateName(restaurant.name, 12) }}
          </text>
        </g>

        <!-- Center circle -->
        <circle cx="50" cy="50" r="8" class="fill-white dark:fill-gray-800 stroke-gray-300 dark:stroke-gray-600" stroke-width="1" />
        <text x="50" y="51.5" text-anchor="middle" class="fill-gray-600 dark:fill-gray-300 text-[4px] font-bold">
          SPIN
        </text>
      </svg>
    </div>
  </div>
</template>

<style scoped>
/* Ensure smooth transitions */
.wheel-transition {
  transition: transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99);
}
</style>
