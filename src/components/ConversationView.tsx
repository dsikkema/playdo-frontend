// src/components/Conversation.tsx

import { useEffect, useState, FormEvent } from 'react'
import { Conversation } from '../types'
import { fetchConversation, sendMessage } from '../services/api'
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
  // State for the message input
  const [messageInput, setMessageInput] = useState('')
  // State to track if a message is being sent
  const [sending, setSending] = useState(false)

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

  // Function to handle sending a message
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault()

    if (!conversationId || !messageInput.trim() || sending) {
      return
    }

    try {
      setSending(true)
      const updatedConversation = await sendMessage(
        conversationId,
        messageInput
      )
      setConversation(updatedConversation)
      setMessageInput('') // Clear the input after sending
    } catch (err) {
      setError('Failed to send message. Please try again.')
      console.error(err)
    } finally {
      setSending(false)
    }
  }

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

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col p-4">
      <h1 className="mb-6 text-2xl font-bold">
        Conversation #{conversation?.id || conversationId}
      </h1>

      {/* Message list with overflow scrolling */}
      <div className="mb-4 flex-1 space-y-4 overflow-y-auto">
        {conversation &&
        conversation.messages &&
        conversation.messages.length > 0 ? (
          conversation.messages.map((message, index) => (
            <Message key={index} message={message} />
          ))
        ) : (
          <div className="py-8">
            No messages found. Start the conversation by sending a message
            below.
          </div>
        )}
      </div>

      {/* Message input form: TOODO: wrap input, expand vertically down */}
      <form onSubmit={handleSendMessage} className="mt-auto flex items-center">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 rounded-l-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={sending}
        />
        <button
          type="submit"
          className="rounded-r-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
          disabled={sending || !messageInput.trim()}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

export default ConversationView
