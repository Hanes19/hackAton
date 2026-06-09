<script lang="ts">
  import { onMount } from 'svelte'
  import { theme } from '$lib/theme'
  import AssistantChat from '$lib/AssistantChat.svelte'
  import '../app.css'

  let { children } = $props()

  onMount(() => {
    theme.init()
  })
</script>

<div class="app-shell">
  <main class="app-main">
    {@render children()}
  </main>
  <AssistantChat />
</div>

<style>
  :global(html),
  :global(body) {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }

  .app-shell {
    display: flex;
    min-height: 100vh;
    width: 100%;
    align-items: stretch;
  }

  .app-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
</style>
