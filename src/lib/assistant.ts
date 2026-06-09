export interface AssistantAction {
  type: 'navigate'
  url: string
  label: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  actions?: AssistantAction[]
}

export interface AssistantResponse {
  message: string
  actions: AssistantAction[]
  matches?: number
  error?: string
}

export async function sendAssistantMessage(
  message: string,
  history: ChatMessage[],
  page: string
): Promise<AssistantResponse> {
  const res = await fetch('/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history: history.map(({ role, content }) => ({ role, content })),
      page
    })
  })

  const data = await res.json()
  if (!res.ok) {
    return { message: data.error || 'Something went wrong.', actions: [] }
  }

  return data
}
