import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
import Providers from "./pages/Providers";
import ProviderDetail from "./pages/ProviderDetail";
import Dashboard from "./pages/Dashboard";
import ProviderSetup from "./pages/ProviderSetup";
import UpdateProfile from "./pages/UpdateProfile";
import JobBoard from "./pages/JobBoard";
import JobDetail from "./pages/JobDetail";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login"            element={<Login />} />
        <Route path="/register"         element={<Register />} />
        <Route path="/providers"        element={<Providers />} />
        <Route path="/providers/:id"    element={<ProviderDetail />} />
        <Route path="/dashboard"        element={<Dashboard />} />
        <Route path="/provider/setup"   element={<ProviderSetup />} />
        <Route path="/profile"          element={<UpdateProfile />} />
        <Route path="/jobs"             element={<JobBoard />} />
        <Route path="/jobs/:id"         element={<JobDetail />} />
        <Route path="/"                 element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
}

export default App;