import { PhoneInput as ReactPhoneInput } from 'react-international-phone'
import 'react-international-phone/style.css'
import { Input } from '@/components/ui/input'
import { forwardRef } from 'react'

export interface PhoneInputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  defaultCountry?: string
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, placeholder, disabled, className, defaultCountry = 'ru' }, ref) => {
    return (
      <ReactPhoneInput
        defaultCountry={defaultCountry}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        inputComponent={Input}
        ref={ref}
      />
    )
  }
)

PhoneInput.displayName = 'PhoneInput'