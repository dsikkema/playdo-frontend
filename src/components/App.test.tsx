import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import App from './App'
import usePythonExecution from '../hooks/usePythonExecution'
import { PyodideStatus } from '../services/pyodide'

// Mock the useAuth hook
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    token: 'mock-token',
    login: vi.fn(),
    logout: vi.fn()
  }))
}))

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
    <div data-testid="mock-conversation-selector">
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

vi.mock('./ConversationManager', () => ({
  default: ({ conversationId }: { conversationId: number | null }) => (
    <div data-testid="mock-conversation-view">
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
    <div data-testid="mock-code-editor">
      <textarea
        data-testid="mock-code-input"
        value={initialCode}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
    </div>
  )
}))

// Mock the Login component
vi.mock('./Login', () => ({
  default: () => <div data-testid="mock-login">Login Form</div>
}))

// Mock the OutputDisplay component
vi.mock('./OutputDisplay', () => ({
  default: ({
    stdout,
    stderr,
    error
  }: {
    stdout: string
    stderr: string
    error: string | null
    isLoading?: boolean
  }) => (
    <div data-testid="mock-output-display">
      {stdout && <pre data-testid="mock-stdout">{stdout}</pre>}
      {stderr && <pre data-testid="mock-stderr">{stderr}</pre>}
      {error && <pre data-testid="mock-error">{error}</pre>}
    </div>
  )
}))

// Mock the usePythonExecution hook
vi.mock('../hooks/usePythonExecution', () => ({
  default: vi.fn(() => ({
    executeCode: vi.fn().mockImplementation(() => {
      // Simulate successful execution
      return Promise.resolve({
        stdout: 'Execution output',
        stderr: '',
        error: null,
        result: null
      })
    }),
    initialize: vi.fn().mockResolvedValue(undefined),
    result: {
      stdout: 'Execution output',
      stderr: '',
      error: null,
      result: null
    },
    isLoading: false,
    isPyodideInitializing: false,
    status: PyodideStatus.READY,
    error: null
  }))
}))

