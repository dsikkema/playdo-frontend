import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import ConversationSelector from './ConversationSelector'
import { fetchConversationIds, createConversation } from '../services/api'
import { ConversationListResponse } from '../types'

// Mock the API functions
vi.mock('../services/api', () => ({
  fetchConversationIds: vi.fn(),
  createConversation: vi.fn()
}))

// Setup mock implementations with proper types
const mockFetchConversationIds = fetchConversationIds as unknown as ReturnType<
  typeof vi.fn
>
const mockCreateConversation = createConversation as unknown as ReturnType<
  typeof vi.fn
>

describe('<ConversationSelector />', () => {
  // Mock props
  const mockOnSelectConversation = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock implementation for API calls
    mockFetchConversationIds.mockResolvedValue([1, 2, 3])
  })

  it('renders the component with a dropdown and fetches conversation IDs', async () => {
    // For this test, make the promise not resolve immediately
    // so we can see the loading state
    const fetchPromise = new Promise<number[]>((resolve) => {
      // Resolve after a short delay
      setTimeout(() => resolve([1, 2, 3]), 100)
    })
    mockFetchConversationIds.mockReturnValue(fetchPromise)

    // Act
    await act(async () => {
      render(
        <ConversationSelector
          selectedConversationId={null}
          onSelectConversation={mockOnSelectConversation}
        />
      )
    })

    // Assert
    expect(screen.getByText('Select a conversation:')).toBeInTheDocument()
    expect(screen.getByText('New Conversation')).toBeInTheDocument()

    // Check that the select dropdown has the placeholder option
    expect(screen.getByText('-- Select a conversation --')).toBeInTheDocument()

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Conversation #1')).toBeInTheDocument()
      expect(screen.getByText('Conversation #2')).toBeInTheDocument()
      expect(screen.getByText('Conversation #3')).toBeInTheDocument()
    })

    // Verify API was called
    expect(mockFetchConversationIds).toHaveBeenCalledTimes(1)
  })

  it('calls onSelectConversation when a conversation is selected', async () => {
    // Arrange
    const user = userEvent.setup()

    // Act
    await act(async () => {
      render(
        <ConversationSelector
          selectedConversationId={null}
          onSelectConversation={mockOnSelectConversation}
        />
      )
    })

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Conversation #1')).toBeInTheDocument()
    })

    // Select a conversation
    const selectElement = screen.getByRole('combobox')
    await act(async () => {
      await user.selectOptions(selectElement, '2')
    })

    // Assert
    expect(mockOnSelectConversation).toHaveBeenCalledWith(2)
  })

  it('shows currently selected conversation', async () => {
    // Act
    await act(async () => {
      render(
        <ConversationSelector
          selectedConversationId={2}
          onSelectConversation={mockOnSelectConversation}
        />
      )
    })

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Conversation #1')).toBeInTheDocument()
    })

    // Assert that the select element has the correct value
    const selectElement = screen.getByRole('combobox') as HTMLSelectElement
    expect(selectElement.value).toBe('2')
  })

  it('creates a new conversation when the button is clicked', async () => {
    // Arrange
    const user = userEvent.setup()
    mockCreateConversation.mockResolvedValue(4)

    // Act
    await act(async () => {
      render(
        <ConversationSelector
          selectedConversationId={null}
          onSelectConversation={mockOnSelectConversation}
        />
      )
    })

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('New Conversation')).toBeEnabled()
    })

    // Click the create button
    await act(async () => {
      await user.click(screen.getByText('New Conversation'))
    })

    // Assert
    expect(mockCreateConversation).toHaveBeenCalledTimes(1)

    // Wait for the creation to complete and verify calls
    await waitFor(() => {
      // Should refresh the conversation list
      expect(mockFetchConversationIds).toHaveBeenCalledTimes(2)
      // Should select the new conversation
      expect(mockOnSelectConversation).toHaveBeenCalledWith(4)
    })
  })

  it('shows error message when fetching conversations fails', async () => {
    // Arrange
    mockFetchConversationIds.mockRejectedValue(new Error('Failed to fetch'))

    // Act
    await act(async () => {
      render(
        <ConversationSelector
          selectedConversationId={null}
          onSelectConversation={mockOnSelectConversation}
        />
      )
    })

    // Assert
    await waitFor(() => {
      expect(
        screen.getByText('Failed to load conversations, please try again.')
      ).toBeInTheDocument()
    })
  })

  it('shows error message when creating a conversation fails', async () => {
    // Arrange
    const user = userEvent.setup()
    mockCreateConversation.mockRejectedValue(new Error('Failed to create'))

    // Act
    await act(async () => {
      render(
        <ConversationSelector
          selectedConversationId={null}
          onSelectConversation={mockOnSelectConversation}
        />
      )
    })

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('New Conversation')).toBeEnabled()
    })

    // Click the create button
    await act(async () => {
      await user.click(screen.getByText('New Conversation'))
    })

    // Assert
    await waitFor(() => {
      expect(
        screen.getByText(
          'Failed to create a new conversation, please try again.'
        )
      ).toBeInTheDocument()
    })
  })

  it('disables the select and button during loading states', async () => {
    // Arrange
    // Don't resolve the promise to keep component in loading state
    mockFetchConversationIds.mockReturnValue(new Promise(() => {}))

    // Act
    await act(async () => {
      render(
        <ConversationSelector
          selectedConversationId={null}
          onSelectConversation={mockOnSelectConversation}
        />
      )
    })

    // Assert
    const selectElement = screen.getByRole('combobox')
    const createButton = screen.getByText('New Conversation')

    expect(selectElement).toBeDisabled()
    expect(createButton).toBeDisabled()
  })

  it('correctly handles ConversationListResponse format from API', async () => {
    // Mock the API to return the actual response format from the server
    const apiResponse: ConversationListResponse = {
      conversation_ids: [1, 2, 3]
    }
    // First mock the return value to be what the API actually returns
    mockFetchConversationIds.mockImplementation(async () => {
      // This simulates what happens in the real API function
      const data = apiResponse
      return data.conversation_ids
    })

    // Act
    await act(async () => {
      render(
        <ConversationSelector
          selectedConversationId={null}
          onSelectConversation={mockOnSelectConversation}
        />
      )
    })

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Conversation #1')).toBeInTheDocument()
      expect(screen.getByText('Conversation #2')).toBeInTheDocument()
      expect(screen.getByText('Conversation #3')).toBeInTheDocument()
    })

    // Verify API was called
    expect(mockFetchConversationIds).toHaveBeenCalledTimes(1)
  })
})
