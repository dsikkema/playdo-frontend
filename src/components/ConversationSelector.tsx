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
    <div className="mb-6 rounded-lg bg-white p-4 shadow">
      {/**
       * Note on tailwind css classes above:
       * bg-white: background color
       * shadow: a little border effect of a thin shadow surrounding the element, cast onto its parent element background
       * p-4: padding on all sides (just p, not pt for p-top for instance), (4) represents how much (4*0.25rem == 4*4px). padding means "inside the element"
       * mb-6: margin (m) added to bottom (b). (6) is how much. Margin is "outside the element"
       * rounded-lg: round the corners, (lg) means large radius roundness
       *
       * Too many more below to research. Thank you AI.
       */}
      <div className="mx-auto max-w-2xl">
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="conversation-select"
            className="block text-sm font-medium text-gray-700"
          >
            Select a conversation:
          </label>
          <button
            onClick={handleCreateConversation}
            disabled={creatingConversation || loading}
            className="rounded-md bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-green-300"
          >
            {creatingConversation ? 'Creating...' : 'New Conversation'}
          </button>
        </div>
        <div className="relative">
          <select
            id="conversation-select"
            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            value={
              selectedConversationId === null
                ? ''
                : selectedConversationId.toString()
            }
            onChange={handleSelectChange}
            disabled={loading || creatingConversation}
          >
            <option value="">-- Select a conversation --</option>
            {conversationIds.map((id) => (
              <option key={id} value={id}>
                Conversation #{id}
              </option>
            ))}
          </select>
          {loading && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-12">
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}

export default ConversationSelector
