import { ref } from 'vue'

export function useGeolocation() {
  const position = ref(null) // { lat, lng }
  const error = ref(null)
  const loading = ref(false)
  const status = ref('idle') // 'idle' | 'loading' | 'success' | 'denied' | 'unavailable' | 'timeout' | 'unsupported'

  function getErrorMessage(err) {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        return 'Location permission denied. Please enable location access in your browser settings.'
      case err.POSITION_UNAVAILABLE:
        return 'Location information unavailable.'
      case err.TIMEOUT:
        return 'Location request timed out. Please try again.'
      default:
        return 'An error occurred while getting your location.'
    }
  }

  function getErrorStatus(err) {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        return 'denied'
      case err.POSITION_UNAVAILABLE:
        return 'unavailable'
      case err.TIMEOUT:
        return 'timeout'
      default:
        return 'unavailable'
    }
  }

  async function getCurrentPosition() {
    if (!navigator.geolocation) {
      error.value = 'Geolocation is not supported by your browser.'
      status.value = 'unsupported'
      return null
    }

    loading.value = true
    error.value = null
    status.value = 'loading'

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          position.value = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          }
          loading.value = false
          status.value = 'success'
          error.value = null
          resolve(position.value)
        },
        (err) => {
          error.value = getErrorMessage(err)
          status.value = getErrorStatus(err)
          loading.value = false
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // Cache for 5 minutes
        }
      )
    })
  }

  function clearPosition() {
    position.value = null
    error.value = null
    status.value = 'idle'
  }

  return {
    position,
    error,
    loading,
    status,
    getCurrentPosition,
    clearPosition
  }
}
