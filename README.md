# HTTP Client Tester

A modern desktop HTTP client testing application built with **Electron-Vite**, **React**, and **TailwindCSS**. This application provides a GUI similar to Postman or Insomnia for testing HTTP requests.

## Tech Stack

- **Electron-Vite** - Next generation Electron build tooling
- **React 18** - UI library with hooks and functional components
- **TailwindCSS v4** - Utility-first CSS framework
- **TypeScript** - Type-safe JavaScript
- **Electron `net` module** - Native HTTP client (Chromium networking)

## Features

### HTTP Methods (Currently Supported)
- **GET** - Retrieve data with query parameters
- **POST** - Send data with JSON/Form/Text body
- PUT, PATCH, DELETE - UI available but not yet implemented

### Request Building
- URL input with method selector (color-coded)
- Query parameters editor (for GET requests)
- Request headers editor
- Request body with format options:
  - None
  - JSON (application/json)
  - Form (application/x-www-form-urlencoded)
  - Text (text/plain)

### Response Viewer
- Real-time status code display (color-coded)
  - 2xx: Green (Success)
  - 3xx: Yellow (Redirect)
  - 4xx/5xx: Red (Client/Server Error)
  - 0: Dark Red (Network/Connection Error)
- Response time tracking
- Response size calculation
- Response headers viewer
- Response body with syntax highlighting
- Copy response body button

### Additional Features
- **30-second request timeout** - Automatic timeout protection
- Error handling with detailed messages
- Modern dark theme interface
- IPC-based secure communication between renderer and main process

## Architecture

```
Renderer (React) ←→ IPC ←→ Main Process (net module) ←→ External API
```

HTTP requests are made from the **main process** using Electron's native `net` module, which provides:
- Chromium's native networking stack
- Automatic proxy configuration
- Better security (avoids CORS issues in renderer)

## Installation

```bash
npm install
```

## Development

Run the app in development mode with hot reload:

```bash
npm run dev
```

## Building

Build the app for production:

```bash
npm run build
```

Build for specific platforms:

```bash
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## Project Structure

```
├── electron.vite.config.ts    # Electron-vite configuration
├── electron-builder.yml       # Build configuration
├── src/
│   ├── main/                  # Main process
│   │   └── index.ts          # Main entry with IPC handlers
│   ├── preload/              # Preload scripts
│   │   ├── index.ts          # IPC exposure
│   │   └── index.d.ts        # Type definitions
│   └── renderer/             # Renderer process (React app)
│       ├── index.html
│       └── src/
│           ├── main.tsx      # React entry
│           ├── App.tsx       # Main app component
│           ├── types.ts      # TypeScript types
│           ├── assets/
│           │   └── index.css # Tailwind CSS
│           └── components/
│               ├── Sidebar.tsx
│               ├── RequestPanel.tsx
│               └── ResponsePanel.tsx
└── package.json
```

## Usage

### Sending GET Requests
1. Select **GET** method (blue)
2. Enter the URL (e.g., `https://jsonplaceholder.typicode.com/posts/1`)
3. Add query parameters in the **Params** tab (optional)
4. Add custom headers in the **Headers** tab (optional)
5. Click **Send** button
6. View real response in the response panel

### Sending POST Requests
1. Select **POST** method (green)
2. Enter the URL
3. Add headers if needed (Content-Type is auto-set based on body type)
4. Select body type in **Body** tab:
   - **JSON**: Enter JSON data
   - **Form**: Enter form data (key=value&key2=value2)
   - **Text**: Enter plain text
5. Click **Send** button
6. View response

### Testing Endpoints

**GET Example:**
- URL: `https://jsonplaceholder.typicode.com/posts/1`
- Method: GET
- Expected: Returns a single post object

**POST Example:**
- URL: `https://jsonplaceholder.typicode.com/posts`
- Method: POST
- Body Type: JSON
- Body: `{"title":"foo","body":"bar","userId":1}`
- Expected: Returns created object with ID

## Technical Details

### IPC Communication
The app uses Electron's `ipcMain.handle` and `ipcRenderer.invoke` for secure communication:
- Renderer sends request config via `window.api.sendHttpRequest()`
- Main process executes the HTTP request using `net.request()`
- Response is returned to renderer with status, headers, body, time, and size

### Security
- Context isolation enabled
- Preload script exposes minimal API
- No node integration in renderer
- CSP headers configured

### Timeout & Error Handling
- 30-second timeout on all requests
- Network errors are caught and displayed
- Invalid URLs show error messages
- Connection failures show status 0 with error description

## Limitations

Currently implemented:
- ✅ GET requests with query parameters
- ✅ POST requests with body (JSON, Form, Text)
- ✅ Custom headers
- ✅ Response viewing

Not yet implemented:
- ⏳ PUT, PATCH, DELETE methods (UI available, needs backend wiring)
- ⏳ File upload (multipart/form-data)
- ⏳ Request history persistence
- ⏳ Collection management
- ⏳ Environment variables

## License

MIT
