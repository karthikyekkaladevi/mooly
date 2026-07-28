import type { AppSettings } from '@mooly/shared-types';

export {};

declare global {
  interface Window {
    mooly: {
      reportOverlayHover: (hovering: boolean) => void;
      getSettings: () => Promise<AppSettings>;
      setSettings: (partial: Partial<AppSettings>) => Promise<AppSettings>;
    };
  }
}
