import { useState, useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { keymap } from '@codemirror/view'
import { Prec } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { useTheme } from '../context/ThemeContext'

export type CodeEditorProps = {
  initialCode?: string
  onChange?: (code: string) => void
  onRunCode?: () => void
}

function CodeEditor({
  initialCode = '',
  onChange,
  onRunCode
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode)
  const { resolvedTheme } = useTheme()

  const handleChange = (value: string) => {
    setCode(value)
    if (onChange) {
      onChange(value)
    }
  }

  // Create custom keymap for Cmd/Ctrl+Enter with highest precedence
  const runCodeKeymap = useMemo(
    () =>
      Prec.highest(
        keymap.of([
          {
            key: 'Ctrl-Enter',
            run: () => {
              if (onRunCode) {
                onRunCode()
              }
              return true // Prevent default behavior
            }
          },
          {
            key: 'Cmd-Enter',
            run: () => {
              if (onRunCode) {
                onRunCode()
              }
              return true // Prevent default behavior
            }
          }
        ])
      ),
    [onRunCode]
  )

  // Create extensions array
  const extensions = useMemo(() => {
    return [runCodeKeymap, python()]
  }, [runCodeKeymap])

  return (
    <div className="flex size-full flex-col rounded-lg border border-gray-200 bg-white shadow-soft transition-all duration-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-2 dark:border-gray-700 dark:from-gray-700 dark:to-gray-600/50">
        <div className="flex items-center gap-2">
          <svg
            className="size-4 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Python Editor
          </div>
        </div>
      </div>
      <div className="size-full overflow-auto">
        <CodeMirror
          value={code}
          height="100%"
          theme={resolvedTheme === 'dark' ? oneDark : undefined}
          extensions={extensions}
          onChange={handleChange}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            foldGutter: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            searchKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true
          }}
          className="size-full font-mono"
        />
      </div>
    </div>
  )
}

export default CodeEditor
