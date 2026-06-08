<script lang="ts">
  import { onMount } from 'svelte'
  import { supabase } from '$lib/supabase'
  import { getUser } from '$lib/auth'
  import { goto } from '$app/navigation'
  

  type Tab = 'overview' | 'ads' | 'users' | 'flags' | 'logs' | 'settings'

  interface Shop { id: string; name: string; category: string; address: string; created_at: string }
  interface Profile { id: string; name: string; email: string; is_admin: boolean; created_at: string }

  let activeTab = $state<Tab>('overview')
  let shops = $state<Shop[]>([])
  let users = $state<Profile[]>([])
  let loading = $state(true)
  let totalProducts = $state(0)
  let adminName = $state('Super Admin')
  

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

  const catColor: Record<string, string> = {
    AUTH: '#6366f1', ADMIN: '#f59e0b', USER: '#10b981', SYS: '#6b7280', REPORT: '#ef4444', AD: '#3b82f6'
  }

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
    users = usersRes.data ?? []
    totalProducts = productsRes.data?.length ?? 0
    loading = false
  })

  async function deleteShop(id: string) {
    if (!confirm('Delete this shop?')) return
    await supabase.from('shops').delete().eq('id', id)
    shops = shops.filter(s => s.id !== id)
  }

  async function toggleAdmin(userId: string, current: boolean) {
    await supabase.from('profiles').update({ is_admin: !current }).eq('id', userId)
    users = users.map(u => u.id === userId ? { ...u, is_admin: !current } : u)
  }

  const navItems: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '⊞' },
    { id: 'ads', label: 'Ads & Promotions', icon: '◈' },
    { id: 'users', label: 'User Management', icon: '👤' },
    { id: 'flags', label: 'Reports & Flags', icon: '⚑' },
    { id: 'logs', label: 'Activity Logs', icon: '≡' },
    { id: 'settings', label: 'Settings', icon: '⚙' },
  ]

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
</script>

