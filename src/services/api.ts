import { Conversation, ConversationListResponse } from '../types'
import { config } from '../config'

export async function fetchConversation(id: number): Promise<Conversation> {
  try {
    const response = await fetch(`${config.backendUrl}/api/conversations/${id}`)

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
    const response = await fetch(`${config.backendUrl}/api/conversations`)

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
  message: string
): Promise<Conversation> {
  try {
    const response = await fetch(
      `${config.backendUrl}/api/conversations/${conversationId}/send_message`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
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
      headers: {
        'Content-Type': 'application/json'
      }
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
