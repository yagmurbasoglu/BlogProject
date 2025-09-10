import { useMemo, useState, useEffect } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FaMoon, FaSun } from "react-icons/fa";

export default function Register() {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Tema state (localStorage’dan oku)
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

useEffect(() => {
  document.body.style.background =
    theme === "dark"
      ? "radial-gradient(1000px 500px at 10% -10%, rgba(100,108,255,0.25), #0d1b2a)"
      : "radial-gradient(1000px 500px at 10% -10%, rgba(100, 108, 255, 0.89), #ffffff), radial-gradient(1000px 500px at 110% 110%, rgba(100,108,255,0.12), #ffffff)";

  document.body.style.color = theme === "dark" ? "#eeeeee" : "#222222";
  localStorage.setItem("theme", theme);
}, [theme]);


  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
    toast.info(`Tema değiştirildi: ${theme === "light" ? "🌙 Dark" : "☀️ Light"}`);
  };

  const isFormValid = useMemo(() => {
    const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
    return (
      userName.trim().length >= 3 &&
      emailRegex.test(email) &&
      password.trim().length >= 6
    );
  }, [userName, email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      const msg = "Lütfen geçerli bilgiler girin (kullanıcı adı ≥3, şifre ≥6)";
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      setLoading(true);
      setError("");
      await api.post("/auth/register", { userName, email, password });
      toast.success("Kayıt başarılı 🎉 Giriş yapabilirsiniz.");
      navigate("/login");
    } catch (err) {
      console.error("Register error:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.title ||
        "Kayıt başarısız, tekrar deneyin.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={getPageWrapper(theme)}>
      <div style={styles.themeToggle}>
        <button onClick={toggleTheme} style={styles.themeBtn}>
          {theme === "light" ? <FaMoon /> : <FaSun />} {theme === "light" ? "Dark" : "Light"}
        </button>
      </div>

      <div style={getCard(theme)}>
        <div style={styles.headerGroup}>
          <h2 style={getText(theme)}>Kayıt Ol</h2>
          <p style={styles.subtitle}>Blog platformumuza katılın ve yazmaya başlayın.</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={getText(theme)} htmlFor="userName">
              Kullanıcı Adı
            </label>
            <input
              id="userName"
              type="text"
              placeholder="örn. yalin.dev"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              style={getInput(theme)}
              autoComplete="username"
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={getText(theme)} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="ornek@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={getInput(theme)}
              autoComplete="email"
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={getText(theme)} htmlFor="password">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              placeholder="En az 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={getInput(theme)}
              autoComplete="new-password"
            />
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <button
            type="submit"
            disabled={loading || !isFormValid}
            style={{
              ...styles.button,
              ...(loading || !isFormValid ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? "Kaydediliyor..." : "Kayıt Ol"}
          </button>
        </form>

        <div style={styles.footerText}>
          Hesabın var mı? <Link to="/login" style={styles.link}>Giriş yap</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  themeToggle: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  themeBtn: {
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid #646cff",
    background: "linear-gradient(135deg, #646cff, #7a83ff)",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  headerGroup: { marginBottom: 12 },
  subtitle: { margin: 0, opacity: 0.8, fontSize: 14 },
  form: { marginTop: 16, display: "flex", flexDirection: "column", gap: 12 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  errorBox: {
    background: "rgba(255,77,79,0.12)",
    border: "1px solid rgba(255,77,79,0.35)",
    color: "#ff6b6b",
    padding: "10px 12px",
    borderRadius: 10,
    fontSize: 13,
  },
  button: {
    marginTop: 4,
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #646cff",
    background: "linear-gradient(135deg, #646cff, #7a83ff)",
    color: "white",
    fontWeight: 600,
    letterSpacing: 0.2,
    cursor: "pointer",
  },
  buttonDisabled: { opacity: 0.6, cursor: "not-allowed" },
  footerText: { marginTop: 16, fontSize: 14, textAlign: "center", opacity: 0.9 },
  link: { color: "#8f95ff" },
};

// 🎨 Tema uyumlu stiller
const getPageWrapper = (theme) => ({
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  transition: "background 0.3s, color 0.3s",
});

const getCard = (theme) => ({
  width: "100%",
  maxWidth: 440,
  background: theme === "dark" ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.9)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
  backdropFilter: "blur(10px)",
  color: theme === "dark" ? "#eee" : "#222",
});

const getText = (theme) => ({
  color: theme === "dark" ? "#f1f1f1" : "#111",
});

const getInput = (theme) => ({
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
  color: theme === "dark" ? "#eee" : "#111",
  outline: "none",
});
