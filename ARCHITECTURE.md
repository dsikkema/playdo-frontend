# Playdo Architecture

This document outlines the architecture for Playdo, an integrated learning environment designed for high school students learning Python. The architecture described here aims to balance quick MVP development with sound architectural decisions that will allow for future expansion.

## System Overview

Playdo is a web application with a clear separation between frontend and backend components:

- **Frontend**: React/TypeScript application that provides the user interface, code editor, and handles Python code execution via Pyodide (WASM)
- **Backend**: Flask/Python API that manages conversations with the Claude AI, stores conversation history, and tracks learning progress

The application follows a client-server architecture with the frontend making API calls to the backend for AI interactions and data persistence.

## Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build/Dev Tool**: Vite
- **State Management**: React Context API
- **Styling**: Tailwind CSS
- **Code Execution**: Pyodide (WebAssembly Python runtime)
- **Code Editor**: To be determined (CodeMirror or Monaco Editor recommended)
- **Testing**: Jest + React Testing Library

### Backend
- **Framework**: Flask
- **Database**: SQLite (with SQLAlchemy ORM)
- **AI Integration**: Anthropic Claude API (via Python SDK)
- **Package Management**: uv
- **Code Quality**: Ruff and Mypy
- **Testing**: pytest

## Architecture Decisions

### Client-Side Python Execution
Pyodide allows Python code to run directly in the browser, eliminating the need for server-side execution. This decision:
- Reduces server load and infrastructure costs
- Removes security concerns associated with executing untrusted code on the server
- Provides immediate feedback to students without network latency
- Enables a more responsive user experience

### Backend as API + LLM Proxy
The backend serves as both a REST API for data persistence and a proxy for Claude API interactions. This pattern:
- Secures API keys
- Allows for rate limiting and cost control
- Enables pre/post-processing of prompts and responses
- Provides a foundation for future authentication and multi-user support

### SQLite for Data Storage
Using SQLite for the MVP simplifies development while maintaining a path to more robust database solutions:
- Zero configuration required
- File-based storage (no separate database server)
- SQLAlchemy abstraction allows easy migration to PostgreSQL when needed
- Sufficient performance for dozens of concurrent users

### React Context for State Management
React Context provides a simpler approach to state management than alternatives like Redux:
- Reduced boilerplate code
- Native React solution with no additional dependencies
- Sufficient for the current application complexity
- Easier testing setup

### TypeScript for Frontend Development
TypeScript provides static typing which:
- Catches type-related errors during development
- Improves IDE support and code completion
- Creates self-documenting interfaces between components
- Helps maintain code quality during rapid development

## Component Architecture

### Frontend Components

```
frontend/
├── src/
│   ├── components/
│   │   ├── CodeEditor/  (Code editing & execution interface)
│   │   ├── ChatInterface/  (AI assistant interaction)
│   │   ├── OutputDisplay/  (Code execution results)
│   │   └── common/  (Shared UI components)
│   ├── contexts/
│   │   ├── ConversationContext.tsx  (Manages chat state)
│   │   └── CodeContext.tsx  (Manages code editor state)
│   ├── services/
│   │   ├── api.ts  (Backend API communication)
│   │   └── pyodide.ts  (Python execution service)
│   ├── hooks/
│   │   └── usePythonExecution.ts  (Custom hook for code execution)
│   ├── types/
│   │   └── index.ts  (TypeScript type definitions)
│   ├── utils/
│   │   └── helpers.ts  (Utility functions)
│   ├── App.tsx
│   └── main.tsx
```

### Backend Components

```
backend/playdo/
├── app.py  (Application entry point)
├── config.py  (Application configuration)
├── db.py  (Database connection)
├── models/
│   ├── conversation.py  (Conversation and message models)
│   ├── code_snippet.py  (Code history model)
├── routes/
│   ├── conversation.py  (Conversation API endpoints)
│   └── progress.py  (Learning progress endpoints)
├── services/
│   ├── llm.py  (Claude API integration)
│   └── curriculum.py  (Learning DAG and progress tracking)
└── utils/
    └── helpers.py  (Utility functions)
```

## Data Models

### Conversation Model
```python
class Conversation(Base):
    __tablename__ = 'conversations'

    id = Column(String, primary_key=True)  # UUID
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    title = Column(String)  # Auto-generated or user-provided

    messages = relationship('Message', back_populates='conversation')
```

### Message Model
```python
class Message(Base):
    __tablename__ = 'messages'

    id = Column(String, primary_key=True)  # UUID
    conversation_id = Column(String, ForeignKey('conversations.id'))
    role = Column(String)  # 'user', 'assistant', or 'system'
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship('Conversation', back_populates='messages')
```

