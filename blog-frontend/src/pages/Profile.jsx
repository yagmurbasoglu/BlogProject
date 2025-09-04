import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaUser, FaEnvelope,
    FaCat, FaDog, FaRobot, FaSmile
} from "react-icons/fa";
import api from "../api/axios";
import { toast } from "react-toastify";
import CountUp from "react-countup";



export default function Profile() {
    const [user, setUser] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [userComments, setUserComments] = useState([]);
    const [editOpen, setEditOpen] = useState(false);
    const [editUsername, setEditUsername] = useState("");
    const [editIcon, setEditIcon] = useState("user");
    const [editEmail, setEditEmail] = useState("");
    const [hoveredPost, setHoveredPost] = useState(null);
    const [hoveredComment, setHoveredComment] = useState(null);

    const navigate = useNavigate();

    const iconMap = {
        user: <FaUser size={26} />,
        cat: <FaCat size={26} />,
        dog: <FaDog size={26} />,
        robot: <FaRobot size={26} />,
        smile: <FaSmile size={26} />
    };

    const fetchLikeInfo = async (postId) => {
        try {
            const [likesRes, likedRes] = await Promise.all([
                api.get(`/PostLikes/${postId}`).catch(() => ({ data: [] })),
                api.get(`/PostLikes/${postId}/isLiked`).catch(() => ({ data: false })),
            ]);
            let count = 0;
            const d = likesRes.data;
            if (Array.isArray(d)) count = d.length;
            else if (Array.isArray(d?.items)) count = d.items.length;
            else if (typeof d?.count === "number") count = d.count;

            const liked = Boolean(likedRes.data === true || likedRes.data?.isLiked === true);
            return { count, liked };
        } catch {
            return { count: 0, liked: false };
        }
    };

    const fetchCommentCount = async (postId) => {
        try {
            const res = await api.get(`/Comments/${postId}`);
            if (Array.isArray(res.data)) return res.data.length;
            if (Array.isArray(res.data?.items)) return res.data.items.length;
            if (typeof res.data?.count === "number") return res.data.count;
            return 0;
        } catch {
            return 0;
        }
    };


    const getCurrentUserIdFromToken = () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return "";
            const raw = token.replace(/^\"|\"$/g, "");
            const payloadPart = raw.split(".")[1];
            if (!payloadPart) return "";
            const json = JSON.parse(atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/")));
            return (
                json["nameid"] ||
                json["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
                json["sub"] ||
                json["userId"] ||
                json["uid"] ||
                json["id"] ||
                ""
            );
        } catch {
            return "";
        }
    };

    useEffect(() => {
        const loadUser = async () => {
            try {
                const id = getCurrentUserIdFromToken();
                if (!id) return;

                const res = await api.get(`/users/${id}`);
                const data = res.data;

                const userData = {
                    id: data.id,
                    username: data.displayName || data.userName || "Bilinmeyen",
                    email: data.email || "—",
                    icon: localStorage.getItem("selectedIcon") || "user",
                    createdAt: data.createdAt,
                    roles: data.roles || [],
                    statistics: data.statistics || { postCount: 0, commentCount: 0, totalViews: 0 },
                };

                setUser(userData);
                setEditUsername(userData.username);
                setEditIcon(userData.icon);
                setEditEmail(userData.email);

                const postsRes = await api.get(`/users/${id}/posts`);

                const rawPosts = postsRes.data || [];

                // enrich like + comment counts
                const enriched = await Promise.all(
                    rawPosts.map(async (p) => {
                        const likeInfo = await fetchLikeInfo(p.id);
                        const commentCount = await fetchCommentCount(p.id);
                        return {
                            ...p,
                            likeCount: likeInfo.count,
                            likedByCurrentUser: likeInfo.liked,
                            commentCount,
                        };
                    })
                );

                setUserPosts(enriched);
                const commentsRes = await api.get(`/users/${id}/comments`);
                setUserComments(commentsRes.data || []);

            } catch (err) {
                console.error("Profil bilgileri yüklenemedi:", err);
            }
        };

        loadUser();
    }, []);

    if (!user) return (
        <div style={styles.centerWrap}><p>Yükleniyor...</p></div>
    );

    const handleSave = async () => {
        try {
            const updated = {
                ...user,
                username: (editUsername || "").trim() || user.username,
                email: (editEmail || "").trim() || user.email,
                icon: editIcon,
            };

            // Backend DTO: UserName & Email
            await api.put(`/users/${user.id}`, {
                userName: updated.username,
                email: updated.email,
            });

            // Frontend state + local
            setUser(updated);
            localStorage.setItem("selectedIcon", editIcon);
            setEditOpen(false);
            toast.success("Profil güncellendi ✅");
        } catch (err) {
            // Identity errors -> description’ları topla
            const resp = err?.response?.data;
            let msg = "Profil güncellenemedi ❌";

            if (Array.isArray(resp)) {
                // bazen errors array döner
                msg = resp.map(e => e.description || e.code || String(e)).join("\n");
            } else if (Array.isArray(resp?.errors)) {
                msg = resp.errors.map(e => e.description || e.code || String(e)).join("\n");
            } else if (resp?.message) {
                msg = resp.message;
            } else if (typeof resp === "string") {
                msg = resp;
            }

            toast.error(msg);
            console.error("Update error:", err);
        }
    };

    return (
        <div style={styles.pageWrapper}>
            <div style={styles.container}>
                <header style={styles.header}>
                    <div>
                        <h2 style={styles.title}>Profilim</h2>
                        <p style={styles.subtitle}>Profilini görüntüle ve yönet.</p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        {!(user.roles && user.roles.includes("SuperAdmin")) && (
                            <button
                                style={{
                                    ...styles.ghostBtn,
                                    borderColor: "rgba(100,108,255,0.6)",
                                    color: "#433ea9ff",
                                }}
                                onClick={() => setEditOpen(true)}
                            >
                                Profili Düzenle
                            </button>
                        )}
                        <button
                            style={{
                                ...styles.ghostBtn,
                                borderColor: "rgba(255,77,80,1)",
                                color: "#f30000ff",
                            }}
                            onClick={() => navigate("/posts")}
                        >
                            Geri
                        </button>
                    </div>

                </header>

                {/* Profil Bilgileri */}
                <section style={styles.profileHeader}>
                    <div style={styles.avatarCircle}>
                        {iconMap[user.icon] || iconMap.user}
                    </div>
                    <div>
                        <div style={styles.displayName}>{user.username}</div>
                        <div style={styles.displayEmail}>{user.email}</div>
                    </div>
                </section>

                <div style={styles.card}>
                    <div style={styles.infoRow}>
                        <span style={styles.infoLabel}><FaUser /> Kullanıcı Adı</span>
                        <span style={styles.infoValue}>{user.username}</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.infoLabel}><FaEnvelope /> E-posta</span>
                        <span style={styles.infoValue}>{user.email}</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Seçili İkon</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <span style={styles.iconPill}>
                                {iconMap[user.icon] || iconMap.user}
                            </span>
                            <span style={styles.infoValueMono}>{user.icon}</span>
                        </span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Kayıt Tarihi</span>
                        <span style={styles.infoValue}>
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString("tr-TR") : "—"}
                        </span>
                    </div>

                    <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Roller</span>
                        <span style={styles.infoValue}>
                            {user.roles && user.roles.length > 0 ? user.roles.join(", ") : "Kullanıcı"}
                        </span>
                    </div>
                    <div style={styles.statsGrid}>
                        <div style={styles.statCard}>
                            <h4>Gönderiler</h4>
                            <p>
                                <CountUp
                                    start={0}
                                    end={user.statistics?.postCount || 0}
                                    duration={1.5}
                                    separator="."
                                />
                            </p>
                        </div>
                        <div style={styles.statCard}>
                            <h4>Yorumlar</h4>
                            <p>
                                <CountUp
                                    start={0}
                                    end={user.statistics?.commentCount || 0}
                                    duration={1.5}
                                    separator="."
                                />
                            </p>
                        </div>
                        <div style={styles.statCard}>
                            <h4>Toplam Görüntülenme</h4>
                            <p>
                                <CountUp
                                    start={0}
                                    end={user.statistics?.totalViews || 0}
                                    duration={2}
                                    separator="."
                                />
                            </p>
                        </div>
                    </div>

                    {/* Gönderilerim */}
                    <h3 style={{ marginTop: 32, marginBottom: 12 }}>Gönderilerim</h3>
                    {userPosts.length > 0 ? (
                        <div style={styles.grid}>
                            {userPosts.map(post => (
                                <div
                                    key={post.id}
                                    style={{
                                        ...styles.postCard,
                                        ...(hoveredPost === post.id ? styles.postCardHover : {})
                                    }}
                                    onMouseEnter={() => setHoveredPost(post.id)}
                                    onMouseLeave={() => setHoveredPost(null)}
                                    onClick={async () => {
                                        try {
                                            const res = await api.get(`/posts/${post.id}/pageNumber?pageSize=6`);
                                            const page = res.data.pageNumber || 1;
                                            navigate(`/posts?page=${page}&highlight=${post.id}`);
                                        } catch (err) {
                                            console.error("Sayfa numarası alınamadı:", err);
                                            toast.error("Gönderi açılırken hata oluştu ❌");
                                        }
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={styles.badge}>
                                            {post.categoryName || "Kategori Yok"}
                                        </span>
                                    </div>

                                    <h4 style={styles.postTitle}>{post.title}</h4>
                                    <p style={styles.postContent}>
                                        {post.content?.slice(0, 80)}...
                                    </p>
                                    <div style={styles.metaRow}>
                                        <span>👁 {post.viewCount || 0}</span>
                                        <span>❤️ {post.likeCount || 0}</span>
                                        <span>💬 {post.commentCount || 0}</span>
                                        <span>{new Date(post.createdAtUtc).toLocaleDateString("tr-TR")}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>Henüz gönderin yok.</p>
                    )}



                    {/* Yorumlarım */}
                    <h3 style={{ marginTop: 32, marginBottom: 12 }}>Yorumlarım</h3>
                    {userComments.length > 0 ? (
                        <div style={styles.grid}>
                            {userComments.map(c => (
                                <div
                                    key={c.id}
                                    style={{
                                        ...styles.commentCard,
                                        ...(hoveredComment === c.id ? styles.commentCardHover : {})
                                    }}
                                    onMouseEnter={() => setHoveredComment(c.id)}
                                    onMouseLeave={() => setHoveredComment(null)}
                                >
                                    {/* 🔹 Gönderi başlığı badge */}
                                    <div style={{ marginBottom: 6 }}>
                                        <span
                                            style={{ ...styles.badge, cursor: "pointer" }}
                                            onClick={async () => {
                                                try {
                                                    // Sayfa numarasını backend'den al
                                                    const res = await api.get(`/posts/${c.postId}/pageNumber?pageSize=6`);
                                                    const pageNum = res.data.pageNumber || 1;

                                                    // İlgili gönderiye yönlendir
                                                    navigate(`/posts?page=${pageNum}&highlight=${c.postId}`);
                                                } catch (err) {
                                                    console.error("Sayfa numarası alınamadı:", err);
                                                    navigate(`/posts?highlight=${c.postId}`); // fallback
                                                }
                                            }}
                                        >
                                            ↪ {c.postTitle}
                                        </span>
                                    </div>


                                    <p style={styles.commentContent}>{c.content}</p>
                                    <small style={styles.commentDate}>
                                        {new Date(c.createdAtUtc).toLocaleDateString("tr-TR")}
                                    </small>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>Henüz yorumun yok.</p>
                    )}


                </div>
            </div>

            {/* Düzenleme Modalı */}
            {editOpen && (
                <div style={styles.modalOverlay}>
                    <div
                        style={styles.modalCard}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSave();
                            }
                        }}
                    >
                        <h3>Profili Düzenle</h3>

                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Kullanıcı Adı</label>
                            <input
                                style={styles.input}
                                value={editUsername}
                                onChange={(e) => setEditUsername(e.target.value)}
                            />
                        </div>

                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>E-posta</label>
                            <input
                                style={styles.input}
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                            />
                        </div>

                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>İkon Seç</label>
                            <div style={styles.iconGrid}>
                                {Object.entries(iconMap).map(([key, icon]) => (
                                    <button
                                        key={key}
                                        style={{
                                            ...styles.iconButton,
                                            border: editIcon === key ? "2px solid #433ea9ff" : "1px solid #ccc",
                                        }}
                                        onClick={() => setEditIcon(key)}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                            <button
                                style={styles.ghostBtn}
                                onClick={() => {
                                    setEditOpen(false);
                                    setEditUsername(user.username); // reset
                                    setEditEmail(user.email);       // reset
                                    setEditIcon(user.icon);         // reset
                                }}
                            >
                                Vazgeç
                            </button>
                            <button style={styles.saveBtn} onClick={handleSave}>Kaydet</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

const styles = {
    badge: {
        display: "inline-block",
        padding: "4px 8px",
        fontSize: 12,
        borderRadius: 999,
        background: "rgba(100,108,255,0.25)",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "rgba(100,108,255,0.5)",
    },

    list: { marginTop: 10, paddingLeft: 20 },
    listItem: { marginBottom: 8, background: "#fff", padding: "8px 12px", borderRadius: 8, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" },

    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "16px",
    },

    postCard: {
        background: "#fff",
        borderRadius: 14,
        padding: "16px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        transition: "all 0.2s ease",
        cursor: "pointer",
    },
    postCardHover: {
        transform: "translateY(-4px)",
        boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
    },
    postTitle: {
        fontSize: 16,
        fontWeight: 600,
        color: "#222",
        margin: "4px 0",
    },
    postContent: {
        fontSize: 14,
        color: "#555",
        lineHeight: 1.4,
    },

    commentCard: {
        background: "#fff",
        borderRadius: 14,
        padding: "14px 16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        fontSize: 14,
        transition: "all 0.2s ease",
        cursor: "pointer",
    },

    commentContent: {
        fontSize: 14,
        color: "#444",
        marginBottom: 6,
    },
    commentDate: {
        fontSize: 12,
        color: "#888",
    },

    metaRow: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: 12,
        color: "#555",
        marginTop: "8px",
    },


    commentCardHover: {
        transform: "translateY(-3px)",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.27)",
    },


    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "16px",
        marginTop: "20px",
    },
    statCard: {
        background: "#fff",
        borderRadius: 12,
        padding: "16px",
        textAlign: "center",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        fontWeight: 600,
    },

    pageWrapper: {
        minHeight: "100vh",
        padding: 24,
        background:
            "radial-gradient(1000px 500px at 10% -10%, rgba(100,108,255,0.18), rgba(0,0,0,0)), radial-gradient(1000px 500px at 110% 110%, rgba(100,108,255,0.18), rgba(0,0,0,0))",
    },
    container: { maxWidth: 900, margin: "0 auto" },
    centerWrap: {
        minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center",
    },
    header: {
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16,
    },
    title: { margin: 0, fontSize: 22, fontWeight: 700 },
    subtitle: { margin: "4px 0 0 0", opacity: 0.8, fontSize: 14 },
    profileHeader: {
        display: "flex", alignItems: "center", gap: 14, marginBottom: 16,
    },
    avatarCircle: {
        width: 56, height: 56, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(100,108,255,0.15)", border: "1px solid rgba(100,108,255,0.45)",
        color: "#433ea9ff",
    },
    displayName: { fontSize: 18, fontWeight: 700 },
    displayEmail: { fontSize: 13, opacity: 0.8 },
    card: {
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 14, padding: 20, boxShadow: "0 8px 30px rgba(0,0,0,0.2)", backdropFilter: "blur(6px)",
    },
    infoRow: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 0", borderBottom: "1px dashed rgba(255,255,255,0.15)",
    },
    infoLabel: {
        display: "inline-flex", alignItems: "center", gap: 8,
        fontWeight: 600, opacity: 0.9,
    },
    infoValue: { opacity: 0.95 },
    infoValueMono: { opacity: 0.9, fontFamily: "ui-monospace, monospace" },
    iconPill: {
        width: 34, height: 34, borderRadius: 999,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: "rgba(100,108,255,0.15)", border: "1px solid rgba(100,108,255,0.45)",
        color: "#433ea9ff",
    },
    ghostBtn: {
        padding: "8px 12px", borderRadius: 10, borderWidth: 1, borderStyle: "solid",
        background: "transparent", cursor: "pointer",
    },
    saveBtn: {
        padding: "8px 12px", borderRadius: 10, border: "1px solid #433ea9ff",
        background: "linear-gradient(135deg, #646cff, #7a83ff)",
        color: "white", cursor: "pointer",
    },
    modalOverlay: {
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(2px)",
    },
    modalCard: {
        width: "100%", maxWidth: 420, background: "white", color: "#333",
        borderRadius: 12, padding: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        display: "flex", flexDirection: "column", gap: 14,
    },
    fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
    label: { fontSize: 13, fontWeight: 600 },
    input: {
        padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc",
    },
    iconGrid: {
        display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4,
    },
    iconButton: {
        background: "#f3f4f6", borderRadius: 8, padding: 8, cursor: "pointer",
    },
};
