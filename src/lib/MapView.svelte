<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { Map, Marker, GeoJSON } from 'leaflet'
  import type { GeoJsonObject } from 'geojson'
  import { hasFlashDeal } from '$lib/mapShop'
  import {
    MAP_TILE_URL,
    MAP_TILE_ATTRIBUTION,
    MAP_COLORS,
    shopPinHtml,
    shopPopupHtml
  } from '$lib/mapTheme'

  interface Shop {
    id: string
    name: string
    category: string
    lat: number
    lng: number
  }

  let {
    shops = [],
    selectedShopId = null,
    userLocation = null,
    routeGeometry = null,
    isNavigating = false,
    recenterTrigger = 0,
    onSelectShop = undefined
  }: {
    shops: Shop[]
    selectedShopId?: string | null
    userLocation: { lat: number; lng: number } | null
    routeGeometry: GeoJsonObject | null
    isNavigating?: boolean
    recenterTrigger?: number
    onSelectShop?: (id: string) => void
  } = $props()

  let mapEl: HTMLDivElement
  let map = $state<Map | undefined>(undefined)
  let L = $state<typeof import('leaflet') | undefined>(undefined)
  let markers: Record<string, Marker> = {}
  let userMarker: Marker | null = null
  let routeLayer: GeoJSON | null = null
  let lastTrigger = 0

  function addMarkers() {
    if (!map || !L) return
    Object.values(markers).forEach((m) => m.remove())
    markers = {}

    if (shops.length === 0) return

    const bounds = L!.latLngBounds([])

    shops.forEach((shop) => {
      const icon = L!.divIcon({
        className: 'budol-marker-wrap',
        html: shopPinHtml(),
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -36]
      })

      const m = L!.marker([shop.lat, shop.lng], { icon })
        .addTo(map!)
        .on('click', () => onSelectShop?.(shop.id))
        .bindPopup(
          shopPopupHtml({
            id: shop.id,
            name: shop.name,
            category: shop.category,
            flashDeal: hasFlashDeal(shop.id)
          }),
          { className: 'budol-leaflet-popup', maxWidth: 240 }
        )

      markers[shop.id] = m
      bounds.extend([shop.lat, shop.lng])
    })

    if (!selectedShopId && !isNavigating) {
      map!.flyToBounds(bounds, { padding: [50, 50], animate: true, duration: 1.2 })
    }
  }

  $effect(() => {
    void shops
    addMarkers()
  })

  $effect(() => {
    if (map && L && userLocation) {
      if (userMarker) userMarker.remove()

      const userIcon = L.divIcon({
        className: 'user-gps-marker',
        html: `<div class="gps-dot"></div><div class="gps-pulse"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
      userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000
      }).addTo(map)

      if (isNavigating) {
        map.flyTo([userLocation.lat, userLocation.lng], 18, { animate: true, duration: 0.5 })
      }
    }
  })

  $effect(() => {
    if (map && userLocation && recenterTrigger > lastTrigger) {
      map.flyTo([userLocation.lat, userLocation.lng], 18, { animate: true, duration: 1.2 })
      lastTrigger = recenterTrigger
    }
  })

  $effect(() => {
    if (map && L) {
      if (routeLayer) routeLayer.remove()

      if (routeGeometry) {
        routeLayer = L.geoJSON(routeGeometry, {
          style: {
            color: MAP_COLORS.budolOrange,
            weight: 5,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round'
          }
        }).addTo(map)

        if (!isNavigating && recenterTrigger === lastTrigger) {
          map.fitBounds(routeLayer.getBounds(), { padding: [50, 50], animate: true, duration: 1 })
        }
      } else if (selectedShopId && markers[selectedShopId] && !isNavigating) {
        const shop = shops.find((s) => s.id === selectedShopId)
        if (shop) {
          const zoomLevel = 16
          const targetLatLng = L!.latLng(shop.lat, shop.lng)
          const targetPoint = map!.project(targetLatLng, zoomLevel)
          targetPoint.y -= 160
          const offsetLatLng = map!.unproject(targetPoint, zoomLevel)

          map!.flyTo(offsetLatLng, zoomLevel, { animate: true, duration: 1.2 })
          markers[selectedShopId].openPopup()
        }
      }
    }
  })

  onMount(async () => {
    L = await import('leaflet')
    await import('leaflet/dist/leaflet.css')
    map = L.map(mapEl, { zoomControl: false }).setView([8.0167, 125.0333], 9)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.tileLayer(MAP_TILE_URL, { attribution: MAP_TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map)
    addMarkers()
  })

  onDestroy(() => {
    if (map) map.remove()
  })
</script>

<div bind:this={mapEl} class="map-root"></div>

<style>
  .map-root {
    height: 100%;
    width: 100%;
    z-index: 1;
  }

  /* Budol shop pins — orange only */
  :global(.budol-marker-wrap) {
    background: none !important;
    border: none !important;
  }

  :global(.budol-shop-pin) {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.15s ease, filter 0.15s ease;
    transform-origin: bottom center;
  }

  :global(.budol-shop-pin:hover) {
    transform: scale(1.1);
    filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.28));
  }

  /* User location — pin-blue only */
  :global(.user-gps-marker) {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  :global(.gps-dot) {
    position: absolute;
    width: 14px;
    height: 14px;
    background: var(--pin-blue);
    border: 3px solid white;
    border-radius: 50%;
    z-index: 2;
    box-shadow: 0 0 10px rgba(33, 150, 243, 0.55);
  }

  :global(.gps-pulse) {
    position: absolute;
    width: 44px;
    height: 44px;
    background: rgba(33, 150, 243, 0.35);
    border-radius: 50%;
    animation: gpsPulse 2s infinite ease-out;
    z-index: 1;
  }

  @keyframes gpsPulse {
    0% {
      transform: scale(0.1);
      opacity: 1;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }

  /* Pop-up cards — bg-card */
  :global(.budol-leaflet-popup .leaflet-popup-content-wrapper) {
    background: var(--bg-card);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-card);
    border: 1px solid var(--border);
    padding: 0;
  }

  :global(.budol-leaflet-popup .leaflet-popup-content) {
    margin: 0;
    min-width: 180px;
  }

  :global(.budol-leaflet-popup .leaflet-popup-tip) {
    background: var(--bg-card);
    border: 1px solid var(--border);
    box-shadow: none;
  }

  :global(.budol-popup) {
    padding: 14px 16px;
    text-align: center;
    font-family: var(--font-sans);
    color: var(--text-dark);
  }

  :global(.budol-popup-deal) {
    display: inline-block;
    margin-bottom: 8px;
    padding: 3px 8px;
    background: var(--alert-red);
    color: white;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-radius: var(--radius-pill);
  }

  :global(.budol-popup-title) {
    display: block;
    font-size: 14px;
    font-weight: 700;
    color: var(--text-dark);
    margin-bottom: 4px;
  }

  :global(.budol-popup-cat) {
    display: block;
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 10px;
  }

  :global(.budol-popup-btn) {
    display: inline-block;
    background: var(--budol-orange);
    color: white;
    padding: 7px 14px;
    border-radius: var(--radius-sm);
    text-decoration: none;
    font-size: 12px;
    font-weight: 600;
    transition: background 0.15s;
  }

  :global(.budol-popup-btn:hover) {
    background: var(--budol-orange-hover);
  }
</style>
