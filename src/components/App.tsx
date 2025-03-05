// src/components/App.tsx
import { useState } from 'react'
import ConversationView from './ConversationView'
import ConversationSelector from './ConversationSelector'
import CodeEditor from './CodeEditor'

function App() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null)
  const [code, setCode] = useState(
    "# Write your Python code here\nprint('Hello, PlayDo!')"
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <ConversationSelector
          onSelectConversation={setSelectedConversationId}
          selectedConversationId={selectedConversationId}
        />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-[60vh]">
            <CodeEditor initialCode={code} onChange={setCode} />
          </div>
          <div>
            <ConversationView conversationId={selectedConversationId} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
