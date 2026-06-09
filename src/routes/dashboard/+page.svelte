<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { loginUrl } from '$lib/navigation'
  import { getUser } from '$lib/auth'
  import NavBar from '$lib/NavBar.svelte'
  import LocationPicker from '$lib/LocationPicker.svelte'
  import {
    fetchMyShop,
    updateShop,
    addListing,
    updateListing,
    deleteListing,
    type SellerShop,
    type BusinessType,
    type SellerProduct
  } from '$lib/seller'
  import ListingEditor from '$lib/ListingEditor.svelte'
  import {
    emptyListingForm,
    listingFromProduct,
    formatDetailChips,
    getProductIndustry,
    getServiceType
  } from '$lib/listingCatalog'
  import type { ListingFormData } from '$lib/listingCatalog'
  import type { User } from '@supabase/supabase-js'

  type Tab = 'overview' | 'setup' | 'listings'

  let user = $state<User | null>(null)
  let shop = $state<SellerShop | null>(null)
  let loading = $state(true)
  let saving = $state(false)
  let error = $state('')
  let success = $state('')
  let activeTab = $state<Tab>('overview')

  let businessType = $state<BusinessType>('product')
  let shopName = $state('')
  let category = $state('Food')
  let description = $state('')
  let address = $state('')
  let lat = $state(7.9064)
  let lng = $state(125.0948)
  let locationPinned = $state(false)

  let listingForm = $state<ListingFormData>(emptyListingForm('product'))
  let editingListingId = $state<string | null>(null)
  let showEditor = $state(false)
  let savingListing = $state(false)

  const categories = ['Food', 'Clothing', 'Electronics', 'Services', 'Health & Beauty', 'Other']

  let listings = $derived(shop?.products ?? [])
  let listingLabel = $derived(businessType === 'service' ? 'Service' : 'Product')
  let listingsTitle = $derived(businessType === 'service' ? 'Your Services' : 'Your Products')
  let setupProgress = $derived.by(() => {
    let done = 0
    if (businessType) done++
    if (shopName.trim()) done++
    if (description.trim()) done++
    if (address.trim() && locationPinned) done++
    return Math.round((done / 4) * 100)
  })

  onMount(async () => {
    user = await getUser()
    if (!user) {
      goto(loginUrl('/dashboard'))
      return
    }

    try {
      shop = await fetchMyShop(user.id)
      if (shop) populateForm(shop)
      activeTab = shop?.shop_setup_complete ? 'overview' : 'setup'
    } catch (e) {
      shop = null
    } finally {
      loading = false
    }
  })

  function populateForm(s: SellerShop) {
    businessType = s.business_type === 'service' ? 'service' : 'product'
    shopName = s.name
    category = s.category
    description = s.description || ''
    address = s.address || ''
    lat = s.lat
    lng = s.lng
    locationPinned = !!(s.lat && s.lng)
  }

  function statusBadge(status: string | null | undefined) {
    if (status === 'approved' || !status) return { label: 'Live on Map', class: 'ok' }
    if (status === 'pending') return { label: 'Pending Review', class: 'pending' }
    return { label: 'Rejected', class: 'rejected' }
  }

  async function saveShopSetup() {
    if (!shop) return
    if (!shopName.trim() || !address.trim() || !locationPinned) {
      error = 'Complete shop name, address, and pin your location on the map.'
      return
    }

    saving = true
    error = ''
    success = ''

    try {
      shop = await updateShop(shop.id, {
        name: shopName.trim(),
        category,
        description: description.trim(),
        address: address.trim(),
        lat,
        lng,
        business_type: businessType,
        shop_setup_complete: true
      })
      success = 'Shop setup saved successfully.'
      activeTab = 'listings'
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not save shop setup.'
    } finally {
      saving = false
    }
  }

  function openNewListing() {
    listingForm = emptyListingForm(businessType)
    editingListingId = null
    showEditor = true
    error = ''
    success = ''
  }

  function openEditListing(item: SellerProduct) {
    listingForm = listingFromProduct(item)
    editingListingId = item.id
    showEditor = true
    error = ''
    success = ''
  }

  function cancelListingEdit() {
    showEditor = false
    editingListingId = null
    listingForm = emptyListingForm(businessType)
  }

  function buildListingPayload() {
    return {
      name: listingForm.name.trim(),
      price: parseFloat(listingForm.price) || 0,
      description: listingForm.description.trim(),
      highlights: listingForm.highlights.trim(),
      listing_type: businessType,
      industry: listingForm.industryId,
      subcategory: listingForm.subcategory,
      image_data: listingForm.imageData || undefined,
      image_name: listingForm.imageName || undefined,
      details: listingForm.details
    }
  }

  async function handleSaveListing() {
    if (!shop || !listingForm.name.trim()) return
    savingListing = true
    error = ''

    try {
      const payload = buildListingPayload()
      let item: SellerProduct

      if (editingListingId) {
        item = await updateListing(editingListingId, payload)
        shop = {
          ...shop,
          products: (shop.products ?? []).map((p) => (p.id === item.id ? item : p))
        }
        success = `${listingLabel} updated.`
      } else {
        item = await addListing(shop.id, payload)
        shop = { ...shop, products: [item, ...(shop.products ?? [])] }
        success = `${listingLabel} published.`
      }

      showEditor = false
      editingListingId = null
      listingForm = emptyListingForm(businessType)
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not save listing.'
    } finally {
      savingListing = false
    }
  }

  async function handleDeleteListing(id: string) {
    if (!shop) return
    try {
      await deleteListing(id)
      shop = { ...shop, products: (shop.products ?? []).filter((p) => p.id !== id) }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not delete listing.'
    }
  }

