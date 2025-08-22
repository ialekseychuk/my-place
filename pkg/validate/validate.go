package validate

import "github.com/go-playground/validator/v10"

var v  = validator.New()


func Struct(s any) map[string]string {
	err := v.Struct(s)
	if err == nil {
		return nil
	}

	out := make(map[string]string)
	for _, err := range err.(validator.ValidationErrors) {
		out[err.Field()] = msg(err)
	}
	return out
}

func msg(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "is required"
	case "email":
		return "must be a valid email"
	case "uuid":
		return "must be a valid uuid"
	case "min":
		return "is too short"
	case "max":
		return "is too long"
	default:
		return "invalid value"
	}
}