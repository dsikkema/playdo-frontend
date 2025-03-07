import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import ConversationManager from './ConversationManager'
import { fetchConversation, sendMessage } from '../services/api'
import { Conversation } from '../types'

/**
 * Mock the API module
 *
 * Note: Use vi.mock() to mock whole module, mean vitest replaces all exported functions with the mock functions defined
 * in below object.
 */
vi.mock('../services/api', () => ({
  fetchConversation: vi.fn(),
  sendMessage: vi.fn()
}))

/**
 * Mock implementation of fetchConversation
 *
 * Note: fetchConversation, because it's imported, even though it's been mocked, TypeScript still 'thinks' it's the
 * original type.
 *
 * `as unknown` is the first type 'conversion'. Converts the real type into 'unknown', a special 'any value' kind of
 * type. This erases original type.
 *
 * `as ReturnType<typeof vi.fn>` - ReturnType<T> extracts a return type from a function type, so it sets the type now
 * as 'the same as whatever vi.fn returns'. This type has the methods like mockReturnValue, mockResolvedValue, etc.
 */
const mockFetchConversation = fetchConversation as unknown as ReturnType<
  typeof vi.fn
>

/**
 * Mock implementation of sendMessage
 */
const mockSendMessage = sendMessage as unknown as ReturnType<typeof vi.fn>

