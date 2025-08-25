package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	// Читаем преобразованный openapi3.json
	openapiData, err := os.ReadFile("docs/openapi3.json")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to read openapi3.json: %v\n", err)
		os.Exit(1)
	}

	// Читаем шаблон securitySchemes
	templateData, err := os.ReadFile("docs/bearer.json")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to read bearer.json: %v\n", err)
		os.Exit(1)
	}

	var openapi, template map[string]interface{}
	if err := json.Unmarshal(openapiData, &openapi); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to unmarshal openapi3.json: %v\n", err)
		os.Exit(1)
	}
	if err := json.Unmarshal(templateData, &template); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to unmarshal security_template.json: %v\n", err)
		os.Exit(1)
	}

	// Инициализируем components, если отсутствует
	if openapi["components"] == nil {
		openapi["components"] = make(map[string]interface{})
	}

	// Объединяем components.securitySchemes
	components := openapi["components"].(map[string]interface{})
	if templateComponents, ok := template["components"].(map[string]interface{}); ok {
		components["securitySchemes"] = templateComponents["securitySchemes"]
	}

	// Сохраняем обновленный openapi3.json
	output, err := json.MarshalIndent(openapi, "", "  ")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to marshal openapi3.json: %v\n", err)
		os.Exit(1)
	}

	err = os.WriteFile(filepath.Join("docs", "openapi3.json"), output, 0644)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to write openapi3.json: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("OpenAPI 3.0 documentation post-processed successfully")
}