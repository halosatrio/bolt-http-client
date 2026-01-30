declare global {
  interface Window {
    // api: IElectronAPI; // This is the 'api' property you are accessing
    api: any; // This is the 'api' property you are accessing
  }
}

export {};
