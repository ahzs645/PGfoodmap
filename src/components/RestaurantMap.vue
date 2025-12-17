<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = defineProps({
  restaurants: {
    type: Array,
    default: () => []
  },
  selectedRestaurant: {
    type: Object,
    default: null
  },
  timelineMonths: {
    type: Number,
    default: 12
  },
  visualizationMode: {
    type: String,
    default: 'violations'
  },
  isDark: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['restaurant-click'])

const mapContainer = ref(null)
let map = null
let popup = null
let hoverPopup = null
let hoveredFeatureId = null

// Prince George center coordinates
const CENTER = [-122.764593, 53.909784]
const ZOOM = 12

// Map styles
const LIGHT_STYLE = 'https://tiles.openfreemap.org/styles/bright'
const DARK_STYLE = 'https://tiles.openfreemap.org/styles/dark'

// Hazard rating colors
const HAZARD_COLORS = {
  'Low': '#22c55e',
  'Moderate': '#f59e0b',
  'Unknown': '#6b7280'
}

// Get color based on violation count
function getViolationColor(violationCount) {
  if (violationCount === 0) return '#22c55e'
  if (violationCount <= 3) return '#eab308'
  if (violationCount <= 6) return '#f97316'
  return '#ef4444'
}

// Get color based on hazard rating
function getHazardColor(rating) {
  return HAZARD_COLORS[rating] || HAZARD_COLORS['Unknown']
}

// Get radius based on violation count (for violations mode)
function getRadius(violationCount, mode) {
  if (mode === 'hazard') return 10
  const baseRadius = 8
  const maxRadius = 20
  const scale = Math.min(violationCount / 10, 1)
  return baseRadius + (maxRadius - baseRadius) * scale
}

function getMarkerColor(restaurant) {
  if (props.visualizationMode === 'violations') {
    const stats = restaurant.violationStats || { total: 0 }
    return getViolationColor(stats.total)
  } else {
    // Use hazardRatingAtDate for timeline-based hazard visualization
    const rating = restaurant.hazardRatingAtDate || restaurant.current_hazard_rating || restaurant.hazard_rating || 'Unknown'
    return getHazardColor(rating)
  }
}

function createHoverContent(properties) {
  const rating = properties.hazard_rating || 'Unknown'
  const violationCount = properties.violation_count || 0

  const hazardColorClass = rating === 'Low' ? 'bg-green-500'
    : rating === 'Moderate' ? 'bg-amber-500'
    : 'bg-gray-500'

  const violationColorClass = violationCount === 0 ? 'bg-green-500'
    : violationCount <= 3 ? 'bg-yellow-500'
    : violationCount <= 6 ? 'bg-orange-500'
    : 'bg-red-500'

  return `
    <div class="p-2 max-w-xs">
      <div class="font-semibold text-gray-900 text-sm mb-1">${properties.name}</div>
      <div class="text-xs text-gray-600 mb-2">${properties.address}</div>
      <div class="flex items-center gap-1">
        <span class="text-xs px-1.5 py-0.5 rounded ${hazardColorClass} text-white">
          ${rating}
        </span>
        <span class="text-xs px-1.5 py-0.5 rounded ${violationColorClass} text-white">
          ${violationCount} violation${violationCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  `
}

function createPopupContent(restaurant) {
  const rating = restaurant.current_hazard_rating || restaurant.hazard_rating || 'Unknown'
  const stats = restaurant.violationStats || { total: 0, critical: 0, inspectionCount: 0 }

  const hazardColorClass = rating === 'Low' ? 'bg-green-500'
    : rating === 'Moderate' ? 'bg-amber-500'
    : 'bg-gray-500'

  const violationColorClass = stats.total === 0 ? 'bg-green-500'
    : stats.total <= 3 ? 'bg-yellow-500'
    : stats.total <= 6 ? 'bg-orange-500'
    : 'bg-red-500'

  const latestInspection = restaurant.filteredInspections?.[0] || restaurant.inspections?.[0]
  const inspectionInfo = latestInspection
    ? `<div class="mt-2 text-sm text-gray-600">
        <div class="font-medium">Latest: ${latestInspection.inspection_date || latestInspection.date}</div>
        <div>${latestInspection.inspection_type || latestInspection.type}</div>
      </div>`
    : ''

  return `
    <div class="p-4 max-w-xs">
      <div class="font-semibold text-gray-900 mb-1">${restaurant.name}</div>
      <div class="text-sm text-gray-600 mb-2">${restaurant.full_address || restaurant.address}</div>

      <div class="flex items-center gap-2 mb-2">
        <span class="text-xs px-2 py-1 rounded ${hazardColorClass} text-white">
          ${rating}
        </span>
        <span class="text-xs px-2 py-1 rounded ${violationColorClass} text-white">
          ${stats.total} violation${stats.total !== 1 ? 's' : ''}
        </span>
      </div>

      <div class="text-xs text-gray-500 mb-2">
        ${stats.inspectionCount} inspection${stats.inspectionCount !== 1 ? 's' : ''} |
        ${stats.critical} critical
      </div>

      ${inspectionInfo}
    </div>
  `
}

function updateSource() {
  if (!map || !map.getSource('restaurants')) return

  // Filter out restaurants with null/undefined coordinates
  const validRestaurants = props.restaurants.filter(
    r => r.latitude != null && r.longitude != null
  )

  const geojson = {
    type: 'FeatureCollection',
    features: validRestaurants.map(r => {
      const stats = r.violationStats || { total: 0, critical: 0 }
      const rating = r.current_hazard_rating || r.hazard_rating || 'Unknown'
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [r.longitude, r.latitude]
        },
        properties: {
          id: r.details_url,
          name: r.name,
          address: r.full_address || r.address,
          hazard_rating: rating,
          facility_type: r.facility_type || 'Unknown',
          violation_count: stats.total,
          critical_count: stats.critical,
          color: getMarkerColor(r),
          radius: getRadius(stats.total, props.visualizationMode)
        }
      }
    })
  }

  map.getSource('restaurants').setData(geojson)
}

