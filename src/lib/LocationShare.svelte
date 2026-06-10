<script lang="ts">
  import { onDestroy } from 'svelte'
  import { pushTrackingPosition, type TrackedBy } from '$lib/orderTracking'

  interface Props {
    orderId: string
    role: TrackedBy
    label?: string
    onUpdate?: (lat: number, lng: number) => void
    onError?: (message: string) => void
  }

  let { orderId, role, label = 'Share live location', onUpdate, onError }: Props = $props()

  let sharing = $state(false)
  let watchId = $state<number | null>(null)
  let lastSent = $state(0)
  let error = $state('')

  const SEND_INTERVAL_MS = 8000

  async function sendPosition(lat: number, lng: number) {
    const now = Date.now()
    if (now - lastSent < SEND_INTERVAL_MS) return
    lastSent = now
    try {
      await pushTrackingPosition(orderId, lat, lng, role)
      onUpdate?.(lat, lng)
      error = ''
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not share location'
      error = msg
      onError?.(msg)
    }
  }

  function startSharing() {
    if (!navigator.geolocation) {
      error = 'Geolocation is not supported on this device.'
      return
    }

    sharing = true
    error = ''

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void sendPosition(pos.coords.latitude, pos.coords.longitude)
        watchId = navigator.geolocation.watchPosition(
          (p) => void sendPosition(p.coords.latitude, p.coords.longitude),
          (err) => {
            error =
              err.code === err.PERMISSION_DENIED
                ? 'Location permission denied. Enable it in browser settings.'
                : 'Could not access your location.'
            sharing = false
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        )
      },
      (err) => {
        sharing = false
        error =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Enable it in browser settings.'
            : 'Could not access your location.'
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: Infinity }
    )
  }

  function stopSharing() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }
    sharing = false
  }

  onDestroy(stopSharing)
</script>

<div class="location-share">
  {#if sharing}
    <div class="live-row">
      <span class="live-dot"></span>
      <span>Sharing live location</span>
    </div>
    <button type="button" class="btn stop" onclick={stopSharing}>Stop sharing</button>
  {:else}
    <button type="button" class="btn start" onclick={startSharing}>{label}</button>
  {/if}
  {#if error}<p class="err">{error}</p>{/if}
</div>

<style>
  .location-share {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .live-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--success, #188038);
  }

  .live-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--success, #188038);
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .btn {
    padding: 10px 16px;
    border-radius: var(--radius-pill, 999px);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: none;
  }

  .btn.start {
    background: var(--budol-orange, #e85d04);
    color: white;
  }

  .btn.stop {
    background: #f1f3f4;
    color: #3c4043;
    border: 1px solid #dadce0;
  }

  .err {
    margin: 0;
    font-size: 12px;
    color: var(--alert-red, #d93025);
  }
</style>
