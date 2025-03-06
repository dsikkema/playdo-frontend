import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import OutputDisplay from './OutputDisplay'

describe('<OutputDisplay />', () => {
  it('should display a placeholder when no output is provided', () => {
    // Arrange & Act
    render(<OutputDisplay stdout="" stderr="" error={null} />)

    // Assert
    expect(
      screen.getByText('Run your code to see output here')
    ).toBeInTheDocument()
  })

  it('should display loading state when isLoading is true', () => {
    // Arrange & Act
    render(
      <OutputDisplay stdout="" stderr="" error={null} isCodeRunning={true} />
    )

    // Assert
    expect(screen.getByText('Running...')).toBeInTheDocument()
    expect(screen.getByText('Running code...')).toBeInTheDocument()
  })

  it('should display stdout output', () => {
    // Arrange
    const stdout = 'Hello, World!'

    // Act
    render(<OutputDisplay stdout={stdout} stderr="" error={null} />)

    // Assert
    expect(screen.getByTestId('stdout')).toHaveTextContent(stdout)
  })

  it('should display stderr output', () => {
    // Arrange
    const stderr = 'Warning: something went wrong'

    // Act
    render(<OutputDisplay stdout="" stderr={stderr} error={null} />)

    // Assert
    expect(screen.getByTestId('error-output')).toHaveTextContent(stderr)
  })

  it('should display error message', () => {
    // Arrange
    const error = 'TypeError: cannot read property of undefined'

    // Act
    render(<OutputDisplay stdout="" stderr="" error={error} />)

    // Assert
    expect(screen.getByTestId('error-output')).toHaveTextContent(
      `Error: ${error}`
    )
  })

  it('should display both stdout and error output when both are present', () => {
    // Arrange
    const stdout = 'Partial output'
    const error = 'Process terminated unexpectedly'

    // Act
    render(<OutputDisplay stdout={stdout} stderr="" error={error} />)

    // Assert
    expect(screen.getByTestId('stdout')).toHaveTextContent(stdout)
    expect(screen.getByTestId('error-output')).toHaveTextContent(
      `Error: ${error}`
    )
  })

  it('should handle an empty output object', () => {
    // Arrange & Act
    render(<OutputDisplay stdout="" stderr="" error={null} />)

    // Assert
    expect(screen.queryByTestId('stdout')).not.toBeInTheDocument()
    expect(screen.queryByTestId('error-output')).not.toBeInTheDocument()
  })

  it('should display both stderr and error when both are present', () => {
    // Arrange
    const stderr = 'Warning: deprecated feature used'
    const error = 'Error: maximum recursion depth exceeded'

    // Act
    render(<OutputDisplay stdout="" stderr={stderr} error={error} />)

    // Assert
    const errorOutput = screen.getByTestId('error-output')
    expect(errorOutput).toHaveTextContent(stderr)
    expect(errorOutput).toHaveTextContent(`Error: ${error}`)
  })
})
