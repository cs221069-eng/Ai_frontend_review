import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import CodingScreen from "./components/CodingScreen";
import SignInForm from "./components/SignInForm";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/coding" replace />} />
        <Route path="/coding" element={<CodingScreen />} />
        <Route path="/signin" element={<SignInForm />} />
        <Route path="*" element={<Navigate to="/coding" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
