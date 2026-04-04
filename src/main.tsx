import { createRoot } from "react-dom/client";
import { registerSW } from 'virtual:pwa-register';
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA — skip in iframes and Lovable preview
const isIframe = window.self !== window.top;
const isPreview = location.search.includes('forceHideBadge');
if ('serviceWorker' in navigator && !isIframe && !isPreview) {
  registerSW({ immediate: true });
}

createRoot(document.getElementById("root")!).render(<App />);
