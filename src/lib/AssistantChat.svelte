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
        <div class="header-info">
          <span class="avatar">🤖</span>
          <div>
            <strong>Budol Assistant</strong>
            <span class="status">Online · Free AI</span>
          </div>
        </div>
        <button class="collapse-btn" onclick={() => (open = false)} aria-label="Collapse assistant">
          <span class="collapse-icon">›</span>
        </button>
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
      <span class="rail-icon">💬</span>
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
    background: #0c1a35;
    border-left: 1px solid rgba(73, 182, 234, 0.2);
    display: flex;
    flex-direction: column;
    transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    overflow: hidden;
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
    gap: 8px;
    width: 100%;
    border: none;
    background: linear-gradient(180deg, #0c1a35 0%, #091525 100%);
    color: white;
    cursor: pointer;
    padding: 16px 0;
    transition: background 0.2s;
  }

  .expand-rail:hover {
    background: linear-gradient(180deg, #112040 0%, #0c1a35 100%);
  }

  .rail-icon {
    font-size: 22px;
    line-height: 1;
  }

  .rail-label {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: #49b6ea;
    text-transform: uppercase;
  }

  .chat-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 360px;
    animation: panelIn 0.22s ease;
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: #091525;
    border-bottom: 1px solid rgba(20, 62, 136, 0.5);
    flex-shrink: 0;
  }

  .header-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .avatar {
    font-size: 24px;
  }

  .header-info strong {
    display: block;
    color: #e8f4fc;
    font-size: 14px;
  }

  .status {
    font-size: 11px;
    color: #49b6ea;
  }

  .collapse-btn {
    background: rgba(73, 182, 234, 0.1);
    border: 1px solid rgba(73, 182, 234, 0.25);
    color: #84b9d5;
    cursor: pointer;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, color 0.2s;
  }

  .collapse-btn:hover {
    background: rgba(73, 182, 234, 0.2);
    color: white;
  }

  .collapse-icon {
    font-size: 18px;
    line-height: 1;
    font-weight: 700;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
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
    border-radius: 14px 14px 14px 4px;
    background: rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(59, 130, 246, 0.25);
    color: #e8f4fc;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  .bubble.user {
    background: #e84c3d;
    border-color: #e84c3d;
    border-radius: 14px 14px 4px 14px;
    color: white;
  }

  .bubble.typing {
    color: #84b9d5;
    font-style: italic;
  }

  .action-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    max-width: 100%;
  }

  .action-btn {
    background: rgba(73, 182, 234, 0.12);
    border: 1px solid rgba(73, 182, 234, 0.35);
    color: #49b6ea;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .action-btn:hover {
    background: rgba(73, 182, 234, 0.25);
    color: white;
  }

  .quick-row {
    display: flex;
    gap: 6px;
    padding: 0 12px 8px;
    overflow-x: auto;
    scrollbar-width: none;
    flex-shrink: 0;
  }

  .quick-row::-webkit-scrollbar {
    display: none;
  }

  .quick-chip {
    flex-shrink: 0;
    background: transparent;
    border: 1px solid rgba(20, 62, 136, 0.7);
    color: #84b9d5;
    padding: 5px 10px;
    border-radius: 16px;
    font-size: 11px;
    cursor: pointer;
    white-space: nowrap;
  }

  .quick-chip:hover:not(:disabled) {
    border-color: #49b6ea;
    color: #49b6ea;
  }

  .quick-chip:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .input-row {
    display: flex;
    gap: 8px;
    padding: 12px;
    border-top: 1px solid rgba(20, 62, 136, 0.5);
    background: #091525;
    flex-shrink: 0;
  }

  .input-row textarea {
    flex: 1;
    resize: none;
    background: #070f1f;
    border: 1px solid #143e88;
    border-radius: 10px;
    color: white;
    padding: 10px 12px;
    font-size: 13px;
    font-family: inherit;
    outline: none;
    max-height: 80px;
  }

  .input-row textarea:focus {
    border-color: #49b6ea;
  }

  .send-btn {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    border: none;
    background: #3b82f6;
    color: white;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    flex-shrink: 0;
    align-self: flex-end;
  }

  .send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .send-btn:not(:disabled):hover {
    background: #2563eb;
  }

  @media (max-width: 768px) {
    .assistant-sidebar {
      position: fixed;
      top: 0;
      right: 0;
      height: 100vh;
      height: 100dvh;
      box-shadow: -8px 0 32px rgba(0, 0, 0, 0.35);
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
      background: rgba(0, 0, 0, 0.45);
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
