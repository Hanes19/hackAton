export const theme = {
  get isDark() {
    if (typeof localStorage === 'undefined') return false
    return localStorage.getItem('theme') === 'dark'
  },
  toggle() {
    const isDark = this.isDark
    localStorage.setItem('theme', isDark ? 'light' : 'dark')
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark')
  },
  init() {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : 'light'
    document.documentElement.setAttribute('data-theme', saved ?? 'light')
  }
}