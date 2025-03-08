import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Conversation } from '../types'

// Mock the config module ONLY
vi.mock('../config', () => ({
  config: { backendUrl: 'http://test-backend' }
}))

// Import the REAL API functions
import {
  fetchConversation,
  fetchConversationIds,
  sendMessage,
  createConversation
} from './api'

// Mock fetch globally
const originalFetch = global.fetch
const mockFetch = vi.fn()

beforeEach(() => {
  global.fetch = mockFetch
  vi.clearAllMocks()
})

afterEach(() => {
  global.fetch = originalFetch
  mockFetch.mockReset()
})

// Rewrite the tests to use the real API functions

describe('API Service', () => {
  describe('fetchConversation', () => {
    it('fetches conversation data successfully', async () => {
      // Setup mock response
      const mockConversation: Conversation = {
        id: 1,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: 'Hello' }]
          }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConversation
      })

      // Call the REAL implementation
      const result = await fetchConversation(1)

      // Verify expectations
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-backend/api/conversations/1'
      )
      expect(result).toEqual(mockConversation)
    })

    it('throws an error when the API call fails', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      // Call the REAL implementation
      await expect(fetchConversation(1)).rejects.toThrow('API error: 404')
    })
  })

  describe('fetchConversationIds', () => {
    it('fetches conversation IDs successfully', async () => {
      // Arrange
      const mockIds = [1, 2, 3]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversation_ids: mockIds })
      })

      // Call the REAL implementation
      const result = await fetchConversationIds()

      // Verify expectations
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-backend/api/conversations'
      )
      expect(result).toEqual(mockIds)
    })

    it('throws an error when the API call fails', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      // Call the REAL implementation
      await expect(fetchConversationIds()).rejects.toThrow('API error: 500')
    })
  })

  describe('sendMessage', () => {
    it('sends a message and returns the updated conversation', async () => {
      // Arrange
      const mockMessage = 'Test message'
      const mockConversationId = 1
      const mockUpdatedConversation: Conversation = {
        id: 1,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: 'Hello' }]
          },
          {
            role: 'user',
            content: [{ type: 'text', text: mockMessage }]
          },
          {
            role: 'assistant',
            content: [{ type: 'text', text: 'Response to the message' }]
          }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedConversation
      })

      // Call the REAL implementation
      const result = await sendMessage(mockConversationId, mockMessage)

      // Verify expectations
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-backend/api/conversations/1/send_message',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: mockMessage,
            editor_code: null,
            stdout: null,
            stderr: null
          })
        }
      )
      expect(result).toEqual(mockUpdatedConversation)
    })

    it('throws an error when the API call fails', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      // Call the REAL implementation
      await expect(sendMessage(1, 'Test message')).rejects.toThrow(
        'API error: 500'
      )
    })
  })

  describe('createConversation', () => {
    it('creates a new conversation and returns the ID', async () => {
      // Arrange
      const mockResponseData = { id: 5 }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponseData
      })

      // Call the REAL implementation
      const result = await createConversation()

      // Verify expectations
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-backend/api/conversations',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      expect(result).toBe(5)
    })

    it('throws an error when the API call fails', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      // Call the REAL implementation
      await expect(createConversation()).rejects.toThrow('API error: 500')
    })
  })
})
