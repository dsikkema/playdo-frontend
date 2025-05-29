import { useState, useEffect } from 'react'
import { fetchConversationIds, createConversation } from '../services/api'

type ConversationSelectorProps = {
  selectedConversationId: number | null
  onSelectConversation: (id: number | null) => void
}

function ConversationSelector({
  onSelectConversation,
  selectedConversationId
}: ConversationSelectorProps) {
  const [conversationIds, setConversationIds] = useState<number[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [creatingConversation, setCreatingConversation] =
    useState<boolean>(false)

  const loadConversationIds = async () => {
    try {
      setLoading(true)
      const ids = await fetchConversationIds()
      setConversationIds(ids)
      setError(null)
    } catch (e) {
      setError('Failed to load conversations, please try again.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConversationIds()
  }, [])

  /**
   * On the changing of the selector, call the callback given as a prop which will
   * cause the conversation to render
   */
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    if (value === '') {
      onSelectConversation(null)
    } else {
      onSelectConversation(Number(value))
    }
  }

  const handleCreateConversation = async () => {
    try {
      setCreatingConversation(true)
      setError(null)
      const newConversationId = await createConversation()

      // Refresh the conversation list
      await loadConversationIds()

      // Select the newly created conversation
      onSelectConversation(newConversationId)
    } catch (e) {
      setError('Failed to create a new conversation, please try again.')
      console.error(e)
    } finally {
      setCreatingConversation(false)
    }
  }

  return (
    <div className="flex items-center space-x-3">
      <label
        htmlFor="conversation-select"
        className="whitespace-nowrap text-sm font-medium text-gray-600 dark:text-gray-300"
      >
        Select conversation:
      </label>
      <div className="relative w-56">
        <select
          id="conversation-select"
          className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          value={
            selectedConversationId === null
              ? ''
              : selectedConversationId.toString()
          }
          onChange={handleSelectChange}
          disabled={loading || creatingConversation}
        >
          <option value="">-- Select --</option>
          {conversationIds.map((id) => (
            <option key={id} value={id}>
              Conversation #{id}
            </option>
          ))}
        </select>
        {loading && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-8">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Loading...
            </p>
          </div>
        )}
      </div>
      <button
        onClick={handleCreateConversation}
        disabled={creatingConversation || loading}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:from-primary-600 hover:to-primary-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none"
      >
        {creatingConversation ? (
          <>
            <svg
              className="size-4 animate-spin"
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
            Creating...
          </>
        ) : (
          <>
            <svg
              className="size-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Conversation
          </>
        )}
      </button>
      {error && (
        <p className="ml-2 animate-fade-in text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

export default ConversationSelector
