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

{@render children()}
<AssistantChat />