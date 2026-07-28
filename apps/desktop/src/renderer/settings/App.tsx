import { useEffect, useState } from 'react';
import type { AppSettings } from '@mooly/shared-types';

export default function App() {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    window.mooly.getSettings().then(setSettings);
  }, []);

  if (!settings) return <div className="p-4">Loading…</div>;

  async function update(partial: Partial<AppSettings>) {
    const merged = await window.mooly.setSettings(partial);
    setSettings(merged);
  }

  return (
    <div className="p-4 space-y-4 text-sm">
      <h1 className="text-lg font-semibold">Mooly Settings</h1>

      <section className="space-y-1">
        <label className="block font-medium">Provider</label>
        <select
          className="border rounded px-2 py-1 w-full"
          value={settings.activeProvider}
          onChange={(e) => update({ activeProvider: e.target.value })}
        >
          <option value="stub">Stub Provider</option>
        </select>
      </section>

      <section className="space-y-1">
        <label className="block font-medium">API Key (unused by Stub Provider)</label>
        <input
          type="password"
          className="border rounded px-2 py-1 w-full"
          value={settings.apiKeys[settings.activeProvider] ?? ''}
          onChange={(e) =>
            update({ apiKeys: { ...settings.apiKeys, [settings.activeProvider]: e.target.value } })
          }
        />
      </section>

      <section className="space-y-1">
        <label className="block font-medium">Overlay Opacity ({settings.overlayOpacity.toFixed(2)})</label>
        <input
          type="range"
          min={0.2}
          max={1}
          step={0.05}
          value={settings.overlayOpacity}
          onChange={(e) => update({ overlayOpacity: Number(e.target.value) })}
          className="w-full"
        />
      </section>

      <section className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-medium">Overlay X</label>
          <input
            type="number"
            className="border rounded px-2 py-1 w-full"
            value={settings.overlayX}
            onChange={(e) => update({ overlayX: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="block font-medium">Overlay Y</label>
          <input
            type="number"
            className="border rounded px-2 py-1 w-full"
            value={settings.overlayY}
            onChange={(e) => update({ overlayY: Number(e.target.value) })}
          />
        </div>
      </section>

      <section className="space-y-1 opacity-50">
        <label className="block font-medium">Capture (coming in a later milestone)</label>
        <label className="flex items-center gap-2">
          <input type="checkbox" disabled /> Screen capture
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" disabled /> Audio capture
        </label>
      </section>
    </div>
  );
}
