# Playdo Chat-Code Integration Requirements

# Overview

This document outlines the requirements for integrating the code editor and output display with the chat interface in Playdo. The goal is to ensure the AI tutor always has appropriate context about the student's code and output without cluttering the chat interface or sending redundant information.

# Core Concepts

- Code and output should be attached to user messages when relevant
- The frontend should track what code/output has been previously sent to avoid duplication
- The backend should transform our message structure into an efficient XML format for the AI
- The chat UI should indicate when code has been updated without dominating the conversation

# Frontend Changes: Managing Code Context

## Current Structure to Updated Structure

Currently, the frontend Message component only displays text content:

```typescript
// Simplified current approach
const messageText = message.content
  .filter((item) => item.type === 'text')
  .map((item) => item.text)
  .join(' ')
```

We need to update this to:

1. Still primarily display the text content
2. Add indicators when code is included
3. Track what code has been sent to avoid duplication

### Implementation Guide:

1. Update the Message type definition:

   ```typescript
   interface Message {
     role: 'user' | 'assistant'
     content: Array<{ type: string; text: string }>
     editorCode?: string | null
     stdout?: string | null
     stderr?: string | null
   }
   ```

2. Modify the Message component to indicate when code was updated:

   - Add a subtle "Code updated" indicator in italics when `editorCode` is present
   - Keep the primary focus on the message text

3. Implement state tracking in the chat container component:

   ```typescript
   // Add state for tracking last sent code/output
   const [lastSentCode, setLastSentCode] = useState<string | null>(null)
   const [lastRunOutput, setLastRunOutput] = useState<{
     stdout: string | null
     stderr: string | null
   }>({ stdout: null, stderr: null })
   ```

4. Update the sendMessage function to include code context:

   - Compare current code with lastSentCode
   - Add special handling for the case where code is unchanged but output is new
   - Update tracking state after successful sending
   - Implement UI blocking during API calls with timeout release

5. Ensure the conversation view correctly renders all messages with the enhanced structure:
   - Update any message list rendering to handle the new fields
   - Focus on maintaining a clean, uncluttered conversation view

These changes will enhance the chat experience by giving the AI tutor appropriate code context while keeping the interface focused on the conversation.

### Message Structure

Update the message sending mechanism to include code and output information:

```typescript
interface MessageToSend {
  messageText: string // The user's typed message
  editorCode: string | null // Current code in editor (null if unchanged since last message)
  stdout: string | null // Standard output (null if code unchanged or not run)
  stderr: string | null // Standard error (null if code unchanged or not run)
}
```

### State Tracking

1. Implement tracking of the last sent code and output:

   - Store references to the last code and output sent to the backend
   - Compare current code/output against these references when preparing messages

2. Implement logic to determine when to attach code and output:

   - Send code when it differs from last sent code
   - Handle the edge case where code is unchanged but output is new (user ran unchanged code)
   - Use `null` for output fields when code hasn't been run yet
   - We need to ONLY send stdout/stderr if it matches the current code. In other words, if the code is run, and output was
     generated, then code is modified and not re-run, the backend must not receive the outdated output that came from the
     previous code. We must deal with this with a flag indicating this case, so that the LLM can (at its discretion)prompt
     the user to re-run the code. The frontend must track some state, so when code is changed, we set an "output is stale"
     flag, and then when code is run, we clear the flag. That flag drives the frontend to only send stdout/stderr if the
     output is not stale, and nulls otherwise (while still sending the current code).

3. UI Blocking during Message Sending:
   - Block the message input while waiting for a response
   - Implement a timeout (approximately 10 seconds) to release the UI block if no response
   - Display appropriate loading indicators

### UI Updates

1. Update the message rendering to:

   - Display only the `messageText` content in the primary message
   - Add a small "Code updated" note in italics when a message includes code

2. No need to implement expandable code views or detailed change indicators at this stage

## Implementation Milestones

### Milestone 1: Backend Data Model

1. Update the `Message` model with new fields
2. Create the database schema
3. Update the repository layer to handle the new fields

### Milestone 2: Backend Transformation Layer

1. Implement the XML conversion logic
2. Add the Anthropic message transformation function
3. Update the API endpoint to use the new transformation

### Milestone 3: Frontend State Tracking

1. Implement the lastSentCode and lastSentOutput state
2. Add the comparison logic to determine when to send code/output
3. Update the message sending function
4. Preventing stale output from being sent to the backend

### Milestone 4: Frontend UI Updates

1. Update the message rendering to show the "Code updated" indicator
2. Implement UI blocking during message sending
3. Add timeout handling

## Edge Cases to Handle

1. **Code Run Status**: If a user runs code without changing it, ensure the new output is sent even though the code hasn't changed.

   ```typescript
   const shouldSendUpdate =
     currentCode !== lastSentCode ||
     (runStatus.hasRun &&
       (lastSentOutput.stdout === null || lastSentOutput.stderr === null))
   ```

2. **Null vs. Empty String**: Maintain the distinction between null (code not run) and empty string (code run with no output).

## Future Considerations (Not for MVP)

- Message pagination for efficiency
- Detailed code change indicators
- Expandable code views in messages
- Advanced error handling and retries for API calls
- State rollback functionality to show code at time of message

## Technical Notes

- Frontend should handle state comparison locally (not via backend)
- Use simple string comparison for code matching (no need for hashing at this stage)
- Focus on a working MVP first; optimize for performance later