describe('<App />', () => {
  const mockExecuteCode = vi.fn().mockResolvedValue({
    stdout: 'Execution output',
    stderr: '',
    error: null,
    result: null
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePythonExecution).mockReturnValue({
      executeCode: mockExecuteCode,
      initialize: vi.fn().mockResolvedValue(undefined),
      result: {
        stdout: 'Execution output',
        stderr: '',
        result: null
      },
      isCodeRunning: false,
      status: PyodideStatus.READY,
      isPyodideInitializing: false,
      error: null
    })
  })

  it('should render the login screen when not authenticated', () => {
    // Mock unauthenticated state
    vi.mocked(require('../context/AuthContext').useAuth).mockReturnValueOnce({
      isAuthenticated: false,
      token: null,
      login: vi.fn(),
      logout: vi.fn()
    })

    // Arrange & Act
    render(<App />)

    // Assert
    expect(screen.getByTestId('mock-login')).toBeInTheDocument()
    expect(screen.queryByTestId('mock-conversation-selector')).not.toBeInTheDocument()
  })

  it('should render the main components correctly when authenticated', () => {
    // Mock authenticated state
    vi.mocked(require('../context/AuthContext').useAuth).mockReturnValueOnce({
      isAuthenticated: true,
      token: 'mock-token',
      login: vi.fn(),
      logout: vi.fn()
    })

    // Arrange & Act
    render(<App />)

    // Assert
    expect(screen.getByTestId('mock-conversation-selector')).toBeInTheDocument()
    expect(screen.getByTestId('mock-code-editor')).toBeInTheDocument()
    expect(screen.getByTestId('mock-conversation-view')).toBeInTheDocument()
  })

  it('should render the run button when authenticated', () => {
    // Mock authenticated state
    vi.mocked(require('../context/AuthContext').useAuth).mockReturnValueOnce({
      isAuthenticated: true,
      token: 'mock-token',
      login: vi.fn(),
      logout: vi.fn()
    })

    // Arrange & Act
    render(<App />)

    // Assert
    expect(screen.getByTestId('run-code-button')).toBeInTheDocument()
  })

  it('should render the OutputDisplay component when authenticated', () => {
    // Mock authenticated state
    vi.mocked(require('../context/AuthContext').useAuth).mockReturnValueOnce({
      isAuthenticated: true,
      token: 'mock-token',
      login: vi.fn(),
      logout: vi.fn()
    })

    // Arrange & Act
    render(<App />)

    // Assert
    expect(screen.getByTestId('mock-output-display')).toBeInTheDocument()
  })

  it('should execute code when the run button is clicked', async () => {
    // Mock authenticated state
    vi.mocked(require('../context/AuthContext').useAuth).mockReturnValueOnce({
      isAuthenticated: true,
      token: 'mock-token',
      login: vi.fn(),
      logout: vi.fn()
    })

    // Arrange
    const user = userEvent.setup()
    render(<App />)
    const runButton = screen.getByTestId('run-code-button')

    // Act
    await user.click(runButton)

    // Assert
    expect(mockExecuteCode).toHaveBeenCalledTimes(1)
    expect(mockExecuteCode).toHaveBeenCalledWith(
      "# Write your Python code here\nprint('Hello, Playdo!')"
    )
  })

  it('should initialize Pyodide on component mount when authenticated', async () => {
    // Mock authenticated state
    vi.mocked(require('../context/AuthContext').useAuth).mockReturnValueOnce({
      isAuthenticated: true,
      token: 'mock-token',
      login: vi.fn(),
      logout: vi.fn()
    })

    // Arrange
    const mockInitialize = vi.fn().mockResolvedValue(undefined)
    vi.mocked(usePythonExecution).mockReturnValue({
      executeCode: mockExecuteCode,
      initialize: mockInitialize,
      result: null,
      isCodeRunning: false,
      status: PyodideStatus.UNINITIALIZED,
      isPyodideInitializing: false,
      error: null
    })

    // Act
    render(<App />)

    // Assert
    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalledTimes(1)
    })
  })

  it('should handle Python execution errors gracefully', async () => {
    // Mock authenticated state
    vi.mocked(require('../context/AuthContext').useAuth).mockReturnValueOnce({
      isAuthenticated: true,
      token: 'mock-token',
      login: vi.fn(),
      logout: vi.fn()
    })

    // Arrange
    const mockExecuteWithError = vi
      .fn()
      .mockRejectedValue(new Error('Execution failed'))
    vi.mocked(usePythonExecution).mockReturnValue({
      executeCode: mockExecuteWithError,
      initialize: vi.fn().mockResolvedValue(undefined),
      result: null,
      isCodeRunning: false,
      status: PyodideStatus.READY,
      isPyodideInitializing: false,
      error: new Error('Execution failed')
    })

    // Spy on console.error
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const user = userEvent.setup()
    render(<App />)
    const runButton = screen.getByTestId('run-code-button')

    // Act
    await user.click(runButton)

    // Assert
    expect(mockExecuteWithError).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to execute code:',
      expect.any(Error)
    )

    // Cleanup
    consoleErrorSpy.mockRestore()
  })

  it('should pass execution result to OutputDisplay after running code', async () => {
    // Mock authenticated state
    vi.mocked(require('../context/AuthContext').useAuth).mockReturnValueOnce({
      isAuthenticated: true,
      token: 'mock-token',
      login: vi.fn(),
      logout: vi.fn()
    })

    // Arrange
    const user = userEvent.setup()
    render(<App />)
    const runButton = screen.getByTestId('run-code-button')

    // Act
    await user.click(runButton)

    // Assert - verify that the result is displayed
    expect(screen.getByTestId('mock-stdout')).toHaveTextContent('Execution output')
  })
})
