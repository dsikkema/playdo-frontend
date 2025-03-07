# Playdo Product Requirements: Code and Chat Integration

## User Experience Overview

The Playdo learning environment seamlessly integrates a code editor with an AI tutor chat interface. Students should be able to write code, receive feedback, and have meaningful conversations with the AI tutor without unnecessary friction or confusion. This document outlines how this integration works from the student's perspective.

## Student Workflow

### Writing and Running Code

When a student is working in the code editor, they can:
1. Write Python code in the editor
2. Click the green "Run" button to execute their code
3. See execution output immediately below the editor
4. Run the code multiple times, with each run updating the output display
5. Make further edits and run again as needed

During this process, the chat interface remains accessible but does not automatically update the AI tutor with every keystroke or run.

### Communicating with the AI Tutor

When a student wants to communicate with the AI tutor:
1. They type a message in the chat input field
2. They send the message by clicking "Send" or pressing Enter
3. Behind the scenes, the system automatically includes their current code and latest output with their message
4. The student receives a response from the AI tutor that is contextually aware of their code

The student does not need to explicitly "share" their code with the tutor – this happens automatically when they send a message.

## Visual Feedback and Interface Elements

### Code Context Indicators

When a student sends a message that includes new code or output:
1. The message appears in the chat interface as normal
2. A subtle "Code updated" indicator appears in italics with the message
3. The student does not see their full code repeated in the chat, keeping the conversation clean and focused

This indicator helps students understand that the AI tutor is aware of their current code state without cluttering the conversation with code duplication.

### Message Sending State

When a student sends a message:
1. The input field becomes temporarily disabled
2. A subtle loading indicator appears
3. After receiving a response (or after a timeout), the input field becomes active again

This provides clear feedback about the message sending process without disrupting the flow of learning.

## Key Interaction Patterns

### Getting Help with Code

When a student encounters a problem:
1. They write and run code that produces an error or unexpected result
2. They ask for help in the chat (e.g., "Why isn't my code working?")
3. The AI tutor responds with guidance that references their specific code and error messages
4. The student can make changes to their code based on the guidance
5. If more help is needed, they can send another message, which will automatically include their updated code

### Learning New Concepts

As a student progresses through concepts:
1. They experiment with code based on the tutor's guidance
2. They run the code to see the results
3. They continue the conversation with the tutor, with each message automatically including their current code state
4. The tutor can recognize their progress through concepts even as the code evolves

### Multiple Code Iterations

During a learning session:
1. Students can freely modify their code multiple times
2. Each new message to the tutor automatically includes the latest code
3. Students don't need to explicitly tell the tutor "I changed the code" - this context is automatically included
4. The conversation history maintains a record of the learning process

## Student Experience Principles

The integration follows these core principles:

1. **Effortless Context Sharing**: Students should never have to worry about whether the AI tutor can "see" their code.

2. **Clean Conversation Flow**: The chat should focus on the educational conversation without being dominated by code repetition.

3. **Implicit Knowledge Transfer**: The system should automatically ensure the AI tutor has the context it needs without the student having to think about it.

4. **Gentle Minimalism**: The interface provides just enough feedback about the sharing of code context without overloading the student with technical details.

5. **Continuous Awareness**: As code evolves through a learning session, the AI tutor remains aware of the current state without requiring explicit updates from the student.

This seamless integration ensures students can focus on learning programming concepts rather than managing the communication of code between different parts of the interface.
