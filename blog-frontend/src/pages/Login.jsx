import { useMemo, useState, useEffect } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FaMoon, FaSun } from "react-icons/fa";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Tema state
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    if (theme === "dark") {
      document.body.style.background =
        "radial-gradient(1000px 600px at 10% -10%, rgba(100, 108, 255, 0.52), transparent), #0d1b2a";
      document.body.style.color = "#eee";
    } else {
      document.body.style.background =
        "radial-gradient(1000px 600px at 10% -10%, rgba(100, 108, 255, 0.32), transparent), #ffffff";
      document.body.style.color = "#222";
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
    toast.info(
      `${t("themeChanged")}: ${
        theme === "light" ? "🌙 " + t("dark") : "☀️ " + t("light")
      }`
    );
  };

  const getRolesFromToken = (token) => {
    try {
      if (!token) return { roles: [], isAdmin: false };
      const raw = String(token).replace(/^\"|\"$/g, "");
      const payloadPart = raw.split(".")[1];
      if (!payloadPart) return { roles: [], isAdmin: false };
      const json = JSON.parse(
        atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/"))
      );

      let rolesClaim =
        json["role"] ||
        json["roles"] ||
        json["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
        [];
      let rolesArr = [];
      if (Array.isArray(rolesClaim)) rolesArr = rolesClaim;
      else if (typeof rolesClaim === "string")
        rolesArr = rolesClaim.split(/[;,\s]+/g);

      const normalized = rolesArr
        .map((r) => String(r).trim().toLowerCase())
        .filter(Boolean);
      const isAdmin =
        normalized.includes("admin") ||
        json.isAdmin === true ||
        json.IsAdmin === true;
      return { roles: normalized, isAdmin };
    } catch {
      return { roles: [], isAdmin: false };
    }
  };

  const isFormValid = useMemo(() => {
    const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
    return emailRegex.test(email) && password.trim().length >= 6;
  }, [email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      const msg = t("invalidLoginForm");
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await api.post("/auth/login", { email, password });
      const raw = res?.data;
      const extracted =
        (raw && (raw.token || raw.accessToken || raw.jwt)) || raw;
      if (!extracted) throw new Error("Token alınamadı");

      localStorage.setItem("token", String(extracted));
      toast.success(t("loginSuccess"));

      const { isAdmin } = getRolesFromToken(extracted);
      navigate("/posts");
    } catch (err) {
      console.error("Login error:", err);
      let backendMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.title ||
        (typeof err.response?.data === "string" ? err.response.data : "");

      if (backendMessage?.toLowerCase().includes("invalid credential")) {
        backendMessage = t("loginFailed");
      }

      const msg = backendMessage || t("loginFailed");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={getPageWrapper(theme)}>
      {/* Dil Seçici */}
      <div style={styles.langSelect}>
        <select
          value={i18n.language}
          onChange={(e) => {
            i18n.changeLanguage(e.target.value);
            localStorage.setItem("i18nextLng", e.target.value);
          }}
          style={styles.select}
        >
          <option value="tr">🇹🇷 Türkçe</option>
          <option value="en">🇬🇧 English</option>
        </select>
      </div>

      {/* Tema Butonu */}
      <div style={styles.themeToggle}>
        <button onClick={toggleTheme} style={styles.themeBtn}>
          {theme === "light" ? <FaMoon /> : <FaSun />}{" "}
          {theme === "light" ? t("dark") : t("light")}
        </button>
      </div>

      <div style={getCard(theme)}>
        <div style={styles.headerGroup}>
          <h2 style={getText(theme)}>{t("loginTitle")}</h2>
          <p style={styles.subtitle}>{t("loginSubtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={getText(theme)} htmlFor="email">
              {t("email")}
            </label>
            <input
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={getInput(theme)}
              autoComplete="email"
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={getText(theme)} htmlFor="password">
              {t("password")}
            </label>
            <input
              id="password"
              type="password"
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={getInput(theme)}
              autoComplete="current-password"
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
            {loading ? t("loggingIn") : t("login")}
          </button>
        </form>

        <div style={styles.footerText}>
          {t("noAccount")}{" "}
          <Link to="/register" style={styles.link}>
            {t("registerHere")}
          </Link>
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
  langSelect: {
    position: "absolute",
    top: 20,
    left: 20,
  },
  select: {
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid #646cff",
    background: "white",
    fontWeight: 600,
    cursor: "pointer",
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
    transition: "transform .08s ease, opacity .2s",
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
