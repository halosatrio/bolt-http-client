export interface IElectronAPI {
  sendMessage: (channel: string, ...args: unknown[]) => void
  on: (channel: string, func: (...args: unknown[]) => void) => (() => void) | undefined
  once: (channel: string, func: (...args: unknown[]) => void) => void
}

export interface IHttpRequestConfig {
  method: string
  url: string
  headers: Array<{ key: string; value: string; enabled: boolean }>
  body: string
  bodyType: string
}

export interface IHttpResponse {
  status: number
  statusText: string
  time: number
  size: string
  headers: Record<string, string>
  body: string
  error?: string
}

export interface IApi {
  sendHttpRequest: (config: IHttpRequestConfig) => Promise<IHttpResponse>
}

declare global {
  interface Window {
    electron: IElectronAPI
    api: IApi
  }
}
