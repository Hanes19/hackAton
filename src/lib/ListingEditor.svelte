<script lang="ts">
  import type { BusinessType } from '$lib/seller'
  import {
    PRODUCT_INDUSTRIES,
    SERVICE_TYPES,
    getProductIndustry,
    getServiceType,
    type ListingFormData
  } from '$lib/listingCatalog'

  let {
    businessType,
    form = $bindable(),
    saving = false,
    onsave,
    oncancel
  }: {
    businessType: BusinessType
    form: ListingFormData
    saving?: boolean
    onsave: () => void
    oncancel?: () => void
  } = $props()

  let activeSection = $state<'basics' | 'category' | 'customize' | 'preview'>('basics')

  const isService = $derived(businessType === 'service')
  const label = $derived(isService ? 'Service' : 'Product')

  let industry = $derived(
    isService ? getServiceType(form.industryId) : getProductIndustry(form.industryId)
  )

  let subcategories = $derived(
    isService ? [] : getProductIndustry(form.industryId).subcategories
  )

  let dynamicFields = $derived(industry.fields)

  function setDetail(key: string, value: string) {
    form = { ...form, details: { ...form.details, [key]: value } }
  }

  function handleImageUpload(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 2 * 1024 * 1024) return

    const reader = new FileReader()
    reader.onload = () => {
      form = { ...form, imageName: file.name, imageData: reader.result as string }
    }
    reader.readAsDataURL(file)
    input.value = ''
  }

  function selectIndustry(id: string) {
    form = {
      ...form,
      industryId: id,
      subcategory: isService ? '' : (getProductIndustry(id).subcategories[0] ?? ''),
      details: {}
    }
  }

  function parseTags(value: string): string {
    return value
  }

  function tagsToString(key: string): string {
    return form.details[key] ?? ''
  }
</script>

