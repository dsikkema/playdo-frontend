// src/components/Conversation.tsx

import { useEffect, useState } from 'react'
import { Conversation } from '../types'
import { fetchConversation } from '../services/api'
import Message from './Message'

export type ConversationViewProps = {
  conversationId: number | null
}

function ConversationView({ conversationId }: ConversationViewProps) {
  // State to store the conversation data
  const [conversation, setConversation] = useState<Conversation | null>(null)
  // State to track loading status
  const [loading, setLoading] = useState(true)
  // State to track any errors
  const [error, setError] = useState<string | null>(null)

  // Effect to fetch the conversation when the component mounts
  useEffect(() => {
    // reset error/conversation state before reloading
    setError(null)
    setConversation(null)

    async function loadConversation() {
      if (conversationId == null) {
        return
      }

      try {
        setLoading(true)
        const data = await fetchConversation(conversationId)
        setConversation(data)
        setError(null)
      } catch (err) {
        setError('Failed to load conversation. Please try again later.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadConversation()
  }, [conversationId]) // Update component every time passed in conversationID changes

  if (conversationId == null) {
    return (
      <div className="py-8">Please select a conversation from the list.</div>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center py-8">Loading conversation...</div>
    )
  }

  // Show error state
  if (error) {
    return <div className="py-8 text-red-500">{error}</div>
  }

  // Show empty state
  if (
    !conversation ||
    !conversation.messages ||
    conversation.messages.length === 0
  ) {
    return <div className="py-8">No messages found.</div>
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-6 text-2xl font-bold">
        Conversation #{conversation.id}
      </h1>
      <div className="space-y-4">
        {conversation.messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}
      </div>
    </div>
  )
}

export default ConversationView
