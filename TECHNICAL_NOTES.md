# Playdo Frontend Technical Notes

## Purpose

This document is principally used to populate the prompt for LLM tools that will generate code. After substantive changes or additions
to functionality, the LLM should also updated this document.

Dear AI, if you're reading this... thanks for all your help and just have fun out there.

## Overview

Playdo is an integrated learning environment for high school students learning Python. The frontend is a React/TypeScript application that provides a code editor, execution environment via Pyodide (WASM), and an AI assistant chat interface.

This repository contains the frontend code for Playdo. The backend serves up a REST API which is called by this application.

## Core Components

### Main Application Structure

- **App.tsx**: Central component that manages application state and coordinates between the code editor, output display, and conversation components
- **CodeEditor.tsx**: Provides syntax-highlighted code editing capabilities
- **OutputDisplay.tsx**: Shows execution results, including stdout and stderr
- **ConversationManager.tsx**: Manages the AI assistant chat interface with code context tracking
- **Message.tsx**: Renders individual conversation messages with markdown support and HTML sanitization
- **Login.tsx**: Handles user authentication with a form-based login interface
- **AuthContext.tsx**: Provides authentication state and functions across the application

### `src/` File Structure

```
src
├── assets
│   └── logo.svg
├── components
│   ├── App.test.tsx
│   ├── App.tsx
│   ├── CodeEditor.test.tsx
│   ├── CodeEditor.tsx
│   ├── ConversationManager.test.tsx
│   ├── ConversationManager.tsx
│   ├── ConversationSelector.test.tsx
│   ├── ConversationSelector.tsx
│   ├── Login.test.tsx
│   ├── Login.tsx
│   ├── Message.test.tsx
│   ├── Message.tsx
│   ├── OutputDisplay.test.tsx
│   └── OutputDisplay.tsx
├── config.ts
├── context
│   ├── AuthContext.test.tsx
│   └── AuthContext.tsx
├── hooks
│   ├── usePythonExecution.test.ts
│   └── usePythonExecution.ts
├── index.tsx
├── services
│   ├── api.test.ts
│   ├── api.ts
│   ├── pyodide.test.ts
│   ├── pyodide.ts
│   └── pyodide_integration.test.ts
├── types
│   └── index.ts
└── utils
    └── index.ts
```

## Data Flow

1. **Code Execution Flow**:

   - User writes Python code in the CodeEditor
   - User clicks the run button, triggering `handleRunCode()` in App.tsx
   - App.tsx calls `executeCode()` from the usePythonExecution hook
   - Python code executes in the browser via Pyodide
   - Results display in OutputDisplay component
   - App sets the `outputIsStale` flag to false, indicating that the output matches the current code

2. **Conversation Flow**:

   - User types messages in the ConversationManager component
   - ConversationManager automatically attaches current code and output (when appropriate) to messages
   - Messages are sent to the backend Flask API
   - Backend communicates with Claude AI and returns responses
   - Responses are displayed in the conversation view
   - Messages are rendered with markdown support and sanitized HTML using the Message component

3. **Authentication Flow**:
   - User visits the application and is presented with the Login screen
   - User enters credentials in the Login component
   - Credentials are sent to the backend API via the login endpoint
   - Upon successful authentication, the backend returns a JWT token
   - Token is stored in localStorage and in the AuthContext state
   - Application renders the main interface instead of the login screen
   - Subsequent API requests include the token in the Authorization header
   - User can logout, which clears the token from localStorage and AuthContext

## Technical Implementation

### Authentication System

- **AuthContext.tsx**: Context provider for authentication state and functions

  - Manages token storage and retrieval from localStorage
  - Provides isAuthenticated state to components
  - Exposes login() and logout() functions
  - Initializes authentication state from localStorage on app load

- **Login.tsx**: Component for user authentication

  - Provides a form for username and password input
  - Handles login API requests and response parsing
  - Manages form state and validation
  - Displays loading state during authentication
  - Shows errors for failed login attempts

- **API Authentication Integration**:
  - API service automatically includes JWT token in requests
  - Helper functions for creating authenticated headers
  - Token retrieved from localStorage for API calls
  - Error handling for authentication failures

### Code-Chat Integration

- **ConversationManager.tsx**: Enhanced to support code context tracking

  - Tracks the last sent code to avoid sending duplicate code
  - Intelligently attaches code and output to messages only when changed
  - Manages UI state during message sending with timeout handling
  - Prevents stale output (from previous code versions) from being sent

- **Message Types**: Enhanced to support code context
  - Messages now include optional fields for editor code, stdout, and stderr
  - UI indicates when messages include code updates without cluttering the conversation

### Pyodide Integration

