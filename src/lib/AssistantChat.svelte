<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { sendAssistantMessage, type ChatMessage } from '$lib/assistant'

  export const SIDEBAR_WIDTH_OPEN = 360
  export const SIDEBAR_WIDTH_COLLAPSED = 52

  let open = $state(false)
  let input = $state('')
  let loading = $state(false)
  let messages = $state<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm Budol Assistant. I can help you find products, navigate the app, or guide you through setting up your shop. What can I help with?",
      actions: [
        { type: 'navigate', url: '/map', label: 'Browse Shops' },
        { type: 'navigate', url: '/register', label: 'Register as Seller' }
      ]
    }
  ])

  const quickPrompts = [
    'Find food near me',
    'How do I register my shop?',
    'Take me to the map',
    'Help me add a product'
  ]

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
          actions: res.actions?.length ? res.actions : undefined
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
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape' && open) open = false
  }}
/>

{#if open}
  <button class="mobile-backdrop" onclick={() => (open = false)} aria-label="Close assistant"></button>
{/if}

<aside class="assistant-sidebar" class:open aria-label="Budol Assistant panel">
  {#if open}
    <div class="chat-panel">
      <header class="chat-header">
        <div class="header-accent"></div>
        <div class="header-row">
          <div class="header-info">
            <span class="avatar">✦</span>
            <div>
              <strong>Budol Assistant</strong>
              <span class="status"><span class="status-dot"></span> Online</span>
            </div>
          </div>
          <button class="collapse-btn" onclick={() => (open = false)} aria-label="Collapse assistant">
            <span class="collapse-icon">›</span>
          </button>
        </div>
      </header>

      <div class="messages">
        {#each messages as msg}
          <div class="msg-row" class:user={msg.role === 'user'}>
            <div class="bubble" class:user={msg.role === 'user'}>
              {msg.content}
            </div>
            {#if msg.actions?.length}
              <div class="action-row">
                {#each msg.actions as action}
                  <button class="action-btn" onclick={() => navigate(action.url)}>
                    {action.label} →
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
        {#if loading}
          <div class="msg-row">
            <div class="bubble typing">Thinking...</div>
          </div>
        {/if}
      </div>

      <div class="quick-row">
        {#each quickPrompts as prompt}
          <button class="quick-chip" onclick={() => send(prompt)} disabled={loading}>{prompt}</button>
        {/each}
      </div>

      <div class="input-row">
        <textarea
          bind:value={input}
          onkeydown={handleKeydown}
          placeholder="Ask anything — find products, navigate, seller help..."
          rows="1"
          disabled={loading}
        ></textarea>
        <button class="send-btn" onclick={() => send()} disabled={loading || !input.trim()} aria-label="Send">
          ↑
        </button>
      </div>
    </div>
  {:else}
    <button class="expand-rail" onclick={() => (open = true)} aria-label="Open Budol Assistant">
      <span class="rail-icon">✦</span>
      <span class="rail-label">AI</span>
    </button>
  {/if}
</aside>

<style>
  .assistant-sidebar {
    --sidebar-width: 52px;
    flex-shrink: 0;
    width: var(--sidebar-width);
    height: 100vh;
    position: sticky;
    top: 0;
    z-index: 9000;
    background: var(--bg-card);
    border-left: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: var(--font-sans);
    overflow: hidden;
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.04);
  }

  .assistant-sidebar.open {
    --sidebar-width: 360px;
  }

  .mobile-backdrop {
    display: none;
  }

  .expand-rail {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    border: none;
    background: var(--bg-card);
    color: var(--budol-orange);
    cursor: pointer;
    padding: 16px 0;
    transition: background 0.2s;
  }

  .expand-rail:hover {
    background: var(--primary-light);
  }

  .rail-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--primary-light);
    font-size: 14px;
    font-weight: 800;
    line-height: 1;
  }

  .rail-label {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .chat-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 360px;
    animation: panelIn 0.22s ease;
    background: var(--bg);
  }

  @keyframes panelIn {
    from {
      opacity: 0;
      transform: translateX(12px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .chat-header {
    flex-shrink: 0;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border);
  }

  .header-accent {
    height: 3px;
    background: var(--gradient-brand);
  }

  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
  }

  .header-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .avatar {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: var(--primary-light);
    color: var(--budol-orange);
    font-size: 16px;
    font-weight: 800;
  }

  .header-info strong {
    display: block;
    color: var(--text-dark);
    font-size: 14px;
    font-weight: 700;
  }

  .status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: var(--text-muted);
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--success);
    box-shadow: 0 0 0 2px var(--success-bg);
  }

  .collapse-btn {
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text-muted);
    cursor: pointer;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .collapse-btn:hover {
    border-color: var(--budol-orange);
    color: var(--budol-orange);
    background: var(--primary-light);
  }

  .collapse-icon {
    font-size: 18px;
    line-height: 1;
    font-weight: 700;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
  }

  .msg-row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .msg-row.user {
    align-items: flex-end;
  }

  .bubble {
    max-width: 88%;
    padding: 10px 14px;
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
    color: var(--text-inverse);
    box-shadow: none;
  }

  .bubble.typing {
    color: var(--text-muted);
    font-style: italic;
    box-shadow: none;
  }

  .action-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    max-width: 100%;
  }

  .action-btn {
    background: var(--bg-card);
    border: 1px solid var(--border-strong);
    color: var(--budol-orange);
    padding: 6px 12px;
    border-radius: var(--radius-pill);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .action-btn:hover {
    background: var(--budol-orange);
    border-color: var(--budol-orange);
    color: white;
  }

  .quick-row {
    display: flex;
    gap: 6px;
    padding: 0 12px 8px;
    overflow-x: auto;
    scrollbar-width: none;
    flex-shrink: 0;
    background: var(--bg);
  }

  .quick-row::-webkit-scrollbar {
    display: none;
  }

  .quick-chip {
    flex-shrink: 0;
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--text-muted);
    padding: 6px 12px;
    border-radius: var(--radius-pill);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s ease;
  }

  .quick-chip:hover:not(:disabled) {
    border-color: var(--budol-orange);
    color: var(--budol-orange);
    background: var(--primary-light);
  }

  .quick-chip:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .input-row {
    display: flex;
    gap: 8px;
    padding: 12px;
    border-top: 1px solid var(--border);
    background: var(--bg-card);
    flex-shrink: 0;
  }

  .input-row textarea {
    flex: 1;
    resize: none;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text-dark);
    padding: 10px 12px;
    font-size: 13px;
    font-family: inherit;
    outline: none;
    max-height: 80px;
  }

  .input-row textarea:focus {
    border-color: var(--budol-orange);
    box-shadow: 0 0 0 3px var(--primary-light);
  }

  .send-btn {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    border: none;
    background: var(--budol-orange);
    color: white;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    flex-shrink: 0;
    align-self: flex-end;
    transition: background 0.15s ease;
  }

  .send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .send-btn:not(:disabled):hover {
    background: var(--budol-orange-hover);
  }

  @media (max-width: 768px) {
    .assistant-sidebar {
      position: fixed;
      top: 0;
      right: 0;
      height: 100vh;
      height: 100dvh;
      box-shadow: var(--shadow-lg);
    }

    .assistant-sidebar:not(.open) {
      --sidebar-width: 44px;
    }

    .assistant-sidebar.open {
      --sidebar-width: min(360px, 100vw);
    }

    .mobile-backdrop {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 8999;
      background: rgba(0, 0, 0, 0.35);
      border: none;
      cursor: pointer;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  }
</style>
