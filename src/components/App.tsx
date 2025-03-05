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
    "# Write your Python code here\nprint('Hello, Playdo!')"
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <h1 className="mb-8 text-center text-3xl font-bold text-green-600">
          Playdo
        </h1>
        <ConversationSelector
          onSelectConversation={setSelectedConversationId}
          selectedConversationId={selectedConversationId}
        />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-[60vh]">
            <CodeEditor initialCode={code} onChange={setCode} />
          </div>
          <div className="flex h-[60vh] flex-col">
            <ConversationView conversationId={selectedConversationId} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