- **pyodide.ts**: Core service that interfaces directly with the Pyodide WebAssembly runtime

  - Handles initialization of the Python environment
  - Provides methods to execute Python code and capture output
  - Manages Pyodide's lifecycle states (uninitialized, loading, ready, error)
  - captures stdout and stderr from Python code

- **usePythonExecution.ts**: React hook that wraps the Pyodide service
  - Manages state for code execution (running, results)
  - Handles initialization of Pyodide when components mount
  - Provides simplified interface for React components

### Component Props and State

- **App.tsx**: Maintains state for:

  - Selected conversation ID
  - Current code in editor
  - Output staleness tracking
  - Coordinates the Python execution process
  - Conditionally renders Login or main application based on authentication status

- **CodeEditor.tsx**: Accepts props for:

  - Initial code content
  - onChange callback for when code changes

- **OutputDisplay.tsx**: Accepts props for:

  - Standard output (stdout)
  - Error output (stderr)
  - Loading/execution states

- **ConversationManager.tsx**: Uses props for:

  - Conversation ID to load and display messages
  - Current code in editor
  - Stdout and stderr from latest execution
  - Flag indicating if output is stale (code changed since last run)

- **Message.tsx**: Uses props for:

  - Message data to render content
  - Processes markdown content with marked library
  - Sanitizes HTML with DOMPurify to prevent XSS attacks

- **Login.tsx**: Uses state for:
  - Username and password input values
  - Loading state during authentication
  - Error messages from failed login attempts

## API Integration

The frontend communicates with the Flask backend API for:

- Retrieving and sending conversation messages
- Storing code snippets and execution results
- Tracking learning progress
- User authentication and session management

### Authentication API

- `/api/login` endpoint accepts:
  - POST requests with username and password
  - Returns JWT token on successful authentication
  - Returns error messages on authentication failures

### Enhanced Message Format

- Messages sent to the backend now include:

  - The user's typed message text
  - Current code in editor (when changed since last message)
  - stdout and stderr (when code has been run and output is not stale)

- This integration enables:
  - Seamless code context sharing without cluttering the UI
  - Automatic inclusion of relevant code with each user message
  - Intelligent tracking to minimize data sent to the backend

## UI/UX Enhancements

### Visual Design System

- **Typography**: Georgia serif font for message content - chosen for its beauty and readability
- **Custom Color Palette**: Extended Tailwind configuration with cohesive primary (green-based) and secondary (purple-based) color schemes
- **Unified Light Theme**: Consistent light theme across all components, including the code editor
- **Custom Animations**: Smooth transitions and micro-interactions including:
  - `fade-in`, `fade-in-up`, `fade-in-down` for content appearance
  - `slide-in-right`, `slide-in-left` for panel transitions
  - `scale-in` for emphasis elements
  - `pulse-soft`, `bounce-soft` for loading states
  - `spin-slow` for loading spinners
- **Custom Shadows**: `shadow-soft` for subtle depth, `shadow-glow-green` and `shadow-glow-purple` for focus states

### Enhanced Components

- **Message Component**:
  - User and assistant avatars with gradient backgrounds
  - Visual indicators for messages containing code
  - Improved typography with prose styling
  - Hover effects and smooth transitions

- **Conversation UI**:
  - Beautiful empty states with illustrative icons
  - Loading animations with context-aware messages
  - Enhanced input area with better visual hierarchy

- **Output Display**:
  - Animated loading states with bouncing dots
  - Clear visual feedback for code execution
  - Helpful empty state with keyboard shortcut hint

### Keyboard Shortcuts

- **Ctrl+Enter / Cmd+Enter**: Execute Python code from anywhere in the application (implemented via CodeMirror keymap extension to prevent conflicts)

### Accessibility & User Experience

- Clear visual feedback for all interactive elements
- Smooth transitions that respect motion preferences
- Consistent hover and focus states
- Improved error states with helpful icons and animations

## Key Design Principles

1. **Gentle Minimalism**: UI is deliberately sleek and uncluttered, focusing on essential components while being beautiful
2. **Hands-On Learning**: Direct code execution in the browser provides immediate feedback
3. **Component Separation**: Clear boundaries between UI components align with single responsibility principle
4. **State Management**: React hooks pattern for local state management
5. **Type Safety**: Comprehensive TypeScript typing throughout the application
6. **Secure By Design**: Authentication integrated throughout the application with proper token management
7. **Delightful Interactions**: Thoughtful animations and transitions that enhance usability without being distracting

## Technical Dependencies

- React 18+ with TypeScript
- Pyodide for in-browser Python execution
- TailwindCSS for styling
- Vite for development and building
- 'Marked' for markdown parsing
- DOMPurify for HTML sanitization
- JWT for secure authentication
