import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import App from './App'
import usePythonExecution from '../hooks/usePythonExecution'
import { PyodideStatus } from '../services/pyodide'

// Set up the mock for AuthContext
const mockLogout = vi.fn()
const mockUseAuth = vi.fn(() => ({
  isAuthenticated: true,
  token: 'mock-token' as string | null,
  login: vi.fn(),
  logout: mockLogout
}))

// Mock the useAuth hook
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth()
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
    mockUseAuth.mockReturnValueOnce({
      isAuthenticated: false,
      token: null,
      login: vi.fn(),
      logout: vi.fn()
    })

    // Arrange & Act
    render(<App />)

    // Assert
    expect(screen.getByTestId('mock-login')).toBeInTheDocument()
    expect(
      screen.queryByTestId('mock-conversation-selector')
    ).not.toBeInTheDocument()
  })

  it('should render the main components correctly when authenticated', () => {
    // Mock authenticated state
    mockUseAuth.mockReturnValueOnce({
      isAuthenticated: true,
      token: 'mock-token' as string | null,
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
    mockUseAuth.mockReturnValueOnce({
      isAuthenticated: true,
      token: 'mock-token' as string | null,
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
    mockUseAuth.mockReturnValueOnce({
      isAuthenticated: true,
      token: 'mock-token' as string | null,
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
    mockUseAuth.mockReturnValueOnce({
      isAuthenticated: true,
      token: 'mock-token' as string | null,
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
    mockUseAuth.mockReturnValueOnce({
      isAuthenticated: true,
      token: 'mock-token' as string | null,
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
    mockUseAuth.mockReturnValueOnce({
      isAuthenticated: true,
      token: 'mock-token' as string | null,
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
    mockUseAuth.mockReturnValueOnce({
      isAuthenticated: true,
      token: 'mock-token' as string | null,
      login: vi.fn(),
      logout: vi.fn()
    })

    // Arrange
    const user = userEvent.setup()
    const executionResult = {
      stdout: 'Test output',
      stderr: 'Test error',
      error: null,
      result: 'Test result'
    }

    vi.mocked(usePythonExecution).mockReturnValue({
      executeCode: mockExecuteCode,
      initialize: vi.fn(),
      result: executionResult,
      isCodeRunning: false,
      status: PyodideStatus.READY,
      isPyodideInitializing: false,
      error: null
    })

    // Act
    render(<App />)
    await user.click(screen.getByTestId('run-code-button'))

    // Assert
    expect(mockExecuteCode).toHaveBeenCalled()

    // Check that the OutputDisplay component is rendered
    const outputContainer = screen.getByTestId('mock-output-display')
    expect(outputContainer).toBeInTheDocument()

    // Check that it's displaying the expected output
    expect(screen.getByTestId('mock-stdout')).toHaveTextContent('Test output')
    expect(screen.getByTestId('mock-stderr')).toHaveTextContent('Test error')
  })

  it('should clear all user-specific state when user logs out', async () => {
    // This test verifies that useEffect clears all user state on logout
    // to prevent the next user from seeing the previous user's data

    let isAuthenticated = true
    let currentToken: string | null = 'user1-token'
    const mockAuthHook = vi.fn(() => ({
      isAuthenticated,
      token: isAuthenticated ? currentToken : null,
      login: vi.fn(),
      logout: vi.fn(() => {
        isAuthenticated = false
        currentToken = null
      })
    }))

    // Mock the useAuth hook to return our dynamic mock
    vi.mocked(mockUseAuth).mockImplementation(mockAuthHook)

    // Arrange
    const user = userEvent.setup()
    const { rerender } = render(<App />)

    // Act 1: Select a conversation and modify code while authenticated
    await user.click(screen.getByTestId('select-conversation-button'))

    const codeInput = screen.getByTestId('mock-code-input')
    await user.clear(codeInput)
    await user.type(codeInput, 'print("User 1 code")')

    // Assert 1: User state should be set
    expect(screen.getByTestId('selected-id')).toHaveTextContent('1')
    expect(screen.getByTestId('mock-conversation-view')).toHaveTextContent(
      'Viewing conversation 1'
    )
    expect(codeInput).toHaveValue('print("User 1 code")')

    // Act 2: Simulate logout by changing authentication state
    isAuthenticated = false
    currentToken = null
    rerender(<App />)

    // Assert 2: Should show login screen (since user is no longer authenticated)
    expect(screen.getByTestId('mock-login')).toBeInTheDocument()
    expect(
      screen.queryByTestId('mock-conversation-selector')
    ).not.toBeInTheDocument()

    // Act 3: Simulate login again as a different user with different token
    isAuthenticated = true
    currentToken = 'user2-token'
    rerender(<App />)

    // Assert 3: All user state should be cleared due to useEffect
    expect(screen.getByTestId('selected-id')).toHaveTextContent('')
    expect(screen.getByTestId('mock-conversation-view')).toHaveTextContent(
      'No conversation selected'
    )
    expect(screen.getByTestId('mock-code-input')).toHaveValue(
      "# Write your Python code here\nprint('Hello, Playdo!')"
    )
  })
})
