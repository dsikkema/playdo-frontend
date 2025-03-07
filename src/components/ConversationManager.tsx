// src/components/Conversation.tsx

import { useEffect, useState, FormEvent, ChangeEvent, useRef } from 'react'
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
  // Timeout reference - using useRef instead of useState for reliable cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  // Reference to the message container for scrolling
  const messageContainerRef = useRef<HTMLDivElement>(null)
  // Reference to the end of messages for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Function to scroll only the message container to the bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current && messageContainerRef.current) {
      // Using scrollIntoView with a specific container
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight
    }
  }

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
        console.log(`conversation: ${JSON.stringify(data)}`)
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

  // Scroll when conversation changes (either initially loaded or updated with new messages)
  useEffect(() => {
    if (
      conversation &&
      conversation.messages &&
      conversation.messages.length > 0
    ) {
      // Add a small delay to ensure content is rendered before scrolling
      const timeoutId = setTimeout(() => {
        scrollToBottom()
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [conversation])

  // Function to handle sending a message
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault()

    if (!conversationId || !messageInput.trim() || sending) {
      return
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Set a timeout to release the UI if no response
    timeoutRef.current = setTimeout(() => {
      setSending(false)
      setError('The request is taking longer than expected. Please try again.')
    }, 10000) // 10 seconds timeout

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
      // Clear the timeout if it exists
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

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
    <div className="flex h-full flex-col">
      {/* Fixed conversation title */}
      <div className="shrink-0 pb-2">
        <h1 className="text-2xl font-bold">
          Conversation #{conversation?.id || conversationId}
        </h1>
      </div>

      {/* Scrollable message container - flex grow to fill available space */}
      <div ref={messageContainerRef} className="mb-2 grow overflow-y-auto pr-1">
        <div className="space-y-4">
          {conversation &&
          conversation.messages &&
          conversation.messages.length > 0 ? (
            <>
              {conversation.messages.map((message, index) => (
                <Message key={index} message={message} />
              ))}
              {/* Invisible element at the end to scroll to */}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No messages found. Start the conversation by sending a message
              below.
            </div>
          )}
        </div>
      </div>

      {/* Fixed message input area */}
      <div className="shrink-0 border-t border-gray-200 pt-2">
        <form onSubmit={handleSendMessage} className="flex items-start">
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
    </div>
  )
}

export default ConversationManager
