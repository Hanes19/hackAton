<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { sendAssistantMessage, type ChatMessage, type ProductSearchResult } from '$lib/assistant'
  import { assistantPanelOpen } from '$lib/assistantPanel'

  function closePanel() {
    assistantPanelOpen.set(false)
  }

  function togglePanel() {
    assistantPanelOpen.update((v) => !v)
  }
  let input = $state('')
  let loading = $state(false)
  let messages = $state<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm Budol Assistant. Ask me for a specific product — like \"pandesal\", \"adobo\", or \"coffee\" — and I'll find it on Budol Map.",
      actions: [
        { type: 'navigate', url: '/map', label: 'Browse map' },
        { type: 'navigate', url: '/register', label: 'Become a seller' }
      ]
    }
  ])

  const quickPrompts = [
    { label: 'Find pandesal', icon: '🥐' },
    { label: 'Search adobo chicken', icon: '🍗' },
    { label: 'Coffee near me', icon: '☕' },
    { label: 'How do I register my shop?', icon: '🏪' }
  ]

  let isMapPage = $derived($page.url.pathname.startsWith('/map'))

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return

    input = ''
    messages = [...messages, { role: 'user', content }]
    loading = true

    try {
      const res = await sendAssistantMessage(content, messages.slice(0, -1), $page.url.pathname)
      messages = [
        ...messages,
        {
          role: 'assistant',
          content: res.message,
          actions: res.actions?.length ? res.actions : undefined,
          results: res.results?.length ? res.results : undefined
        }
      ]
    } catch {
      messages = [
        ...messages,
        {
          role: 'assistant',
          content: 'Sorry, I could not connect right now. Make sure the API server is running on port 3001.'
        }
      ]
    } finally {
      loading = false
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function navigate(url: string) {
    goto(url)
    closePanel()
  }

  function openResult(result: ProductSearchResult) {
    goto(result.url)
    closePanel()
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape' && $assistantPanelOpen) closePanel()
  }}
/>

