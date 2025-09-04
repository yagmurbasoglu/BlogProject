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

export default function Layout() {
  const [showModal, setShowModal] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState("user"); // default
  const navigate = useNavigate();
  const location = useLocation();

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
    { path: "/admin", label: "Admin", icon: <FaUserShield size={16} /> },
    { path: "/profile", label: "Profil", icon: <FaUser size={16} /> },
    { path: "/settings", label: "Ayarlar", icon: <FaCog size={16} /> },
  ];

  return (
    <div style={styles.wrapper}>
      {/* Üst Navbar */}
      <header style={styles.navbar}>
        <div style={styles.navLeft}>
          <FaReact size={28} color="#61dafb" />
          <span style={styles.logoText}>Blog Project</span>
        </div>

        <nav style={styles.navCenter}>
          {navItems.map((item) => (
            // Link map'inde inline style’da borderBottom yerine şunu yap:
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navLink,
                backgroundColor: location.pathname === item.path ? "#eef2ff" : "transparent",
                color: location.pathname === item.path ? "#433ea9ff" : "#444",
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
            <h2>Bir ikon seç</h2>
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
    background: "#f3f4f6",
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
