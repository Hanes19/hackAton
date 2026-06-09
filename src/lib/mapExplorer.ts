import type { MapShop } from '$lib/mapShop'
import type { GeoJsonObject } from 'geojson'

export const MAP_CATEGORIES = [
  'All',
  'Food',
  'Clothing',
  'Electronics',
  'Services',
  'Health & Beauty'
] as const

export type TravelMode = 'walking' | 'motorcycle' | 'car'
export type MapCategory = (typeof MAP_CATEGORIES)[number]

export interface UserLocation {
  lat: number
  lng: number
}

export interface RouteInfo {
  geometry: GeoJsonObject | null
  distance: number | null
  eta: number | null
}

interface OSRMResponse {
  routes: {
    geometry: GeoJsonObject
    distance: number
    duration: number
  }[]
}

export function filterShops(
  shops: MapShop[],
  search: string,
  selectedCategory: string
): MapShop[] {
  const query = search.toLowerCase()
  return shops.filter((shop) => {
    const matchSearch =
      shop.name.toLowerCase().includes(query) ||
      shop.category.toLowerCase().includes(query) ||
      (shop.products?.some((product) => product.name.toLowerCase().includes(query)) ?? false)
    const matchCategory = selectedCategory === 'All' || shop.category === selectedCategory
    return matchSearch && matchCategory
  })
}

export async function fetchMapShops(): Promise<MapShop[]> {
  const res = await fetch('/api/shops')
  return res.json()
}

export function osrmProfile(mode: TravelMode): string {
  if (mode === 'walking') return 'foot'
  if (mode === 'motorcycle') return 'bike'
  return 'driving'
}

export async function fetchRoute(
  userLocation: UserLocation,
  shop: MapShop,
  travelMode: TravelMode
): Promise<RouteInfo> {
  const profile = osrmProfile(travelMode)
  const url = `https://router.project-osrm.org/route/v1/${profile}/${userLocation.lng},${userLocation.lat};${shop.lng},${shop.lat}?geometries=geojson&overview=full`

  const data: OSRMResponse = await fetch(url).then((res) => res.json())
  if (!data.routes?.length) {
    return { geometry: null, distance: null, eta: null }
  }

  const route = data.routes[0]
  return {
    geometry: route.geometry,
    distance: route.distance / 1000,
    eta: Math.ceil(route.duration / 60)
  }
}

export interface GpsTracker {
  start: () => void
  stop: () => void
  isActive: () => boolean
}

export function createGpsTracker(handlers: {
  onLocation: (location: UserLocation) => void
  onLoading: (loading: boolean) => void
  onRecenter: () => void
  onActiveChange?: (active: boolean) => void
}): GpsTracker {
  let watchId: number | null = null
  let hasLocation = false

  function stop() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
      handlers.onActiveChange?.(false)
    }
  }

  return {
    isActive: () => watchId !== null,
    stop,
    start() {
      if (!navigator.geolocation) {
        alert('Geolocation not supported by this browser.')
        return
      }

      if (watchId !== null) {
        if (hasLocation) handlers.onRecenter()
        return
      }

      handlers.onLoading(true)

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          hasLocation = true
          handlers.onLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          handlers.onRecenter()
          handlers.onLoading(false)

          watchId = navigator.geolocation.watchPosition(
            (newPos) => {
              handlers.onLocation({
                lat: newPos.coords.latitude,
                lng: newPos.coords.longitude
              })
            },
            (err) => console.warn('Background watcher error:', err),
            { enableHighAccuracy: true, maximumAge: 5000 }
          )
          handlers.onActiveChange?.(true)
        },
        (err) => {
          console.error('GPS Error:', err)
          handlers.onLoading(false)
          if (err.code === err.PERMISSION_DENIED) {
            alert(
              'Location permission denied. Please check your browser settings AND your Windows privacy settings.'
            )
          } else {
            alert("Could not lock your location. Ensure your device's location services are turned on.")
          }
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: Infinity }
      )
    }
  }
}
