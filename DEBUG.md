# Debugging Guide for MyPlace Project

This guide explains how to set up and use debugging for the MyPlace project in VS Code.

## Prerequisites

1. **Install VS Code Extensions**: Install the recommended extensions from the Extensions tab
2. **Install Go Tools**: Run `go install -a` to install Go debugging tools
3. **Database Setup**: Ensure PostgreSQL is running (`make up`)
4. **Environment Variables**: Ensure `.env` file is configured properly

## Available Debug Configurations

### 1. Launch API Server
- **Name**: "Launch API Server"
- **Purpose**: Debug the main API server with predefined environment variables
- **Usage**: Press F5 or use Debug panel
- **Port**: 8080 (different from normal dev port 81 to avoid conflicts)

### 2. Launch API Server (with .env)
- **Name**: "Launch API Server (with .env)"
- **Purpose**: Debug using environment variables from `.env` file
- **Usage**: Select from debug dropdown, then F5
- **Recommended**: Use this for most debugging sessions

### 3. Debug Current Go File
- **Name**: "Debug Current Go File"
- **Purpose**: Debug any single Go file
- **Usage**: Open a Go file, then F5

### 4. Debug Go Tests
- **Name**: "Debug Go Tests"
- **Purpose**: Debug all tests in the project
- **Usage**: Select from debug dropdown, then F5

### 5. Debug Current Go Test
- **Name**: "Debug Current Go Test"
- **Purpose**: Debug specific test function
- **Usage**: Open test file, select config, enter test name when prompted

### 6. Attach to Running API Server
- **Name**: "Attach to Running API Server"
- **Purpose**: Attach debugger to already running process
- **Usage**: Start server normally, then attach debugger

### 7. Launch Full Stack
- **Name**: "Launch Full Stack"
- **Purpose**: Start both backend and frontend for full-stack debugging
- **Usage**: Select from compounds section

## Debugging Workflow

### Basic Backend Debugging

1. **Set Breakpoints**: Click in the gutter next to line numbers
2. **Start Debugging**: Press F5 or select "Launch API Server (with .env)"
3. **Use Debug Console**: View variables, call stack, and execute expressions
4. **Step Through Code**: Use F10 (step over), F11 (step into), Shift+F11 (step out)

### Frontend + Backend Debugging

1. **Start Full Stack**: Select "Launch Full Stack" from debug panel
2. **Set Breakpoints**: In both Go and TypeScript files
3. **Test API Endpoints**: Use browser or Thunder Client extension
4. **Debug Both Sides**: Switch between backend and frontend debugging

### Testing with Debugging

1. **Write Tests**: Create `*_test.go` files
2. **Set Breakpoints**: In test functions or code being tested
3. **Run Specific Test**: Use "Debug Current Go Test"
4. **Run All Tests**: Use "Debug Go Tests"

## Useful Debug Features

### Variable Inspection
- **Variables Panel**: View local variables, function parameters
- **Watch Panel**: Add expressions to monitor
- **Call Stack**: See function call hierarchy

### Conditional Breakpoints
- Right-click on breakpoint → Add condition
- Example: `userID == "123"` only breaks when condition is true

### Logpoints
- Right-click in gutter → Add Logpoint
- Print values without modifying code
- Example: `User: {userID}, Email: {email}`

## Environment Configuration

### Debug Environment Variables
```json
{
  "APP_ENV": "local",
  "APP_HTTP_PORT": "8080",
  "POSTGRES_DSN": "postgres://postgres:postgres@localhost:5432/myplace?sslmode=disable",
  "REDIS_ADDR": "localhost:6379",
  "JWT_SECRET": "your-super-secret-jwt-key-here-change-in-production"
}
```

### Test Environment
- Uses `myplace_test` database
- Isolated from development data
- Reset between test runs

## Common Debugging Scenarios

### API Endpoint Issues
1. Set breakpoint in handler function
2. Make HTTP request to endpoint
3. Step through request processing
4. Inspect request data and responses

### Database Query Problems
1. Set breakpoint in repository method
2. Inspect SQL queries and parameters
3. Check database connection status
4. Verify query results

### Authentication Issues
1. Set breakpoint in JWT middleware
2. Inspect token validation process
3. Check user context injection
4. Verify role-based access control

### Frontend-Backend Integration
1. Debug API calls in frontend service
2. Set breakpoints in corresponding backend handlers
3. Trace data flow between layers
4. Verify request/response format

## Tips and Best Practices

### Performance Debugging
- Use race detection: `go: build race` task
- Monitor memory usage in debug console
- Profile CPU usage with Go tools

### Debugging Production Issues
- Use structured logging (Zap)
- Add correlation IDs to requests
- Monitor application metrics

### Hot Reload Development
- Use `make dev` for normal development
- Use debugging for specific issue investigation
- Restart debugger after significant code changes

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Stop existing server: `make down`
   - Change debug port in launch.json

2. **Database Connection Failed**
   - Check PostgreSQL status: `make up`
   - Verify connection string in .env

3. **Breakpoint Not Hit**
   - Ensure code is recompiled
   - Check if path is correct
   - Verify request reaches the code

4. **Go Tools Missing**
   - Run: `go install -a`
   - Restart VS Code
   - Check Go extension status

### Debug Console Commands
```
// Print variable
p variableName

// Call function
call functionName(args)

// Set variable
set variableName = value

// List goroutines
goroutines

// Switch goroutine
goroutine 2
```

## Integration with Development Workflow

### Before Debugging
1. Run `make lint` to check code quality
2. Run `make test` to ensure tests pass
3. Run `make swagger` to update API docs

### During Debugging
1. Use debug console for quick testing
2. Take notes of findings
3. Add tests for discovered issues

### After Debugging
1. Remove debug prints
2. Add proper error handling
3. Update documentation if needed
4. Commit fixes with descriptive messages

This debugging setup provides comprehensive tools for developing and maintaining the MyPlace application efficiently.