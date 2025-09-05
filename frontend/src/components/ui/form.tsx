import type { ComponentPropsWithoutRef, ElementRef, FormHTMLAttributes, ReactNode } from "react"
import { createContext, forwardRef, useContext, useId } from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Slot } from "@radix-ui/react-slot"

interface FormContextValue {
  name: string
}

const FormContext = createContext<FormContextValue | undefined>(undefined)

const useFormField = () => {
  const fieldId = useId()
  const formContext = useContext(FormContext)
  const name = formContext?.name || ""
  const id = `${name}-${fieldId}`

  return {
    id,
    name,
  }
}

interface FormProps extends FormHTMLAttributes<HTMLFormElement> {}

const Form = forwardRef<HTMLFormElement, FormProps>(({ className, ...props }, ref) => {
  return (
    <form
      ref={ref}
      className={cn("space-y-6", className)}
      {...props}
    />
  )
})
Form.displayName = "Form"

interface FormItemProps extends ComponentPropsWithoutRef<"div"> {}

const FormItem = forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-2", className)}
        {...props}
      />
    )
  }
)
FormItem.displayName = "FormItem"

interface FormLabelProps extends ComponentPropsWithoutRef<typeof Label> {}

const FormLabel = forwardRef<ElementRef<typeof Label>, FormLabelProps>(({ className, ...props }, ref) => {
  return (
    <Label
      ref={ref}
      className={cn(className)}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

interface FormControlProps extends ComponentPropsWithoutRef<"div"> {}

const FormControl = forwardRef<HTMLDivElement, FormControlProps>(
  ({ ...props }, ref) => {
    return (
      <div
        ref={ref}
        {...props}
      />
    )
  }
)
FormControl.displayName = "FormControl"

interface FormDescriptionProps extends ComponentPropsWithoutRef<"p"> {}

const FormDescription = forwardRef<HTMLParagraphElement, FormDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
      />
    )
  }
)
FormDescription.displayName = "FormDescription"

interface FormMessageProps extends ComponentPropsWithoutRef<"p"> {
  children?: ReactNode
}

const FormMessage = forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm font-medium text-destructive", className)}
        {...props}
      >
        {children}
      </p>
    )
  }
)
FormMessage.displayName = "FormMessage"

interface FormFieldProps {
  name: string
  children?: ReactNode
  render: (props: { field: { value: any; name: string; onChange: (value: any) => void } }) => ReactNode
  control: any
}

const FormField = ({ name, render }: FormFieldProps) => {
  return (
    <FormContext.Provider value={{ name }}>
      {render({ field: { value: undefined, name, onChange: () => {} } })}
    </FormContext.Provider>
  )
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}