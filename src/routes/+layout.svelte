<script lang="ts">
  import { onMount } from 'svelte'
  import { theme } from '$lib/theme'
  import '../app.css'

  let { children } = $props()

  onMount(() => {
    theme.init()
  })
</script>

{@render children()}