<div style="display: flex; height: 100vh; background: #0f0f0f; color: #e0e0e0; font-family: 'Segoe UI', sans-serif; overflow: hidden;">

  <!-- Sidebar -->
  <aside style="width: 200px; background: #141414; border-right: 1px solid #222; display: flex; flex-direction: column; flex-shrink: 0;">
    <div style="padding: 1rem 1.25rem; border-bottom: 1px solid #222; display: flex; align-items: center; gap: 8px;">
      <div style="width: 24px; height: 24px; background: #3b82f6; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px;">⊙</div>
      <span style="font-size: 12px; font-weight: 600; color: #fff; letter-spacing: 0.05em;">ADMIN CONSOLE</span>
    </div>
    <nav style="padding: 0.75rem 0; flex: 1;">
      <p style="font-size: 10px; color: #555; padding: 0 1rem; margin-bottom: 4px; letter-spacing: 0.08em;">NAVIGATION</p>
      {#each navItems as item (item.id)}
        <button
          onclick={() => activeTab = item.id}
          style="width: 100%; text-align: left; padding: 8px 1rem; font-size: 13px; background: {activeTab === item.id ? '#1e1e1e' : 'transparent'}; color: {activeTab === item.id ? '#fff' : '#888'}; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; border-left: 2px solid {activeTab === item.id ? '#3b82f6' : 'transparent'};">
          <span>{item.icon}</span>
          {item.label}
          {#if item.id === 'flags'}
            <span style="margin-left: auto; background: #ef4444; color: white; font-size: 10px; padding: 1px 6px; border-radius: 10px;">{flags.filter(f => f.severity === 'red').length}</span>
          {/if}
        </button>
      {/each}
    </nav>
    <div style="padding: 0.75rem 1rem; border-top: 1px solid #222; font-size: 11px; color: #555; display: flex; align-items: center; gap: 6px;">
      <span style="width: 6px; height: 6px; background: #10b981; border-radius: 50%; display: inline-block;"></span>
      System operational
    </div>
  </aside>

  <!-- Main -->
  <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">

    <!-- Topbar -->
    <header style="background: #141414; border-bottom: 1px solid #222; padding: 0.75rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
      <span style="font-size: 14px; font-weight: 500; color: #fff;">{navItems.find(n => n.id === activeTab)?.label}</span>
      <div style="display: flex; align-items: center; gap: 12px;">
        <a href="/" style="font-size: 12px; color: #666; text-decoration: none;">← Back to site</a>
        <div style="width: 28px; height: 28px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700;">{adminName[0]}</div>
        <span style="font-size: 13px; color: #ccc;">{adminName}</span>
      </div>
    </header>

    <!-- Content -->
    <main style="flex: 1; overflow-y: auto; padding: 1.5rem;">

      {#if loading}
        <p style="color: #555;">Loading...</p>

      {:else if activeTab === 'overview'}
        <h2 style="font-size: 1.3rem; font-weight: 600; color: #fff; margin-bottom: 4px;">Dashboard Overview</h2>
        <p style="font-size: 13px; color: #555; margin-bottom: 1.5rem;">{today}</p>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 1.5rem;">
          {#each [
            { label: 'Registered Shops', value: shops.length, sub: 'on the map' },
            { label: 'Total Users', value: users.length, sub: 'registered' },
            { label: 'Total Products', value: totalProducts, sub: 'listed' },
            { label: 'Open Flags', value: flags.filter(f => f.severity !== 'green').length, sub: `${flags.filter(f => f.severity === 'red').length} critical` }
          ] as card (card.label)}
            <div style="background: #1a1a1a; border: 1px solid #222; border-radius: 10px; padding: 1.25rem;">
              <div style="font-size: 26px; font-weight: 700; color: #fff;">{card.value}</div>
              <div style="font-size: 13px; color: #aaa; margin-top: 2px;">{card.label}</div>
              <div style="font-size: 11px; color: #555; margin-top: 2px;">{card.sub}</div>
            </div>
          {/each}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div style="background: #1a1a1a; border: 1px solid #222; border-radius: 10px; padding: 1.25rem;">
            <h3 style="font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 1rem;">Recent Shops</h3>
            {#each shops.slice(0, 5) as shop (shop.id)}
              <div style="display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #1e1e1e; font-size: 13px;">
                <span style="color: #ccc;">{shop.name}</span>
                <span style="color: #555; font-size: 12px;">{shop.category}</span>
              </div>
            {/each}
          </div>
          <div style="background: #1a1a1a; border: 1px solid #222; border-radius: 10px; padding: 1.25rem;">
            <h3 style="font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 1rem;">Recent Flags</h3>
            {#each flags as flag (flag.id)}
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid #1e1e1e; font-size: 13px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; background: {flag.severity === 'red' ? '#ef4444' : flag.severity === 'yellow' ? '#f59e0b' : '#10b981'}; display: inline-block;"></span>
                  <span style="color: #ccc;">{flag.name}</span>
                </div>
                <span style="color: #555; font-size: 12px;">{flag.issue}</span>
              </div>
            {/each}
          </div>
        </div>

      {:else if activeTab === 'ads'}
        <h2 style="font-size: 1.3rem; font-weight: 600; color: #fff; margin-bottom: 4px;">Ads & Promotions</h2>
        <p style="font-size: 13px; color: #555; margin-bottom: 1.5rem;">Manage campaigns and user preference targeting</p>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 1.5rem;">
          {#each [
            { label: 'TOTAL SPEND', value: '₱850' },
            { label: 'TOTAL IMPRESSIONS', value: '6,900' },
            { label: 'TOTAL CLICKS', value: '454' }
          ] as stat (stat.label)}
            <div style="background: #1a1a1a; border: 1px solid #222; border-radius: 10px; padding: 1.25rem;">
              <div style="font-size: 10px; color: #555; letter-spacing: 0.08em; margin-bottom: 6px;">{stat.label}</div>
              <div style="font-size: 24px; font-weight: 700; color: #fff;">{stat.value}</div>
            </div>
          {/each}
        </div>
        <div style="background: #1a1a1a; border: 1px solid #222; border-radius: 10px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid #222;">
                {#each ['CAMPAIGN', 'TYPE', 'TARGET', 'BUDGET', 'IMPRESSIONS', 'CLICKS', 'STATUS'] as h (h)}
                  <th style="text-align: left; padding: 10px 16px; font-size: 11px; color: #555; letter-spacing: 0.05em;">{h}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each ads as ad (ad.name)}
                <tr style="border-bottom: 1px solid #1e1e1e;">
                  <td style="padding: 10px 16px; font-size: 13px; color: #ccc;">{ad.name}</td>
                  <td style="padding: 10px 16px; font-size: 13px; color: #666;">{ad.type}</td>
                  <td style="padding: 10px 16px; font-size: 13px; color: #666;">{ad.target}</td>
                  <td style="padding: 10px 16px; font-size: 13px; color: #ccc;">{ad.budget}</td>
                  <td style="padding: 10px 16px; font-size: 13px; color: #666;">{ad.impressions.toLocaleString()}</td>
                  <td style="padding: 10px 16px; font-size: 13px; color: #666;">{ad.clicks}</td>
                  <td style="padding: 10px 16px;">
                    <span style="font-size: 11px; padding: 2px 8px; border-radius: 20px; background: {ad.status === 'active' ? '#052e16' : '#1c1917'}; color: {ad.status === 'active' ? '#10b981' : '#f59e0b'};">{ad.status}</span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

      {:else if activeTab === 'users'}
        <h2 style="font-size: 1.3rem; font-weight: 600; color: #fff; margin-bottom: 4px;">User Management</h2>
        <p style="font-size: 13px; color: #555; margin-bottom: 1.5rem;">Assign co-managers and manage access</p>
        <div style="background: #1a1a1a; border: 1px solid #222; border-radius: 10px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid #222;">
                {#each ['USER', 'ROLE', 'JOINED', 'ACTIONS'] as h (h)}
                  <th style="text-align: left; padding: 10px 16px; font-size: 11px; color: #555; letter-spacing: 0.05em;">{h}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each users as user (user.id)}
                <tr style="border-bottom: 1px solid #1e1e1e;">
                  <td style="padding: 10px 16px;">
                    <div style="font-size: 13px; color: #ccc;">{user.name ?? '—'}</div>
                    <div style="font-size: 11px; color: #555;">{user.email ?? '—'}</div>
                  </td>
                  <td style="padding: 10px 16px;">
                    <span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: {user.is_admin ? '#1e3a5f' : '#1e1e1e'}; color: {user.is_admin ? '#3b82f6' : '#666'};">{user.is_admin ? 'admin' : 'user'}</span>
                  </td>
                  <td style="padding: 10px 16px; font-size: 12px; color: #555;">{new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td style="padding: 10px 16px;">
                    <button onclick={() => toggleAdmin(user.id, user.is_admin)} style="font-size: 11px; padding: 4px 10px; background: #222; color: #aaa; border: 1px solid #333; border-radius: 4px; cursor: pointer;">{user.is_admin ? 'Remove admin' : 'Make admin'}</button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

      {:else if activeTab === 'flags'}
        <h2 style="font-size: 1.3rem; font-weight: 600; color: #fff; margin-bottom: 4px;">Reports & Flags</h2>
        <p style="font-size: 13px; color: #555; margin-bottom: 1.5rem;">Monitor seller and buyer violations and compliance</p>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 1.5rem;">
          {#each [
            { label: 'Critical', count: flags.filter(f => f.severity === 'red').length, color: '#ef4444', bg: '#1c0a0a' },
            { label: 'Warning', count: flags.filter(f => f.severity === 'yellow').length, color: '#f59e0b', bg: '#1c1300' },
            { label: 'Resolved', count: flags.filter(f => f.severity === 'green').length, color: '#10b981', bg: '#052e16' }
          ] as stat (stat.label)}
            <div style="background: {stat.bg}; border: 1px solid {stat.color}33; border-radius: 10px; padding: 1.25rem;">
              <div style="font-size: 28px; font-weight: 700; color: {stat.color};">{stat.count}</div>
              <div style="font-size: 13px; color: {stat.color}; margin-top: 2px;">{stat.label}</div>
            </div>
          {/each}
        </div>
        <div style="background: #1a1a1a; border: 1px solid #222; border-radius: 10px; overflow: hidden;">
          {#each flags as flag (flag.id)}
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #1e1e1e;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 16px;">{flag.severity === 'red' ? '🔴' : flag.severity === 'yellow' ? '🟡' : '🟢'}</span>
                <div>
                  <span style="font-size: 13px; color: #ccc;">{flag.name}</span>
                  <span style="font-size: 11px; background: #222; color: #666; padding: 1px 6px; border-radius: 4px; margin-left: 8px;">{flag.type}</span>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 16px;">
                <span style="font-size: 13px; color: #666;">{flag.issue}</span>
                <span style="font-size: 11px; padding: 2px 8px; border-radius: 20px; background: {flag.severity === 'red' ? '#450a0a' : flag.severity === 'yellow' ? '#1c1300' : '#052e16'}; color: {flag.severity === 'red' ? '#ef4444' : flag.severity === 'yellow' ? '#f59e0b' : '#10b981'};">{flag.severity === 'red' ? 'Critical' : flag.severity === 'yellow' ? 'Warning' : 'Resolved'}</span>
                <span style="font-size: 12px; color: #555;">{flag.date}</span>
              </div>
            </div>
          {/each}
        </div>

      {:else if activeTab === 'logs'}
        <h2 style="font-size: 1.3rem; font-weight: 600; color: #fff; margin-bottom: 4px;">Activity Logs</h2>
        <p style="font-size: 13px; color: #555; margin-bottom: 1.5rem;">Full audit trail of all admin and system events</p>
        <div style="background: #1a1a1a; border: 1px solid #222; border-radius: 10px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid #222;">
                {#each ['TIMESTAMP', 'CATEGORY', 'ACTOR', 'ACTION', 'TARGET'] as h (h)}
                  <th style="text-align: left; padding: 10px 16px; font-size: 11px; color: #555; letter-spacing: 0.05em;">{h}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each logs as log (log.time)}
                <tr style="border-bottom: 1px solid #1e1e1e;">
                  <td style="padding: 10px 16px; font-size: 12px; color: #555; white-space: nowrap;">{log.time}</td>
                  <td style="padding: 10px 16px;">
                    <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: {catColor[log.category]}22; color: {catColor[log.category]}; font-weight: 600; letter-spacing: 0.05em;">{log.category}</span>
                  </td>
                  <td style="padding: 10px 16px; font-size: 13px; color: #ccc;">{log.actor}</td>
                  <td style="padding: 10px 16px; font-size: 12px; color: #888; font-family: monospace;">{log.action}</td>
                  <td style="padding: 10px 16px; font-size: 13px; color: #666;">{log.target}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        {:else if activeTab === 'settings'}
  <h2 style="font-size: 1.3rem; font-weight: 600; color: #fff; margin-bottom: 4px;">Settings</h2>
  <p style="font-size: 13px; color: #555; margin-bottom: 1.5rem;">Platform configuration and operational controls</p>

  <!-- Catalog & Inventory -->
  <div style="background: #1a1a1a; border: 1px solid #222; border-radius: 10px; padding: 1.5rem; margin-bottom: 16px;">
    <h3 style="font-size: 13px; font-weight: 600; color: #3b82f6; letter-spacing: 0.08em; margin-bottom: 1.25rem;">CATALOG & INVENTORY MANAGEMENT</h3>

    <div style="display: flex; flex-direction: column; gap: 1.25rem;">

      <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1.25rem; border-bottom: 1px solid #222;">
        <div style="max-width: 60%;">
          <p style="font-size: 13px; color: #ccc; font-weight: 500; margin-bottom: 4px;">Variation Architecture</p>
          <p style="font-size: 12px; color: #555; line-height: 1.5;">Enable parent-child SKU structure. Each variation (size, color) gets independent stock levels, SKU codes, and pricing under a unified parent listing.</p>
        </div>
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input type="checkbox" checked style="width: 16px; height: 16px; accent-color: #3b82f6;" />
          <span style="font-size: 12px; color: #888;">Enabled</span>
        </label>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1.25rem; border-bottom: 1px solid #222;">
        <div style="max-width: 60%;">
          <p style="font-size: 13px; color: #ccc; font-weight: 500; margin-bottom: 4px;">Rule-Based Categorization</p>
          <p style="font-size: 12px; color: #555; line-height: 1.5;">Auto-populate shop categories using configured filters. Rules can be based on brand, price range, or upload timestamp.</p>
          <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
            {#each ['By Brand', 'By Price', 'By Upload Time'] as rule (rule)}
              <span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: #1e3a5f; color: #3b82f6;">{rule}</span>
            {/each}
          </div>
        </div>
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input type="checkbox" checked style="width: 16px; height: 16px; accent-color: #3b82f6;" />
          <span style="font-size: 12px; color: #888;">Enabled</span>
        </label>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="max-width: 60%;">
          <p style="font-size: 13px; color: #ccc; font-weight: 500; margin-bottom: 4px;">Stock Synchronization</p>
          <p style="font-size: 12px; color: #555; line-height: 1.5;">Sync inventory across multiple warehouse locations and trigger automated low-stock alerts.</p>
          <div style="display: flex; gap: 16px; margin-top: 10px;">
            <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #888; cursor: pointer;">
              <input type="checkbox" checked style="accent-color: #3b82f6;" /> Multi-warehouse sync
            </label>
            <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #888; cursor: pointer;">
              <input type="checkbox" checked style="accent-color: #3b82f6;" /> Low-stock alerts
            </label>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-end;">
          <label style="font-size: 12px; color: #555;">Alert threshold</label>
          <input type="number" value="10" style="width: 80px; background: #111; border: 1px solid #333; color: #ccc; padding: 4px 8px; border-radius: 6px; font-size: 13px; text-align: center;" />
          <span style="font-size: 11px; color: #555;">units remaining</span>
        </div>
      </div>

    </div>
  </div>

  <!-- Logistics & Fulfillment -->
  <div style="background: #1a1a1a; border: 1px solid #222; border-radius: 10px; padding: 1.5rem; margin-bottom: 16px;">
    <h3 style="font-size: 13px; font-weight: 600; color: #10b981; letter-spacing: 0.08em; margin-bottom: 1.25rem;">LOGISTICS & FULFILLMENT</h3>

    <div style="display: flex; flex-direction: column; gap: 1.25rem;">

      <div style="padding-bottom: 1.25rem; border-bottom: 1px solid #222;">
        <p style="font-size: 13px; color: #ccc; font-weight: 500; margin-bottom: 4px;">Dimensional Weight Constraints</p>
        <p style="font-size: 12px; color: #555; margin-bottom: 12px; line-height: 1.5;">Parcel dimensions fed to logistics APIs for real-time shipping fee calculation at checkout.</p>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
          {#each [
            { label: 'Length (cm)', val: '30' },
            { label: 'Width (cm)', val: '20' },
            { label: 'Height (cm)', val: '15' },
            { label: 'Weight (kg)', val: '2.5' }
          ] as dim (dim.label)}
            <div>
              <label style="font-size: 11px; color: #555; display: block; margin-bottom: 4px;">{dim.label}</label>
              <input type="number" value={dim.val} style="width: 100%; background: #111; border: 1px solid #333; color: #ccc; padding: 6px 8px; border-radius: 6px; font-size: 13px;" />
            </div>
          {/each}
        </div>
      </div>

      <div style="padding-bottom: 1.25rem; border-bottom: 1px solid #222;">
        <p style="font-size: 13px; color: #ccc; font-weight: 500; margin-bottom: 4px;">Address Routing</p>
        <p style="font-size: 12px; color: #555; margin-bottom: 12px;">Maps physical locations to courier operational zones.</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <label style="font-size: 11px; color: #555; display: block; margin-bottom: 4px;">Default Pickup Address</label>
            <input type="text" placeholder="e.g. Malaybalay City, Bukidnon" style="width: 100%; background: #111; border: 1px solid #333; color: #ccc; padding: 6px 8px; border-radius: 6px; font-size: 13px;" />
          </div>
          <div>
            <label style="font-size: 11px; color: #555; display: block; margin-bottom: 4px;">Return Address</label>
            <input type="text" placeholder="e.g. Manolo Fortich, Bukidnon" style="width: 100%; background: #111; border: 1px solid #333; color: #ccc; padding: 6px 8px; border-radius: 6px; font-size: 13px;" />
          </div>
        </div>
      </div>

      <div>
        <p style="font-size: 13px; color: #ccc; font-weight: 500; margin-bottom: 4px;">3PL Channel Toggles</p>
        <p style="font-size: 12px; color: #555; margin-bottom: 12px;">Enable or disable logistics providers at the platform level.</p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          {#each [
            { name: 'LBC Express', type: 'Standard Delivery', enabled: true },
            { name: 'J&T Express', type: 'Economy Delivery', enabled: true },
            { name: 'Ninja Van', type: 'Same-Day', enabled: false },
            { name: 'GoGo Express', type: 'On-Demand', enabled: false },
          ] as courier (courier.name)}
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #111; border-radius: 8px; border: 1px solid #222;">
              <div>
                <span style="font-size: 13px; color: #ccc;">{courier.name}</span>
                <span style="font-size: 11px; color: #555; margin-left: 8px;">{courier.type}</span>
              </div>
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" checked={courier.enabled} style="width: 14px; height: 14px; accent-color: #10b981;" />
                <span style="font-size: 12px; color: {courier.enabled ? '#10b981' : '#555'};">{courier.enabled ? 'Active' : 'Inactive'}</span>
              </label>
            </div>
          {/each}
        </div>
      </div>

    </div>
  </div>

  <!-- Operational & Financial -->
  <div style="background: #1a1a1a; border: 1px solid #222; border-radius: 10px; padding: 1.5rem; margin-bottom: 16px;">
    <h3 style="font-size: 13px; font-weight: 600; color: #f59e0b; letter-spacing: 0.08em; margin-bottom: 1.25rem;">OPERATIONAL & FINANCIAL CONTROLS</h3>

    <div style="display: flex; flex-direction: column; gap: 1.25rem;">

      <div style="padding-bottom: 1.25rem; border-bottom: 1px solid #222;">
        <p style="font-size: 13px; color: #ccc; font-weight: 500; margin-bottom: 4px;">Role-Based Access Control</p>
        <p style="font-size: 12px; color: #555; margin-bottom: 12px; line-height: 1.5;">Grant restricted modular access to sub-accounts. Configure what each role can view or modify.</p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          {#each [
            { role: 'Customer Service', perms: ['View Orders', 'Handle Disputes'], color: '#3b82f6' },
            { role: 'Warehouse Manager', perms: ['Manage Inventory', 'Update Stock'], color: '#10b981' },
            { role: 'Finance Staff', perms: ['View Reports', 'Settlement Access'], color: '#f59e0b' },
          ] as rbac (rbac.role)}
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #111; border-radius: 8px; border: 1px solid #222;">
              <span style="font-size: 13px; color: #ccc;">{rbac.role}</span>
              <div style="display: flex; gap: 6px;">
                {#each rbac.perms as perm (perm)}
                  <span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: {rbac.color}22; color: {rbac.color};">{perm}</span>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div style="padding-bottom: 1.25rem; border-bottom: 1px solid #222;">
        <p style="font-size: 13px; color: #ccc; font-weight: 500; margin-bottom: 4px;">Settlement Preferences</p>
        <p style="font-size: 12px; color: #555; margin-bottom: 12px;">Configure auto-withdrawal intervals and bank account binding.</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <label style="font-size: 11px; color: #555; display: block; margin-bottom: 4px;">Auto-withdrawal Interval</label>
            <select style="width: 100%; background: #111; border: 1px solid #333; color: #ccc; padding: 6px 8px; border-radius: 6px; font-size: 13px;">
              <option>Every 7 days</option>
              <option>Every 14 days</option>
              <option>Every 30 days</option>
              <option>Manual only</option>
            </select>
          </div>
          <div>
            <label style="font-size: 11px; color: #555; display: block; margin-bottom: 4px;">Tax ID (TIN)</label>
            <input type="text" placeholder="e.g. 123-456-789-000" style="width: 100%; background: #111; border: 1px solid #333; color: #ccc; padding: 6px 8px; border-radius: 6px; font-size: 13px;" />
          </div>
        </div>
      </div>

      <div>
        <p style="font-size: 13px; color: #ccc; font-weight: 500; margin-bottom: 4px;">Partner & Webhook Integration</p>
        <p style="font-size: 12px; color: #555; margin-bottom: 12px;">Connect external ERPs or multi-channel fulfillment tools via API.</p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          {#each [
            { name: 'ERP Webhook URL', placeholder: 'https://your-erp.com/webhook', enabled: false },
            { name: 'Fulfillment API Key', placeholder: 'sk_live_...', enabled: false },
          ] as integration (integration.name)}
            <div style="padding: 10px 12px; background: #111; border-radius: 8px; border: 1px solid #222;">
              <label style="font-size: 11px; color: #555; display: block; margin-bottom: 6px;">{integration.name}</label>
              <input type="text" placeholder={integration.placeholder} style="width: 100%; background: #0a0a0a; border: 1px solid #2a2a2a; color: #ccc; padding: 6px 8px; border-radius: 6px; font-size: 12px; font-family: monospace;" />
            </div>
          {/each}
        </div>
      </div>

    </div>
  </div>

  <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
    <button style="padding: 8px 24px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 13px; cursor: pointer;">Save Settings</button>
  </div>

      {/if}
      

    </main>
  </div>
</div>