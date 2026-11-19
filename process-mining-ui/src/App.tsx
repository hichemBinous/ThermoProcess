import { BrowserRouter, Routes, Route } from "react-router-dom";
/*import DomainsPage from "./pages/DomainsPage";*/
import UploadPage from "./pages/UploadPage";
import MappingPage from "./pages/MappingPage";
import AnalysisPage from "./pages/AnalysisPage";
import Navbar from "./components/NavBar";
import ProcessExplorerPage from "./pages/ProcessExplorerPage";
import ContextDiscoveryPage from "./pages/ContextDiscoveryPage";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/mapping" element={<MappingPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/process-explorer" element={<ProcessExplorerPage />} />
        <Route path="/context-discovery" element={<ContextDiscoveryPage />} />
      </Routes>
    </BrowserRouter>
  );
}
