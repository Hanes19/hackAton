<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { sendAssistantMessage, type ChatMessage } from '$lib/assistant'

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
        { type: 'navigate', url: '/dashboard', label: 'Set Up a Shop' }
      ]
    }
  ])

  const quickPrompts = [
    'Find food near me',
    'How do I become a seller?',
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
    open = false
  }
</script>

<div class="assistant-root">
  {#if open}
    <div class="chat-panel" role="dialog" aria-label="Budol Assistant">
      <header class="chat-header">
        <div class="header-info">
          <span class="avatar">🤖</span>
          <div>
            <strong>Budol Assistant</strong>
            <span class="status">Online · Free AI</span>
          </div>
        </div>
        <button class="close-btn" onclick={() => (open = false)} aria-label="Close chat">✕</button>
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
  {/if}

  <button
    class="toggle-btn"
    class:open
    onclick={() => (open = !open)}
    aria-label={open ? 'Close Budol Assistant' : 'Open Budol Assistant'}
  >
    {open ? '✕' : '💬'}
  </button>
</div>

<style>
  .assistant-root {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .toggle-btn {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    background: linear-gradient(135deg, #e84c3d, #c0392b);
    color: white;
    font-size: 22px;
    cursor: pointer;
    box-shadow: 0 6px 24px rgba(232, 76, 61, 0.45);
    transition: transform 0.2s, box-shadow 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toggle-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 28px rgba(232, 76, 61, 0.55);
  }

  .toggle-btn.open {
    background: #333;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    font-size: 16px;
  }

  .chat-panel {
    position: absolute;
    bottom: 68px;
    right: 0;
    width: min(380px, calc(100vw - 32px));
    height: min(520px, calc(100vh - 120px));
    background: #0c1a35;
    border: 1px solid rgba(73, 182, 234, 0.25);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.25s ease;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: #091525;
    border-bottom: 1px solid rgba(20, 62, 136, 0.5);
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

  .close-btn {
    background: transparent;
    border: none;
    color: #84b9d5;
    cursor: pointer;
    font-size: 16px;
    padding: 4px 8px;
    border-radius: 4px;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
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
</style>