function addLayers() {
  if (!map.getSource('restaurants')) {
    map.addSource('restaurants', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    })
  }

  // Remove existing layers if they exist
  const layerIds = ['restaurants-glow', 'restaurants-circle']
  layerIds.forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id)
  })

  // Add glow layer for high-violation restaurants (only in violations mode)
  if (props.visualizationMode === 'violations') {
    map.addLayer({
      id: 'restaurants-glow',
      type: 'circle',
      source: 'restaurants',
      filter: ['>', ['get', 'violation_count'], 3],
      paint: {
        'circle-radius': ['+', ['get', 'radius'], 6],
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.3,
        'circle-blur': 1
      }
    })
  }

  // Add circle layer
  map.addLayer({
    id: 'restaurants-circle',
    type: 'circle',
    source: 'restaurants',
    paint: {
      'circle-radius': ['get', 'radius'],
      'circle-color': ['get', 'color'],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
      'circle-opacity': 0.9
    }
  })


  // Add click handler
  map.on('click', 'restaurants-circle', handleMapClick)

  // Add hover handlers for quick preview
  map.on('mouseenter', 'restaurants-circle', (e) => {
    map.getCanvas().style.cursor = 'pointer'

    if (e.features.length > 0) {
      const feature = e.features[0]
      hoveredFeatureId = feature.properties.id

      // Remove existing hover popup if any
      if (hoverPopup) hoverPopup.remove()

      // Create hover popup
      hoverPopup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        maxWidth: '250px',
        offset: 15,
        className: 'hover-popup'
      })
        .setLngLat(e.lngLat)
        .setHTML(createHoverContent(feature.properties))
        .addTo(map)
    }
  })

  map.on('mousemove', 'restaurants-circle', (e) => {
    if (e.features.length > 0 && hoverPopup) {
      hoverPopup.setLngLat(e.lngLat)
    }
  })

  map.on('mouseleave', 'restaurants-circle', () => {
    map.getCanvas().style.cursor = ''
    hoveredFeatureId = null

    // Remove hover popup
    if (hoverPopup) {
      hoverPopup.remove()
      hoverPopup = null
    }
  })
}

function handleMapClick(e) {
  // Remove hover popup when clicking
  if (hoverPopup) {
    hoverPopup.remove()
    hoverPopup = null
  }

  if (e.features.length > 0) {
    const feature = e.features[0]
    const restaurant = props.restaurants.find(
      r => r.details_url === feature.properties.id
    )
    if (restaurant) {
      emit('restaurant-click', restaurant)
      showPopup(restaurant, e.lngLat)
    }
  }
}

function initMap() {
  map = new maplibregl.Map({
    container: mapContainer.value,
    style: props.isDark ? DARK_STYLE : LIGHT_STYLE,
    center: CENTER,
    zoom: ZOOM
  })

  map.addControl(new maplibregl.NavigationControl(), 'top-right')

  map.on('load', () => {
    addLayers()
    updateSource()
  })
}

function showPopup(restaurant, lngLat) {
  if (popup) popup.remove()

  popup = new maplibregl.Popup({
    closeButton: true,
    closeOnClick: true,
    maxWidth: '300px'
  })
    .setLngLat(lngLat || [restaurant.longitude, restaurant.latitude])
    .setHTML(createPopupContent(restaurant))
    .addTo(map)
}

function flyToRestaurant(restaurant) {
  if (!map || !restaurant.latitude || !restaurant.longitude) return

  map.flyTo({
    center: [restaurant.longitude, restaurant.latitude],
    zoom: 16,
    duration: 1000
  })

  showPopup(restaurant)
}

// Watch for dark mode changes
watch(() => props.isDark, (isDark) => {
  if (!map) return

  const center = map.getCenter()
  const zoom = map.getZoom()
  const bearing = map.getBearing()
  const pitch = map.getPitch()

  map.setStyle(isDark ? DARK_STYLE : LIGHT_STYLE)

  // Use 'idle' event which fires after style is fully loaded and rendered
  map.once('idle', () => {
    map.setCenter(center)
    map.setZoom(zoom)
    map.setBearing(bearing)
    map.setPitch(pitch)
    addLayers()
    updateSource()
  })
})

// Watch for visualization mode changes
watch(() => props.visualizationMode, () => {
  if (!map || !map.isStyleLoaded()) return
  addLayers()
  updateSource()
})

watch(() => props.restaurants, () => {
  updateSource()
}, { deep: true })

watch(() => props.selectedRestaurant, (newVal) => {
  if (newVal && newVal.latitude && newVal.longitude) {
    flyToRestaurant(newVal)
  }
})

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (hoverPopup) hoverPopup.remove()
  if (popup) popup.remove()
  if (map) map.remove()
})

defineExpose({ flyToRestaurant })
</script>

<template>
  <div ref="mapContainer" class="w-full h-full"></div>
</template>
