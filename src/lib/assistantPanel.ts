import { writable } from 'svelte/store'

/** Shared open state so map controls can open the assistant without overlapping FABs. */
export const assistantPanelOpen = writable(false)