describe('<ConversationView />', () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test case for null conversationId
  it('shows "select a conversation" message when no conversation is selected', async () => {
    // Act
    await act(async () => {
      render(<ConversationManager conversationId={null} />)
    })

    // Assert
    expect(
      screen.getByText('Please select a conversation from the list.')
    ).toBeInTheDocument()
    expect(mockFetchConversation).not.toHaveBeenCalled()
  })

  // Test case for loading state
  it('shows loading state while fetching conversation', async () => {
    // Arrange
    // Create a promise that won't resolve immediately to keep the component in loading state
    const fetchPromise = new Promise<Conversation>(() => {})
    mockFetchConversation.mockReturnValue(fetchPromise)
    const conversationId = 1

    // Act
    await act(async () => {
      render(<ConversationManager conversationId={conversationId} />)
    })

    // Assert
    expect(screen.getByText('Loading conversation...')).toBeInTheDocument()
    expect(mockFetchConversation).toHaveBeenCalledWith(conversationId)
  })

  // Test case for error state
  it('shows error message when API call fails', async () => {
    // Arrange
    // Note: similar to mockResolvedValue, it mocks the error thrown inside promise
    mockFetchConversation.mockRejectedValue(new Error('API error'))
    const conversationId = 1

    // Act
    await act(async () => {
      render(<ConversationManager conversationId={conversationId} />)
    })

    // Assert
    /**
     * Note: waitFor() happens because, at first render, there is (or may be) a different state than the one expected.
     * We use hooks related to useState and useEffect to enact re-renders. So, at first, the component may be in the
     * "loading" state, and only after some computation and rerenders happen will the component finish being rendered
     * into the "error state". waitFor() will repeatedly run the provided callback function provided (which performs
     * the assertions) either until they pass, or until a timeout (which would fail the test)
     *
     * This also applies to waitFor() in the tests that successfully render the cases of no/one/many messages.
     */
    await waitFor(() => {
      expect(
        screen.getByText('Failed to load conversation. Please try again later.')
      ).toBeInTheDocument()
    })
    expect(mockFetchConversation).toHaveBeenCalledWith(conversationId)
  })

  // Test case for empty conversation
  it('shows "no messages" when conversation has no messages and allows adding a new message', async () => {
    // Arrange
    const user = userEvent.setup()
    const emptyConversation: Conversation = {
      id: 1,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      messages: []
    }

    const user_msg = 'First message in conversation'
    const assistant_msg = 'Response to first message'
    const updatedConversation: Conversation = {
      ...emptyConversation,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: user_msg }]
        },
        {
          role: 'assistant',
          content: [{ type: 'text', text: assistant_msg }]
        }
      ]
    }

    // Note: different from mockReturnValue - it cuts through the async/Promise layer, mocking what the promise returns
    mockFetchConversation.mockResolvedValue(emptyConversation)
    mockSendMessage.mockResolvedValue(updatedConversation)
    const conversationId = 1

    // Act
    await act(async () => {
      render(<ConversationManager conversationId={conversationId} />)
    })

    // Assert - Step 1: Verify empty conversation state
    await waitFor(() => {
      // 1. Assert the proper 'no messages' content is displayed
      expect(
        screen.getByText(
          'No messages found. Start the conversation by sending a message below.'
        )
      ).toBeInTheDocument()

      // 2. Assert that the input element is present
      expect(
        screen.getByPlaceholderText('Type your message...')
      ).toBeInTheDocument()
      expect(screen.getByText('Send')).toBeInTheDocument()
    })
    expect(mockFetchConversation).toHaveBeenCalledWith(conversationId)

    // Act - Step 2: Add a new message
    const messageInput = screen.getByPlaceholderText('Type your message...')
    await act(async () => {
      await user.type(messageInput, user_msg)
    })

    const sendButton = screen.getByText('Send')
    await act(async () => {
      await user.click(sendButton)
    })

    // Assert - Step 3: Verify the new message is shown
    await waitFor(() => {
      // Check that both the user message and assistant response are displayed
      expect(screen.getByText(user_msg)).toBeInTheDocument()
      expect(screen.getByText(assistant_msg)).toBeInTheDocument()
      expect(screen.getAllByText('You').length).toBe(1)
      expect(screen.getByText('Assistant')).toBeInTheDocument()
      expect(screen.getAllByText('Assistant').length).toBe(1)
    })

    // Verify the API was called correctly
    expect(mockSendMessage).toHaveBeenCalledWith(
      conversationId,
      user_msg,
      '',
      null,
      null
    )
  })

  // Test case for conversation with a single message
  it('renders a conversation with a single message correctly', async () => {
    // Arrange
    const singleMessageConversation: Conversation = {
      id: 1,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: 'This is a single message' }]
        }
      ]
    }
    mockFetchConversation.mockResolvedValue(singleMessageConversation)

    // Act
    const conversationId = 1
    await act(async () => {
      render(<ConversationManager conversationId={conversationId} />)
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Conversation #1')).toBeInTheDocument()
      expect(screen.getByText('You')).toBeInTheDocument()
      expect(screen.getByText('This is a single message')).toBeInTheDocument()
    })
    expect(mockFetchConversation).toHaveBeenCalledWith(conversationId)
  })

  // Test case for conversation with multiple messages
  it('renders a conversation with multiple messages correctly', async () => {
    // Arrange
    const multipleMessagesConversation: Conversation = {
      id: 2,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Hello, how are you?' }]
        },
        {
          role: 'assistant',
          content: [{ type: 'text', text: 'I am doing well, thank you!' }]
        },
        {
          role: 'user',
          content: [{ type: 'text', text: 'That is good to hear.' }]
        }
      ]
    }
    mockFetchConversation.mockResolvedValue(multipleMessagesConversation)

    // Act
    const conversationId = 2
    await act(async () => {
      render(<ConversationManager conversationId={conversationId} />)
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Conversation #2')).toBeInTheDocument()
      expect(screen.getAllByText('You').length).toBe(2)
      expect(screen.getByText('Assistant')).toBeInTheDocument()
      expect(screen.getByText('Hello, how are you?')).toBeInTheDocument()
      expect(
        screen.getByText('I am doing well, thank you!')
      ).toBeInTheDocument()
      expect(screen.getByText('That is good to hear.')).toBeInTheDocument()
    })
    expect(mockFetchConversation).toHaveBeenCalledWith(conversationId)
  })

  // Test case for sending a message
  it('allows users to send messages', async () => {
    // Arrange
    const user = userEvent.setup()
    const initialConversation: Conversation = {
      id: 3,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Initial message' }]
        }
      ]
    }

    const updatedConversation: Conversation = {
      ...initialConversation,
      messages: [
        ...initialConversation.messages,
        {
          role: 'user',
          content: [{ type: 'text', text: 'New message' }]
        },
        {
          role: 'assistant',
          content: [{ type: 'text', text: 'Response to new message' }]
        }
      ]
    }

    mockFetchConversation.mockResolvedValue(initialConversation)
    mockSendMessage.mockResolvedValue(updatedConversation)

    const conversationId = 3

    // Act
    await act(async () => {
      render(<ConversationManager conversationId={conversationId} />)
    })

    // Wait for the initial conversation to load
    await waitFor(() => {
      expect(screen.getByText('Initial message')).toBeInTheDocument()
    })

    // Type and send a new message
    const messageInput = screen.getByPlaceholderText('Type your message...')
    await act(async () => {
      await user.type(messageInput, 'New message')
    })

    const sendButton = screen.getByText('Send')
    await act(async () => {
      await user.click(sendButton)
    })

    // Assert
    await waitFor(() => {
      // Check that the updated messages are displayed
      expect(screen.getByText('Response to new message')).toBeInTheDocument()
    })

    expect(mockSendMessage).toHaveBeenCalledWith(
      conversationId,
      'New message',
      '',
      null,
      null
    )
  })

  // Test case for error handling when sending a message
  it('shows error message when sending a message fails', async () => {
    // Arrange
    const user = userEvent.setup()
    const testConversation: Conversation = {
      id: 4,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Initial message' }]
        }
      ]
    }

    mockFetchConversation.mockResolvedValue(testConversation)
    mockSendMessage.mockRejectedValue(new Error('Failed to send message'))

    const conversationId = 4

    // Act
    await act(async () => {
      render(<ConversationManager conversationId={conversationId} />)
    })

    // Wait for the initial conversation to load
    await waitFor(() => {
      expect(screen.getByText('Initial message')).toBeInTheDocument()
    })

    // Type and send a new message
    const messageInput = screen.getByPlaceholderText('Type your message...')
    await act(async () => {
      await user.type(messageInput, 'This will fail')
    })

    const sendButton = screen.getByText('Send')
    await act(async () => {
      await user.click(sendButton)
    })

    // Assert
    await waitFor(() => {
      expect(
        screen.getByText('Failed to send message. Please try again.')
      ).toBeInTheDocument()
    })

    expect(mockSendMessage).toHaveBeenCalledWith(
      conversationId,
      'This will fail',
      '',
      null,
      null
    )
  })
})
