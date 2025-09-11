import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
    FaMoon,
    FaSun,
    FaBell,
    FaBellSlash,
    FaSignOutAlt,
    FaCog,
    FaGlobe,
    FaLock,
    FaTrash,
} from "react-icons/fa";

export default function Settings() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState(true);
    const [language, setLanguage] = useState("tr");

    // ✅ localStorage’dan oku
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

    // ✅ tema değişince body’ye uygula
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

const handleThemeChange = () => {
  const newTheme = theme === "light" ? "dark" : "light";
  setTheme(newTheme);
  localStorage.setItem("theme", newTheme);

  // ✅ Layout’a haber ver
  window.dispatchEvent(new Event("themeChanged"));

  toast.info(
    `Tema değiştirildi: ${newTheme === "light" ? "☀️ Light" : "🌙 Dark"}`
  );
};


    const handleNotifications = () => {
        setNotifications(!notifications);
        toast.success(
            `Bildirimler ${!notifications ? "açıldı 🔔" : "kapandı 🔕"}`
        );
    };

    const handleLanguageChange = (e) => {
        setLanguage(e.target.value);
        toast.info(
            `Dil ${e.target.value === "tr" ? "Türkçe" : "English"} olarak ayarlandı 🌍`
        );
    };

    const handleChangePassword = () => {
        toast.info("🔒 Şifre değiştirme sayfası açılacak (henüz bağlanmadı)");
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        toast.info("Çıkış yapıldı 👋");
        navigate("/login");
    };

    const handleDeleteAccount = () => {
        if (confirm("Hesabını kalıcı olarak silmek istediğine emin misin?")) {
            toast.error("Hesap silme işlemi henüz bağlanmadı ❌");
        }
    };

    return (
        <div style={getPageWrapper(theme)}>
            <div style={styles.container}>
                <header style={styles.header}>
                    <div>
                        <h2 style={styles.title}>
                            <FaCog style={{ marginRight: 8 }} /> Ayarlar
                        </h2>
                        <p style={styles.subtitle}>
                            Hesap ve uygulama tercihlerini buradan yönet.
                        </p>
                    </div>
                </header>

                <div style={styles.grid}>
                    {/* Tema Ayarı */}
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>Tema</h3>
                        <button style={styles.primaryBtn} onClick={handleThemeChange}>
                            {theme === "light" ? <FaSun /> : <FaMoon />} Şu an:{" "}
                            {theme === "light" ? "Light" : "Dark"}
                        </button>
                    </div>

                    {/* Bildirim Ayarı */}
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>Bildirimler</h3>
                        <button style={styles.ghostBtn} onClick={handleNotifications}>
                            {notifications ? <FaBell /> : <FaBellSlash />}{" "}
                            {notifications ? "Bildirimler Açık" : "Bildirimler Kapalı"}
                        </button>
                    </div>

                    {/* Dil Seçimi */}
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>
                            <FaGlobe style={{ marginRight: 6 }} /> Dil Seçimi
                        </h3>
                        <select
                            value={language}
                            onChange={handleLanguageChange}
                            style={styles.select}
                        >
                            <option value="tr">🇹🇷 Türkçe</option>
                            <option value="en">🇬🇧 English</option>
                        </select>
                    </div>

                    {/* Güvenlik */}
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>
                            <FaLock style={{ marginRight: 6 }} /> Güvenlik
                        </h3>
                        <button style={styles.ghostBtn} onClick={handleChangePassword}>
                            Şifre Değiştir
                        </button>
                    </div>

                    {/* Hesap İşlemleri */}
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>Hesap</h3>
                        <div style={{ display: "flex", gap: 12 }}>
                            <button style={styles.ghostBtn} onClick={handleLogout}>
                                <FaSignOutAlt /> Çıkış Yap
                            </button>
                            <button
                                style={{ ...styles.ghostBtn, borderColor: "red", color: "red" }}
                                onClick={handleDeleteAccount}
                            >
                                <FaTrash /> Hesabı Sil
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    pageWrapper: { minHeight: "100vh", padding: 24 },
    container: { maxWidth: 1000, margin: "0 auto" },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    title: { margin: 0, fontSize: 24, display: "flex", alignItems: "center" },
    subtitle: { margin: 0, opacity: 0.85, fontSize: 14 },
    grid: {
        marginTop: 16,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 16,
    },
    card: {
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 14,
        padding: 16,
        boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
        backdropFilter: "blur(6px)",
    },
    cardTitle: {
        marginTop: 0,
        marginBottom: 12,
        fontSize: 18,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
    },
    primaryBtn: {
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid #646cff",
        background: "linear-gradient(135deg, #646cff, #7a83ff)",
        color: "white",
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
    },
    ghostBtn: {
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.18)",
        background: "transparent",
        color: "inherit",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
    },
    select: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(0,0,0,0.25)",
        color: "inherit",
    },
};
// Kart stilini tema göre belirle
const getCardStyle = (theme) => ({
    background: theme === "light" ? "#4e7dd91e" : "rgba(0, 0, 50, 0.7)",
    color: theme === "light" ? "#222222" : "#eeeeee",
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
    backdropFilter: "blur(6px)",
});

// Yazılar için
const getTextStyle = (theme) => ({
    color: theme === "light" ? "#222222" : "#eeeeee",
});

const getGhostBtn = (theme) => ({
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "transparent",
    color: theme === "light" ? "#222" : "#eee",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
});
// Settings.jsx içinde
const getPageWrapper = (theme) => ({
  minHeight: "100vh",
  padding: 24,
  background:
    theme === "light"
      ? "radial-gradient(1000px 500px at 10% -10%, rgba(100, 108, 255, 0.23), #ffffff)"
      : "radial-gradient(1000px 500px at 10% -10%, rgba(100,108,255,0.25), #0d1b2a)",
  color: theme === "light" ? "#222" : "#eee",
});

