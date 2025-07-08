import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AddURLForm } from '../AddURLForm'

test('renders AddURLForm and allows input and submit', () => {
  const mockOnSuccess = jest.fn()

  render(<AddURLForm onSuccess={mockOnSuccess} />)

  const input = screen.getByPlaceholderText(/enter website url/i)
  expect(input).toBeInTheDocument()

  fireEvent.change(input, { target: { value: 'https://test.com' } })
  expect(input).toHaveValue('https://test.com')

  const button = screen.getByRole('button', { name: /add url/i })
  expect(button).toBeInTheDocument()

  fireEvent.click(button)

  // This click won't call mockOnSuccess unless you mock fetch or override the form submit
  // so this is just a minimal test that it renders and can submit without error
})