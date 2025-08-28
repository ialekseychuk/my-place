import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PhoneInput } from './phone-input'

describe('PhoneInput', () => {
  it('renders with initial value', () => {
    render(<PhoneInput value="+7 999 123 45 67" />)
    expect(screen.getByDisplayValue('+7 999 123 45 67')).toBeInTheDocument()
  })

  it('calls onChange when value changes', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<PhoneInput onChange={handleChange} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '9991234567')
    
    expect(handleChange).toHaveBeenCalled()
  })

  it('displays placeholder when provided', () => {
    render(<PhoneInput placeholder="+7 (999) 123-45-67" />)
    expect(screen.getByPlaceholderText('+7 (999) 123-45-67')).toBeInTheDocument()
  })
})