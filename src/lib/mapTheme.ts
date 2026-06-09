/** Map tile layer — Carto Voyager (minimal POI clutter vs default OSM). */
export const MAP_TILE_URL =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

export const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

export const MAP_COLORS = {
  budolOrange: '#FF5722',
  budolOrangeHover: '#E64A19',
  pinBlue: '#2196F3',
  alertRed: '#F44336',
  mapLand: '#4CAF50',
  mapWater: '#2196F3',
  mapRoad: '#9E9E9E'
} as const

const PIN_SVG = `<svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 0C6.82 0 1 5.82 1 13c0 9.75 13 23 13 23s13-13.25 13-23C27 5.82 21.18 0 14 0z" fill="${MAP_COLORS.budolOrange}"/>
  <circle cx="14" cy="13" r="5" fill="white"/>
</svg>`

export function shopPinHtml(): string {
  return `<div class="budol-shop-pin">${PIN_SVG}</div>`
}

export function shopPopupHtml(shop: {
  id: string
  name: string
  category: string
  flashDeal?: boolean
}): string {
  const dealBadge = shop.flashDeal
    ? `<span class="budol-popup-deal">Flash deal</span>`
    : ''
  return `
    <div class="budol-popup">
      ${dealBadge}
      <strong class="budol-popup-title">${shop.name}</strong>
      <span class="budol-popup-cat">${shop.category}</span>
      <a href="/shops/${shop.id}" class="budol-popup-btn">View Shop</a>
    </div>
  `
}
