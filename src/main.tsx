import { createRoot } from 'react-dom/client'
import { LanguageProvider } from '@/contexts/LanguageContext'
import App from './App.tsx'
import './index.css'
import { initTelegramViewportFix } from '@/utils/telegramViewportFix'

// Initialize Telegram viewport error fix before rendering
initTelegramViewportFix();

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
