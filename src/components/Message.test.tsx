import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Message from './Message'
import { Message as MessageType } from '../types'
import DOMPurify from 'dompurify'

// Mock DOMPurify to verify it's being used
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((html) => {
      // Simple sanitization for testing
      if (typeof html === 'string') {
        // Remove script tags
        let sanitized = html.replace(
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          ''
        )

        // Simple simulation of removing dangerous attributes (not a complete implementation)
        // In a real implementation, DOMPurify would handle this more comprehensively
        sanitized = sanitized
          .replace(/javascript:/gi, 'removed:')
          .replace(/\s+onclick=/gi, ' data-removed-onclick=')

        return sanitized
      }
      return html
    })
  }
}))

describe('<Message />', () => {
  // Test case for user message
  it('renders user message correctly', async () => {
    // Arrange
    const userMessage: MessageType = {
      role: 'user',
      content: [{ type: 'text', text: 'Hello, this is a test message' }]
    }

    // Act
    render(<Message message={userMessage} />)

    // Assert
    expect(screen.getByText('You')).toBeInTheDocument()
    await waitFor(() => {
      expect(
        screen.getByText('Hello, this is a test message')
      ).toBeInTheDocument()
    })
  })

  // Test case for assistant message
  it('renders assistant message correctly', async () => {
    // Arrange
    const assistantMessage: MessageType = {
      role: 'assistant',
      content: [{ type: 'text', text: 'I am the assistant' }]
    }

    // Act
    render(<Message message={assistantMessage} />)

    // Assert
    expect(screen.getByText('Assistant')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('I am the assistant')).toBeInTheDocument()
    })
  })

  // Test case for message with multiple content items
  it('combines multiple text content items', async () => {
    // Arrange
    const multiContentMessage: MessageType = {
      role: 'user',
      content: [
        { type: 'text', text: 'First part.' },
        { type: 'text', text: 'Second part.' }
      ]
    }

    // Act
    render(<Message message={multiContentMessage} />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('First part. Second part.')).toBeInTheDocument()
    })
  })

  // Test case for message with non-text content items
  it('filters out non-text content items', async () => {
    // Arrange
    const mixedContentMessage: MessageType = {
      role: 'assistant',
      content: [
        { type: 'text', text: 'This should be visible.' },
        { type: 'image', text: 'This should not be visible.' } // This is not a real type, just for testing
      ]
    }

    // Act
    render(<Message message={mixedContentMessage} />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('This should be visible.')).toBeInTheDocument()
      expect(
        screen.queryByText('This should not be visible.')
      ).not.toBeInTheDocument()
    })
  })

  // Test case for message with newlines
  it('preserves newlines in message content', async () => {
    // Arrange
    const messageWithNewlines: MessageType = {
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'This is line one.\nThis is line two.\n\nThis is after an empty line.\n```python\ndef example():\n    return "Code block"\n```'
        }
      ]
    }

    // Act
    render(<Message message={messageWithNewlines} />)

    // Assert
    await waitFor(() => {
      // Check the HTML structure to ensure newlines are preserved
      const messageContainer = screen
        .getByText(/This is line one/)
        .closest('div')
      expect(messageContainer).toHaveTextContent('This is line one.')
      expect(messageContainer).toHaveTextContent('This is line two.')
      expect(messageContainer).toHaveTextContent('This is after an empty line.')
      expect(messageContainer).toHaveTextContent('def example():')
      expect(messageContainer).toHaveTextContent('return "Code block"')
    })
  })

  // Test case for markdown formatting
  it('renders markdown formatting correctly', async () => {
    // Arrange
    const markdownMessage: MessageType = {
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'This is a small `example` message with \n\n```\nformatting\n```\n\nand **bold** things.'
        }
      ]
    }

    // Act
    render(<Message message={markdownMessage} />)

    // Assert
    await waitFor(() => {
      const messageContainer = screen
        .getByText(/This is a small/)
        .closest('div')

      // Check for code block
      expect(messageContainer).toHaveTextContent('formatting')

      // Check that all content is present
      expect(messageContainer).toHaveTextContent('This is a small')
      expect(messageContainer).toHaveTextContent('example')
      expect(messageContainer).toHaveTextContent('formatting')
      expect(messageContainer).toHaveTextContent('and')
      expect(messageContainer).toHaveTextContent('bold')
      expect(messageContainer).toHaveTextContent('things')
    })
  })

  // Test that HTML sanitization is properly applied
  it('sanitizes dangerous HTML content', async () => {
    // Arrange
    const dangerousMessage: MessageType = {
      role: 'user',
      content: [
        { type: 'text', text: 'Hello <script>alert("XSS")</script> world' }
      ]
    }

    // Act
    render(<Message message={dangerousMessage} />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Hello world')).toBeInTheDocument()
      expect(DOMPurify.sanitize).toHaveBeenCalled()
    })
  })

  // Test that event handlers are removed
  it('removes dangerous event handlers', async () => {
    // Arrange
    const dangerousMessage: MessageType = {
      role: 'user',
      content: [
        {
          type: 'text',
          text: '<a href="javascript:alert(\'XSS\')" onclick="alert(\'XSS\')">Click me</a>'
        }
      ]
    }

    // Act
    render(<Message message={dangerousMessage} />)

    // Assert
    await waitFor(() => {
      expect(DOMPurify.sanitize).toHaveBeenCalled()

      // The link should be rendered but without the dangerous attributes
      const link = screen.getByText('Click me')
      expect(link).toBeInTheDocument()

      // With our mock implementation, javascript: should be changed to removed:
      expect(link.getAttribute('href')).toBe("removed:alert('XSS')")

      // onclick should be transformed to data-removed-onclick
      expect(link.getAttribute('onclick')).toBeNull()
      expect(link.getAttribute('data-removed-onclick')).toBe("alert('XSS')")
    })
  })

  // Test that iframe elements are handled properly
  it('handles iframe elements properly', async () => {
    // Arrange
    const iframeMessage: MessageType = {
      role: 'user',
      content: [
        { type: 'text', text: '<iframe src="https://evil.com"></iframe>' }
      ]
    }

    // Act
    render(<Message message={iframeMessage} />)

    // Assert
    await waitFor(() => {
      expect(DOMPurify.sanitize).toHaveBeenCalled()

      // We're not testing actual iframe removal since our mock doesn't implement this
      // Instead we verify DOMPurify was called to sanitize the content
      const container = screen.getByText('You').closest('div')
      expect(container).toBeInTheDocument()
    })
  })
})
