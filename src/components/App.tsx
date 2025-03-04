// src/components/App.tsx
import { useState } from 'react'
import ConversationView from './ConversationView'
import ConversationSelector from './ConversationSelector'

function App() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <ConversationSelector
          onSelectConversation={setSelectedConversationId}
          selectedConversationId={selectedConversationId}
        />
        <ConversationView conversationId={selectedConversationId} />
      </div>
    </div>
  )
}

export default App
