<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { Map, Marker } from 'leaflet'

  let {
    lat = $bindable(7.9064),
    lng = $bindable(125.0948),
    pinned = $bindable(false),
    centerLat = 7.9064,
    centerLng = 125.0948,
    zoom = 14
  }: {
    lat?: number
    lng?: number
    pinned?: boolean
    centerLat?: number
    centerLng?: number
    zoom?: number
  } = $props()

  let mapEl: HTMLDivElement
  let map = $state<Map | undefined>(undefined)
  let L = $state<typeof import('leaflet') | undefined>(undefined)
  let marker: Marker | null = null
  let locating = $state(false)
  let locateError = $state('')

  function setLocation(newLat: number, newLng: number, fromUser = true) {
    lat = Math.round(newLat * 10000) / 10000
    lng = Math.round(newLng * 10000) / 10000
    if (fromUser) pinned = true
    updateMarker()
  }

  function updateMarker() {
    if (!map || !L) return
    if (marker) marker.remove()
    marker = L.marker([lat, lng], { draggable: true }).addTo(map)
    marker.on('dragend', () => {
      const pos = marker!.getLatLng()
      setLocation(pos.lat, pos.lng)
    })
  }

  function centerOnLgu() {
    if (!map) return
    map.flyTo([centerLat, centerLng], zoom, { animate: true, duration: 0.8 })
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      locateError = 'Geolocation is not supported in this browser.'
      return
    }
    locating = true
    locateError = ''
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(pos.coords.latitude, pos.coords.longitude)
        map?.flyTo([lat, lng], 17, { animate: true, duration: 0.8 })
        locating = false
      },
      () => {
        locateError = 'Could not get your location. Allow GPS or pin manually on the map.'
        locating = false
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  $effect(() => {
    if (map && L) {
      void centerLat
      void centerLng
      if (!pinned) centerOnLgu()
    }
  })

  $effect(() => {
    if (map && L && marker) {
      void lat
      void lng
      marker.setLatLng([lat, lng])
    }
  })

  onMount(async () => {
    L = await import('leaflet')
    await import('leaflet/dist/leaflet.css')

    map = L.map(mapEl, { zoomControl: false }).setView([lat, lng], zoom)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }).addTo(map)

    updateMarker()

    map.on('click', (e) => {
      setLocation(e.latlng.lat, e.latlng.lng)
      map!.flyTo(e.latlng, Math.max(map!.getZoom(), 16), { animate: true, duration: 0.5 })
    })
  })

  onDestroy(() => {
    if (map) map.remove()
  })
</script>

<div class="picker">
  <div class="picker-header">
    <div>
      <strong>Pin your shop location</strong>
      <span>Click the map or drag the pin to set coordinates</span>
    </div>
    <div class="picker-actions">
      <button type="button" class="tool-btn" onclick={centerOnLgu}>Center on LGU</button>
      <button type="button" class="tool-btn accent" onclick={useMyLocation} disabled={locating}>
        {locating ? 'Locating…' : 'Use my location'}
      </button>
    </div>
  </div>

  <div class="map-wrap">
    <div bind:this={mapEl} class="map-el"></div>
    {#if !pinned}
      <div class="map-overlay">Tap the map to drop your shop pin</div>
    {/if}
  </div>

  <div class="coords-row">
    <div class="coord">
      <label for="picker-lat">Latitude</label>
      <input
        id="picker-lat"
        type="number"
        step="0.0001"
        value={lat}
        oninput={(e) => {
          const v = parseFloat((e.currentTarget as HTMLInputElement).value)
          if (!Number.isNaN(v)) setLocation(v, lng)
        }}
      />
    </div>
    <div class="coord">
      <label for="picker-lng">Longitude</label>
      <input
        id="picker-lng"
        type="number"
        step="0.0001"
        value={lng}
        oninput={(e) => {
          const v = parseFloat((e.currentTarget as HTMLInputElement).value)
          if (!Number.isNaN(v)) setLocation(lat, v)
        }}
      />
    </div>
  </div>

  {#if pinned}
    <p class="pinned-note">📍 Location pinned — {lat.toFixed(4)}, {lng.toFixed(4)}</p>
  {/if}
  {#if locateError}
    <p class="locate-error">{locateError}</p>
  {/if}
</div>

<style>
  .picker {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .picker-header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 10px;
    align-items: flex-start;
  }

  .picker-header strong {
    display: block;
    font-size: 13px;
    color: #e8f4fc;
    margin-bottom: 2px;
  }

  .picker-header span {
    font-size: 12px;
    color: #4d7a9e;
  }

  .picker-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .tool-btn {
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid #143e88;
    background: #091525;
    color: #84b9d5;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }

  .tool-btn:hover:not(:disabled) {
    border-color: #49b6ea;
    color: #49b6ea;
  }

  .tool-btn.accent {
    background: rgba(73, 182, 234, 0.12);
    border-color: rgba(73, 182, 234, 0.35);
    color: #49b6ea;
  }

  .tool-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .map-wrap {
    position: relative;
    height: 260px;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #143e88;
  }

  .map-el {
    height: 100%;
    width: 100%;
    z-index: 1;
  }

  .map-overlay {
    position: absolute;
    left: 50%;
    bottom: 12px;
    transform: translateX(-50%);
    z-index: 500;
    background: rgba(7, 15, 31, 0.92);
    border: 1px solid rgba(73, 182, 234, 0.35);
    color: #84b9d5;
    font-size: 11px;
    padding: 6px 12px;
    border-radius: 20px;
    pointer-events: none;
    white-space: nowrap;
  }

  .coords-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .coord {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .coord label {
    font-size: 11px;
    font-weight: 500;
    color: #6eb3da;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .coord input {
    width: 100%;
    padding: 8px 10px;
    background: #091525;
    border: 1px solid #143e88;
    border-radius: 8px;
    color: #e8f4fc;
    font-size: 13px;
    outline: none;
    box-sizing: border-box;
    font-family: inherit;
  }

  .coord input:focus {
    border-color: #49b6ea;
  }

  .pinned-note {
    margin: 0;
    font-size: 12px;
    color: #34d399;
  }

  .locate-error {
    margin: 0;
    font-size: 12px;
    color: #f87171;
  }

  :global(.leaflet-container) {
    background: #091525;
    font-family: inherit;
  }
</style>
