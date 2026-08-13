import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./styles.css";
import "./settings.css";
import "./catalog-theme.css";
import "./catalog-header.css";
import "./shadcn-theme.css";
import "./catalog-copy.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </BrowserRouter>
  </StrictMode>,
);
