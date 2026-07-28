export {};

declare global {
  interface Window {
    mooly: {
      reportOverlayHover: (hovering: boolean) => void;
    };
  }
}
