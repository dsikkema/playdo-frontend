import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import Message from './Message'
import { Message as MessageType } from '../types'
import { vi } from 'vitest'
import DOMPurify from 'dompurify'

vi.mock('DOMPurify', () => ({
  default: {
    sanitize: vi.fn().mockImplementation((input) => input)
  }
}))

describe('<Message />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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

      // Check the newlines are present (in html form) by seeing 'This is after an empty line'
      const afterEmptyLine = screen.getByText('This is after an empty line.')
      expect(afterEmptyLine).toBeInTheDocument()
      expect(afterEmptyLine.tagName).toBe('P')
      // makes sure no other text in that paragraph, because it's newline separated
      expect(afterEmptyLine.textContent).toBe('This is after an empty line.')
    })
  })

  // Test case for markdown formatting
  it('renders markdown formatting correctly', async () => {
    /**
     * Note: this is actually a bit of an integration test because we don't mock marked, but call the
     * real component in the test. That's okay.
     */
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
      // Find elements by their expected rendering
      const container = screen.getByText(/This is a small/).closest('.prose')
      expect(container).not.toBeNull()

      // Check for code inline element
      const codeInline = container?.querySelector('code')
      expect(codeInline).not.toBeNull()
      expect(codeInline).toHaveTextContent('example')

      // Check for code block
      const preElement = container?.querySelector('pre')
      expect(preElement).not.toBeNull()
      const codeBlock = preElement?.querySelector('code')
      expect(codeBlock).not.toBeNull()
      expect(codeBlock).toHaveTextContent('formatting')

      // Check for bold text
      const boldElement = container?.querySelector('strong')
      expect(boldElement).not.toBeNull()
      expect(boldElement).toHaveTextContent('bold')
    })
  })

  // Test that HTML sanitization is properly applied
  it('sanitizes HTML content', async () => {
    /**
     * Note: I actually wanted a kind of 'integration test' here, to actually rev DOMPurify's engine
     * and make the test verify _for sure_ that it removed the script. But it doesn't run while in
     * this testing mode (unsure why, possibly related to the type of DOM used by Vitest. DOMPurify
     * relies heavily on in-browser DOM APIs for performance reasons, so it's not surprising that
     * it breaks in highly envrionment-dependent ways). Hence, DOMPurify is mocked, and we just
     * verify that it gets called, only manual testing shows that it 'does its job'
     */
    // Arrange
    const message = 'Hello world `<script>bad stuff</script>` this is bad!'
    // const message = 'Hello world'
    const dangerousMessage: MessageType = {
      role: 'user',
      content: [{ type: 'text', text: message }]
    }

    // Act
    render(<Message message={dangerousMessage} />)

    // PS: Found something cool here. I was doing { debug } = render()...
    // and not seeing the message render when I called debug(), which was
    // because it was still (asynchronously) waiting to be rendered. Always
    // think in async terms in React!!!

    // Assert
    await waitFor(() => {
      expect(DOMPurify.sanitize).toHaveBeenCalledOnce()
      expect(DOMPurify.sanitize).toHaveBeenCalledWith(
        expect.stringContaining('Hello world')
      )
    })
  })
})
