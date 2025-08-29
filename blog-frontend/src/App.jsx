import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Posts from "./pages/Posts";
import Admin from "./pages/Admin";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/posts" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/posts" element={<Posts />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}

export default App;
