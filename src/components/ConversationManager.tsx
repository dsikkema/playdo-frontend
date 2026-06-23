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
      <div className="flex h-full animate-fade-in items-center justify-center">
        <div className="text-center">
          <svg
            className="mx-auto mb-4 size-16 text-gray-300 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">
            Please select a conversation from the list
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            or create a new one to get started
          </p>
        </div>
      </div>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-full animate-fade-in items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="mb-4">
            <svg
              className="size-10 animate-spin-slow text-primary-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            Loading conversation...
          </p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex h-full animate-fade-in items-center justify-center">
        <div className="text-center">
          <svg
            className="mx-auto mb-4 size-16 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-soft dark:border-gray-700 dark:bg-gray-800">
      {/* Fixed conversation title */}
      <div className="shrink-0 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/50 px-6 py-4 dark:border-gray-700 dark:from-gray-700 dark:to-gray-600/50">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Conversation #{conversation?.id || conversationId}
        </h1>
      </div>

      {/* Scrollable message container - flex grow to fill available space */}
      <div ref={messageContainerRef} className="grow overflow-y-auto px-6 py-4">
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
            <div className="flex h-full animate-fade-in items-center justify-center">
              <div className="text-center">
                <svg
                  className="mx-auto mb-4 size-20 text-gray-200 dark:text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                  />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">
                  No messages yet
                </p>
                <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                  Start the conversation by asking a question
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed message input area */}
      <div className="shrink-0 border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-start gap-2">
          <textarea
            value={messageInput}
            onChange={handleTextareaChange}
            placeholder="Type your message..."
            className="flex-1 resize-none overflow-y-auto rounded-lg border border-gray-300 bg-white p-3 text-sm shadow-sm transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
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
            className="h-[42px] rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:from-primary-600 hover:to-primary-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none"
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
