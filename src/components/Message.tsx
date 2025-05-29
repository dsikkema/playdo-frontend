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

  // Check if the message contains code updates
  const hasCodeUpdate = message.editor_code !== null

  return (
    <div
      className={classNames(
        'flex w-full items-start gap-3 animate-fade-in-up',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={classNames(
          'flex size-10 shrink-0 items-center justify-center rounded-full shadow-sm',
          isUser
            ? 'bg-gradient-to-br from-secondary-400 to-secondary-500'
            : 'bg-gradient-to-br from-primary-400 to-primary-500'
        )}
      >
        {isUser ? (
          <svg
            className="size-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        ) : (
          <svg
            className="size-5 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        )}
      </div>

      {/* Message content */}
      <div
        className={classNames(
          'group relative max-w-[70%] rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md',
          isUser
            ? 'bg-gradient-to-br from-secondary-50 to-secondary-100/50 text-secondary-900'
            : 'bg-white text-gray-800 border border-gray-200'
        )}
      >
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-medium">
            {isUser ? 'You' : 'Playdo Assistant'}
          </span>
          {hasCodeUpdate && (
            <span className="flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-700">
              <svg
                className="size-3"
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
              Code attached
            </span>
          )}
        </div>
        <div
          className={classNames(
            'prose prose-sm max-w-none',
            isUser ? 'prose-secondary' : 'prose-gray'
          )}
          style={{ fontFamily: 'Georgia, serif' }}
        >
          <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
        </div>
      </div>
    </div>
  )
}

export default Message
