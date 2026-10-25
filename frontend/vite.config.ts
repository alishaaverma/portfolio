import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Fills %TITLE% and %DESCRIPTION% in index.html from backend/data/profile.json.
 * This puts your name in the page itself, so link previews on LinkedIn, WhatsApp
 * and X (which don't run JavaScript) show it too.
 */
function profileMeta(): Plugin {
  return {
    name: 'profile-meta',
    transformIndexHtml(html) {
      const profile = JSON.parse(readFileSync(new URL('../backend/data/profile.json', import.meta.url), 'utf-8'));
      const name = `${profile.first_name} ${profile.last_name}`;
      const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
      return html
        .replaceAll('%TITLE%', escape(`${name} · ${profile.role}`))
        .replaceAll('%DESCRIPTION%', escape(`${name}, ${profile.role}. ${profile.tagline}`));
    },
  };
}

// In development, /api and /media requests are forwarded to the Python backend,
// so the frontend never needs to know the backend's address.
export default defineConfig({
  plugins: [react(), tailwindcss(), profileMeta()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/media': 'http://localhost:8000',
    },
  },
});
