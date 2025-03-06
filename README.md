# Playdo Frontend

## Technical Notes

For technical design notes, see [TECHNICAL_NOTES.md](TECHNICAL_NOTES.md).

## Installation

Required environment variables:

```bash
export VITE_PLAYDO_BACKEND_URL='http://localhost:5000'
```

```bash
npm install
```

## Development

Start the development server with hot reloading:

```bash
npm run dev
```

The application will be available at http://localhost:5173.

## Testing and Verification

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.
