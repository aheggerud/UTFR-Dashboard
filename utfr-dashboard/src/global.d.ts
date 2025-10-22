export {}; // ensure this is a module

declare global {
  interface Window {
    utfr?: {
      openInMotec: (payload: { localPath?: string; url?: string }) => Promise<boolean> | boolean;
    };
  }
}


