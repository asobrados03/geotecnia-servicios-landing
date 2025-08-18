import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import logoUrl from '@/assets/LOGO.png'

// Set favicon to the project logo (PNG) without distortion
const ensureFavicon = (href: string) => {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    document.head.appendChild(link);
  }
  link.href = href;
};

ensureFavicon(logoUrl);

createRoot(document.getElementById("root")).render(<App />);
