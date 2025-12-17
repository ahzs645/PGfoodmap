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
  }
})

const emit = defineEmits(['restaurant-click'])

const mapContainer = ref(null)
let map = null
let popup = null

// Prince George center coordinates
const CENTER = [-122.764593, 53.909784]
const ZOOM = 12

// Hazard rating colors
const HAZARD_COLORS = {
  'Low': '#22c55e',      // green
  'Moderate': '#f59e0b', // amber
  'Unknown': '#6b7280'   // gray
}

function getHazardColor(restaurant) {
  const rating = restaurant.current_hazard_rating || restaurant.hazard_rating || 'Unknown'
  return HAZARD_COLORS[rating] || HAZARD_COLORS['Unknown']
}

function createPopupContent(restaurant) {
  const rating = restaurant.current_hazard_rating || restaurant.hazard_rating || 'Unknown'
  const colorClass = rating === 'Low' ? 'bg-green-500' : rating === 'Moderate' ? 'bg-amber-500' : 'bg-gray-500'

  const latestInspection = restaurant.inspections?.[0]
  const inspectionInfo = latestInspection
    ? `<div class="mt-2 text-sm text-gray-600">
        <div class="font-medium">Latest Inspection: ${latestInspection.inspection_date || latestInspection.date}</div>
        <div>Type: ${latestInspection.inspection_type || latestInspection.type}</div>
        <div>Critical Violations: ${latestInspection.critical_violations_count || 0}</div>
      </div>`
    : ''

  return `
    <div class="p-4 max-w-xs">
      <div class="flex items-center gap-2 mb-2">
        <span class="w-3 h-3 rounded-full ${colorClass}"></span>
        <span class="font-semibold text-gray-900">${restaurant.name}</span>
      </div>
      <div class="text-sm text-gray-600">${restaurant.full_address || restaurant.address}</div>
      <div class="mt-2 flex items-center gap-2">
        <span class="text-xs px-2 py-1 rounded ${colorClass} text-white">${rating}</span>
        <span class="text-xs text-gray-500">${restaurant.facility_type || 'Restaurant'}</span>
      </div>
      ${inspectionInfo}
      <div class="mt-3">
        <a href="${restaurant.details_url}" target="_blank" class="text-blue-600 text-sm hover:underline">
          View on HealthSpace →
        </a>
      </div>
    </div>
  `
}

function updateSource() {
  if (!map || !map.getSource('restaurants')) return

  const geojson = {
    type: 'FeatureCollection',
    features: props.restaurants.map(r => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [r.longitude, r.latitude]
      },
      properties: {
        id: r.details_url,
        name: r.name,
        address: r.full_address || r.address,
        hazard_rating: r.current_hazard_rating || r.hazard_rating || 'Unknown',
        facility_type: r.facility_type || 'Unknown',
        color: getHazardColor(r)
      }
    }))
  }

  map.getSource('restaurants').setData(geojson)
}

function initMap() {
  map = new maplibregl.Map({
    container: mapContainer.value,
    style: 'https://tiles.openfreemap.org/styles/bright',
    center: CENTER,
    zoom: ZOOM
  })

  map.addControl(new maplibregl.NavigationControl(), 'top-right')

  map.on('load', () => {
    // Add restaurant source
    map.addSource('restaurants', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    })

    // Add circle layer for restaurants
    map.addLayer({
      id: 'restaurants-circle',
      type: 'circle',
      source: 'restaurants',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 6,
          14, 10,
          18, 16
        ],
        'circle-color': ['get', 'color'],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-opacity': 0.9
      }
    })

    // Click handler for restaurants
    map.on('click', 'restaurants-circle', (e) => {
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
    })

    // Change cursor on hover
    map.on('mouseenter', 'restaurants-circle', () => {
      map.getCanvas().style.cursor = 'pointer'
    })

    map.on('mouseleave', 'restaurants-circle', () => {
      map.getCanvas().style.cursor = ''
    })

    updateSource()
  })
}

function showPopup(restaurant, lngLat) {
  if (popup) {
    popup.remove()
  }

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
  if (map) {
    map.remove()
  }
})

defineExpose({
  flyToRestaurant
})
</script>

<template>
  <div ref="mapContainer" class="w-full h-full"></div>
</template>
