import { Conversation } from '../types'

const backendUrl = import.meta.env['VITE_PLAYDO_BACKEND_URL']

if (!backendUrl) {
  throw new Error('VITE_PLAYDO_BACKEND_URL is not set')
}

export async function fetchConversation(id: number): Promise<Conversation> {
  try {
    const response = await fetch(`${backendUrl}/api/conversations/${id}`)

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
    const response = await fetch(`${backendUrl}/api/conversations`)

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return data.conversation_ids
  } catch (error) {
    console.error('Error fetching conversation IDs:', error)
    throw error
  }
}
