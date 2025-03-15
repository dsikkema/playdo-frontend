import { Conversation, ConversationListResponse } from '../types'
import { config } from '../config'

// Helper function to get the auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('playdo_auth_token')
}

// Helper function to create headers with auth token if available
const createHeaders = (contentType = 'application/json'): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': contentType
  }

  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

export async function fetchConversation(id: number): Promise<Conversation> {
  try {
    const response = await fetch(
      `${config.backendUrl}/api/conversations/${id}`,
      {
        headers: createHeaders()
      }
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return data as Conversation
  } catch (error) {
    console.error('Error fetching conversation:', error)
    throw error
  }
}

export async function fetchConversationIds(): Promise<number[]> {
  try {
    const response = await fetch(`${config.backendUrl}/api/conversations`, {
      headers: createHeaders()
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = (await response.json()) as ConversationListResponse
    return data.conversation_ids
  } catch (error) {
    console.error('Error fetching conversation IDs:', error)
    throw error
  }
}

export async function sendMessage(
  conversationId: number,
  message: string,
  editor_code: string | null = null,
  stdout: string | null = null,
  stderr: string | null = null
): Promise<Conversation> {
  try {
    const response = await fetch(
      `${config.backendUrl}/api/conversations/${conversationId}/send_message`,
      {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({
          message,
          editor_code,
          stdout,
          stderr
        })
      }
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return data as Conversation
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}

export async function createConversation(): Promise<number> {
  try {
    const response = await fetch(`${config.backendUrl}/api/conversations`, {
      method: 'POST',
      headers: createHeaders()
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return data.id as number
  } catch (error) {
    console.error('Error creating conversation:', error)
    throw error
  }
}
