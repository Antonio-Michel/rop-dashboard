import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeContext";
import App from "./App";
import RenewalRiskPage from "./pages/RenewalRisk";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route
            path="/properties/:propertyId/renewal-risk"
            element={<RenewalRiskPage />}
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
