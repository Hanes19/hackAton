<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { getUser } from '$lib/auth'
  import {
    fetchLguMunicipalities,
    verifyPermitWithLgu,
    ID_TYPES,
    type LguMunicipality,
    type PermitVerificationResult
  } from '$lib/lgu'
  import type { User } from '@supabase/supabase-js'

  const steps = ['Business Info', 'LGU Permit', 'Valid ID', 'Review'] as const
  let step = $state(0)

  let user = $state<User | null>(null)
  let lgus = $state<LguMunicipality[]>([])

  let ownerName = $state('')
  let shopName = $state('')
  let category = $state('Food')
  let description = $state('')
  let address = $state('')
  let lguMunicipality = $state('Valencia City')
  let lat = $state(7.9064)
  let lng = $state(125.0948)

  let permitNumber = $state('')
  let permitVerifying = $state(false)
  let permitResult = $state<PermitVerificationResult | null>(null)

  let idType = $state(ID_TYPES[0])
  let idNumber = $state('')
  let idFileName = $state('')
  let idDocumentData = $state('')
  let idAttestation = $state(false)

  let loading = $state(false)
  let success = $state(false)
  let error = $state('')

  const categories = ['Food', 'Clothing', 'Electronics', 'Services', 'Health & Beauty', 'Other']

  const demoPermits = [
    { permit: 'VC-2024-001234', owner: 'Juan dela Cruz', lgu: 'Valencia City' },
    { permit: 'MB-2023-009912', owner: 'Pedro Reyes', lgu: 'Malaybalay City' }
  ]

  onMount(async () => {
    user = await getUser()
    try {
      lgus = await fetchLguMunicipalities()
    } catch {
      lgus = [{ id: 'valencia', name: 'Valencia City', province: 'Bukidnon' }]
    }
  })

  function canAdvance(): boolean {
    if (step === 0) {
      return !!(ownerName.trim() && shopName.trim() && address.trim() && lguMunicipality)
    }
    if (step === 1) {
      return permitResult?.verified === true
    }
    if (step === 2) {
      return !!(idType && idNumber.trim() && idDocumentData && idAttestation)
    }
    return true
  }

  async function verifyPermit() {
    if (!permitNumber.trim() || !ownerName.trim()) {
      error = 'Enter your permit number and owner name first.'
      return
    }
    permitVerifying = true
    error = ''
    permitResult = null
    try {
      permitResult = await verifyPermitWithLgu(permitNumber, ownerName, lguMunicipality)
    } catch {
      error = 'Could not reach LGU verification service. Is the API server running?'
    } finally {
      permitVerifying = false
    }
  }

  function fillDemo(demo: (typeof demoPermits)[0]) {
    permitNumber = demo.permit
    ownerName = demo.owner
    lguMunicipality = demo.lgu
    permitResult = null
  }

  function handleIdUpload(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      error = 'Please upload a photo or scan of your ID (JPG, PNG, or WebP).'
      input.value = ''
      return
    }
    if (file.size > 1.5 * 1024 * 1024) {
      error = 'ID image must be under 1.5 MB.'
      input.value = ''
      return
    }

    error = ''
    idFileName = file.name
    const reader = new FileReader()
    reader.onload = () => {
      idDocumentData = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  function next() {
    error = ''
    if (!canAdvance()) {
      if (step === 1) error = 'Verify your business permit with the LGU before continuing.'
      else if (step === 2) error = 'Upload a valid ID and confirm the attestation.'
      else error = 'Please complete all required fields.'
      return
    }
    if (step < steps.length - 1) step++
  }

  function back() {
    error = ''
    if (step > 0) step--
  }

  async function submit() {
    if (!canAdvance()) return
    loading = true
    error = ''

    const res = await fetch('/api/shops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: shopName,
        description,
        category,
        address,
        lat,
        lng,
        user_id: user?.id,
        owner_name: ownerName,
        permit_number: permitNumber,
        lgu_municipality: lguMunicipality,
        permit_verified: permitResult?.verified,
        permit_business_name: permitResult?.permit?.businessName,
        id_type: idType,
        id_number: idNumber,
        id_document_data: idDocumentData,
        id_document_name: idFileName
      })
    })

    const data = await res.json()
    loading = false

    if (!res.ok || data.error) {
      error = data.error || 'Registration failed. Run the Supabase migration if columns are missing.'
      return
    }
    success = true
  }
</script>

