import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { inject } from '@vercel/analytics'

// Activa las analíticas de Vercel
inject();

createRoot(document.getElementById("root")).render(
  <App />
);
