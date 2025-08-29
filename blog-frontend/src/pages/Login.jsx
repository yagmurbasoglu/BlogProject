import { useMemo, useState } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getRolesFromToken = (token) => {
    try {
      if (!token) return { roles: [], isAdmin: false };
      const raw = String(token).replace(/^\"|\"$/g, "");
      const payloadPart = raw.split(".")[1];
      if (!payloadPart) return { roles: [], isAdmin: false };
      const json = JSON.parse(atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/")));

      let rolesClaim = json["role"] || json["roles"] || json["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || [];
      let rolesArr = [];
      if (Array.isArray(rolesClaim)) rolesArr = rolesClaim;
      else if (typeof rolesClaim === "string") rolesArr = rolesClaim.split(/[;,\s]+/g);

      const normalized = rolesArr.map((r) => String(r).trim().toLowerCase()).filter(Boolean);
      const isAdmin = normalized.includes("admin") || json.isAdmin === true || json.IsAdmin === true;
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
      setError("Geçerli email ve en az 6 karakter şifre girin");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await api.post("/auth/login", { email, password });
      const raw = res?.data;
      const extracted = (raw && (raw.token || raw.accessToken || raw.jwt)) || raw;
      if (!extracted) {
        throw new Error("Token alınamadı");
      }
      localStorage.setItem("token", String(extracted));

      const { isAdmin } = getRolesFromToken(extracted);
      navigate(isAdmin ? "/admin" : "/posts");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Login error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      const backendMessage =
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message;
      setError(backendMessage || "Giriş başarısız, bilgileri kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
        <div style={styles.headerGroup}>
          <h2 style={styles.title}>Giriş Yap</h2>
          <p style={styles.subtitle}>Hoş geldin! Devam etmek için oturum aç.</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="ornek@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              autoComplete="email"
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="password">Şifre</label>
            <input
              id="password"
              type="password"
              placeholder="En az 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={styles.errorBox}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !isFormValid} style={{
            ...styles.button,
            ...(loading || !isFormValid ? styles.buttonDisabled : {}),
          }}>
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <div style={styles.footerText}>
          Hesabın yok mu? {" "}
          <Link to="/register" style={styles.link}>Kayıt ol</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background:
      "radial-gradient(1000px 500px at 10% -10%, rgba(100,108,255,0.25), rgba(0,0,0,0)), radial-gradient(1000px 500px at 110% 110%, rgba(100,108,255,0.25), rgba(0,0,0,0))",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
    backdropFilter: "blur(10px)",
  },
  headerGroup: { marginBottom: 12 },
  title: { margin: 0, fontSize: 28 },
  subtitle: { margin: 0, opacity: 0.8, fontSize: 14 },
  form: { marginTop: 16, display: "flex", flexDirection: "column", gap: 12 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, opacity: 0.9 },
  input: {
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.25)",
    color: "inherit",
    outline: "none",
    transition: "border-color .2s, box-shadow .2s",
  },
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
