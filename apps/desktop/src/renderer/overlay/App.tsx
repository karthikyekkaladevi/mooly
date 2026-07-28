import { useEffect, useRef, useState } from 'react';

export default function App() {
  const [suggestion, setSuggestion] = useState('Waiting for the first suggestion…');
  const streaming = useRef(false);

  useEffect(() => {
    const unsubscribe = window.mooly.onSuggestionChunk(({ text, done }) => {
      if (done) {
        streaming.current = false;
        return;
      }
      setSuggestion((prev) => (streaming.current ? prev + text : text));
      streaming.current = true;
    });
    return unsubscribe;
  }, []);

  return (
    <div
      className="w-full h-full rounded-xl bg-black/70 text-white text-sm flex flex-col"
      onMouseEnter={() => window.mooly.reportOverlayHover(true)}
      onMouseLeave={() => window.mooly.reportOverlayHover(false)}
    >
      <div
        className="h-6 flex items-center gap-2 px-2 text-xs text-red-400 shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        Recording (stub)
      </div>
      <div className="px-2 pb-2 flex-1 overflow-y-auto">{suggestion}</div>
    </div>
  );
}
