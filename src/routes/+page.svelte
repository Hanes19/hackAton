<script>
  const { countries = [] } = $props();
</script>

<ul>
  {#each countries as country (country.id ?? country.name)}
    <li>{country.name}</li>
  {/each}
</ul>