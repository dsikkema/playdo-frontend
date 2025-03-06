// src/components/Message.tsx

import { Message as MessageType } from '../types'
import { classNames } from 'utils'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useState, useEffect } from 'react'

type MessageProps = {
  message: MessageType
}

function Message({ message }: MessageProps) {
  // State to hold the sanitized HTML
  const [sanitizedHtml, setSanitizedHtml] = useState<string>('')

  // Determine if the message is from the user or the assistant
  const isUser = message.role === 'user'

  // Combine all text content parts
  const messageText = message.content
    .filter((item) => item.type === 'text')
    .map((item) => item.text)
    .join(' ')

  // Process markdown and sanitize HTML when the message changes
  useEffect(() => {
    const processContent = async () => {
      // Convert markdown to HTML
      const rawHtml = await marked.parse(messageText)
      // Sanitize HTML to prevent XSS
      const cleanHtml = DOMPurify.sanitize(rawHtml)
      setSanitizedHtml(cleanHtml)
    }

    processContent()
  }, [messageText])

  return (
    <div className="flex w-full">
      <div
        className={classNames(
          'max-w-[75%] rounded-lg p-4 mb-4',
          // Use flex positioning instead of margin for alignment
          isUser
            ? 'ml-auto mr-0 bg-blue-100 text-blue-800'
            : 'ml-0 mr-auto bg-gray-100 text-gray-800'
        )}
      >
        <div className="mb-1 text-sm font-medium">
          {isUser ? 'You' : 'Assistant'}
        </div>
        <div className="prose prose-slate max-w-none">
          <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
        </div>
      </div>
    </div>
  )
}

export default Message