<div class="editor">
  <div class="editor-toolbar">
    <div class="tabs">
      {#each [
        { id: 'basics', label: 'Basics' },
        { id: 'category', label: isService ? 'Service Type' : 'Category' },
        { id: 'customize', label: 'Customize' },
        { id: 'preview', label: 'Preview' }
      ] as tab}
        <button
          type="button"
          class="tab"
          class:active={activeSection === tab.id}
          onclick={() => (activeSection = tab.id as typeof activeSection)}
        >
          {tab.label}
        </button>
      {/each}
    </div>
    <div class="toolbar-actions">
      {#if oncancel}
        <button type="button" class="btn secondary" onclick={oncancel} disabled={saving}>Cancel</button>
      {/if}
      <button type="button" class="btn primary" onclick={onsave} disabled={saving || !form.name.trim()}>
        {saving ? 'Saving…' : `Save ${label}`}
      </button>
    </div>
  </div>

  <div class="editor-body">
    <aside class="photo-panel">
      <label class="photo-upload" for="listing-photo">
        {#if form.imageData}
          <img src={form.imageData} alt="Preview" class="photo-preview" />
          <span class="photo-change">Change photo</span>
        {:else}
          <span class="photo-icon">📷</span>
          <span>Add {label} photo</span>
          <span class="photo-hint">JPG, PNG · max 2 MB</span>
        {/if}
      </label>
      <input id="listing-photo" type="file" accept="image/*" onchange={handleImageUpload} hidden />
      {#if form.imageName}
        <span class="photo-name">{form.imageName}</span>
      {/if}
    </aside>

    <div class="form-panel">
      {#if activeSection === 'basics'}
        <h3>{label} basics</h3>
        <div class="fields">
          <div class="field">
            <label for="ed-name">{label} name</label>
            <input id="ed-name" bind:value={form.name} placeholder={isService ? 'e.g. Home haircut & styling' : 'e.g. Ube cheese pandesal'} />
          </div>
          <div class="field-row">
            <div class="field">
              <label for="ed-price">{isService ? 'Rate (₱)' : 'Price (₱)'}</label>
              <input id="ed-price" type="number" min="0" step="0.01" bind:value={form.price} placeholder="0.00" />
            </div>
            <div class="field">
              <label for="ed-highlights">Tagline</label>
              <input id="ed-highlights" bind:value={form.highlights} placeholder="e.g. Best seller, Same-day" />
            </div>
          </div>
          <div class="field">
            <label for="ed-desc">Description</label>
            <textarea id="ed-desc" bind:value={form.description} rows="4" placeholder="Describe your {label.toLowerCase()} in detail…"></textarea>
          </div>
        </div>

      {:else if activeSection === 'category'}
        <h3>{isService ? 'Service type' : 'Product categorization'}</h3>
        <p class="section-desc">
          {isService
            ? 'Pick the type that best matches your service — this unlocks relevant fields like duration and speed.'
            : 'Choose an industry and subcategory so buyers can find your product easily.'}
        </p>

        <div class="category-grid">
          {#if isService}
            {#each SERVICE_TYPES as st}
              <button
                type="button"
                class="cat-card"
                class:selected={form.industryId === st.id}
                onclick={() => selectIndustry(st.id)}
              >
                <strong>{st.label}</strong>
              </button>
            {/each}
          {:else}
            {#each PRODUCT_INDUSTRIES as ind}
              <button
                type="button"
                class="cat-card"
                class:selected={form.industryId === ind.id}
                onclick={() => selectIndustry(ind.id)}
              >
                <strong>{ind.label}</strong>
                <span>{ind.subcategories.slice(0, 3).join(' · ')}…</span>
              </button>
            {/each}
          {/if}
        </div>

        {#if !isService && subcategories.length}
          <div class="field" style="margin-top: 1rem;">
            <label for="ed-sub">Subcategory</label>
            <select id="ed-sub" bind:value={form.subcategory}>
              {#each subcategories as sub}<option>{sub}</option>{/each}
            </select>
          </div>
        {/if}

      {:else if activeSection === 'customize'}
        <h3>Customize details</h3>
        <p class="section-desc">Fine-tune how your {label.toLowerCase()} appears — duration, speed, specs, and more.</p>

        <div class="fields">
          {#each dynamicFields as field}
            <div class="field">
              <label for="ed-{field.key}">{field.label}</label>
              {#if field.type === 'select'}
                <select
                  id="ed-{field.key}"
                  value={form.details[field.key] ?? ''}
                  onchange={(e) => setDetail(field.key, (e.currentTarget as HTMLSelectElement).value)}
                >
                  <option value="">Select…</option>
                  {#each field.options ?? [] as opt}<option value={opt}>{opt}</option>{/each}
                </select>
              {:else if field.type === 'textarea'}
                <textarea
                  id="ed-{field.key}"
                  rows="3"
                  placeholder={field.placeholder}
                  value={form.details[field.key] ?? ''}
                  oninput={(e) => setDetail(field.key, (e.currentTarget as HTMLTextAreaElement).value)}
                ></textarea>
              {:else if field.type === 'tags'}
                <input
                  id="ed-{field.key}"
                  placeholder={field.placeholder ?? 'Comma-separated tags'}
                  value={tagsToString(field.key)}
                  oninput={(e) => setDetail(field.key, parseTags((e.currentTarget as HTMLInputElement).value))}
                />
                <span class="hint">Separate with commas</span>
              {:else}
                <input
                  id="ed-{field.key}"
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form.details[field.key] ?? ''}
                  oninput={(e) => setDetail(field.key, (e.currentTarget as HTMLInputElement).value)}
                />
              {/if}
            </div>
          {/each}
        </div>

      {:else}
        <h3>Live preview</h3>
        <p class="section-desc">This is how buyers will see your listing.</p>

        <div class="preview-card">
          {#if form.imageData}
            <img src={form.imageData} alt="" class="preview-img" />
          {:else}
            <div class="preview-img placeholder">{isService ? '🛠' : '📦'}</div>
          {/if}
          <div class="preview-body">
            <div class="preview-tags">
              {#if !isService && form.subcategory}
                <span class="chip">{form.subcategory}</span>
              {/if}
              <span class="chip muted">{isService ? getServiceType(form.industryId).label : getProductIndustry(form.industryId).label}</span>
            </div>
            <strong class="preview-title">{form.name || `Your ${label} name`}</strong>
            {#if form.highlights}
              <span class="preview-highlight">{form.highlights}</span>
            {/if}
            <p class="preview-desc">{form.description || 'Your description will appear here.'}</p>
            <div class="preview-details">
              {#each dynamicFields as field}
                {#if form.details[field.key]}
                  <span class="detail-chip">{field.label}: {form.details[field.key]}</span>
                {/if}
              {/each}
            </div>
            <span class="preview-price">₱{form.price ? Number(form.price).toLocaleString() : '0'}</span>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .editor {
    border: 1px solid rgba(73, 182, 234, 0.2);
    border-radius: 12px;
    overflow: hidden;
    background: #091525;
  }

  .editor-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    padding: 10px 14px;
    background: #0c1a35;
    border-bottom: 1px solid rgba(20, 62, 136, 0.5);
  }

  .tabs {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .tab {
    padding: 6px 12px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: #4d7a9e;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }

  .tab:hover { color: #84b9d5; }
  .tab.active { background: rgba(59, 130, 246, 0.2); color: #fff; }

  .toolbar-actions { display: flex; gap: 8px; }

  .btn {
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    border: none;
  }

  .btn.primary {
    background: linear-gradient(135deg, #0d58b0, #49b6ea);
    color: white;
  }

  .btn.primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn.secondary {
    background: transparent;
    border: 1px solid #143e88;
    color: #84b9d5;
  }

  .editor-body {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 0;
    min-height: 360px;
  }

  @media (max-width: 720px) {
    .editor-body { grid-template-columns: 1fr; }
    .photo-panel { border-right: none; border-bottom: 1px solid rgba(20, 62, 136, 0.5); }
  }

  .photo-panel {
    padding: 1rem;
    border-right: 1px solid rgba(20, 62, 136, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .photo-upload {
    width: 100%;
    aspect-ratio: 1;
    max-width: 168px;
    border: 2px dashed #143e88;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    color: #4d7a9e;
    font-size: 12px;
    text-align: center;
    padding: 8px;
    position: relative;
    overflow: hidden;
  }

  .photo-upload:hover { border-color: #49b6ea; }

  .photo-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    inset: 0;
  }

  .photo-change {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.65);
    color: white;
    font-size: 11px;
    padding: 6px;
  }

  .photo-icon { font-size: 2rem; }
  .photo-hint { font-size: 10px; opacity: 0.7; }
  .photo-name { font-size: 10px; color: #34d399; word-break: break-all; text-align: center; }

  .form-panel {
    padding: 1.25rem;
    overflow-y: auto;
    max-height: 480px;
  }

  .form-panel h3 {
    margin: 0 0 0.35rem;
    font-size: 1rem;
    color: #e8f4fc;
  }

  .section-desc {
    margin: 0 0 1rem;
    font-size: 12px;
    color: #4d7a9e;
    line-height: 1.5;
  }

  .fields { display: flex; flex-direction: column; gap: 12px; }
  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 520px) { .field-row { grid-template-columns: 1fr; } }

  .field { display: flex; flex-direction: column; gap: 5px; }

  label {
    font-size: 11px;
    font-weight: 600;
    color: #6eb3da;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  input, select, textarea {
    padding: 9px 11px;
    background: #070f1f;
    border: 1px solid #143e88;
    border-radius: 8px;
    color: #e8f4fc;
    font-size: 13px;
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
    width: 100%;
  }

  input:focus, select:focus, textarea:focus {
    border-color: #49b6ea;
  }

  textarea { resize: vertical; min-height: 72px; }
  .hint { font-size: 10px; color: #2d5580; }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 10px;
  }

  .cat-card {
    text-align: left;
    padding: 12px;
    border-radius: 10px;
    border: 2px solid rgba(20, 62, 136, 0.5);
    background: #070f1f;
    color: #84b9d5;
    cursor: pointer;
    font-family: inherit;
    transition: border-color 0.15s, background 0.15s;
  }

  .cat-card strong {
    display: block;
    font-size: 13px;
    color: #e8f4fc;
    margin-bottom: 4px;
  }

  .cat-card span { font-size: 11px; opacity: 0.8; }

  .cat-card:hover { border-color: rgba(73, 182, 234, 0.4); }
  .cat-card.selected {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.12);
  }

  .preview-card {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 14px;
    background: #070f1f;
    border: 1px solid #143e88;
    border-radius: 12px;
    padding: 14px;
    max-width: 520px;
  }

  @media (max-width: 480px) {
    .preview-card { grid-template-columns: 1fr; }
  }

  .preview-img {
    width: 100%;
    height: 120px;
    object-fit: cover;
    border-radius: 10px;
  }

  .preview-img.placeholder {
    display: grid;
    place-items: center;
    background: #0c1a35;
    font-size: 2.5rem;
  }

  .preview-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }

  .chip {
    font-size: 10px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 12px;
    background: rgba(59, 130, 246, 0.2);
    color: #49b6ea;
  }

  .chip.muted { background: rgba(255, 255, 255, 0.06); color: #84b9d5; }

  .preview-title { display: block; font-size: 15px; color: #fff; margin-bottom: 4px; }
  .preview-highlight { font-size: 11px; color: #fbbf24; display: block; margin-bottom: 6px; }
  .preview-desc { font-size: 12px; color: #84b9d5; line-height: 1.5; margin: 0 0 8px; }
  .preview-details { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }

  .detail-chip {
    font-size: 10px;
    padding: 3px 7px;
    border-radius: 6px;
    background: rgba(52, 211, 153, 0.1);
    color: #6ee7b7;
    border: 1px solid rgba(52, 211, 153, 0.2);
  }

  .preview-price { font-size: 1.1rem; font-weight: 700; color: #34d399; }
</style>
