// App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Posts from "./pages/Posts";
import Admin from "./pages/Admin";
import { ToastContainer } from "react-toastify"; // ✅ Sadece component

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/posts" element={<Posts />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>

      {/* ✅ Bir kere, en altta/üstte olabilir; Routes'ın kardeşi olarak */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="colored"  // İstersen "light"/"dark"
      />
    </>
  );
}

export default App;
