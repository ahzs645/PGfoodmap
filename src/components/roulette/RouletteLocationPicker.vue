<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import * as turf from '@turf/turf'

const props = defineProps({
  sourceLocation: Object,
  maxDistance: Number,
  isDark: Boolean
})

const emit = defineEmits(['location-selected'])

const mapContainer = ref(null)
let map = null
let marker = null

// Prince George center coordinates
const CENTER = [-122.764593, 53.909784]
const ZOOM = 11

// Map styles
const LIGHT_STYLE = 'https://tiles.openfreemap.org/styles/bright'
const DARK_STYLE = 'https://tiles.openfreemap.org/styles/dark'

function initMap() {
  if (!mapContainer.value) return

  map = new maplibregl.Map({
    container: mapContainer.value,
    style: props.isDark ? DARK_STYLE : LIGHT_STYLE,
    center: props.sourceLocation
      ? [props.sourceLocation.lng, props.sourceLocation.lat]
      : CENTER,
    zoom: props.sourceLocation ? 12 : ZOOM
  })

  // Click handler for setting location
  map.on('click', (e) => {
    emit('location-selected', {
      lat: e.lngLat.lat,
      lng: e.lngLat.lng
    })
  })

  map.on('load', () => {
    // Add circle source and layer for radius visualization
    map.addSource('radius-circle', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    })

    map.addLayer({
      id: 'radius-circle-fill',
      type: 'fill',
      source: 'radius-circle',
      paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.15
      }
    })

    map.addLayer({
      id: 'radius-circle-stroke',
      type: 'line',
      source: 'radius-circle',
      paint: {
        'line-color': '#3b82f6',
        'line-width': 2,
        'line-opacity': 0.6
      }
    })

    // Update marker and circle if location exists
    if (props.sourceLocation) {
      updateMarkerAndCircle()
    }
  })
}

function updateMarkerAndCircle() {
  if (!map || !map.isStyleLoaded()) return

  // Update or create marker
  if (props.sourceLocation) {
    if (marker) {
      marker.setLngLat([props.sourceLocation.lng, props.sourceLocation.lat])
    } else {
      marker = new maplibregl.Marker({ color: '#ef4444' })
        .setLngLat([props.sourceLocation.lng, props.sourceLocation.lat])
        .addTo(map)
    }

    // Update radius circle
    const circleGeoJSON = turf.circle(
      [props.sourceLocation.lng, props.sourceLocation.lat],
      props.maxDistance,
      { units: 'kilometers', steps: 64 }
    )

    const source = map.getSource('radius-circle')
    if (source) {
      source.setData(circleGeoJSON)
    }

    // Fit bounds to circle
    const bounds = turf.bbox(circleGeoJSON)
    map.fitBounds(bounds, { padding: 20, maxZoom: 14 })
  } else {
    // Remove marker and clear circle
    if (marker) {
      marker.remove()
      marker = null
    }

    const source = map.getSource('radius-circle')
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: []
      })
    }

    // Reset view
    map.flyTo({ center: CENTER, zoom: ZOOM })
  }
}

// Watch for style changes (dark mode)
watch(() => props.isDark, (isDark) => {
  if (map) {
    map.setStyle(isDark ? DARK_STYLE : LIGHT_STYLE)

    // Re-add sources and layers after style change
    map.once('styledata', () => {
      if (!map.getSource('radius-circle')) {
        map.addSource('radius-circle', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        })

        map.addLayer({
          id: 'radius-circle-fill',
          type: 'fill',
          source: 'radius-circle',
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.15
          }
        })

        map.addLayer({
          id: 'radius-circle-stroke',
          type: 'line',
          source: 'radius-circle',
          paint: {
            'line-color': '#3b82f6',
            'line-width': 2,
            'line-opacity': 0.6
          }
        })
      }
      updateMarkerAndCircle()
    })
  }
})

// Watch for location and distance changes
watch([() => props.sourceLocation, () => props.maxDistance], () => {
  updateMarkerAndCircle()
}, { deep: true })

onMounted(initMap)

onUnmounted(() => {
  if (marker) marker.remove()
  if (map) map.remove()
})
</script>

<template>
  <div
    ref="mapContainer"
    class="w-full h-40 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 cursor-crosshair"
  ></div>
</template>
