import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// @ts-ignore - virtual module from vite-plugin-pwa
import("virtual:pwa-register").then(({ registerSW }: any) => {
  registerSW({ immediate: true });
}).catch(() => {});
