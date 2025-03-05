import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import App from './App'

// Note: deleted previous implementation that mocked api out, because App doesn't directly use api,
// and children components that _do_ use it are mocked in this test, and this fact helps demonstrate
// the value of mocking out those child components entirely.

// Mock the child components
vi.mock('./ConversationSelector', () => ({
  default: ({
    onSelectConversation,
    selectedConversationId
  }: {
    onSelectConversation: (id: number | null) => void
    selectedConversationId: number | null
  }) => (
    <div data-testid="conversation-selector">
      {/**
       * Note: replaces the html content implementation of the real ConversationSelector, because we don't need or care about those implementation
       * details. We only need something in the test component so that we can hook into it and cause the 'onSelectConversation' callback to be
       * called. This is because of the way that the parent and child components interrelate to one another - the child can run the parent's
       * code by means of callbacks.
       *
       * For instance, in one of the tests below, we see:
       * ```
       *     await user.click(screen.getByTestId('select-conversation-button'))
       * ```
       * Which is the test's way of causing the child to run the callback, by clicking the button that's wired up to the callback.
       *
       * The key idea is this test only cares about the way in which the parent interacts with the children, not on the internal
       * workings of the children.
       */}
      <button
        onClick={() => onSelectConversation(1)}
        data-testid="select-conversation-button"
      >
        Select Conversation 1
      </button>
      <div data-testid="selected-id">{selectedConversationId}</div>
    </div>
  )
}))

vi.mock('./ConversationView', () => ({
  default: ({ conversationId }: { conversationId: number | null }) => (
    <div data-testid="conversation-view">
      {conversationId
        ? `Viewing conversation ${conversationId}`
        : 'No conversation selected'}
    </div>
  )
}))

vi.mock('./CodeEditor', () => ({
  default: ({
    initialCode,
    onChange
  }: {
    initialCode: string
    onChange: (code: string) => void
  }) => (
    <div data-testid="code-editor">
      <textarea
        data-testid="code-editor-textarea"
        value={initialCode}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
    </div>
  )
}))

describe('<App />', () => {
  it('renders the ConversationSelector, CodeEditor, and ConversationView components', () => {
    // Act
    render(<App />)

    // Assert
    expect(screen.getByTestId('conversation-selector')).toBeInTheDocument()
    expect(screen.getByTestId('code-editor')).toBeInTheDocument()
    expect(screen.getByTestId('conversation-view')).toBeInTheDocument()
  })

  it('passes the selected conversation ID to ConversationView', async () => {
    // Arrange
    const user = userEvent.setup()

    // Act
    render(<App />)

    // Initially, no conversation is selected
    expect(screen.getByText('No conversation selected')).toBeInTheDocument()

    // Select a conversation
    await user.click(screen.getByTestId('select-conversation-button'))

    // Assert
    // Note: assertion is based on the text supplied in the mocked child component.
    // Again, just testing the proper parent-child interaction, that the mock was
    // given the appropriate value and hence rendering the appropriate state.
    expect(screen.getByText('Viewing conversation 1')).toBeInTheDocument()
    expect(screen.getByTestId('selected-id').textContent).toBe('1')
  })

  it('initializes the CodeEditor with default code', () => {
    // Act
    render(<App />)

    // Assert
    const textareaElement = screen.getByTestId('code-editor-textarea')
    expect(textareaElement).toHaveValue(
      "# Write your Python code here\nprint('Hello, PlayDo!')"
    )
  })
})