{#if $assistantPanelOpen}
  <button class="backdrop" onclick={closePanel} aria-label="Close assistant"></button>

  <aside class="chat-drawer" aria-label="Budol Assistant">
    <header class="drawer-header">
      <div class="header-brand">
        <span class="avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 3l1.8 5.5H19l-4.5 3.3 1.7 5.2L12 13.8 7.8 17l1.7-5.2L5 8.5h5.2L12 3z" fill="currentColor" />
          </svg>
        </span>
        <div>
          <strong>Budol Assistant</strong>
          <span class="status"><span class="status-dot"></span> Ready to help</span>
        </div>
      </div>
      <button type="button" class="close-btn" onclick={closePanel} aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
    </header>

    <div class="messages" role="log" aria-live="polite">
      {#each messages as msg, i (i)}
        <div class="msg-row" class:user={msg.role === 'user'}>
          {#if msg.role === 'assistant'}
            <span class="msg-avatar" aria-hidden="true">✦</span>
          {/if}
          <div class="msg-stack">
            <div class="bubble" class:user={msg.role === 'user'}>
              {msg.content}
            </div>
            {#if msg.results?.length}
              <div class="result-list">
                {#each msg.results as result (result.shopId + (result.productId ?? 'shop'))}
                  <button type="button" class="result-card" onclick={() => openResult(result)}>
                    {#if result.image}
                      <img src={result.image} alt="" class="result-img" />
                    {:else}
                      <div class="result-img placeholder">{result.productName ? '🍽' : '🏪'}</div>
                    {/if}
                    <div class="result-body">
                      <strong>{result.productName ?? result.shopName}</strong>
                      <span class="result-meta">
                        {#if result.productName}
                          {result.shopName}
                          {#if result.shopCategory} · {result.shopCategory}{/if}
                        {:else}
                          {result.shopCategory ?? 'Shop'}
                        {/if}
                      </span>
                    </div>
                    {#if result.price != null}
                      <span class="result-price">₱{result.price.toLocaleString()}</span>
                    {/if}
                  </button>
                {/each}
              </div>
            {/if}
            {#if msg.actions?.length}
              <div class="action-row">
                {#each msg.actions as action}
                  <button type="button" class="action-btn" onclick={() => navigate(action.url)}>
                    {action.label}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/each}

      {#if loading}
        <div class="msg-row">
          <span class="msg-avatar" aria-hidden="true">✦</span>
          <div class="bubble typing" aria-label="Assistant is thinking">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </div>
        </div>
      {/if}
    </div>

    <div class="drawer-footer">
      <div class="quick-grid">
        {#each quickPrompts as prompt (prompt.label)}
          <button
            type="button"
            class="quick-card"
            onclick={() => send(prompt.label)}
            disabled={loading}
          >
            <span class="quick-icon">{prompt.icon}</span>
            <span class="quick-label">{prompt.label}</span>
          </button>
        {/each}
      </div>

      <div class="composer">
        <textarea
          bind:value={input}
          onkeydown={handleKeydown}
          placeholder="Search a product — e.g. pandesal, adobo, coffee…"
          rows="1"
          disabled={loading}
          aria-label="Message to assistant"
        ></textarea>
        <button
          type="button"
          class="send-btn"
          onclick={() => send()}
          disabled={loading || !input.trim()}
          aria-label="Send message"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  </aside>
{/if}

{#if !isMapPage}
<button
  type="button"
  class="fab"
  class:open={$assistantPanelOpen}
  onclick={togglePanel}
  aria-label={$assistantPanelOpen ? 'Close Budol Assistant' : 'Open Budol Assistant'}
  aria-expanded={$assistantPanelOpen}
>
  {#if $assistantPanelOpen}
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
    </svg>
  {:else}
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l1.2 3.7H17l-3 2.2 1.1 3.5L12 10.8 8.9 12.4l1.1-3.5-3-2.2h3.8L12 3z" fill="currentColor" />
      <path d="M6 18.5c1.8-2.2 4-3.3 6-3.3s4.2 1.1 6 3.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </svg>
    <span class="fab-label">Ask AI</span>
  {/if}
</button>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 8998;
    background: rgba(0, 0, 0, 0.32);
    border: none;
    cursor: pointer;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .chat-drawer {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 8999;
    width: min(400px, 100vw);
    height: 100vh;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    background: var(--bg-card);
    border-left: 1px solid var(--border);
    box-shadow: -12px 0 40px rgba(0, 0, 0, 0.12);
    font-family: var(--font-sans);
    animation: slideIn 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 18px;
    background: linear-gradient(135deg, var(--budol-orange) 0%, var(--budol-orange-hover) 100%);
    color: white;
    flex-shrink: 0;
  }

  .header-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .avatar {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.2);
    flex-shrink: 0;
  }

  .avatar svg {
    width: 22px;
    height: 22px;
    color: white;
  }

  .header-brand strong {
    display: block;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: -0.01em;
  }

  .status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    opacity: 0.92;
  }

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #a5f3b4;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25);
  }

  .close-btn {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.18);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s ease;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.28);
  }

  .close-btn svg {
    width: 18px;
    height: 18px;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 18px 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-height: 0;
    background: var(--bg);
  }

  .msg-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    max-width: 100%;
  }

  .msg-row.user {
    flex-direction: row-reverse;
  }

  .msg-avatar {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--primary-light);
    color: var(--budol-orange);
    font-size: 12px;
    font-weight: 800;
    flex-shrink: 0;
    margin-bottom: 2px;
  }

  .msg-stack {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-width: calc(100% - 36px);
  }

  .msg-row.user .msg-stack {
    align-items: flex-end;
  }

  .bubble {
    padding: 11px 14px;
    border-radius: 16px 16px 16px 4px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--text-dark);
    font-size: 13px;
    line-height: 1.55;
    white-space: pre-wrap;
    box-shadow: var(--shadow-sm);
  }

  .bubble.user {
    background: var(--budol-orange);
    border-color: var(--budol-orange);
    border-radius: 16px 16px 4px 16px;
    color: white;
    box-shadow: none;
  }

  .bubble.typing {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 14px 16px;
    min-width: 56px;
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--text-muted);
    animation: bounce 1.2s infinite ease-in-out;
  }

  .dot:nth-child(2) { animation-delay: 0.15s; }
  .dot:nth-child(3) { animation-delay: 0.3s; }

  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.45; }
    40% { transform: translateY(-5px); opacity: 1; }
  }

  .action-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .action-btn {
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--budol-orange);
    padding: 6px 12px;
    border-radius: var(--radius-pill);
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .action-btn:hover {
    background: var(--budol-orange);
    border-color: var(--budol-orange);
    color: white;
  }

  .result-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .result-card {
    display: grid;
    grid-template-columns: 48px 1fr auto;
    gap: 10px;
    align-items: center;
    width: 100%;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--bg-card);
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .result-card:hover {
    border-color: var(--budol-orange);
    box-shadow: var(--shadow-sm);
  }

  .result-img {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    object-fit: cover;
  }

  .result-img.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    font-size: 20px;
  }

  .result-body {
    min-width: 0;
  }

  .result-body strong {
    display: block;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-dark);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .result-meta {
    display: block;
    font-size: 11px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .result-price {
    font-size: 13px;
    font-weight: 800;
    color: var(--budol-orange);
    white-space: nowrap;
  }

  .drawer-footer {
    flex-shrink: 0;
    padding: 12px 14px 16px;
    border-top: 1px solid var(--border);
    background: var(--bg-card);
  }

  .quick-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 12px;
  }

  .quick-card {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px;
    text-align: left;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--bg);
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s ease;
  }

  .quick-card:hover:not(:disabled) {
    border-color: var(--budol-orange);
    background: var(--primary-light);
  }

  .quick-card:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .quick-icon {
    font-size: 16px;
    line-height: 1;
    flex-shrink: 0;
  }

  .quick-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-dark);
    line-height: 1.35;
  }

  .composer {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 6px;
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
    background: var(--bg);
  }

  .composer:focus-within {
    border-color: var(--budol-orange);
    box-shadow: 0 0 0 3px var(--primary-light);
  }

  .composer textarea {
    flex: 1;
    resize: none;
    border: none;
    background: transparent;
    color: var(--text-dark);
    padding: 8px 10px;
    font-size: 13px;
    font-family: inherit;
    outline: none;
    max-height: 96px;
    min-height: 36px;
  }

  .send-btn {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 50%;
    background: var(--budol-orange);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s ease;
  }

  .send-btn svg {
    width: 18px;
    height: 18px;
  }

  .send-btn:hover:not(:disabled) {
    background: var(--budol-orange-hover);
  }

  .send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .fab {
    position: fixed;
    z-index: 8997;
    right: 20px;
    bottom: 24px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 0 22px 0 16px;
    height: 56px;
    border: none;
    border-radius: var(--radius-pill);
    background: linear-gradient(135deg, var(--budol-orange) 0%, var(--budol-orange-hover) 100%);
    color: white;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 8px 28px rgba(255, 87, 34, 0.45);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .fab svg {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
  }

  .fab:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(255, 87, 34, 0.5);
  }

  .fab.open {
    width: 52px;
    height: 52px;
    padding: 0;
    justify-content: center;
    border-radius: 50%;
  }

  .fab-label {
    white-space: nowrap;
  }

  @media (max-width: 768px) {
    .chat-drawer {
      width: 100vw;
      border-left: none;
    }

    .quick-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 480px) {
    .fab:not(.open) {
      width: 52px;
      height: 52px;
      padding: 0;
      justify-content: center;
      border-radius: 50%;
    }

    .fab-label {
      display: none;
    }
  }
</style>
