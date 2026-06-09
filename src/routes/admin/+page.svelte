<script lang="ts">
  import { onMount } from 'svelte'
  import { supabase } from '$lib/supabase'
  import { getUser } from '$lib/auth'
  import { goto } from '$app/navigation'
  import NavBar from '$lib/NavBar.svelte'
  
  type Tab = 'overview' | 'sellers' | 'ads' | 'users' | 'flags' | 'logs' | 'settings'
  type SettingsTab = 'catalog' | 'logistics' | 'operations'
  type AdsTab = 'campaigns' | 'offers' | 'create'

  interface Shop {
    id: string
    name: string
    category: string
    address: string
    created_at: string
    owner_name?: string
    permit_number?: string
    lgu_municipality?: string
    permit_verified?: boolean
    id_type?: string
    verification_status?: string | null
  }
  interface Profile { id: string; name: string; email: string; is_admin: boolean; created_at: string; city_municipality?: string; permissions?: string[] }

  let activeTab = $state<Tab>('overview')
  let settingsSubTab = $state<SettingsTab>('catalog') 
  let adsSubTab = $state<AdsTab>('campaigns')
  
  let shops = $state<Shop[]>([])
  let users = $state<Profile[]>([])
  let loading = $state(true)
  let totalProducts = $state(0)
  let adminName = $state('Super Admin')
  
  let hoveredRegion = $state<{ name: string; count: number } | null>(null)

  // --- NEW: Permissions Modal State ---
  let showPermsModal = $state(false)
  let editingUser = $state<Profile | null>(null)
  let tempPerms = $state<Record<string, boolean>>({ ads: false, flags: false, catalog: false, logs: false })

  const availablePerms = [
    { id: 'ads', label: 'Ads & Campaigns Manager', desc: 'Can create, pause, and approve promotional campaigns.' },
    { id: 'flags', label: 'Dispute Resolution', desc: 'Can review flags, ban users, and resolve tickets.' },
    { id: 'catalog', label: 'Catalog Administrator', desc: 'Can edit taxonomy, variations, and global product rules.' },
    { id: 'logs', label: 'System Audit Viewer', desc: 'Can read full administrative activity logs and exports.' }
  ]

  // Mock Data
  const flags = [
    { id: 1, name: 'Highlands Coffee', type: 'seller', issue: 'Fake listing', severity: 'red', date: 'Jun 7' },
    { id: 2, name: 'Del Monte Pasalubong', type: 'seller', issue: 'Late fulfillment', severity: 'yellow', date: 'Jun 6' },
    { id: 3, name: 'User #1023', type: 'buyer', issue: 'Dispute resolved', severity: 'green', date: 'Jun 5' },
  ]

  const logs = [
    { time: '2026-06-09 08:12', category: 'AUTH', actor: 'Super Admin', action: 'LOGIN_SUCCESS', target: 'Admin panel' },
    { time: '2026-06-09 08:05', category: 'ADMIN', actor: 'Super Admin', action: 'SHOP_DELETED', target: 'Test Shop' },
    { time: '2026-06-08 22:10', category: 'USER', actor: 'Super Admin', action: 'ROLE_UPDATED', target: 'User → Admin' },
    { time: '2026-06-08 18:33', category: 'SYS', actor: 'System', action: 'BACKUP_COMPLETED', target: 'Full DB snapshot' },
    { time: '2026-06-08 14:21', category: 'REPORT', actor: 'Super Admin', action: 'FLAG_RAISED_RED', target: 'Highlands Coffee' },
  ]

  const ads = [
    { name: 'Summer Sale Banner', type: 'Banner', target: 'Food buyers', budget: '₱500', impressions: 4200, clicks: 312, status: 'active' },
    { name: 'Featured Seller Spotlight', type: 'Sidebar', target: 'All users', budget: '₱200', impressions: 1800, clicks: 98, status: 'active' },
    { name: 'New Arrivals Push', type: 'Push', target: 'Clothing', budget: '₱150', impressions: 900, clicks: 44, status: 'paused' },
  ]

  let sellerOffers = $state([
    { id: 1, shop: 'Highlands Coffee', title: 'Buy 1 Take 1 Brewed Coffee', discount: '50%', expires: 'Jun 15', status: 'pending' },
    { id: 2, shop: 'Del Monte Pasalubong', title: 'Summer Pineapple Bundle', discount: '20%', expires: 'Jun 20', status: 'approved' },
    { id: 3, shop: 'Bukidnon Crafts', title: 'Handwoven Bags Clearance', discount: '30%', expires: 'Jun 10', status: 'rejected' },
  ])

  const catColor: Record<string, string> = {
    AUTH: '#2196f3', ADMIN: '#ff5722', USER: '#4caf50', SYS: '#757575', REPORT: '#f44336', AD: '#ff5722'
  }

  const bukidnonRegions = $derived(() => {
    const locations = [
      { id: 'valencia', name: 'Valencia City', cx: 160, cy: 260, r: 32, baseMock: 45 },
      { id: 'malaybalay', name: 'Malaybalay City', cx: 170, cy: 160, r: 38, baseMock: 38 },
      { id: 'maramag', name: 'Maramag', cx: 150, cy: 340, r: 24, baseMock: 22 },
      { id: 'manolo', name: 'Manolo Fortich', cx: 130, cy: 60, r: 28, baseMock: 29 },
      { id: 'quezon', name: 'Quezon', cx: 220, cy: 370, r: 22, baseMock: 15 },
      { id: 'don_carlos', name: 'Don Carlos', cx: 110, cy: 390, r: 18, baseMock: 12 },
    ]
    return locations.map(loc => {
      const realCount = users.filter(u => u.city_municipality?.toLowerCase().includes(loc.id) || u.city_municipality?.toLowerCase().includes(loc.name.toLowerCase())).length
      return { ...loc, count: realCount > 0 ? realCount : loc.baseMock }
    })
  })

  const maxUserCount = $derived(Math.max(...bukidnonRegions().map(r => r.count), 1))

  onMount(async () => {
    const user = await getUser()
    if (!user) { goto('/login'); return }
    const { data: profile } = await supabase.from('profiles').select('is_admin, name').eq('id', user.id).single()
    if (!profile?.is_admin) { goto('/'); return }
    if (profile.name) adminName = profile.name

    const [shopsRes, usersRes, productsRes] = await Promise.all([
      supabase.from('shops').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('id')
    ])
    shops = shopsRes.data ?? []
    
    // Add mock permissions for visual testing if DB doesn't have it yet
    users = (usersRes.data ?? []).map(u => ({ ...u, permissions: u.is_admin ? ['ads', 'flags'] : [] }))
    totalProducts = productsRes.data?.length ?? 0
    loading = false
  })

  // --- NEW: User Permissions Handlers ---
  function toggleAdmin(userId: string, current: boolean) {
    // In production: await supabase.from('profiles').update({ is_admin: !current }).eq('id', userId)
    users = users.map(u => u.id === userId ? { ...u, is_admin: !current } : u)
  }

  function openPermissionsModal(user: Profile) {
    editingUser = user
    tempPerms = { ads: false, flags: false, catalog: false, logs: false }
    if (user.permissions) {
      user.permissions.forEach(p => { tempPerms[p] = true })
    }
    showPermsModal = true
  }

  function savePermissions() {
    if (!editingUser) return
    const newPerms = Object.keys(tempPerms).filter(k => tempPerms[k])
    
    // In production: await supabase.from('profiles').update({ permissions: newPerms }).eq('id', editingUser.id)
    users = users.map(u => u.id === editingUser!.id ? { ...u, permissions: newPerms } : u)
    
    showPermsModal = false
    editingUser = null
  }

  function updateOfferStatus(id: number, status: string) {
    sellerOffers = sellerOffers.map(o => o.id === id ? { ...o, status } : o)
  }

  let pendingSellers = $derived(shops.filter(s => s.verification_status === 'pending'))
  let reviewingId = $state<string | null>(null)

  async function updateSellerStatus(shopId: string, status: 'approved' | 'rejected') {
    reviewingId = shopId
    const res = await fetch(`/api/shops/${shopId}/verification`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    reviewingId = null
    if (res.ok) {
      shops = shops.map(s => s.id === shopId ? { ...s, verification_status: status } : s)
    }
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
</script>

<div class="admin-page">
  <NavBar variant="light" />
  <div class="admin-dashboard-container">
  <aside class="sidebar">
    <div class="brand-header">
      <div class="brand-avatar">{adminName[0]}</div>
      <div class="brand-info">
        <h3>Admin Console</h3>
        <span>{adminName}</span>
      </div>
    </div>

    <nav class="nav-menu">
      <button class="nav-item" class:active={activeTab === 'overview'} onclick={() => activeTab = 'overview'}><span class="icon">⊞</span> Overview</button>
      <button class="nav-item" class:active={activeTab === 'sellers'} onclick={() => activeTab = 'sellers'}><span class="icon">🏪</span> Seller Verification
        {#if pendingSellers.length > 0}<span class="nav-badge-alert">{pendingSellers.length}</span>{/if}
      </button>
      <button class="nav-item" class:active={activeTab === 'ads'} onclick={() => activeTab = 'ads'}><span class="icon">◈</span> Ads & Promotions</button>
      <button class="nav-item" class:active={activeTab === 'users'} onclick={() => activeTab = 'users'}><span class="icon">👤</span> User Management</button>
      <button class="nav-item" class:active={activeTab === 'flags'} onclick={() => activeTab = 'flags'}><span class="icon">⚑</span> Reports & Flags
        {#if flags.filter(f => f.severity === 'red').length > 0}<span class="nav-badge-alert">{flags.filter(f => f.severity === 'red').length}</span>{/if}
      </button>
      <button class="nav-item" class:active={activeTab === 'logs'} onclick={() => activeTab = 'logs'}><span class="icon">≡</span> Activity Logs</button>
      <button class="nav-item" class:active={activeTab === 'settings'} onclick={() => activeTab = 'settings'}><span class="icon">⚙</span> Settings</button>
    </nav>
    <div class="sidebar-footer"><a href="/" class="btn-text" style="font-size: 12px;">← Back to Map</a></div>
  </aside>

  <main class="main-content">
    {#if loading}
      <p class="loading-text">Loading data from Supabase…</p>
    
    {:else if activeTab === 'overview'}
      <div class="tab-header">
        <h2>Dashboard Overview</h2>
        <p class="text-dim">{today}</p>
      </div>

      <section class="kpi-grid">
        <div class="kpi-card text-blue"><div class="kpi-meta"><span class="kpi-label">Registered Shops</span><span class="kpi-icon">🏪</span></div><h2 class="kpi-value">{shops.length}</h2><span class="kpi-trend static">on the map</span></div>
        <div class="kpi-card text-emerald"><div class="kpi-meta"><span class="kpi-label">Total Users</span><span class="kpi-icon">👥</span></div><h2 class="kpi-value">{users.length}</h2><span class="kpi-trend static">registered</span></div>
        <div class="kpi-card text-purple"><div class="kpi-meta"><span class="kpi-label">Total Products</span><span class="kpi-icon">📦</span></div><h2 class="kpi-value">{totalProducts}</h2><span class="kpi-trend static">listed items</span></div>
        <div class="kpi-card text-rose"><div class="kpi-meta"><span class="kpi-label">Open Flags</span><span class="kpi-icon">🚩</span></div><h2 class="kpi-value">{flags.filter(f => f.severity !== 'green').length}</h2><span class="kpi-trend immediate">{flags.filter(f => f.severity === 'red').length} critical</span></div>
      </section>

      <section class="dashboard-split-panels">
        <div class="panel-card"><div class="panel-header"><h3>Recent Shops</h3></div>
          <div class="table-container">
            <table class="custom-table">
              <tbody>{#each shops.slice(0, 5) as shop (shop.id)}<tr><td class="font-medium">{shop.name}</td><td class="text-dim text-right">{shop.category}</td></tr>{/each}</tbody>
            </table>
          </div>
        </div>

        <div class="panel-card map-panel">
          <div class="panel-header flex-header"><h3>Bukidnon Density Heatmap</h3><span class="geo-badge">Mindanao, PH</span></div>
          <div class="map-visualization-container">
            <div class="map-tooltip" class:visible={hoveredRegion !== null}>
              {#if hoveredRegion}<strong>{hoveredRegion.name}</strong><span>{hoveredRegion.count} Active Users</span>{:else}Hover over a region{/if}
            </div>
            <svg class="bukidnon-svg" viewBox="0 0 320 460" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="0.5"/></pattern></defs>
              <rect width="100%" height="100%" fill="url(#grid)" rx="8" />
              <path class="bukidnon-boundary" d="M120 20 L220 40 L280 120 L260 220 L290 350 L240 440 L150 440 L80 380 L60 280 L90 140 Z" />
              {#each bukidnonRegions() as region (region.id)}
                <circle cx={region.cx} cy={region.cy} r={region.r + 8} fill="#ff5722" fill-opacity={(region.count / maxUserCount) * 0.12} />
                <circle cx={region.cx} cy={region.cy} r={region.r} fill="#ff5722" fill-opacity={0.15 + (region.count / maxUserCount) * 0.45} stroke="#4caf50" stroke-width="1.5" class="interactive-region-node" role="button" tabindex="0" onmouseenter={() => hoveredRegion = { name: region.name, count: region.count }} onmouseleave={() => hoveredRegion = null} />
                <text x={region.cx} y={region.cy + 4} text-anchor="middle" class="map-node-text">{region.count}</text>
                <text x={region.cx} y={region.cy + region.r + 14} text-anchor="middle" class="map-node-subtext">{region.name}</text>
              {/each}
            </svg>
          </div>
        </div>
        
        <div class="panel-card"><div class="panel-header"><h3>Recent Flags</h3></div>
          <div class="table-container">
            <table class="custom-table">
              <tbody>{#each flags.slice(0, 5) as flag (flag.id)}<tr><td><span class="status-dot {flag.severity === 'red' ? 'dot-red' : flag.severity === 'yellow' ? 'dot-yellow' : 'dot-green'}"></span><span class="font-medium">{flag.name}</span></td><td class="text-dim text-right">{flag.issue}</td></tr>{/each}</tbody>
            </table>
          </div>
        </div>
      </section>

    {:else if activeTab === 'sellers'}
      <div class="tab-header">
        <h2>Seller Verification</h2>
        <p class="text-dim">Review LGU-verified seller applications with business permit and valid ID</p>
      </div>

      <section class="kpi-grid" style="margin-bottom: 1.5rem;">
        <div class="kpi-card text-amber">
          <div class="kpi-meta"><span class="kpi-label">Pending Review</span><span class="kpi-icon">⏳</span></div>
          <h2 class="kpi-value">{pendingSellers.length}</h2>
          <span class="kpi-trend static">awaiting approval</span>
        </div>
        <div class="kpi-card text-emerald">
          <div class="kpi-meta"><span class="kpi-label">Approved Sellers</span><span class="kpi-icon">✓</span></div>
          <h2 class="kpi-value">{shops.filter(s => s.verification_status === 'approved' || !s.verification_status).length}</h2>
          <span class="kpi-trend static">on the map</span>
        </div>
        <div class="kpi-card text-rose">
          <div class="kpi-meta"><span class="kpi-label">Rejected</span><span class="kpi-icon">✕</span></div>
          <h2 class="kpi-value">{shops.filter(s => s.verification_status === 'rejected').length}</h2>
          <span class="kpi-trend static">not listed</span>
        </div>
      </section>

      <div class="panel-card">
        <div class="panel-header flex-header">
          <h3>Applications Queue</h3>
          <a href="/register" class="btn-text">+ New registration form</a>
        </div>
        <div class="table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Shop / Owner</th>
                <th>LGU Permit</th>
                <th>Valid ID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each shops.filter(s => s.verification_status === 'pending' || s.verification_status === 'rejected') as shop (shop.id)}
                <tr>
                  <td>
                    <div class="font-medium">{shop.name}</div>
                    <div class="text-dim" style="font-size: 11px;">{shop.owner_name || '—'} · {shop.category}</div>
                    <div class="text-dim" style="font-size: 11px;">{shop.address}</div>
                  </td>
                  <td>
                    <div class="font-medium" style="font-size: 12px;">{shop.permit_number || '—'}</div>
                    <div class="text-dim" style="font-size: 11px;">{shop.lgu_municipality || '—'}</div>
                    {#if shop.permit_verified}<span class="badge badge-success" style="font-size: 10px; margin-top: 4px;">LGU Verified</span>{/if}
                  </td>
                  <td class="text-dim" style="font-size: 12px;">{shop.id_type || '—'}</td>
                  <td>
                    <span class="badge {shop.verification_status === 'pending' ? 'badge-warning' : shop.verification_status === 'approved' ? 'badge-success' : 'badge-danger'}">
                      {(shop.verification_status || 'legacy').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {#if shop.verification_status === 'pending'}
                      <div style="display: flex; gap: 8px;">
                        <button class="action-btn approve" disabled={reviewingId === shop.id} onclick={() => updateSellerStatus(shop.id, 'approved')}>Approve</button>
                        <button class="action-btn reject" disabled={reviewingId === shop.id} onclick={() => updateSellerStatus(shop.id, 'rejected')}>Reject</button>
                      </div>
                    {:else}
                      <span class="text-dim">—</span>
                    {/if}
                  </td>
                </tr>
              {:else}
                <tr><td colspan="5" class="text-dim" style="text-align: center; padding: 2rem;">No pending seller applications</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

    {:else if activeTab === 'ads'}
      <div class="tab-header" style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1rem;">
        <div><h2>Ads & Promotions</h2><p class="text-dim">Manage campaigns, monitor ad spend, and review seller offers</p></div>
        {#if adsSubTab !== 'create'}<button class="btn-primary" onclick={() => adsSubTab = 'create'}>+ Create Campaign</button>{/if}
      </div>

      <div class="panel-header-tabs" style="margin-bottom: 2rem;">
        <button class="tab-btn" class:active={adsSubTab === 'campaigns'} onclick={() => adsSubTab = 'campaigns'}>Active Campaigns</button>
        <button class="tab-btn" class:active={adsSubTab === 'offers'} onclick={() => adsSubTab = 'offers'}>Seller Offers</button>
      </div>

      {#if adsSubTab === 'campaigns'}
        <section class="kpi-grid">
          <div class="kpi-card text-emerald"><div class="kpi-meta"><span class="kpi-label">Active Campaigns</span><span class="kpi-icon">📢</span></div><h2 class="kpi-value">{ads.filter(a => a.status === 'active').length}</h2><span class="kpi-trend positive">Running optimally</span></div>
          <div class="kpi-card text-blue"><div class="kpi-meta"><span class="kpi-label">Total Impressions</span><span class="kpi-icon">👁️</span></div><h2 class="kpi-value">{ads.reduce((acc, ad) => acc + ad.impressions, 0).toLocaleString()}</h2><span class="kpi-trend positive">↑ 15% vs last week</span></div>
          <div class="kpi-card text-purple"><div class="kpi-meta"><span class="kpi-label">Total Clicks</span><span class="kpi-icon">🖱️</span></div><h2 class="kpi-value">{ads.reduce((acc, ad) => acc + ad.clicks, 0).toLocaleString()}</h2><span class="kpi-trend static">Steady engagement</span></div>
          <div class="kpi-card text-rose"><div class="kpi-meta"><span class="kpi-label">Total Spend</span><span class="kpi-icon">₱</span></div><h2 class="kpi-value">850</h2><span class="kpi-trend static">of ₱1,500 budget</span></div>
        </section>
        
        <div class="panel-card"><div class="panel-header"><h3>Campaign Performance Details</h3></div>
          <div class="table-container">
            <table class="custom-table">
              <thead><tr><th>Campaign Info</th><th>Format</th><th>Target Audience</th><th>Performance (CTR)</th><th>Est. Spend / Budget</th><th>Status</th></tr></thead>
              <tbody>
                {#each ads as ad (ad.name)}
                  <tr>
                    <td><div class="font-medium">{ad.name}</div><div class="text-dim" style="font-size: 11px;">Created Jun 1, 2026</div></td>
                    <td><span class="geo-badge muted">{ad.type}</span></td>
                    <td class="text-dim">{ad.target}</td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <div class="ctr-bar"><div class="ctr-fill" style="width: {Math.min(100, (ad.clicks / ad.impressions) * 100 * 5)}%"></div></div>
                        <span class="font-medium" style="font-size: 12px;">{((ad.clicks / ad.impressions) * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td><div class="font-medium">₱{Math.round(parseInt(ad.budget.replace('₱','')) * 0.8)} <span class="text-dim" style="font-size: 11px; font-weight: normal;">/ {ad.budget}</span></div></td>
                    <td><span class="badge {ad.status === 'active' ? 'badge-success' : 'badge-warning'}">{ad.status.toUpperCase()}</span></td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

      {:else if adsSubTab === 'offers'}
        <div class="panel-card">
          <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center;">
            <div><h3>Promo Submissions</h3><p class="text-dim" style="font-size: 12px; margin-top: 4px;">Review and approve discounts submitted by verified sellers.</p></div>
            <span class="badge badge-warning" style="font-size: 11px;">{sellerOffers.filter(o => o.status === 'pending').length} Pending Review</span>
          </div>
          <div class="table-container">
            <table class="custom-table">
              <thead><tr><th>Shop Name</th><th>Offer Details</th><th>Discount Value</th><th>Expiry Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {#each sellerOffers as offer (offer.id)}
                  <tr>
                    <td class="font-medium">{offer.shop}</td><td class="text-dim">{offer.title}</td><td class="font-medium discount">{offer.discount} OFF</td><td class="text-dim">{offer.expires}</td>
                    <td><span class="badge {offer.status === 'approved' ? 'badge-success' : offer.status === 'rejected' ? 'badge-danger' : 'badge-neutral'}">{offer.status.toUpperCase()}</span></td>
                    <td>
                      {#if offer.status === 'pending'}
                        <div style="display: flex; gap: 8px;">
                          <button class="action-btn approve" onclick={() => updateOfferStatus(offer.id, 'approved')}>Approve</button>
                          <button class="action-btn reject" onclick={() => updateOfferStatus(offer.id, 'rejected')}>Reject</button>
                        </div>
                      {:else}<span class="text-dim" style="font-size: 11px;">Processed</span>{/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

      {:else if adsSubTab === 'create'}
        <div class="dashboard-split-panels" style="grid-template-columns: 2fr 1fr; align-items: start;">
          <div class="panel-card"><div class="panel-header"><h3>Campaign Details</h3></div>
            <div class="form-grid">
              <div class="input-group full-width"><label for="c-name">Campaign Name</label><input type="text" id="c-name" placeholder="e.g. Summer Festival Promo 2026" class="form-input" /></div>
              <div class="input-group"><label for="c-format">Ad Format</label><select id="c-format" class="form-input"><option>Hero Banner</option><option>Sidebar Spotlight</option><option>Push Notification</option><option>Map Pin Highlight</option></select></div>
              <div class="input-group"><label for="c-budget">Total Budget (₱)</label><input type="number" id="c-budget" placeholder="1000" class="form-input" /></div>
              <div class="input-group full-width"><label for="c-target">Target Audience Focus</label><input type="text" id="c-target" placeholder="e.g. Foodies in Valencia City" class="form-input" /></div>
              <div class="input-group"><label for="c-start">Start Date</label><input type="date" id="c-start" class="form-input" /></div>
              <div class="input-group"><label for="c-end">End Date</label><input type="date" id="c-end" class="form-input" /></div>
            </div>
            <div class="form-footer">
              <button class="action-btn" onclick={() => adsSubTab = 'campaigns'} style="padding: 10px 20px;">Cancel</button>
              <button class="btn-primary" onclick={() => adsSubTab = 'campaigns'}>Launch Campaign</button>
            </div>
          </div>
          <div class="panel-card" style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="panel-header" style="margin-bottom: 0;"><h3>Creative Asset</h3></div>
            <div class="upload-zone"><div style="font-size: 2rem; margin-bottom: 0.5rem;">🖼️</div><p class="font-medium" style="margin: 0;">Drag & Drop Image</p><p class="text-dim" style="font-size: 11px; margin-top: 4px;">PNG, JPG up to 5MB</p><button class="action-btn" style="margin-top: 1rem;">Browse Files</button></div>
            <div class="guidelines-box"><strong>Format Guidelines:</strong><ul><li>Banner: 1200 x 400px</li><li>Sidebar: 300 x 250px</li><li>Avoid more than 20% text</li></ul></div>
          </div>
        </div>
      {/if}

    {:else if activeTab === 'users'}
      <div class="tab-header"><h2>User Management</h2><p class="text-dim">Assign co-managers and manage granular access</p></div>
      <div class="panel-card">
        <div class="table-container">
          <table class="custom-table">
            <thead><tr><th>User Details</th><th>Role</th><th>System Access</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {#each users as user (user.id)}
                <tr>
                  <td>
                    <div class="font-medium">{user.name ?? '—'}</div>
                    <div class="text-dim" style="font-size: 11px;">{user.email ?? '—'}</div>
                  </td>
                  <td>
                    <span class="badge {user.is_admin ? 'badge-danger' : (user.permissions && user.permissions.length > 0) ? 'badge-info' : 'badge-neutral'}">
                      {user.is_admin ? 'SUPER ADMIN' : (user.permissions && user.permissions.length > 0) ? 'STAFF' : 'USER'}
                    </span>
                  </td>
                  <td>
                    {#if user.is_admin}
                      <span class="text-dim" style="font-size: 12px;">Full Access</span>
                    {:else if user.permissions && user.permissions.length > 0}
                      <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                        {#each user.permissions as perm}
                          <span class="geo-badge" style="font-size: 10px; padding: 2px 6px;">{perm.toUpperCase()}</span>
                        {/each}
                      </div>
                    {:else}
                      <span class="text-dim" style="font-size: 12px;">Standard Default</span>
                    {/if}
                  </td>
                  <td class="text-dim">{new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>
                    <div style="display: flex; gap: 8px;">
                      {#if !user.is_admin}
                        <button class="action-btn info" onclick={() => openPermissionsModal(user)}>Edit Roles</button>
                      {/if}
                      <button class="action-btn" onclick={() => toggleAdmin(user.id, user.is_admin)}>
                        {user.is_admin ? 'Demote to User' : 'Make Super Admin'}
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

    {:else if activeTab === 'flags'}
      <div class="tab-header"><h2>Reports & Flags</h2><p class="text-dim">Monitor seller and buyer violations</p></div>
      <div class="panel-card"><div class="table-container"><table class="custom-table"><thead><tr><th>Reported Entity</th><th>Issue Details</th><th>Severity</th><th>Date</th></tr></thead><tbody>{#each flags as flag (flag.id)}<tr><td><div class="font-medium">{flag.name}</div><div class="text-dim" style="font-size: 11px;">Type: {flag.type}</div></td><td>{flag.issue}</td><td><span class="badge {flag.severity === 'red' ? 'badge-danger' : flag.severity === 'yellow' ? 'badge-warning' : 'badge-success'}">{flag.severity === 'red' ? 'CRITICAL' : flag.severity === 'yellow' ? 'WARNING' : 'RESOLVED'}</span></td><td class="text-dim">{flag.date}</td></tr>{/each}</tbody></table></div></div>

    {:else if activeTab === 'logs'}
      <div class="tab-header"><h2>Activity Logs</h2><p class="text-dim">Full audit trail of all admin and system events</p></div>
      <div class="panel-card"><div class="table-container"><table class="custom-table"><thead><tr><th>Timestamp</th><th>Category</th><th>Actor</th><th>Action Event</th><th>Target</th></tr></thead><tbody>{#each logs as log (log.time)}<tr><td class="text-dim">{log.time}</td><td><span class="badge" style="background: {catColor[log.category]}22; color: {catColor[log.category]}">{log.category}</span></td><td class="font-medium">{log.actor}</td><td class="mono-cell">{log.action}</td><td class="text-dim">{log.target}</td></tr>{/each}</tbody></table></div></div>

    {:else if activeTab === 'settings'}
      <div class="tab-header"><h2>Core Settings</h2><p class="text-dim">Platform configuration and operational controls</p></div>
      <section class="panel-card">
        <div class="panel-header-tabs"><button class="tab-btn" class:active={settingsSubTab === 'catalog'} onclick={() => settingsSubTab = 'catalog'}>Catalog & Inventory</button><button class="tab-btn" class:active={settingsSubTab === 'logistics'} onclick={() => settingsSubTab = 'logistics'}>Logistics & Fulfillment</button><button class="tab-btn" class:active={settingsSubTab === 'operations'} onclick={() => settingsSubTab = 'operations'}>Operational Rules</button></div>
        <div class="settings-body">
          {#if settingsSubTab === 'catalog'}
            <div class="setting-row"><div class="setting-info"><h4>Variation Architecture</h4><p>Allow multi-tier properties down to inventory components.</p></div><label class="toggle-switch"><input type="checkbox" checked /><span class="slider"></span></label></div>
            <div class="setting-row"><div class="setting-info"><h4>Rule-Based Automated Categorization</h4><p>Deploy AI matching trees to handle marketplace sorting protocols automatically.</p></div><label class="toggle-switch"><input type="checkbox" /><span class="slider"></span></label></div>
            <div class="setting-row no-border"><button class="btn-primary">Save Catalog Settings</button></div>
          {/if}
          {#if settingsSubTab === 'logistics'} <div class="setting-placeholder"><p class="text-dim">Logistics parameters and real-time routing engines configuration options display here.</p></div> {/if}
          {#if settingsSubTab === 'operations'} <div class="setting-placeholder"><p class="text-dim">Financial ledger audit protocols and standard user clearance levels configuration display here.</p></div> {/if}
        </div>
      </section>
    {/if}

  </main>

  {#if showPermsModal && editingUser}
    <div class="modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget) showPermsModal = false }}>
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Edit User Roles</h3>
            <p class="text-dim modal-sub">Modifying access for <strong class="highlight-name">{editingUser.name || editingUser.email}</strong></p>
          </div>
          <button class="close-btn" onclick={() => showPermsModal = false}>✕</button>
        </div>
        
        <div class="modal-body">
          <p class="text-dim modal-hint">Assign specific administrative functionalities. Note: Making a user a "Super Admin" overrides these granular settings.</p>
          
          <div class="permissions-list">
            {#each availablePerms as perm}
              <label class="perm-row">
                <div class="perm-info">
                  <h4>{perm.label}</h4>
                  <p>{perm.desc}</p>
                </div>
                <div class="toggle-switch">
                  <input type="checkbox" bind:checked={tempPerms[perm.id]} />
                  <span class="slider"></span>
                </div>
              </label>
            {/each}
          </div>
        </div>

        <div class="modal-footer">
          <button class="action-btn" onclick={() => showPermsModal = false}>Cancel</button>
          <button class="btn-primary" onclick={savePermissions}>Save Configurations</button>
        </div>
      </div>
    </div>
  {/if}

  </div>
</div>

<style>
  .admin-page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--bg);
    color: var(--text-dark);
    font-family: var(--font-sans);
  }

  .admin-dashboard-container {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    position: relative;
  }

  .sidebar {
    width: 248px;
    background: var(--bg-card);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 1.25rem 1rem;
    flex-shrink: 0;
    box-shadow: var(--shadow-sm);
  }

  .brand-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--border);
    margin-bottom: 1.25rem;
  }

  .brand-avatar {
    width: 36px;
    height: 36px;
    background: var(--budol-orange);
    color: white;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
  }

  .brand-info h3 {
    font-size: 0.95rem;
    margin: 0;
    font-weight: 700;
    color: var(--text-dark);
  }

  .brand-info span {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .nav-menu {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: transparent;
    border: none;
    color: var(--text-muted);
    padding: 0.65rem 0.85rem;
    border-radius: var(--radius-sm);
    text-align: left;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    font-family: inherit;
    transition: all 0.15s ease;
  }

  .nav-item:hover {
    background: var(--bg);
    color: var(--text-dark);
  }

  .nav-item.active {
    background: var(--primary-light);
    color: var(--budol-orange);
  }

  .nav-badge-alert {
    margin-left: auto;
    background: var(--alert-red);
    color: white;
    font-size: 10px;
    padding: 2px 7px;
    border-radius: var(--radius-pill);
    font-weight: 700;
  }

  .sidebar-footer {
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }

  .main-content {
    flex: 1;
    padding: 1.75rem 2rem;
    background: var(--bg);
    overflow-y: auto;
    max-height: calc(100vh - 56px);
  }

  .loading-text {
    color: var(--text-muted);
    margin-top: 2rem;
    font-size: 14px;
  }

  .tab-header {
    margin-bottom: 1.75rem;
  }

  .tab-header h2 {
    margin: 0 0 0.25rem;
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text-dark);
  }

  .btn-primary {
    background: var(--budol-orange);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: var(--radius-pill);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s ease;
  }

  .btn-primary:hover {
    background: var(--budol-orange-hover);
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .input-group.full-width {
    grid-column: span 2;
  }

  .input-group label {
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .form-input {
    background: var(--bg-card);
    border: 1px solid var(--border);
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    color: var(--text-dark);
    font-size: 13px;
    font-family: inherit;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--budol-orange);
    box-shadow: 0 0 0 3px var(--primary-light);
  }

  .upload-zone {
    border: 1px dashed var(--border-strong);
    background: var(--bg);
    border-radius: var(--radius-md);
    padding: 2rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    transition: border-color 0.15s ease;
    cursor: pointer;
  }

  .upload-zone:hover {
    border-color: var(--budol-orange);
    background: var(--primary-light);
  }

  .form-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
  }

  .guidelines-box {
    padding: 1rem;
    background: var(--bg);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    font-size: 12px;
    color: var(--text-muted);
  }

  .guidelines-box ul {
    margin: 8px 0 0;
    padding-left: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.75rem;
  }

  .kpi-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: var(--shadow-sm);
    transition: transform 0.15s ease, border-color 0.15s ease;
  }

  .kpi-card:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 87, 34, 0.2);
  }

  .kpi-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .kpi-label {
    font-size: 0.8rem;
    color: var(--text-muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .kpi-icon {
    font-size: 1.25rem;
  }

  .kpi-value {
    font-size: 1.75rem;
    font-weight: 800;
    margin: 0.25rem 0;
    color: var(--text-dark);
  }

  .kpi-trend {
    font-size: 0.75rem;
    font-weight: 500;
  }

  .text-blue .kpi-value { color: var(--pin-blue); }
  .text-amber .kpi-value { color: var(--budol-orange); }
  .text-emerald .kpi-value { color: var(--success); }
  .text-rose .kpi-value { color: var(--alert-red); }
  .text-purple .kpi-value { color: #9c27b0; }
  .positive { color: var(--success); }
  .immediate { color: var(--alert-red); }
  .static { color: var(--text-muted); }

  .dashboard-split-panels {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.25rem;
  }

  .panel-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 1.25rem;
    margin-bottom: 1.25rem;
    box-shadow: var(--shadow-sm);
  }

  .panel-header {
    margin-bottom: 1rem;
  }

  .panel-header h3 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-dark);
  }

  .flex-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .geo-badge {
    font-size: 11px;
    background: var(--bg);
    color: var(--text-muted);
    border: 1px solid var(--border);
    padding: 3px 10px;
    border-radius: var(--radius-pill);
    font-weight: 600;
  }

  .geo-badge.muted {
    font-weight: 500;
  }

  .map-panel {
    min-height: 420px;
    display: flex;
    flex-direction: column;
  }

  .map-visualization-container {
    position: relative;
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--bg);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    overflow: hidden;
    padding: 1rem;
  }

  .bukidnon-svg {
    width: 100%;
    max-height: 340px;
  }

  .bukidnon-boundary {
    fill: rgba(76, 175, 80, 0.08);
    stroke: rgba(76, 175, 80, 0.35);
    stroke-width: 1.5;
    stroke-dasharray: 4 2;
  }

  .interactive-region-node {
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .interactive-region-node:hover {
    fill-opacity: 0.75;
    stroke: var(--budol-orange);
    stroke-width: 2px;
  }

  .map-node-text {
    fill: var(--text-dark);
    font-size: 11px;
    font-weight: 700;
    pointer-events: none;
    font-family: monospace;
  }

  .map-node-subtext {
    fill: var(--text-muted);
    font-size: 10px;
    font-weight: 600;
    pointer-events: none;
  }

  .map-tooltip {
    position: absolute;
    top: 12px;
    left: 12px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease;
    z-index: 10;
    box-shadow: var(--shadow-md);
  }

  .map-tooltip.visible {
    opacity: 1;
  }

  .map-tooltip strong {
    color: var(--text-dark);
    font-weight: 700;
  }

  .map-tooltip span {
    color: var(--budol-orange);
    font-weight: 600;
  }

  .table-container {
    overflow-x: auto;
  }

  .custom-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 0.85rem;
  }

  .custom-table th {
    padding: 0.75rem 1rem;
    background: var(--bg);
    color: var(--text-muted);
    font-weight: 700;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--border);
  }

  .custom-table td {
    padding: 0.9rem 1rem;
    border-bottom: 1px solid var(--border);
    color: var(--text-dark);
  }

  .custom-table tbody tr {
    transition: background-color 0.15s ease;
  }

  .custom-table tbody tr:hover {
    background-color: var(--bg);
  }

  .text-dim {
    color: var(--text-muted);
  }

  .text-right {
    text-align: right;
  }

  .font-medium {
    font-weight: 600;
    color: var(--text-dark);
  }

  .discount {
    color: var(--success);
  }

  .mono-cell {
    font-family: ui-monospace, monospace;
    color: var(--text-muted);
    font-size: 12px;
  }

  .btn-text {
    background: transparent;
    border: none;
    color: var(--budol-orange);
    cursor: pointer;
    text-decoration: none;
    font-size: 12px;
    font-weight: 600;
  }

  .btn-text:hover {
    color: var(--budol-orange-hover);
    text-decoration: underline;
  }

  .action-btn {
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--text-muted);
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    font-family: inherit;
    transition: all 0.15s ease;
  }

  .action-btn:hover {
    border-color: var(--border-strong);
    color: var(--text-dark);
  }

  .action-btn.approve {
    background: var(--success-bg);
    border-color: rgba(76, 175, 80, 0.3);
    color: var(--success);
  }

  .action-btn.reject {
    background: var(--error-bg);
    border-color: rgba(244, 67, 54, 0.25);
    color: var(--alert-red);
  }

  .action-btn.info {
    background: rgba(33, 150, 243, 0.1);
    border-color: rgba(33, 150, 243, 0.25);
    color: var(--pin-blue);
  }

  .ctr-bar {
    width: 60px;
    height: 6px;
    background: var(--bg);
    border-radius: 3px;
    overflow: hidden;
  }

  .ctr-fill {
    height: 100%;
    background: var(--budol-orange);
    border-radius: 3px;
  }

  .status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 8px;
  }

  .dot-red { background: var(--alert-red); }
  .dot-yellow { background: var(--budol-orange); }
  .dot-green { background: var(--success); }

  .badge {
    padding: 0.25rem 0.55rem;
    border-radius: var(--radius-pill);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .badge-success { background: var(--success-bg); color: var(--success); }
  .badge-warning { background: var(--primary-light); color: var(--budol-orange); }
  .badge-danger { background: var(--error-bg); color: var(--alert-red); }
  .badge-info { background: rgba(33, 150, 243, 0.12); color: var(--pin-blue); }
  .badge-neutral { background: var(--bg); color: var(--text-muted); }

  .panel-header-tabs {
    display: flex;
    gap: 0.5rem;
    border-bottom: 1px solid var(--border);
    margin-bottom: 1rem;
  }

  .tab-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    padding: 0.75rem 0.85rem;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
    font-family: inherit;
    border-bottom: 2px solid transparent;
    transition: all 0.15s ease;
  }

  .tab-btn:hover,
  .tab-btn.active {
    color: var(--text-dark);
  }

  .tab-btn.active {
    border-bottom-color: var(--budol-orange);
    color: var(--budol-orange);
  }

  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
    flex-shrink: 0;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background-color: var(--border-strong);
    transition: 0.2s;
    border-radius: 24px;
  }

  .slider:before {
    position: absolute;
    content: '';
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.2s;
    border-radius: 50%;
    box-shadow: var(--shadow-sm);
  }

  input:checked + .slider {
    background-color: var(--budol-orange);
  }

  input:checked + .slider:before {
    transform: translateX(20px);
  }

  .setting-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 0;
    border-bottom: 1px solid var(--border);
    gap: 1rem;
  }

  .setting-row.no-border {
    border-bottom: none;
  }

  .setting-info h4 {
    margin: 0 0 0.25rem;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-dark);
  }

  .setting-info p {
    margin: 0;
    font-size: 0.82rem;
    color: var(--text-muted);
  }

  .setting-placeholder {
    padding: 3rem 1rem;
    text-align: center;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
  }

  .modal-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 540px;
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes modalIn {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .modal-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 800;
    color: var(--text-dark);
  }

  .modal-sub {
    margin: 4px 0 0;
    font-size: 12px;
  }

  .highlight-name {
    color: var(--budol-orange);
  }

  .modal-hint {
    margin: 0 0 1.5rem;
    font-size: 13px;
  }

  .close-btn {
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text-muted);
    font-size: 1rem;
    cursor: pointer;
    line-height: 1;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    transition: all 0.15s ease;
  }

  .close-btn:hover {
    color: var(--text-dark);
    border-color: var(--border-strong);
  }

  .modal-body {
    padding: 1.5rem;
    max-height: 60vh;
    overflow-y: auto;
  }

  .permissions-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .perm-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: border-color 0.15s ease;
  }

  .perm-row:hover {
    border-color: var(--budol-orange);
  }

  .perm-info h4 {
    margin: 0 0 4px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-dark);
  }

  .perm-info p {
    margin: 0;
    font-size: 12px;
    color: var(--text-muted);
  }

  .modal-footer {
    padding: 1.25rem 1.5rem;
    border-top: 1px solid var(--border);
    background: var(--bg);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  @media (max-width: 900px) {
    .admin-dashboard-container {
      flex-direction: column;
    }

    .sidebar {
      width: 100%;
    }

    .main-content {
      max-height: none;
    }
  }
</style>