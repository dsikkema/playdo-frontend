// src/components/Conversation.tsx

import { useEffect, useState, FormEvent, ChangeEvent } from 'react'
import { Conversation } from '../types'
import { fetchConversation, sendMessage } from '../services/api'
import Message from './Message'

export type ConversationManagerProps = {
  conversationId: number | null
  currentCode?: string
  stdout?: string | null
  stderr?: string | null
  outputIsStale?: boolean
}

function ConversationManager({
  conversationId,
  currentCode = '',
  stdout = null,
  stderr = null,
  outputIsStale = false
}: ConversationManagerProps) {
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
  // State to track the last sent code and output
  const [lastSentCode, setLastSentCode] = useState<string | null>(null)
  // Timeout reference
  const [sendingTimeout, setSendingTimeout] = useState<NodeJS.Timeout | null>(
    null
  )

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

    // Clear any existing timeout
    if (sendingTimeout) {
      clearTimeout(sendingTimeout)
    }

    // Set a timeout to release the UI if no response
    const timeout = setTimeout(() => {
      setSending(false)
      setError('The request is taking longer than expected. Please try again.')
    }, 10000) // 10 seconds timeout

    setSendingTimeout(timeout)

    try {
      setSending(true)

      // Determine what code and output to send
      const codeToSend = currentCode !== lastSentCode ? currentCode : null

      // Only send output if it matches the current code (not stale) and is different from last sent, and if code is being sent
      let stdoutToSend: string | null = null
      let stderrToSend: string | null = null
      if (codeToSend !== null && !outputIsStale) {
        stdoutToSend = stdout === null ? '' : stdout
        stderrToSend = stderr === null ? '' : stderr
      }

      const updatedConversation = await sendMessage(
        conversationId,
        messageInput,
        codeToSend,
        stdoutToSend,
        stderrToSend
      )

      // Update last sent code and output if we sent them
      if (codeToSend !== null) {
        setLastSentCode(currentCode)
      }

      setConversation(updatedConversation)
      setMessageInput('') // Clear the input after sending
    } catch (err) {
      setError('Failed to send message. Please try again.')
      console.error(err)
    } finally {
      setSending(false)
      if (sendingTimeout) {
        clearTimeout(sendingTimeout)
      }
    }
  }

  // Function to handle textarea input and auto-resize
  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value)

    // Auto-resize the textarea
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`
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

      {/* Message input form with auto-expanding textarea */}
      <form onSubmit={handleSendMessage} className="mt-auto flex items-start">
        <textarea
          value={messageInput}
          onChange={handleTextareaChange}
          placeholder="Type your message..."
          className="flex-1 resize-none overflow-y-auto rounded-l-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={sending}
          rows={1}
          style={{ minHeight: '42px', maxHeight: '150px' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (messageInput.trim() && !sending) {
                handleSendMessage(e)
              }
            }
          }}
        />
        <button
          type="submit"
          className="h-[42px] rounded-r-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
          disabled={sending || !messageInput.trim()}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

export default ConversationManager
