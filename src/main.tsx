import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Guard: desregistrar SWs em iframes e previews do Lovable
const isIframe = window.self !== window.top;
const isPreview = location.search.includes('forceHideBadge');
if (isIframe || isPreview) {
  navigator.serviceWorker?.getRegistrations().then(regs =>
    regs.forEach(r => r.unregister())
  );
}

createRoot(document.getElementById("root")!).render(<App />);
