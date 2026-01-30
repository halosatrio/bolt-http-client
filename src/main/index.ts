import { app, shell, BrowserWindow, ipcMain, net } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// HTTP Request Handler using Electron's net module
ipcMain.handle("http-request", async (event, requestConfig) => {
  const startTime = Date.now();

  try {
    // Build URL with query parameters for GET requests
    let url = requestConfig.url;
    if (requestConfig.method === "GET" && requestConfig.headers) {
      const params = requestConfig.headers.filter(
        (h: { key: string; value: string; enabled: boolean }) =>
          h.enabled && h.key,
      );
      if (params.length > 0) {
        const queryString = params
          .map(
            (p: { key: string; value: string }) =>
              `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`,
          )
          .join("&");
        url = `${url}${url.includes("?") ? "&" : "?"}${queryString}`;
      }
    }

    // Create request options
    const options: Electron.ClientRequestConstructorOptions = {
      method: requestConfig.method,
      url: url,
    };

    // Make the request
    const response = await new Promise<{
      status: number;
      statusText: string;
      headers: Record<string, string>;
      body: string;
      time: number;
      size: string;
    }>((resolve, reject) => {
      const request = net.request(options);

      // Manual timeout implementation (30 seconds)
      const timeoutId = setTimeout(() => {
        request.abort();
        reject(new Error("Request timeout after 30 seconds"));
      }, 30000);

      // Set request headers
      if (requestConfig.headers && requestConfig.headers.length > 0) {
        requestConfig.headers
          .filter(
            (h: { key: string; value: string; enabled: boolean }) =>
              h.enabled && h.key,
          )
          .forEach((h: { key: string; value: string }) => {
            request.setHeader(h.key, h.value);
          });
      }

      // Set body for POST, PUT, PATCH requests (methods that support body)
      const methodsWithBody = ["POST", "PUT", "PATCH"];
      if (
        methodsWithBody.includes(requestConfig.method) &&
        requestConfig.body &&
        requestConfig.bodyType !== "none"
      ) {
        // Set content type based on body type
        if (requestConfig.bodyType === "json") {
          request.setHeader("Content-Type", "application/json");
        } else if (requestConfig.bodyType === "form") {
          request.setHeader(
            "Content-Type",
            "application/x-www-form-urlencoded",
          );
        } else if (requestConfig.bodyType === "text") {
          request.setHeader("Content-Type", "text/plain");
        }
      }

      request.on("response", (response) => {
        let body = "";

        response.on("data", (chunk) => {
          body += chunk.toString();
        });

        response.on("end", () => {
          clearTimeout(timeoutId); // Clear timeout on success
          const endTime = Date.now();
          const time = endTime - startTime;
          const size = `${(Buffer.byteLength(body) / 1024).toFixed(2)} KB`;

          // Convert headers to plain object
          const headers: Record<string, string> = {};
          for (const [key, value] of Object.entries(response.headers)) {
            headers[key] = Array.isArray(value)
              ? value.join(", ")
              : String(value);
          }

          resolve({
            status: response.statusCode || 0,
            statusText: response.statusMessage || "",
            headers,
            body,
            time,
            size,
          });
        });

        response.on("error", (error) => {
          clearTimeout(timeoutId); // Clear timeout on error
          reject(error);
        });
      });

      request.on("error", (error) => {
        clearTimeout(timeoutId); // Clear timeout on error
        reject(error);
      });

      // Write body for POST, PUT, PATCH requests (methods that support body)
      if (
        methodsWithBody.includes(requestConfig.method) &&
        requestConfig.body &&
        requestConfig.bodyType !== "none"
      ) {
        request.write(requestConfig.body);
      }

      request.end();
    });

    return response;
  } catch (error) {
    const endTime = Date.now();
    const time = endTime - startTime;

    return {
      status: 0,
      statusText: "Error",
      headers: {},
      body: error instanceof Error ? error.message : "Unknown error occurred",
      time,
      size: "0 B",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
