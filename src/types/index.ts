// Content item within a message
type ContentItem = {
  text: string
  type: string // Currently only "text", but could have other types in the future
}

// Message structure
export type Message = {
  content: ContentItem[]
  role: 'user' | 'assistant'
  editor_code?: string | null // New field for the code in the editor
  stdout?: string | null // New field for standard output
  stderr?: string | null // New field for standard error
}

// Conversation structure
export type Conversation = {
  created_at: string
  id: number
  messages: Message[]
  updated_at: string
}

export type ConversationListResponse = {
  conversation_ids: number[]
}