### Code Snippet Model
```python
class CodeSnippet(Base):
    __tablename__ = 'code_snippets'

    id = Column(String, primary_key=True)  # UUID
    conversation_id = Column(String, ForeignKey('conversations.id'))
    code = Column(Text)
    output = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
```

## API Endpoints

### Conversation Endpoints

- `POST /api/conversations`: Create a new conversation
- `GET /api/conversations`: List all conversations
- `GET /api/conversations/{id}`: Get a specific conversation with messages
- `POST /api/conversations/{id}/messages`: Add a message to a conversation
  - This endpoint will:
    1. Store the user's message
    2. Send the message to Claude API with appropriate context
    3. Store Claude's response
    4. Return both messages to the client

### Learning Progress Endpoints

- `GET /api/progress`: Get the current learning progress
- `POST /api/progress`: Update the learning progress

## Data Flow

### Code Execution Flow
1. User writes Python code in the CodeEditor component
2. User clicks the "Run" button
3. Frontend passes code to the Pyodide runtime
4. Pyodide executes the Python code in WebAssembly
5. Execution output is captured and displayed in the OutputDisplay component
6. (Optional) Code and output are sent to backend for storage in the conversation context

### Conversation Flow
1. User enters a message in the ChatInterface component
2. Frontend sends message to backend API
3. Backend stores the message and prepares context for Claude:
   - Recent conversation history
   - Current code in editor and execution output
   - Learning progress information
4. Backend sends request to Claude API
5. Claude's response is received, stored, and returned to frontend
6. Frontend displays the response in the ChatInterface

## Development Workflow

### Setup and Installation
1. Clone the repository
2. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```
3. Install backend dependencies:
   ```
   cd backend
   uv install
   ```
4. Create a `.env` file in the backend directory with:
   ```
   ANTHROPIC_API_KEY=your_api_key
   ```

### Development
1. Start the frontend development server:
   ```
   cd frontend
   npm run dev
   ```
2. Start the backend development server:
   ```
   cd backend
   python -m app
   ```

### Linting and Formatting
Maintaining code quality and consistency is essential for collaborative development. Playdo uses Ruff for Python linting and formatting:

1. Run linting to check for code issues:
   ```
   cd backend
   uv run ruff check .
   ```

2. Run formatting to automatically fix code style:
   ```
   cd backend
   uv run ruff format .
   ```

3. Run mypy
   ```
   cd backend
   uv run mypy .
   ```

Ruff is chosen for its:
- Speed (10-100x faster than traditional Python linters)
- Comprehensive rule set that replaces multiple tools (flake8, black, isort, etc.)
- Automatic fixing capabilities
- Easy configuration via pyproject.toml
- Consistency in enforcing Python best practices

All Python code must pass typechecking, linting, and formatting checks before being committed to ensure consistent code quality throughout the project.



### Testing
- Frontend tests:
  ```
  cd frontend
  npm test
  ```
- Backend tests:
  ```
  cd backend
  python -m pytest
  ```

Ensure all components are thoroughly tested.

## Deployment Considerations

While not part of the MVP, future deployment should consider:

- Separating API keys and other secrets using environment variables
- Setting up proper CORS for production
- Implementing rate limiting for the Claude API
- Considering serverless or container-based deployment for cost efficiency
- Implementing proper error handling and logging

## Future Considerations

### Authentication
- Implement user authentication for multi-user support
- Track user-specific learning progress
- Enforce resource limits per user

### Database Migration
- Migrate from SQLite to PostgreSQL for production use
- Implement proper database migration workflow

### Advanced Features
- Expand the curriculum DAG
- Add code visualization tools
- Implement multi-user classroom functionality
- Support additional programming languages

## Technical Limitations and Tradeoffs

### Pyodide Limitations
- Initial load time (several MB of WASM to download)
- Limited Python package support
- Slight differences from standard Python behavior
- Not suitable for CPU-intensive computations

### Claude API Considerations
- API key management and security
- Cost implications for high usage
- Rate limiting and error handling

## Conclusion

This architecture provides a foundation for rapid MVP development while maintaining a clear path for future enhancements. The separation of frontend and backend concerns, along with the use of Pyodide for client-side Python execution, creates a responsive learning environment that can be deployed with minimal server resources.

By leveraging modern web technologies and focusing on a clean, maintainable codebase, Playdo can quickly provide value to students while establishing the technical foundation for future growth.
