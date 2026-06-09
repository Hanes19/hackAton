<script lang="ts">
  import { goto } from '$app/navigation'
</script>

<div style="min-height: 100vh; font-family: 'Segoe UI', sans-serif; background: #fff;">

  <!-- Navbar -->
  <header style="position: sticky; top: 0; z-index: 100; background: white; border-bottom: 1px solid #eee; padding: 0.75rem 2rem; display: flex; justify-content: space-between; align-items: center;">
    <div style="display: flex; align-items: center; gap: 10px;">
      <img src="/logo.png" alt="Budol Map" style="height: 40px; width: 40px; object-fit: contain;" />
      <span style="font-size: 1.2rem; font-weight: 700; color: #1a1a1a;">Budol <span style="color: #e84c3d;">Maps</span></span>
    </div>
    <nav style="display: flex; gap: 2rem; align-items: center;">
      <a href="/" style="font-size: 13px; color: #e84c3d; font-weight: 500; text-decoration: none;">Home</a>
      <a href="/map" style="font-size: 13px; color: #555; text-decoration: none;">Local Shops</a>
      <a href="/login" style="font-size: 13px; color: #555; text-decoration: none;">Login</a>
      <a href="/register-user" style="font-size: 13px; background: #e84c3d; color: white; padding: 7px 18px; border-radius: 6px; text-decoration: none; font-weight: 500;">Get Started</a>
    </nav>
  </header>

  <!-- Hero -->
  <div style="position: relative; min-height: 85vh; display: flex; align-items: center; overflow: hidden; background: url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1400&q=80') center/cover no-repeat;">

    <!-- Dark overlay -->
    <div style="position: absolute; inset: 0; background: rgba(10, 20, 40, 0.78);"></div>

    <!-- Background text -->
    <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0.04; font-size: 12vw; font-weight: 900; color: white; letter-spacing: -2px; pointer-events: none; user-select: none;">BUKIDNON</div>

    <!-- Left content -->
    <div style="position: relative; z-index: 2; flex: 1; padding: 4rem 3rem 4rem 5vw; max-width: 55%;">
      <div style="display: inline-block; background: rgba(232, 76, 61, 0.15); border: 1px solid rgba(232, 76, 61, 0.3); color: #e84c3d; font-size: 12px; padding: 4px 12px; border-radius: 20px; margin-bottom: 1.5rem; letter-spacing: 0.08em; font-weight: 500;">
        🗺 Valencia City & Bukidnon
      </div>
      <h1 style="font-size: clamp(1.8rem, 4vw, 3.2rem); font-weight: 800; color: white; line-height: 1.15; margin-bottom: 1rem;">
        <span style="color: #e84c3d;">Budol Map</span> —<br/>
        Empowering Local Trade<br/>
        in Bukidnon
      </h1>
      <p style="font-size: 1rem; color: #aaa; line-height: 1.7; margin-bottom: 2rem; max-width: 420px;">
        A Digital Marketplace for Local Small Businesses. Discover shops, services, and products near you on an interactive map.
      </p>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <button onclick={() => goto('/map')} style="background: #e84c3d; color: white; border: none; padding: 13px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer;">
          Discover Local Finds →
        </button>
        <button onclick={() => goto('/register-user')} style="background: transparent; color: white; border: 1px solid rgba(255,255,255,0.3); padding: 13px 28px; border-radius: 8px; font-size: 15px; cursor: pointer;">
          Register as Seller
        </button>
      </div>
    </div>

    <!-- Right phone mockup -->
    <div style="position: relative; z-index: 2; flex: 1; display: flex; justify-content: center; align-items: center; padding: 2rem;">
      <div style="width: 260px; height: 520px; background: #1a1a1a; border-radius: 36px; border: 6px solid #333; box-shadow: 0 30px 80px rgba(0,0,0,0.5); overflow: hidden; position: relative;">
        <div style="position: absolute; top: 0; left: 0; right: 0; background: #1a1a1a; height: 28px; display: flex; align-items: center; justify-content: center; z-index: 1;">
          <div style="width: 60px; height: 6px; background: #333; border-radius: 3px;"></div>
        </div>
        <div style="margin-top: 28px; height: calc(100% - 28px); overflow: hidden;">
          <img src="/app-screenshot.png" alt="Budol Map App" style="width: 100%; height: 100%; object-fit: cover; object-position: top;" />
        </div>
      </div>
    </div>

  </div>

  <!-- Features -->
  <div style="background: #f9f9f9; padding: 4rem 2rem;">
    <h2 style="text-align: center; font-size: 1.5rem; font-weight: 700; margin-bottom: 2.5rem; color: #1a1a1a;">Why Budol Map?</h2>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; max-width: 900px; margin: 0 auto;">
      {#each [
        { icon: '📍', title: 'Interactive Map Discovery', desc: 'Find local shops and services pinned directly on a map of Bukidnon' },
        { icon: '🤝', title: 'Support Local Sellers', desc: 'Every purchase supports small and medium enterprises in your community' },
        { icon: '🔍', title: 'Smart Search & Filtering', desc: 'Search by name, category, or location to find exactly what you need' }
      ] as feature (feature.title)}
        <div style="background: white; border-radius: 12px; padding: 1.5rem; text-align: center; border: 1px solid #eee; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          <div style="font-size: 2rem; margin-bottom: 0.75rem;">{feature.icon}</div>
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #1a1a1a;">{feature.title}</div>
          <div style="font-size: 13px; color: #666; line-height: 1.6;">{feature.desc}</div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Local Products Section -->
  <div style="padding: 4rem 2rem; max-width: 900px; margin: 0 auto;">
    <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; color: #1a1a1a;">Featured from Bukidnon</h2>
    <p style="font-size: 13px; color: #999; margin-bottom: 2rem;">Discover what local sellers have to offer</p>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
      {#each [
        { emoji: '☕', name: 'Native Coffee Beans', location: 'Manolo Fortich', category: 'Food' },
        { emoji: '🧶', name: 'Handcrafted Weaves', location: 'Lantapan', category: 'Clothing' },
        { emoji: '🍍', name: 'Del Monte Pineapple Products', location: 'Manolo Fortich', category: 'Food' },
      ] as product (product.name)}
        <div style="border-radius: 12px; overflow: hidden; border: 1px solid #eee; cursor: pointer;" onclick={() => goto('/map')}>
          <div style="height: 140px; background: linear-gradient(135deg, #f0f4ff, #e8f4f0); display: flex; align-items: center; justify-content: center; font-size: 4rem;">
            {product.emoji}
          </div>
          <div style="padding: 12px;">
            <p style="font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px;">{product.name}</p>
            <p style="font-size: 12px; color: #999;">📍 {product.location}</p>
            <span style="font-size: 11px; background: #f0f0f0; padding: 2px 8px; border-radius: 20px; color: #555; margin-top: 6px; display: inline-block;">{product.category}</span>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- CTA -->
  <div style="background: #e84c3d; padding: 4rem 2rem; text-align: center;">
    <h2 style="font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 0.75rem;">Ready to sell on Budol Map?</h2>
    <p style="color: rgba(255,255,255,0.8); margin-bottom: 2rem; font-size: 15px;">Join hundreds of local sellers and reach more buyers in Bukidnon.</p>
    <button onclick={() => goto('/register-user')} style="background: white; color: #e84c3d; border: none; padding: 13px 32px; border-radius: 8px; font-size: 15px; font-weight: 700; cursor: pointer;">
      Register Your Shop Free →
    </button>
  </div>

  <!-- Footer -->
  <footer style="background: #1a1a1a; color: #666; padding: 1.5rem 2rem; text-align: center; font-size: 12px;">
    Budol Map — Empowering Local Trade in Bukidnon • Built for the community
  </footer>

</div> 