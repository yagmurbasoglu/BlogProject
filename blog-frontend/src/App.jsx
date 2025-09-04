import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Posts from "./pages/Posts";
import Admin from "./pages/Admin";
import { ToastContainer } from "react-toastify";
import Layout from "./components/Layout"; // ✅

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ✅ Layout kullanılan kısım */}
        <Route element={<Layout />}>
          <Route path="/posts" element={<Posts />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>

      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </>
  );
}

export default App;