<div class="page">
  <div class="shell">
    <a href="/map" class="back-link" onclick={() => goto('/map')}>← Back to map</a>

    <div class="header">
      <div class="brand">
        <span class="brand-icon">🏛️</span>
        <div>
          <h1>Register as a Seller</h1>
          <p>Verified local businesses only — LGU permit & valid ID required</p>
        </div>
      </div>
      {#if !user}
        <p class="auth-hint">
          <a href="/login">Sign in</a> or <a href="/register-user">create an account</a> to link your shop to your profile.
        </p>
      {/if}
    </div>

    {#if success}
      <div class="success-card">
        <span class="success-icon">✓</span>
        <h2>Application Submitted</h2>
        <p>
          Your shop <strong>{shopName}</strong> is pending admin review. LGU permit
          <strong>{permitNumber}</strong> was verified. You'll appear on the map once approved.
        </p>
        <button class="primary-btn" onclick={() => goto('/map')}>Browse the map</button>
      </div>
    {:else}
      <div class="stepper">
        {#each steps as label, i}
          <div class="step-item" class:active={i === step} class:done={i < step}>
            <span class="step-num">{i < step ? '✓' : i + 1}</span>
            <span class="step-label">{label}</span>
          </div>
          {#if i < steps.length - 1}<span class="step-line" class:done={i < step}></span>{/if}
        {/each}
      </div>

      <div class="card">
        {#if step === 0}
          <h2 class="card-title">Business & Owner Information</h2>
          <p class="card-desc">Tell us about your shop and which LGU issued your business permit.</p>

          <div class="fields">
            <div class="field">
              <label for="owner">Owner full name <span class="req">*</span></label>
              <input id="owner" bind:value={ownerName} placeholder="As shown on Mayor's / Business Permit" />
              <span class="hint">Must match the name on your LGU business permit exactly.</span>
            </div>

            <div class="field">
              <label for="shop">Shop / business name <span class="req">*</span></label>
              <input id="shop" bind:value={shopName} placeholder="e.g. Juan's Bakery" />
            </div>

            <div class="field-row">
              <div class="field">
                <label for="category">Category</label>
                <select id="category" bind:value={category}>
                  {#each categories as cat}<option>{cat}</option>{/each}
                </select>
              </div>
              <div class="field">
                <label for="lgu">LGU municipality <span class="req">*</span></label>
                <select id="lgu" bind:value={lguMunicipality}>
                  {#each lgus as lgu}<option value={lgu.name}>{lgu.name}</option>{/each}
                </select>
              </div>
            </div>

            <div class="field">
              <label for="address">Business address <span class="req">*</span></label>
              <input id="address" bind:value={address} placeholder="Street, barangay, Valencia City, Bukidnon" />
            </div>

            <div class="field">
              <label for="description">Description</label>
              <textarea id="description" bind:value={description} rows="3" placeholder="What products or services do you offer?"></textarea>
            </div>

            <div class="field-row">
              <div class="field">
                <label for="lat">Latitude</label>
                <input id="lat" type="number" bind:value={lat} step="0.0001" />
              </div>
              <div class="field">
                <label for="lng">Longitude</label>
                <input id="lng" type="number" bind:value={lng} step="0.0001" />
              </div>
            </div>
            <span class="hint">Tip: right-click on Google Maps → "What's here?" to get coordinates. Default is Valencia City center.</span>
          </div>

        {:else if step === 1}
          <h2 class="card-title">LGU Business Permit Verification</h2>
          <p class="card-desc">
            We verify your Mayor's Permit / Business Permit against the
            <strong>{lguMunicipality}</strong> LGU registry before you can sell on Budol Map.
          </p>

          <div class="lgu-badge">
            <span>🏛️</span>
            <div>
              <strong>Integrated LGU Verification</strong>
              <span>Real-time check against local business permit records</span>
            </div>
          </div>

          <div class="fields">
            <div class="field">
              <label for="permit">Business permit number <span class="req">*</span></label>
              <input id="permit" bind:value={permitNumber} placeholder="e.g. VC-2024-001234" style="text-transform: uppercase;" />
            </div>

            <div class="info-box">
              <strong>Owner on permit:</strong> {ownerName || '(enter in step 1)'}
              <br />
              <strong>LGU:</strong> {lguMunicipality}
            </div>

            <button class="verify-btn" onclick={verifyPermit} disabled={permitVerifying || !permitNumber.trim()}>
              {#if permitVerifying}
                Verifying with LGU…
              {:else}
                Verify Permit with LGU
              {/if}
            </button>

            {#if permitResult}
              <div class="result-box" class:ok={permitResult.verified} class:fail={!permitResult.verified}>
                {#if permitResult.verified}
                  <span class="result-icon">✓</span>
                  <div>
                    <strong>Permit Verified</strong>
                    <p>{permitResult.message}</p>
                    {#if permitResult.permit}
                      <ul>
                        <li>Registered business: {permitResult.permit.businessName}</li>
                        <li>Issued: {permitResult.permit.issued} · Expires: {permitResult.permit.expires}</li>
                      </ul>
                    {/if}
                  </div>
                {:else}
                  <span class="result-icon">✕</span>
                  <div>
                    <strong>Verification Failed</strong>
                    <p>{permitResult.message}</p>
                  </div>
                {/if}
              </div>
            {/if}

            <details class="demo-box">
              <summary>Demo permit numbers (for testing)</summary>
              <ul>
                {#each demoPermits as demo}
                  <li>
                    <button type="button" class="demo-btn" onclick={() => fillDemo(demo)}>
                      {demo.permit} — {demo.owner} ({demo.lgu})
                    </button>
                  </li>
                {/each}
              </ul>
            </details>
          </div>

        {:else if step === 2}
          <h2 class="card-title">Valid Government ID</h2>
          <p class="card-desc">
            Upload a clear photo of any valid Philippine government-issued ID. This confirms you are the permit owner.
          </p>

          <div class="fields">
            <div class="field-row">
              <div class="field">
                <label for="id-type">ID type <span class="req">*</span></label>
                <select id="id-type" bind:value={idType}>
                  {#each ID_TYPES as type}<option>{type}</option>{/each}
                </select>
              </div>
              <div class="field">
                <label for="id-num">ID number <span class="req">*</span></label>
                <input id="id-num" bind:value={idNumber} placeholder="ID number as printed" />
              </div>
            </div>

            <div class="field">
              <label for="id-upload">ID photo / scan <span class="req">*</span></label>
              <label class="upload-zone" for="id-upload">
                {#if idDocumentData}
                  <img src={idDocumentData} alt="Uploaded ID preview" class="id-preview" />
                  <span class="upload-name">{idFileName}</span>
                {:else}
                  <span class="upload-icon">📷</span>
                  <span>Click to upload ID photo</span>
                  <span class="hint">JPG, PNG, or WebP · max 1.5 MB</span>
                {/if}
              </label>
              <input id="id-upload" type="file" accept="image/jpeg,image/png,image/webp" onchange={handleIdUpload} hidden />
            </div>

            <label class="checkbox-row">
              <input type="checkbox" bind:checked={idAttestation} />
              <span>
                I confirm that the ID belongs to <strong>{ownerName}</strong>, matches the LGU business permit owner,
                and the information provided is true and correct.
              </span>
            </label>
          </div>

        {:else}
          <h2 class="card-title">Review & Submit</h2>
          <p class="card-desc">Confirm your details before submitting for admin approval.</p>

          <div class="review-grid">
            <section>
              <h3>Business</h3>
              <dl>
                <dt>Owner</dt><dd>{ownerName}</dd>
                <dt>Shop</dt><dd>{shopName}</dd>
                <dt>Category</dt><dd>{category}</dd>
                <dt>Address</dt><dd>{address}</dd>
                <dt>LGU</dt><dd>{lguMunicipality}</dd>
              </dl>
            </section>
            <section>
              <h3>LGU Permit</h3>
              <dl>
                <dt>Permit #</dt><dd>{permitNumber}</dd>
                <dt>Status</dt><dd class="tag ok">LGU Verified</dd>
                {#if permitResult?.permit}
                  <dt>Registered name</dt><dd>{permitResult.permit.businessName}</dd>
                {/if}
              </dl>
            </section>
            <section>
              <h3>Valid ID</h3>
              <dl>
                <dt>Type</dt><dd>{idType}</dd>
                <dt>Number</dt><dd>{idNumber}</dd>
                <dt>Document</dt><dd>{idFileName || 'Uploaded'}</dd>
              </dl>
            </section>
          </div>

          <div class="notice">
            Your shop will be reviewed by our team before appearing on the public map. LGU verification is automatic;
            admin review typically takes 1–2 business days.
          </div>
        {/if}

        {#if error}
          <div class="error-box">{error}</div>
        {/if}

        <div class="actions">
          {#if step > 0}
            <button class="secondary-btn" onclick={back} disabled={loading}>Back</button>
          {/if}
          {#if step < steps.length - 1}
            <button class="primary-btn" onclick={next}>Continue</button>
          {:else}
            <button class="primary-btn" onclick={submit} disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Application'}
            </button>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .page {
    min-height: 100vh;
    background: #070f1f;
    background-image:
      radial-gradient(ellipse 60% 50% at 50% 0%, rgba(13, 88, 176, 0.18) 0%, transparent 70%),
      radial-gradient(ellipse 40% 30% at 80% 80%, rgba(73, 182, 234, 0.07) 0%, transparent 60%);
    padding: 1.5rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  }

  .shell {
    max-width: 640px;
    margin: 0 auto;
  }

  .back-link {
    font-size: 13px;
    color: #4d7a9e;
    text-decoration: none;
    display: inline-block;
    margin-bottom: 1rem;
  }
  .back-link:hover { color: #49b6ea; }

  .header { margin-bottom: 1.5rem; }
  .brand { display: flex; gap: 12px; align-items: flex-start; }
  .brand-icon { font-size: 2rem; }
  .brand h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #e8f4fc;
    letter-spacing: -0.02em;
  }
  .brand p { margin: 4px 0 0; font-size: 13px; color: #4d7a9e; }
  .auth-hint { font-size: 13px; color: #3a6080; margin-top: 0.75rem; }
  .auth-hint a { color: #49b6ea; text-decoration: none; }

  .stepper {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 1.25rem;
    overflow-x: auto;
    padding-bottom: 4px;
  }
  .step-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
  .step-num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 12px;
    font-weight: 700;
    background: #091525;
    border: 1px solid #143e88;
    color: #4d7a9e;
  }
  .step-item.active .step-num {
    background: #0d58b0;
    border-color: #49b6ea;
    color: white;
  }
  .step-item.done .step-num {
    background: rgba(52, 211, 153, 0.15);
    border-color: #34d399;
    color: #34d399;
  }
  .step-label { font-size: 10px; color: #2d5580; white-space: nowrap; }
  .step-item.active .step-label { color: #49b6ea; }
  .step-line {
    flex: 1;
    min-width: 24px;
    height: 2px;
    background: #143e88;
    margin: 0 6px;
    margin-bottom: 18px;
  }
  .step-line.done { background: #34d399; }

  .card {
    background: #0c1a35;
    border: 1px solid rgba(73, 182, 234, 0.15);
    border-radius: 16px;
    padding: 1.75rem;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  }

  .card-title { margin: 0 0 0.35rem; font-size: 1.15rem; color: #e8f4fc; }
  .card-desc { margin: 0 0 1.25rem; font-size: 13px; color: #4d7a9e; line-height: 1.5; }

  .fields { display: flex; flex-direction: column; gap: 14px; }
  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 520px) { .field-row { grid-template-columns: 1fr; } }

  .field { display: flex; flex-direction: column; gap: 6px; }
  label { font-size: 12px; font-weight: 500; color: #6eb3da; text-transform: uppercase; letter-spacing: 0.02em; }
  .req { color: #e84c3d; }
  input, select, textarea {
    width: 100%;
    padding: 10px 12px;
    background: #091525;
    border: 1px solid #143e88;
    border-radius: 8px;
    color: #e8f4fc;
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
    font-family: inherit;
  }
  input:focus, select:focus, textarea:focus {
    border-color: #49b6ea;
    box-shadow: 0 0 0 3px rgba(121, 224, 233, 0.12);
  }
  textarea { resize: vertical; min-height: 72px; }
  .hint { font-size: 11px; color: #2d5580; }

  .lgu-badge {
    display: flex;
    gap: 12px;
    align-items: center;
    background: rgba(73, 182, 234, 0.08);
    border: 1px solid rgba(73, 182, 234, 0.25);
    border-radius: 10px;
    padding: 12px 14px;
    margin-bottom: 1.25rem;
    font-size: 13px;
  }
  .lgu-badge strong { display: block; color: #e8f4fc; }
  .lgu-badge span { color: #4d7a9e; font-size: 12px; }

  .info-box {
    background: #091525;
    border: 1px solid #143e88;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 13px;
    color: #84b9d5;
    line-height: 1.6;
  }

  .verify-btn {
    padding: 11px;
    background: linear-gradient(135deg, #0d58b0, #49b6ea);
    border: none;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    font-family: inherit;
  }
  .verify-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .result-box {
    display: flex;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 10px;
    font-size: 13px;
  }
  .result-box.ok {
    background: rgba(52, 211, 153, 0.1);
    border: 1px solid rgba(52, 211, 153, 0.3);
    color: #a7f3d0;
  }
  .result-box.fail {
    background: rgba(248, 113, 113, 0.08);
    border: 1px solid rgba(248, 113, 113, 0.25);
    color: #fca5a5;
  }
  .result-box p { margin: 4px 0 0; }
  .result-box ul { margin: 8px 0 0; padding-left: 1.2rem; }
  .result-icon { font-size: 1.25rem; font-weight: 700; flex-shrink: 0; }

  .demo-box {
    font-size: 12px;
    color: #3a6080;
    border: 1px dashed #1a3258;
    border-radius: 8px;
    padding: 8px 12px;
  }
  .demo-box summary { cursor: pointer; color: #4d7a9e; }
  .demo-box ul { margin: 8px 0 0; padding-left: 0; list-style: none; }
  .demo-btn {
    background: none;
    border: none;
    color: #49b6ea;
    cursor: pointer;
    font-size: 12px;
    padding: 4px 0;
    text-align: left;
    font-family: inherit;
  }
  .demo-btn:hover { text-decoration: underline; }

  .upload-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 120px;
    border: 2px dashed #143e88;
    border-radius: 10px;
    cursor: pointer;
    color: #4d7a9e;
    font-size: 13px;
    text-align: center;
    padding: 1rem;
    transition: border-color 0.2s;
  }
  .upload-zone:hover { border-color: #49b6ea; }
  .upload-icon { font-size: 1.75rem; }
  .upload-name { font-size: 11px; color: #34d399; }
  .id-preview {
    max-height: 80px;
    max-width: 100%;
    border-radius: 6px;
    object-fit: contain;
  }

  .checkbox-row {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    font-size: 13px;
    color: #84b9d5;
    line-height: 1.5;
    cursor: pointer;
  }
  .checkbox-row input { width: auto; margin-top: 3px; flex-shrink: 0; }

  .review-grid {
    display: grid;
    gap: 14px;
    margin-bottom: 1rem;
  }
  .review-grid section {
    background: #091525;
    border: 1px solid #143e88;
    border-radius: 10px;
    padding: 12px 14px;
  }
  .review-grid h3 {
    margin: 0 0 8px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #49b6ea;
  }
  .review-grid dl {
    margin: 0;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 12px;
    font-size: 13px;
  }
  .review-grid dt { color: #4d7a9e; }
  .review-grid dd { margin: 0; color: #e8f4fc; }
  .tag.ok {
    display: inline-block;
    background: rgba(52, 211, 153, 0.15);
    color: #34d399;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
  }

  .notice {
    background: rgba(245, 158, 11, 0.08);
    border: 1px solid rgba(245, 158, 11, 0.25);
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 12px;
    color: #fcd34d;
    line-height: 1.5;
  }

  .error-box {
    margin-top: 1rem;
    background: rgba(248, 113, 113, 0.08);
    border: 1px solid rgba(248, 113, 113, 0.2);
    border-radius: 8px;
    padding: 10px 12px;
    color: #f87171;
    font-size: 13px;
  }

  .actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(20, 62, 136, 0.5);
  }

  .primary-btn, .secondary-btn {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    border: none;
  }
  .primary-btn {
    background: linear-gradient(135deg, #0d58b0, #49b6ea);
    color: white;
    box-shadow: 0 4px 16px rgba(13, 88, 176, 0.35);
  }
  .primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .secondary-btn {
    background: transparent;
    border: 1px solid #143e88;
    color: #84b9d5;
  }

  .success-card {
    background: #0c1a35;
    border: 1px solid rgba(52, 211, 153, 0.3);
    border-radius: 16px;
    padding: 2.5rem 2rem;
    text-align: center;
  }
  .success-icon {
    display: inline-grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(52, 211, 153, 0.15);
    color: #34d399;
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }
  .success-card h2 { margin: 0 0 0.75rem; color: #e8f4fc; }
  .success-card p { color: #84b9d5; font-size: 14px; line-height: 1.6; margin-bottom: 1.5rem; }
</style>
