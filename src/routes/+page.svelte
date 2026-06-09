<script lang="ts">
  import { goto } from '$app/navigation'
</script>

<div style="min-height: 100vh; background: #0f0f0f; color: white; display: flex; flex-direction: column;">

  <!-- Nav -->
  <header style="padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #222;">
    <span style="font-size: 1.1rem; font-weight: 700;">🗺 LocalMarket</span>
    <div style="display: flex; gap: 12px;">
      <a href="/login" style="font-size: 13px; color: #aaa; text-decoration: none; padding: 6px 14px;">Login</a>
      <a href="/register-user" style="font-size: 13px; background: white; color: black; text-decoration: none; padding: 6px 14px; border-radius: 6px; font-weight: 500;">Get Started</a>
    </div>
  </header>

  <!-- Hero -->
  <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 4rem 2rem;">
    <div style="font-size: 12px; letter-spacing: 0.15em; color: #3b82f6; margin-bottom: 1.5rem; text-transform: uppercase; font-weight: 600;">Bukidnon Province • Digital Marketplace</div>
    <h1 style="font-size: clamp(2rem, 6vw, 4rem); font-weight: 800; line-height: 1.1; margin-bottom: 1.5rem; max-width: 700px;">
      Discover Local Shops.<br/>
      <span style="color: #3b82f6;">Support Local Trade.</span>
    </h1>
    <p style="font-size: 1rem; color: #888; max-width: 500px; line-height: 1.7; margin-bottom: 2.5rem;">
      LocalMarket connects Bukidnon buyers and sellers on an interactive map. Find food, clothing, services and more from local small businesses near you.
    </p>
    <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
      <button onclick={() => goto('/map')} style="background: #3b82f6; color: white; border: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer;">
        Explore the Map →
      </button>
      <button onclick={() => goto('/register-user')} style="background: transparent; color: white; border: 1px solid #333; padding: 12px 28px; border-radius: 8px; font-size: 15px; cursor: pointer;">
        Register as Seller
      </button>
    </div>
  </div>

  <!-- Features -->
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #222; border-top: 1px solid #222;">
    {#each [
      { icon: '📍', title: 'Map Discovery', desc: 'Find shops near you on an interactive map of Bukidnon' },
      { icon: '🏪', title: 'Local Sellers', desc: 'Support small and medium enterprises in your community' },
      { icon: '🔍', title: 'Smart Search', desc: 'Filter by category, name, or location instantly' }
    ] as feature (feature.title)}
      <div style="background: #0f0f0f; padding: 2rem; text-align: center;">
        <div style="font-size: 2rem; margin-bottom: 0.75rem;">{feature.icon}</div>
        <div style="font-size: 14px; font-weight: 600; margin-bottom: 6px;">{feature.title}</div>
        <div style="font-size: 13px; color: #666; line-height: 1.6;">{feature.desc}</div>
      </div>
    {/each}
  </div>

  <!-- Footer -->
  <div style="padding: 1.5rem 2rem; border-top: 1px solid #222; text-align: center; font-size: 12px; color: #444;">
    LocalMarket — Empowering Local Trade in Bukidnon • Built for the community
  </div>
</div>