export {};

declare global {
  interface Window {
    mooly: Record<string, never>;
  }
}
