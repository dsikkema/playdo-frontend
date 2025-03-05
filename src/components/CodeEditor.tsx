import { useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'

export type CodeEditorProps = {
  initialCode?: string
  onChange?: (code: string) => void
}

function CodeEditor({ initialCode = '', onChange }: CodeEditorProps) {
  const [code, setCode] = useState(initialCode)

  const handleChange = (value: string) => {
    setCode(value)
    if (onChange) {
      onChange(value)
    }
  }

  return (
    <div className="flex size-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-2">
        <div className="text-sm font-medium text-gray-700">Python Editor</div>
      </div>
      <div className="size-full overflow-auto">
        {/* TOODO: use light theme */}
        <CodeMirror
          value={code}
          height="100%"
          theme={oneDark}
          extensions={[python()]}
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
