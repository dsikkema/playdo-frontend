# Playdo Frontend

## Directory

Note: This app is under the `playdo-frontend/` directory of the playdo project, all commands must be run from this
directory.

## Tech Stack

Started from a template: https://github.com/joaopaulomoraes/reactjs-vite-tailwindcss-boilerplate

Built with Vite, React 18, TypeScript, Vitest, Testing Library, TailwindCSS 3, Eslint and Prettier

- [Vite](https://vitejs.dev)
- [ReactJS](https://reactjs.org)
- [TypeScript](https://www.typescriptlang.org)
- [Vitest](https://vitest.dev)
- [Testing Library](https://testing-library.com)
- [Tailwindcss](https://tailwindcss.com)
- [Eslint](https://eslint.org)
- [Prettier](https://prettier.io)

## Architecture

The application follows a component-based architecture with clear separation of concerns:

- **Types**: Strongly typed data structures used throughout the application
- **API Services**: Functions for interacting with backend APIs
- **Components**: Reusable UI components for rendering the application

Key components:

- `App`: Main application component, manages conversation selection state
- `ConversationView`: Displays messages from the selected conversation
- `Message`: Renders individual messages with appropriate styling

### Prerequisites

- Node.js 18 or higher
- npm 10 or higher (idk, that's what I have)

### Installation

Required environment variables:

```bash
export VITE_PLAYDO_BACKEND_URL='http://localhost:5000'
```

```bash
npm install
```

### Development

Start the development server with hot reloading:

```bash
npm run dev
```

The application will be available at http://localhost:5173.

### Testing

Run all tests:

```bash
npm run test
```

View and interact with tests via UI:

#### Pyodide Integration Tests

Pyodide is a WASM-based Python interpreter that runs in the browser.

Pyodide integration tests require a browser environment:

```bash
npm run test:ui -- src/services/pyodide_integration.test.ts
```

These tests verify Python code execution through the Pyodide service in a real browser context.

### Linting and Type Checking

Check for linting issues:

```bash
npm run lint
```

Check for TypeScript errors:

```bash
npm run typecheck
```

Build the application:

```bash
npm run build
```

After building, can run with (for example):

```bash
python -m http.server 8000 --directory dist
```

## Project Structure

```
src/
├── assets/
├── components/
│   ├── App.tsx
│   ├── ConversationView.tsx
│   ├── ... (etc)
│   └── Message.tsx
├── services/
│   └── api.ts
├── types/
│   └── index.ts
└── utils/
    └── index.ts
```

## Important Notes for Development

- The application uses the React hooks pattern extensively (useState, useEffect)
- Components are designed to be stateless where possible, with state management handled by parent components
- Error states, loading states, and empty states are handled for all data fetching
- TailwindCSS is used for styling - refer to the TailwindCSS documentation for class names

## License

This project is licensed under the MIT License - see the LICENSE file for details.
