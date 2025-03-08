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
    <div className="flex items-center space-x-4">
      <label
        htmlFor="conversation-select"
        className="whitespace-nowrap text-sm font-medium text-gray-700"
      >
        Select conversation:
      </label>
      <div className="relative w-56">
        <select
          id="conversation-select"
          className="block w-full rounded-md border-gray-300 py-1.5 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
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
            <p className="text-xs text-gray-500">Loading...</p>
          </div>
        )}
      </div>
      <button
        onClick={handleCreateConversation}
        disabled={creatingConversation || loading}
        className="whitespace-nowrap rounded-md bg-green-500 px-3 py-1.5 text-sm text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-green-300"
      >
        {creatingConversation ? 'Creating...' : 'New Conversation'}
      </button>
      {error && <p className="ml-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default ConversationSelector
