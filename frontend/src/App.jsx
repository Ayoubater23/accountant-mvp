import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Upload from "./pages/Upload.jsx";
import Verify from "./pages/Verify.jsx";

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  const location = useLocation();
  if (!token) {
    return (
      <Navigate to="/connexion" replace state={{ from: location }} />
    );
  }
  return children;
}

function GuestRoute({ children }) {
  const { token } = useAuth();
  if (token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function TrialExpiredBanner({ message }) {
  return (
    <div className="bg-red-600 text-white text-center px-4 py-3 text-sm font-medium">
      {message}
    </div>
  );
}

export default function App() {
  const { trialExpired } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {trialExpired && <TrialExpiredBanner message={trialExpired} />}
      <main className="flex-1">
        <Routes>
          <Route
            path="/connexion"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/inscription"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/import"
            element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            }
          />
          <Route path="/verify" element={<Verify />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
