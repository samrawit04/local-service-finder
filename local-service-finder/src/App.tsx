import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/login";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
import Providers from "./pages/Providers";
import ProviderDetail from "./pages/ProviderDetail";
import Dashboard from "./pages/Dashboard";
import UpdateProfile from "./pages/UpdateProfile";
import JobBoard from "./pages/JobBoard";
import JobDetail from "./pages/JobDetail";
import Chat from "./pages/Chat";

function App() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login"            element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register"         element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/providers"        element={<Providers />} />
        <Route path="/providers/:id"    element={<ProviderDetail />} />
        <Route path="/dashboard"        element={<Dashboard />} />
        <Route path="/profile"          element={<UpdateProfile />} />
        <Route path="/jobs"             element={<JobBoard />} />
        <Route path="/jobs/:id"         element={<JobDetail />} />
        <Route path="/chat"             element={<Chat />} />
        <Route path="/"                 element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </>
  );
}

export default App;