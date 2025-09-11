import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FaReact,
  FaHome,
  FaUserShield,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaUserPlus,
  FaCat,
  FaDog,
  FaRobot,
  FaSmile,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";

export default function Layout() {
  const [showModal, setShowModal] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState("user"); // default
  const [role, setRole] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");


  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);

    const handleThemeChange = () => {
      setTheme(localStorage.getItem("theme") || "light");
    };

    // ✅ hem storage hem custom event
    window.addEventListener("storage", handleThemeChange);
    window.addEventListener("themeChanged", handleThemeChange);

    return () => {
      window.removeEventListener("storage", handleThemeChange);
      window.removeEventListener("themeChanged", handleThemeChange);
    };
  }, []);


  useEffect(() => {
    const handleStorage = () => {
      setTheme(localStorage.getItem("theme") || "light");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log("JWT Payload:", decoded);

        let userRole =
          decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

        // Eğer array ise (örn: ["Admin","User"]) ilkini al
        if (Array.isArray(userRole)) {
          userRole = userRole[0];
        }

        // normalize: küçük harfe çevir
        setRole(userRole ? userRole.toLowerCase() : null);
      } catch (err) {
        console.error("Token çözülemedi:", err);
      }
    }
  }, []);


  useEffect(() => {
    const handleStorageChange = () => {
      const savedIcon = localStorage.getItem("selectedIcon") || "user";
      setSelectedIcon(savedIcon);
    };

    window.addEventListener("storage", handleStorageChange);

    // cleanup
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);


  // LocalStorage'dan oku
  useEffect(() => {
    const savedIcon = localStorage.getItem("selectedIcon");
    if (savedIcon) {
      setSelectedIcon(savedIcon);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    toast.info("Oturum kapatıldı 👋");
  };

  const handleIconSelect = (iconKey) => {
    setSelectedIcon(iconKey);
    localStorage.setItem("selectedIcon", iconKey);
    setShowModal(false);
  };

  // Kullanıcının seçebileceği ikonlar
  const iconMap = {
    user: <FaUser size={20} />,
    cat: <FaCat size={20} />,
    dog: <FaDog size={20} />,
    robot: <FaRobot size={20} />,
    smile: <FaSmile size={20} />,
  };

  const navItems = [
    { path: "/posts", label: "Gönderiler", icon: <FaHome size={16} /> },
    ...(role === "admin" || role === "superadmin"
      ? [{ path: "/admin", label: "Admin", icon: <FaUserShield size={16} /> }]
      : []),
    { path: "/profile", label: "Profil", icon: <FaUser size={16} /> },
    { path: "/settings", label: "Ayarlar", icon: <FaCog size={16} /> },
  ];
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          theme === "light"
            ? "radial-gradient(1000px 500px at 10% -10%, rgba(100,108,255,0.08), #ffffff)"
            : "radial-gradient(1000px 500px at 10% -10%, rgba(100,108,255,0.25), #0d1b2a)",
        color: theme === "light" ? "#222" : "#eee",
      }}
    >
      {/* Üst Navbar */}
      <header
        style={{
          background: theme === "light" ? "white" : "rgba(0,0,0,0.3)", // ✅ dark modda şeffaf
          backdropFilter: theme === "dark" ? "blur(6px)" : "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 24px",
          borderBottom:
            theme === "light"
              ? "1px solid #eee"
              : "1px solid rgba(255,255,255,0.1)",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >

        <div style={styles.navLeft}>
          <FaReact size={28} color="#61dafb" />
          <span style={styles.logoText}>Blog Project</span>
        </div>

        <nav style={styles.navCenter}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navLink,
                backgroundColor:
                  location.pathname === item.path
                    ? (theme === "light" ? "#eef2ff" : "rgba(255,255,255,0.1)")
                    : "transparent",
                color:
                  location.pathname === item.path
                    ? (theme === "light" ? "#433ea9ff" : "#ffffff")
                    : (theme === "light" ? "#444" : "#ddd"),
                fontWeight: location.pathname === item.path ? 600 : 500,
              }}
            >

              {item.icon}
              <span>{item.label}</span>
            </Link>

          ))}
        </nav>

        <div style={styles.navRight}>
          <button
            onClick={() => setShowModal(true)}
            style={styles.addUserBtn}
            title="İkon Seç"
          >
            <FaUserPlus size={16} />
          </button>
          <div style={styles.iconWrapper}>{iconMap[selectedIcon]}</div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <FaSignOutAlt size={16} /> Çıkış
          </button>
        </div>
      </header>

      {/* İçerik */}
      <main style={styles.content}>
        <div style={styles.innerContent}>
          <Outlet />
        </div>
      </main>

      {/* Modal - İkon seçimi */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={{
              marginBottom: "12px",
              fontSize: "18px",
              fontWeight: 600,
              color: "#ef4444" 
            }}>
              Bir İkon Seç
            </h2>

            <div style={styles.iconGrid}>
              {Object.entries(iconMap).map(([key, icon]) => (
                <button
                  key={key}
                  style={styles.iconButton}
                  onClick={() => handleIconSelect(key)}
                >
                  {icon}
                </button>
              ))}
            </div>
            <button style={styles.closeBtn} onClick={() => setShowModal(false)}>
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#f9f9fb",
  },
  navbar: {
    background: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 24px",
    borderBottom: "1px solid #eee",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },
  navLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 700,
    fontSize: 18,
  },
  logoText: {
    color: "#433ea9ff",
  },
  navCenter: {
    display: "flex",
    gap: "20px",
  },
  navLink: {
    textDecoration: "none",
    color: "#444",
    fontSize: 15,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    borderRadius: "8px",
    transition: "all 0.25s ease",
  },

  navRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  addUserBtn: {
    background: "#4f46e5",
    border: "none",
    borderRadius: "50%",
    color: "white",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#4f46e5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #eee",
  },
  logoutBtn: {
    background: "rgba(239, 68, 68, 0.9)",
    border: "none",
    borderRadius: 6,
    padding: "6px 10px",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: "5px",
    display: "flex",
    justifyContent: "center",
  },
  innerContent: {
    width: "100%",
    maxWidth: "100%",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    background: "white",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    textAlign: "center",
  },
  iconGrid: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    marginTop: "12px",
    marginBottom: "12px",
  },
  iconButton: {
    background: "#f3f4f6",
    border: "none",
    borderRadius: "8px",
    padding: "10px",
    cursor: "pointer",
    transition: "transform 0.2s",
  },
  closeBtn: {
    marginTop: "10px",
    padding: "8px 12px",
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
