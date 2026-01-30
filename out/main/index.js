"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const icon = path.join(__dirname, "../../resources/icon.png");
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1e3,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.ipcMain.handle("http-request", async (event, requestConfig) => {
  const startTime = Date.now();
  try {
    let url = requestConfig.url;
    if (requestConfig.method === "GET" && requestConfig.headers) {
      const params = requestConfig.headers.filter((h) => h.enabled && h.key);
      if (params.length > 0) {
        const queryString = params.map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join("&");
        url = `${url}${url.includes("?") ? "&" : "?"}${queryString}`;
      }
    }
    const options = {
      method: requestConfig.method,
      url
    };
    const response = await new Promise((resolve, reject) => {
      const request = electron.net.request(options);
      const timeoutId = setTimeout(() => {
        request.abort();
        reject(new Error("Request timeout after 30 seconds"));
      }, 3e4);
      if (requestConfig.headers && requestConfig.headers.length > 0) {
        requestConfig.headers.filter((h) => h.enabled && h.key).forEach((h) => {
          request.setHeader(h.key, h.value);
        });
      }
      if (requestConfig.method === "POST" && requestConfig.body && requestConfig.bodyType !== "none") {
        if (requestConfig.bodyType === "json") {
          request.setHeader("Content-Type", "application/json");
        } else if (requestConfig.bodyType === "form") {
          request.setHeader("Content-Type", "application/x-www-form-urlencoded");
        } else if (requestConfig.bodyType === "text") {
          request.setHeader("Content-Type", "text/plain");
        }
      }
      request.on("response", (response2) => {
        let body = "";
        response2.on("data", (chunk) => {
          body += chunk.toString();
        });
        response2.on("end", () => {
          clearTimeout(timeoutId);
          const endTime = Date.now();
          const time = endTime - startTime;
          const size = `${(Buffer.byteLength(body) / 1024).toFixed(2)} KB`;
          const headers = {};
          for (const [key, value] of Object.entries(response2.headers)) {
            headers[key] = Array.isArray(value) ? value.join(", ") : String(value);
          }
          resolve({
            status: response2.statusCode || 0,
            statusText: response2.statusMessage || "",
            headers,
            body,
            time,
            size
          });
        });
        response2.on("error", (error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
      });
      request.on("error", (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
      if (requestConfig.method === "POST" && requestConfig.body && requestConfig.bodyType !== "none") {
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
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
});
