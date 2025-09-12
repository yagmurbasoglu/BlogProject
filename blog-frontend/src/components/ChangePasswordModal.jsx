import { useState } from "react";
import api from "../api/axios"; 
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useTranslation } from "react-i18next";

export default function ChangePasswordModal({ onClose }) {
  const { t } = useTranslation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // 👁 Şifre göster/gizle state
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error(t("errors.fillAllFields")); // ❌ Çeviriden geliyor
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error(t("errors.passwordMismatch")); // ❌ Çeviriden geliyor
      return;
    }

    try {
      const response = await api.put("/users/change-password", {
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      toast.success(response.data.message || t("success.passwordChanged"));
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || t("errors.passwordNotChanged"));
    }
  };

  return (
    <div style={styles.modal}>
      <h2>{t("changePassword")}</h2>

      {/* Current Password */}
      <div style={styles.inputWrapper}>
        <input
          type={showCurrent ? "text" : "password"}
          placeholder={t("currentPassword")}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          style={styles.input}
        />
        <span onClick={() => setShowCurrent(!showCurrent)} style={styles.eyeIcon}>
          {showCurrent ? <FaEyeSlash /> : <FaEye />}
        </span>
      </div>

      {/* New Password */}
      <div style={styles.inputWrapper}>
        <input
          type={showNew ? "text" : "password"}
          placeholder={t("newPassword")}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={styles.input}
        />
        <span onClick={() => setShowNew(!showNew)} style={styles.eyeIcon}>
          {showNew ? <FaEyeSlash /> : <FaEye />}
        </span>
      </div>

      {/* Confirm New Password */}
      <div style={styles.inputWrapper}>
        <input
          type={showConfirm ? "text" : "password"}
          placeholder={t("confirmNewPassword")}
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          style={styles.input}
        />
        <span onClick={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
          {showConfirm ? <FaEyeSlash /> : <FaEye />}
        </span>
      </div>

      <button
        onClick={handleChangePassword}
        style={{ ...styles.button, background: "green", color: "white" }}
      >
        {t("update")}
      </button>
      <button
        onClick={onClose}
        style={{ ...styles.button, background: "red", color: "white" }}
      >
        {t("cancel")}
      </button>
    </div>
  );
}

const styles = {
  modal: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "#1e1e2f",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    zIndex: 1000,
    color: "#fff",
    minWidth: "300px",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  eyeIcon: {
    position: "absolute",
    right: "10px",
    cursor: "pointer",
    color: "#aaa",
  },
  button: {
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