</script>

<div class="dashboard-page">
  <NavBar variant="dark" />
  <div class="dashboard">
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-icon">🏪</span>
      <div>
        <strong>Seller Dashboard</strong>
        <span>{user?.email ?? 'Loading…'}</span>
      </div>
    </div>

    <nav class="nav">
      <button class="nav-btn" class:active={activeTab === 'overview'} onclick={() => (activeTab = 'overview')}>
        <span>⊞</span> Overview
      </button>
      <button class="nav-btn" class:active={activeTab === 'setup'} onclick={() => (activeTab = 'setup')}>
        <span>⚙</span> Set Up Your Shop
        {#if shop && !shop.shop_setup_complete}<span class="nav-dot"></span>{/if}
      </button>
      <button class="nav-btn" class:active={activeTab === 'listings'} onclick={() => (activeTab = 'listings')} disabled={!shop}>
        <span>{businessType === 'service' ? '🛠' : '📦'}</span>
        {businessType === 'service' ? 'Services' : 'Products'}
      </button>
    </nav>

    <div class="sidebar-footer">
      {#if shop?.verification_status === 'approved' || !shop?.verification_status}
        <a href="/shops/{shop?.id}" class="link-btn">View Public Shop</a>
      {/if}
    </div>
  </aside>

  <main class="main">
    {#if loading}
      <p class="muted">Loading your seller account…</p>
    {:else if !shop}
      <div class="empty-state">
        <span class="empty-icon">🏛️</span>
        <h1>No shop registered yet</h1>
        <p>Complete seller registration with LGU business permit verification before setting up your shop.</p>
        <a href="/register" class="primary-btn">Register as Seller</a>
      </div>
    {:else}
      {#if error}<div class="alert error">{error}</div>{/if}
      {#if success}<div class="alert success">{success}</div>{/if}

      {#if activeTab === 'overview'}
        <header class="page-header">
          <div>
            <h1>Welcome back{shop.owner_name ? `, ${shop.owner_name.split(' ')[0]}` : ''}</h1>
            <p>Manage <strong>{shop.name}</strong> from your seller dashboard.</p>
          </div>
          {#if shop.verification_status}
            {@const badge = statusBadge(shop.verification_status)}
            <span class="status-badge {badge.class}">{badge.label}</span>
          {/if}
        </header>

        <section class="kpi-grid">
          <div class="kpi">
            <span class="kpi-label">Business Type</span>
            <span class="kpi-value">{businessType === 'service' ? 'Service' : 'Product'}</span>
          </div>
          <div class="kpi">
            <span class="kpi-label">Listings</span>
            <span class="kpi-value">{listings.length}</span>
          </div>
          <div class="kpi">
            <span class="kpi-label">Setup Progress</span>
            <span class="kpi-value">{setupProgress}%</span>
          </div>
          <div class="kpi">
            <span class="kpi-label">Category</span>
            <span class="kpi-value">{shop.category}</span>
          </div>
        </section>

        {#if !shop.shop_setup_complete}
          <div class="callout">
            <div>
              <strong>Finish setting up your shop</strong>
              <p>Choose your business type and complete your shop profile to start adding {businessType === 'service' ? 'services' : 'products'}.</p>
            </div>
            <button class="primary-btn" onclick={() => (activeTab = 'setup')}>Continue Setup →</button>
          </div>
        {/if}

        <div class="info-card">
          <h3>Shop Details</h3>
          <dl>
            <dt>Address</dt><dd>{shop.address || '—'}</dd>
            <dt>LGU</dt><dd>{shop.lgu_municipality || '—'}</dd>
            <dt>Map pin</dt><dd>{shop.lat?.toFixed(4)}, {shop.lng?.toFixed(4)}</dd>
          </dl>
        </div>

      {:else if activeTab === 'setup'}
        <header class="page-header">
          <div>
            <h1>Set Up Your Shop</h1>
            <p>Tell buyers what kind of business you run and where to find you.</p>
          </div>
          <div class="progress-ring">
            <span>{setupProgress}%</span>
            <small>complete</small>
          </div>
        </header>

        <section class="panel">
          <h2>Business Type <span class="req">*</span></h2>
          <p class="panel-desc">Choose whether you sell physical products or offer services.</p>

          <div class="type-grid">
            <button
              type="button"
              class="type-card"
              class:selected={businessType === 'product'}
              onclick={() => (businessType = 'product')}
            >
              <span class="type-icon">📦</span>
              <strong>Product-based</strong>
              <span>Sell goods — food, clothing, crafts, electronics, pasalubong, etc.</span>
            </button>
            <button
              type="button"
              class="type-card"
              class:selected={businessType === 'service'}
              onclick={() => (businessType = 'service')}
            >
              <span class="type-icon">🛠</span>
              <strong>Service-based</strong>
              <span>Offer services — repairs, salon, tutoring, delivery, consulting, etc.</span>
            </button>
          </div>
        </section>

        <section class="panel">
          <h2>Shop Profile</h2>
          <div class="fields">
            <div class="field">
              <label for="shop-name">Shop name</label>
              <input id="shop-name" bind:value={shopName} placeholder="Your business name" />
            </div>

            <div class="field-row">
              <div class="field">
                <label for="shop-cat">Category</label>
                <select id="shop-cat" bind:value={category}>
                  {#each categories as cat}<option>{cat}</option>{/each}
                </select>
              </div>
              <div class="field">
                <span class="field-label">Business type</span>
                <div class="type-pill">{businessType === 'service' ? 'Service-based' : 'Product-based'}</div>
              </div>
            </div>

            <div class="field">
              <label for="shop-desc">
                {businessType === 'service' ? 'Service description' : 'Product / shop description'}
              </label>
              <textarea
                id="shop-desc"
                bind:value={description}
                rows="3"
                placeholder={businessType === 'service'
                  ? 'Describe the services you offer, hours, and service area…'
                  : 'Describe what products you sell, specialties, and highlights…'}
              ></textarea>
            </div>

            <div class="field">
              <label for="shop-address">Business address</label>
              <input id="shop-address" bind:value={address} placeholder="Street, barangay, city" />
            </div>

            <div class="field">
              <span class="field-label">Shop location on map</span>
              <LocationPicker bind:lat bind:lng bind:pinned={locationPinned} />
            </div>
          </div>

          <div class="panel-actions">
            <button class="primary-btn" onclick={saveShopSetup} disabled={saving}>
              {saving ? 'Saving…' : 'Save & Continue'}
            </button>
          </div>
        </section>

      {:else}
        <header class="page-header">
          <div>
            <h1>{listingsTitle}</h1>
            <p>
              Build rich {businessType === 'service' ? 'service' : 'product'} listings with photos, categories, and custom details.
            </p>
          </div>
          <div class="header-actions">
            <button class="secondary-btn" onclick={() => (activeTab = 'setup')}>Edit Shop Setup</button>
            {#if !showEditor}
              <button class="primary-btn" onclick={openNewListing}>+ New {listingLabel}</button>
            {/if}
          </div>
        </header>

        {#if showEditor}
          <section class="panel editor-panel">
            <h2>{editingListingId ? `Edit ${listingLabel}` : `Create ${listingLabel}`}</h2>
            <ListingEditor
              {businessType}
              bind:form={listingForm}
              saving={savingListing}
              onsave={handleSaveListing}
              oncancel={cancelListingEdit}
            />
          </section>
        {/if}

        <section class="panel">
          <h2>{listingsTitle} ({listings.length})</h2>
          {#if listings.length === 0}
            <p class="muted">No {businessType === 'service' ? 'services' : 'products'} yet. Click <strong>+ New {listingLabel}</strong> to open the editor.</p>
          {:else}
            <div class="listing-grid rich">
              {#each listings as item (item.id)}
                {@const chips = formatDetailChips(businessType, item.industry ?? '', (item.details as Record<string, string>) ?? {})}
                {@const catLabel = businessType === 'service'
                  ? getServiceType(item.industry ?? 'personal_care').label
                  : (item.subcategory || getProductIndustry(item.industry ?? 'food').label)}
                <div class="listing-card rich">
                  {#if item.image_data}
                    <img src={item.image_data} alt="" class="listing-thumb" />
                  {:else}
                    <div class="listing-thumb placeholder">{businessType === 'service' ? '🛠' : '📦'}</div>
                  {/if}
                  <div class="listing-content">
                    <div class="listing-tags">
                      <span class="tag">{catLabel}</span>
                      {#if item.highlights}<span class="tag highlight">{item.highlights}</span>{/if}
                    </div>
                    <strong>{item.name}</strong>
                    <p>{item.description || 'No description'}</p>
                    {#if chips.length}
                      <div class="chip-row">
                        {#each chips as chip}<span class="mini-chip">{chip}</span>{/each}
                      </div>
                    {/if}
                  </div>
                  <div class="listing-meta">
                    <span class="price">₱{Number(item.price).toLocaleString()}</span>
                    <div class="listing-btns">
                      <button class="text-btn" onclick={() => openEditListing(item)}>Edit</button>
                      <button class="icon-btn" onclick={() => handleDeleteListing(item.id)} aria-label="Delete">✕</button>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </section>
      {/if}
    {/if}
  </main>
  </div>
</div>

<style>
  .dashboard-page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--surface-deepest);
  }

  .dashboard {
    display: flex;
    flex: 1;
    min-height: 0;
    background: var(--surface-deepest);
    color: #e8f4fc;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .sidebar {
    width: 260px;
    flex-shrink: 0;
    background: var(--surface-darker);
    border-right: 1px solid rgba(73, 182, 234, 0.15);
    display: flex;
    flex-direction: column;
    padding: 1.25rem;
  }

  .brand {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(20, 62, 136, 0.5);
  }

  .brand-icon { font-size: 1.5rem; }
  .brand strong { display: block; font-size: 14px; }
  .brand span { font-size: 11px; color: #4d7a9e; word-break: break-all; }

  .nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }

  .nav-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #84b9d5;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    position: relative;
  }

  .nav-btn:hover:not(:disabled) { background: rgba(73, 182, 234, 0.08); color: #e8f4fc; }
  .nav-btn.active { background: rgba(59, 130, 246, 0.2); color: #fff; }
  .nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .nav-dot {
    width: 8px; height: 8px; border-radius: 50%; background: #f59e0b;
    margin-left: auto;
  }

  .sidebar-footer {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: 1rem;
    border-top: 1px solid rgba(20, 62, 136, 0.5);
  }

  .link-btn {
    background: none;
    border: none;
    color: #4d7a9e;
    font-size: 12px;
    text-align: left;
    cursor: pointer;
    text-decoration: none;
    padding: 4px 0;
    font-family: inherit;
  }
  .link-btn:hover { color: var(--accent-warm); }
  .link-btn.danger:hover { color: #f87171; }

  .main {
    flex: 1;
    min-width: 0;
    padding: 1.5rem 2rem;
    overflow-y: auto;
    max-height: 100vh;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .page-header h1 { margin: 0 0 0.35rem; font-size: 1.5rem; }
  .page-header p { margin: 0; color: #4d7a9e; font-size: 14px; }

  .status-badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }
  .status-badge.ok { background: rgba(52, 211, 153, 0.15); color: #34d399; }
  .status-badge.pending { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
  .status-badge.rejected { background: rgba(248, 113, 113, 0.15); color: #f87171; }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    margin-bottom: 1.5rem;
  }

  .kpi {
    background: var(--surface-darker);
    border: 1px solid rgba(20, 62, 136, 0.5);
    border-radius: 12px;
    padding: 1rem;
  }
  .kpi-label { display: block; font-size: 11px; color: #4d7a9e; text-transform: uppercase; margin-bottom: 4px; }
  .kpi-value { font-size: 1.25rem; font-weight: 700; }

  .callout {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.25);
    border-radius: 12px;
    padding: 1rem 1.25rem;
    margin-bottom: 1.5rem;
  }
  .callout strong { display: block; margin-bottom: 4px; }
  .callout p { margin: 0; font-size: 13px; color: #84b9d5; }

  .info-card, .panel {
    background: var(--surface-darker);
    border: 1px solid rgba(20, 62, 136, 0.5);
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1rem;
  }

  .info-card h3, .panel h2 {
    margin: 0 0 0.75rem;
    font-size: 1rem;
  }

  .panel-desc { margin: -0.25rem 0 1rem; font-size: 13px; color: #4d7a9e; }
  .req { color: var(--accent); }

  .info-card dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 6px 16px;
    margin: 0;
    font-size: 13px;
  }
  .info-card dt { color: #4d7a9e; }
  .info-card dd { margin: 0; }

  .type-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  @media (max-width: 640px) {
    .dashboard { flex-direction: column; }
    .sidebar { width: 100%; }
    .type-grid { grid-template-columns: 1fr; }
  }

  .type-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding: 1rem;
    border-radius: 12px;
    border: 2px solid rgba(20, 62, 136, 0.6);
    background: var(--surface-deepest);
    color: #84b9d5;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    transition: border-color 0.2s, background 0.2s;
  }

  .type-card:hover { border-color: rgba(73, 182, 234, 0.4); }
  .type-card.selected {
    border-color: var(--primary);
    background: rgba(59, 130, 246, 0.12);
    color: #e8f4fc;
  }

  .type-icon { font-size: 1.75rem; }
  .type-card strong { font-size: 14px; color: inherit; }
  .type-card span:last-child { font-size: 12px; line-height: 1.4; opacity: 0.85; }

  .type-pill {
    padding: 10px 12px;
    background: rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 8px;
    color: var(--accent-warm);
    font-size: 13px;
    font-weight: 600;
  }

  .fields { display: flex; flex-direction: column; gap: 14px; }
  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .field.flex-2 { grid-column: span 1; }
  @media (max-width: 520px) { .field-row { grid-template-columns: 1fr; } }

  .field { display: flex; flex-direction: column; gap: 6px; }
  label, .field-label {
    font-size: 12px;
    font-weight: 500;
    color: #6eb3da;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  input, select, textarea {
    width: 100%;
    padding: 10px 12px;
    background: var(--surface-deepest);
    border: 1px solid #143e88;
    border-radius: 8px;
    color: #e8f4fc;
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
    font-family: inherit;
  }

  input:focus, select:focus, textarea:focus {
    border-color: var(--accent-warm);
    box-shadow: 0 0 0 3px rgba(121, 224, 233, 0.12);
  }

  textarea { resize: vertical; min-height: 72px; }

  .panel-actions { margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid rgba(20, 62, 136, 0.5); }

  .progress-ring {
    text-align: center;
    background: var(--surface-deepest);
    border: 1px solid #143e88;
    border-radius: 12px;
    padding: 10px 16px;
    flex-shrink: 0;
  }
  .progress-ring span { display: block; font-size: 1.25rem; font-weight: 700; color: var(--accent-warm); }
  .progress-ring small { font-size: 10px; color: #4d7a9e; text-transform: uppercase; }

  .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .editor-panel { padding: 1rem; }

  .listing-grid.rich { gap: 12px; }
  .listing-card.rich {
    display: grid;
    grid-template-columns: 72px 1fr auto;
    gap: 12px;
    align-items: start;
    padding: 12px 14px;
    background: var(--surface-deepest);
    border: 1px solid rgba(20, 62, 136, 0.5);
    border-radius: 10px;
  }

  @media (max-width: 560px) {
    .listing-card.rich { grid-template-columns: 56px 1fr; }
    .listing-meta { grid-column: 1 / -1; flex-direction: row; justify-content: space-between; }
  }

  .listing-thumb {
    width: 72px;
    height: 72px;
    border-radius: 8px;
    object-fit: cover;
  }

  .listing-thumb.placeholder {
    display: grid;
    place-items: center;
    background: var(--surface-deepest);
    font-size: 1.75rem;
  }

  .listing-content strong { display: block; font-size: 14px; margin-bottom: 2px; }
  .listing-content p { margin: 0; font-size: 12px; color: #4d7a9e; line-height: 1.4; }

  .listing-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 4px; }
  .tag {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 10px;
    background: rgba(59, 130, 246, 0.15);
    color: var(--accent-warm);
  }
  .tag.highlight { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }

  .chip-row { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
  .mini-chip {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(52, 211, 153, 0.08);
    color: #6ee7b7;
    border: 1px solid rgba(52, 211, 153, 0.15);
  }

  .listing-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    flex-shrink: 0;
  }

  .listing-btns { display: flex; align-items: center; gap: 6px; }
  .text-btn {
    background: none;
    border: none;
    color: var(--accent-warm);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    padding: 4px 6px;
  }
  .text-btn:hover { text-decoration: underline; }

  .price { font-weight: 700; color: #34d399; font-size: 14px; }

  .icon-btn {
    background: rgba(248, 113, 113, 0.1);
    border: 1px solid rgba(248, 113, 113, 0.25);
    color: #f87171;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
  }

  .primary-btn, .secondary-btn {
    padding: 10px 18px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    border: none;
    text-decoration: none;
    display: inline-block;
    text-align: center;
  }

  .primary-btn {
    background: var(--gradient-brand);
    color: white;
    box-shadow: 0 4px 16px rgba(13, 88, 176, 0.35);
  }
  .primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .secondary-btn {
    background: transparent;
    border: 1px solid #143e88;
    color: #84b9d5;
  }

  .alert {
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 1rem;
  }
  .alert.error { background: rgba(248, 113, 113, 0.1); border: 1px solid rgba(248, 113, 113, 0.25); color: #f87171; }
  .alert.success { background: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.25); color: #34d399; }

  .empty-state {
    max-width: 420px;
    margin: 4rem auto;
    text-align: center;
  }
  .empty-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
  .empty-state h1 { margin: 0 0 0.75rem; font-size: 1.4rem; }
  .empty-state p { color: #4d7a9e; font-size: 14px; line-height: 1.6; margin-bottom: 1.5rem; }

  .muted { color: #4d7a9e; font-size: 14px; }
</style>
