import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import ConfessPage from "./pages/ConfessPage";
import RevealPage from "./pages/RevealPage";
import OpenInBrowser from "./pages/OpenInBrowser";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/confess/:userId" element={<ConfessPage />} />
          <Route path="/reveal" element={<RevealPage />} />
          <Route path="/open" element={<OpenInBrowser />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
