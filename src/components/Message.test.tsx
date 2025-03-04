import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Message from './Message'
import { Message as MessageType } from '../types'

describe('<Message />', () => {
  // Test case for user message
  it('renders user message correctly', () => {
    // Arrange
    const userMessage: MessageType = {
      role: 'user',
      content: [{ type: 'text', text: 'Hello, this is a test message' }]
    }

    // Act
    render(<Message message={userMessage} />)

    // Assert
    expect(screen.getByText('You')).toBeInTheDocument()
    expect(
      screen.getByText('Hello, this is a test message')
    ).toBeInTheDocument()
  })

  // Test case for assistant message
  it('renders assistant message correctly', () => {
    // Arrange
    const assistantMessage: MessageType = {
      role: 'assistant',
      content: [{ type: 'text', text: 'I am the assistant' }]
    }

    // Act
    render(<Message message={assistantMessage} />)

    // Assert
    expect(screen.getByText('Assistant')).toBeInTheDocument()
    expect(screen.getByText('I am the assistant')).toBeInTheDocument()
  })

  // Test case for message with multiple content items
  it('combines multiple text content items', () => {
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
    expect(screen.getByText('First part. Second part.')).toBeInTheDocument()
  })

  // Test case for message with non-text content items
  it('filters out non-text content items', () => {
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
    expect(screen.getByText('This should be visible.')).toBeInTheDocument()
    expect(
      screen.queryByText('This should not be visible.')
    ).not.toBeInTheDocument()
  })
})
