# HTTP Client Tester - Technical Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Main Process](#main-process)
3. [Renderer Process](#renderer-process)
4. [Preload Script](#preload-script)
5. [Inter-Process Communication (IPC)](#inter-process-communication-ipc)
6. [HTTP Request Flow](#http-request-flow)
7. [Security Model](#security-model)

---

## Architecture Overview

**HTTP Client Tester** is a desktop application built with **Electron**, **React**, and **TypeScript**. It follows Electron's multi-process architecture consisting of:

- **Main Process**: Node.js environment with full system access
- **Renderer Process**: Chromium-based web environment for UI (React)
- **Preload Script**: Bridge between Main and Renderer with controlled API exposure

```
┌─────────────────────────────────────────────────────────────────┐
│                     HTTP Client Tester                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐         ┌──────────────────────────────┐   │
│  │  Main Process   │◄───────►│      Preload Script          │   │
│  │  (Node.js)      │  IPC    │  (Context Bridge)            │   │
│  │                 │         │                              │   │
│  │  • Window Mgmt  │         │  • Exposes safe APIs         │   │
│  │  • HTTP (net)   │         │  • Sandboxed bridge          │   │
│  │  • File System  │         │                              │   │
│  └─────────────────┘         └──────────────┬───────────────┘   │
│           ▲                                 │                   │
│           │                                 │ window.api        │
│           │                                 ▼                   │
│           │                  ┌──────────────────────────────┐   │
│           └──────────────────│     Renderer Process         │   │
│             ipcRenderer      │     (Chromium + React)       │   │
│                              │                              │   │
│                              │  • User Interface            │   │
│                              │  • Request Configuration     │   │
│                              │  • Response Display          │   │
│                              └──────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Main Process

**File**: `src/main/index.ts`

The Main Process is the entry point of the application. It runs in a Node.js environment and has full access to:

- Operating system APIs
- File system
- Native modules
- Network requests (via Electron's `net` module)

### Key Responsibilities

| Responsibility  | Implementation                                |
| --------------- | --------------------------------------------- |
| Window Creation | `BrowserWindow` with preload script injection |
| HTTP Requests   | `net.request()` for network operations        |
| IPC Handlers    | `ipcMain.handle()` for renderer communication |
| App Lifecycle   | `app.whenReady()`, `window-all-closed` events |

### Window Configuration

```typescript
const mainWindow = new BrowserWindow({
  width: 1400,
  height: 900,
  webPreferences: {
    preload: join(__dirname, "../preload/index.js"), // Security: Preload script
    sandbox: false, // Required for some APIs
    contextIsolation: true, // Security: Isolate contexts
    nodeIntegration: false, // Security: Disable Node in renderer
  },
});
```

### HTTP Handler Registration

```typescript
ipcMain.handle("http-request", async (event, requestConfig) => {
  // Uses Electron's net module (Chromium's networking stack)
  const request = net.request(options);
  // ... handles GET, POST, PUT, PATCH, DELETE
  // ... sets headers, body, timeout
  // ... returns response data
});
```

---

## Renderer Process

**Files**: `src/renderer/src/App.tsx`, `src/renderer/src/components/`

The Renderer Process is a Chromium-based environment that runs the React UI. It has:

- No direct access to Node.js APIs (security)
- Access to browser APIs (DOM, fetch, etc.)
- Communication via exposed APIs from preload script

### Key Components

```
Renderer/
├── App.tsx              # Main application component
├── main.tsx             # React entry point
├── types.ts             # TypeScript interfaces
└── components/
    ├── Sidebar.tsx      # Request history sidebar
    ├── RequestPanel.tsx # HTTP request configuration
    └── ResponsePanel.tsx # Response display
```

### Using the Exposed API

```typescript
// Renderer calls preload-exposed API
const response = await window.api.sendHttpRequest({
  method: request.method, // "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  url: request.url, // Target URL
  headers: request.headers, // Array of {key, value, enabled}
  body: request.body, // Request body content
  bodyType: request.bodyType, // "none" | "json" | "form" | "text"
});
```

---

## Preload Script

**File**: `src/preload/index.ts`

The Preload Script acts as a **secure bridge** between Main and Renderer. It:

- Runs in an isolated context
- Selectively exposes APIs via `contextBridge`
- Prevents direct access to Node.js in renderer

### API Exposure

```typescript
import { contextBridge, ipcRenderer } from "electron";

// Custom API definition
const api = {
  sendHttpRequest: (config) => ipcRenderer.invoke("http-request", config),
};

// Expose to renderer's window object
contextBridge.exposeInMainWorld("api", api);
```

### Result in Renderer

```typescript
// Renderer can now access:
window.api.sendHttpRequest(config); // Type-safe, secure API
```

---

## Inter-Process Communication (IPC)

IPC is the mechanism for communication between Main and Renderer processes.

### IPC Pattern: Invoke/Handle (Request/Response)

```
Renderer                    Preload                    Main
    │                          │                         │
    │  window.api.sendHttpRequest(config)                │
    ├─────────────────────────►│                         │
    │                          │ ipcRenderer.invoke()    │
    │                          ├────────────────────────►│
    │                          │                         │
    │                          │    ipcMain.handle()     │
    │                          │◄────────────────────────┤
    │                          │    net.request()        │
    │                          │    (HTTP request)       │
    │                          │                         │
    │                          │    Response data        │
    │◄─────────────────────────┤◄────────────────────────┤
    │   Promise resolves       │                         │
    │   with response          │                         │
```

### IPC Methods

| Direction       | Method                 | Use Case                 |
| --------------- | ---------------------- | ------------------------ |
| Renderer → Main | `ipcRenderer.invoke()` | Request/Response pattern |
| Main → Renderer | `ipcMain.handle()`     | Register handlers        |

### Security Considerations

- **Context Isolation**: Enabled (`contextIsolation: true`)
- **Node Integration**: Disabled (`nodeIntegration: false`)
- **Sandbox**: Configured appropriately
- **Context Bridge**: Only exposed APIs are accessible

---

## HTTP Request Flow

### Step-by-Step Request Lifecycle

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │     │  Renderer   │     │   Preload   │     │    Main     │
│   Action    │────►│   (React)   │────►│   Script    │────►│  (Node.js)  │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                   │
                                                                   ▼
                                                           ┌─────────────┐
                                                           │   External  │
                                                           │    Server   │
                                                           └─────────────┘
```

### 1. User Configuration (Renderer)

User configures request in React UI:

- **Method**: GET, POST, PUT, PATCH, DELETE
- **URL**: Target endpoint
- **Headers**: Key-value pairs with enabled/disabled state
- **Body**: Content for POST/PUT/PATCH (JSON, form, text)

### 2. Request Initiation (Renderer → Preload)

```typescript
// src/renderer/src/App.tsx:57
const response = await window.api.sendHttpRequest({
  method: request.method,
  url: request.url,
  headers: request.headers, // [{key: "Content-Type", value: "application/json", enabled: true}]
  body: request.body,
  bodyType: request.bodyType, // "json" | "form" | "text" | "none"
});
```

### 3. IPC Bridge (Preload)

```typescript
// src/preload/index.ts:7-13
const api = {
  sendHttpRequest: (config) => ipcRenderer.invoke("http-request", config), // Channels to Main
};
```

### 4. Request Processing (Main)

```typescript
// src/main/index.ts:73-219
ipcMain.handle("http-request", async (event, requestConfig) => {
  // 1. Build URL with query parameters (for GET)
  let url = requestConfig.url;
  if (requestConfig.method === "GET" && requestConfig.headers) {
    // Append query params to URL
  }

  // 2. Create request options
  const options = {
    method: requestConfig.method,
    url: url,
  };

  // 3. Execute request using Electron's net module
  const request = net.request(options);

  // 4. Set headers
  requestConfig.headers
    .filter((h) => h.enabled)
    .forEach((h) => request.setHeader(h.key, h.value));

  // 5. Handle body for POST/PUT/PATCH
  if (["POST", "PUT", "PATCH"].includes(requestConfig.method)) {
    request.write(requestConfig.body);
  }

  // 6. Return promise with response
  return new Promise((resolve, reject) => {
    request.on("response", (response) => {
      let body = "";
      response.on("data", (chunk) => (body += chunk));
      response.on("end", () => {
        resolve({
          status: response.statusCode,
          statusText: response.statusMessage,
          headers: response.headers,
          body: body,
          time: Date.now() - startTime,
          size: calculatedSize,
        });
      });
    });
    request.end();
  });
});
```

### 5. Using Electron's `net` Module

The application uses Electron's `net` module instead of Node's `http` or browser's `fetch`:

```typescript
import { net } from "electron";

const request = net.request({
  method: "GET",
  url: "https://api.example.com/data",
});
```

**Advantages of `net` module:**

- Uses Chromium's native networking stack
- Automatic proxy handling
- Supports standard web security model
- Consistent with browser behavior

### 6. Response Flow

```
External Server ──► Main Process ──► Preload ──► Renderer
                      │                               │
                      ▼                               ▼
              Parse response                    Update React state
              Extract headers                   Display in UI
              Calculate metrics                 Show status, time, size
```

### 7. Response Data Structure

```typescript
interface ResponseData {
  status: number; // HTTP status code (200, 404, 500, etc.)
  statusText: string; // Status message ("OK", "Not Found")
  time: number; // Request duration in milliseconds
  size: string; // Response size ("1.2 KB")
  headers: Record<string, string>; // Response headers
  body: string; // Response body content
}
```

---

## Security Model

### Layered Security Architecture

```
┌─────────────────────────────────────────┐
│         Security Layers                 │
├─────────────────────────────────────────┤
│  1. Context Isolation                   │
│     - Renderer cannot access Node.js    │
│     - Separate JavaScript contexts      │
├─────────────────────────────────────────┤
│  2. Context Bridge                      │
│     - Only whitelisted APIs exposed     │
│     - Type-safe communication           │
├─────────────────────────────────────────┤
│  3. IPC Validation                      │
│     - Main validates all inputs         │
│     - Structured request/response       │
├─────────────────────────────────────────┤
│  4. Sandboxing                          │
│     - Renderer runs in sandbox          │
│     - Limited system access             │
└─────────────────────────────────────────┘
```

### Configuration

```typescript
webPreferences: {
  preload: join(__dirname, "../preload/index.js"),  // Preload for API bridge
  sandbox: false,                                    // Adjusted for requirements
  contextIsolation: true,                            // Critical security feature
  nodeIntegration: false,                            // Never enable in production
}
```

---

## Data Flow Summary

```
User Input (Renderer/React)
    │
    ▼
window.api.sendHttpRequest(config)
    │
    ▼
ipcRenderer.invoke('http-request', config)
    │
    ▼
ipcMain.handle('http-request', handler)
    │
    ▼
net.request(options) ──► External Server
    │
    ▼
Response ──► Promise.resolve(data)
    │
    ▼
Renderer updates state ──► UI re-renders
```

---

## File Structure

```
src/
├── main/
│   └── index.ts           # Main process entry
├── preload/
│   ├── index.ts           # Preload script
│   └── index.d.ts         # Type definitions
├── renderer/
│   └── src/
│       ├── main.tsx       # React entry
│       ├── App.tsx        # Main app component
│       ├── types.ts       # TypeScript interfaces
│       └── components/    # UI components
│           ├── Sidebar.tsx
│           ├── RequestPanel.tsx
│           └── ResponsePanel.tsx
└── types/
    └── global.d.ts        # Global type declarations
```

---

## Key Technologies

| Technology        | Purpose                          |
| ----------------- | -------------------------------- |
| **Electron**      | Cross-platform desktop framework |
| **React**         | UI component library             |
| **TypeScript**    | Type-safe JavaScript             |
| **Tailwind CSS**  | Utility-first styling            |
| **Vite**          | Build tool and dev server        |
| **electron-vite** | Vite plugin for Electron         |

---

## References

- [Electron Documentation](https://www.electronjs.org/docs/latest/)
- [IPC Communication](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [net Module](https://www.electronjs.org/docs/latest/api/net)
