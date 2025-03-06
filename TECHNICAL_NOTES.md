# Playdo Frontend Technical Notes

## Overview

Playdo is an integrated learning environment for high school students learning Python. The frontend is a React/TypeScript application that provides a code editor, execution environment via Pyodide (WASM), and an AI assistant chat interface.

## Core Components

### Main Application Structure

- **App.tsx**: Central component that manages application state and coordinates between the code editor, output display, and conversation components
- **CodeEditor.tsx**: Provides syntax-highlighted code editing capabilities
- **OutputDisplay.tsx**: Shows execution results, including stdout, stderr, and error messages
- **ConversationView.tsx**: Manages the AI assistant chat interface

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
│   ├── ConversationSelector.test.tsx
│   ├── ConversationSelector.tsx
│   ├── ConversationView.test.tsx
│   ├── ConversationView.tsx
│   ├── Message.test.tsx
│   ├── Message.tsx
│   ├── OutputDisplay.test.tsx
│   └── OutputDisplay.tsx
├── config.ts
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

2. **Conversation Flow**:
   - User types messages in the ConversationView component
   - Messages are sent to the backend Flask API
   - Backend communicates with Claude AI and returns responses
   - Responses are displayed in the ConversationView

## Technical Implementation

### Pyodide Integration

- **pyodide.ts**: Core service that interfaces directly with the Pyodide WebAssembly runtime
  - Handles initialization of the Python environment
  - Provides methods to execute Python code and capture output
  - Manages Pyodide's lifecycle states (uninitialized, loading, ready, error)

- **usePythonExecution.ts**: React hook that wraps the Pyodide service
  - Manages state for code execution (running, results, errors)
  - Handles initialization of Pyodide when components mount
  - Provides simplified interface for React components

### Component Props and State

- **App.tsx**: Maintains state for:
  - Selected conversation ID
  - Current code in editor
  - Coordinates the Python execution process

- **CodeEditor.tsx**: Accepts props for:
  - Initial code content
  - onChange callback for when code changes

- **OutputDisplay.tsx**: Accepts props for:
  - Standard output (stdout)
  - Error output (stderr)
  - Runtime errors
  - Loading/execution states

- **ConversationView.tsx**: Uses props for:
  - Conversation ID to load and display messages

## API Integration

The frontend communicates with the Flask backend API for:
- Retrieving and sending conversation messages
- Storing code snippets and execution results
- Tracking learning progress

## Key Design Principles

1. **Gentle Minimalism**: UI is deliberately sleek and uncluttered, focusing on essential components while being beautiful
2. **Hands-On Learning**: Direct code execution in the browser provides immediate feedback
3. **Component Separation**: Clear boundaries between UI components align with single responsibility principle
4. **State Management**: React hooks pattern for local state management
5. **Type Safety**: Comprehensive TypeScript typing throughout the application

## Technical Dependencies

- React 18+ with TypeScript
- Pyodide for in-browser Python execution
- TailwindCSS for styling
- Vite for development and building
