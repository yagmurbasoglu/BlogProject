import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState("");
  const [editingCat, setEditingCat] = useState(null);
  const [catName, setCatName] = useState("");
  const [catSaving, setCatSaving] = useState(false);

  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedPosts, setExpandedPosts] = useState({});

  const [promoteUserId, setPromoteUserId] = useState("");
  const [promoteSaving, setPromoteSaving] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const SHOW_ADMIN_LIST = false;

  const getCurrentRoleFromToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return [];
      const raw = token.replace(/^\"|\"$/g, "");
      const payloadPart = raw.split(".")[1];
      if (!payloadPart) return [];
      const json = JSON.parse(atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/")));
      const roles = json["role"] || json["roles"] || json["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || [];
      if (Array.isArray(roles)) return roles.map(String);
      if (typeof roles === "string") return [roles];
      return [];
    } catch {
      return [];
    }
  };

  const isAdmin = useMemo(() => getCurrentRoleFromToken().some(r => /admin/i.test(r)), []);

  const loadAdmins = async () => {
    try {
      setAdminsLoading(true);
      // kept for future use; currently not called because SHOW_ADMIN_LIST=false
      const tryEndpoints = [
        "/Auth/admins",
        "/Auth/GetAdmins",
        "/Auth/get-admins",
        "/Auth/admin-users",
        "/auth/admins",
        "/auth/get-admins",
        "/Users/admins",
        "/users/admins",
        "/Auth/users",
        "/Users",
        "/users",
        "/users?role=admin",
      ];
      let data = [];
      for (const ep of tryEndpoints) {
        try {
          const res = await api.get(ep);
          if (res?.data) { data = res.data; break; }
        } catch {
        }
      }
      const arr = Array.isArray(data) ? data : [];
      const filtered = arr.filter((u) => {
        const roles = (u.userRoles || u.UserRoles || u.roles || u.role || []);
        let list = [];
        if (Array.isArray(roles)) list = roles;
        else if (typeof roles === "string") list = roles.split(/[;,\s]+/g);
        else if (typeof roles === "object" && roles) list = Object.values(roles);
        return list.map((r)=>String(r).toLowerCase()).includes("admin");
      });
      const normalized = (filtered || []).map(u => ({
        id: u.id || u.userId || u.Id || u.UserId || u.guid || "",
        username: u.userName || u.username || u.name || u.fullName || u.email || u.Email || "",
        email: u.email || u.Email || "",
        avatar: u.profileImage || u.profilePicture || u.avatar || null,
      }));
      setAdmins(normalized);
    } finally {
      setAdminsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      alert("Bu sayfaya erişim için yönetici yetkisi gerekir.");
      navigate("/posts");
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const [catsRes, postsRes] = await Promise.all([
          api.get("/categories"),
          api.get("/posts"),
        ]);
        setCategories(catsRes.data || []);
        setPosts(postsRes.data || []);
        if (SHOW_ADMIN_LIST) {
          await loadAdmins();
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Admin load error", err.response?.status, err.response?.data);
        setError("Veriler yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAdmin, navigate]);

  const filteredPosts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (posts || []).filter(p => term ? (p.title?.toLowerCase().includes(term) || p.content?.toLowerCase().includes(term)) : true);
  }, [posts, search]);

  const categoryCounts = useMemo(() => {
    const map = {};
    (posts || []).forEach(p => {
      const key = String(p.categoryId ?? "");
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [posts]);

  const startEditCategory = (c) => {
    setEditingCat(c);
    setCatName(c?.name || "");
  };

  const cancelEditCategory = () => {
    setEditingCat(null);
    setCatName("");
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      setCatSaving(true);
      if (editingCat?.id) {
        await api.put(`/categories/${editingCat.id}`, { name: catName.trim() });
      } else {
        await api.post(`/categories`, { name: catName.trim() });
      }
      const res = await api.get("/categories");
      setCategories(res.data || []);
      cancelEditCategory();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Save category error", err.response?.status, err.response?.data);
      alert("Kategori kaydedilemedi.");
    } finally {
      setCatSaving(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!confirm("Kategoriyi silmek istediğine emin misin?")) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Delete category error", err.response?.status, err.response?.data);
      alert("Kategori silinemedi.");
    }
  };

  const deletePost = async (id) => {
    if (!confirm("Gönderiyi silmek istediğine emin misin?")) return;
    try {
      await api.delete(`/posts/${id}`);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Delete post error", err.response?.status, err.response?.data);
      alert("Gönderi silinemedi.");
    }
  };

  const promoteToAdmin = async () => {
    if (!promoteUserId.trim()) return;
    try {
      setPromoteSaving(true);
      await api.post(`/Auth/promote-to-admin/${promoteUserId.trim()}`);
      alert("Kullanıcı admin yapıldı.");
      setPromoteUserId("");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Promote admin error", err.response?.status, err.response?.data);
      alert("Kullanıcı admin yapılamadı.");
    } finally {
      setPromoteSaving(false);
    }
  };

  const logout = () => { localStorage.removeItem("token"); navigate("/login"); };

  const truncateContent = (content, maxLength = 150) => {
    if (!content || content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + "...";
  };

  const togglePostExpansion = (postId) => {
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  if (loading) return <div style={styles.centerWrap}><p>Yükleniyor...</p></div>;
  if (error) return <div style={styles.centerWrap}><p style={{ color: "#ff6b6b" }}>{error}</p></div>;

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h2 style={styles.title}>Yönetim Paneli</h2>
            <p style={styles.subtitle}>Kategorileri ve gönderileri yönet, kullanıcıları admin yap.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={styles.ghostBtn} onClick={() => navigate("/posts")}>Geri</button>
            <button style={{...styles.ghostBtn, borderColor: "rgba(255,77,79,0.45)", color: "#ff6b6b"}} onClick={logout}>Çıkış</button>
          </div>
        </header>

        <section style={styles.blockCard}>
          <div style={styles.blockHeader}>
            <h3 style={{ margin: 0 }}>Kategoriler</h3>
          </div>
          <form onSubmit={saveCategory} style={styles.toolbar}>
            <input style={styles.input} placeholder="Kategori adı" value={catName} onChange={(e)=>setCatName(e.target.value)} />
            <button style={{...styles.primaryBtn, ...(catSaving ? styles.buttonDisabled : {})}} disabled={catSaving}>{editingCat ? "Güncelle" : "Ekle"}</button>
            {editingCat && <button type="button" style={styles.ghostBtn} onClick={cancelEditCategory}>Vazgeç</button>}
          </form>
          <div style={styles.categoriesGrid}>
            {categories.map(c => (
              <div key={c.id} style={styles.categoryCard}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={styles.catAvatar}>{String(c.name || "?").charAt(0).toUpperCase()}</span>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <strong style={{ margin: 0 }}>{c.name}</strong>
                      <span style={{ fontSize: 12, opacity: 0.8 }}>{categoryCounts[String(c.id)] || 0} gönderi</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={styles.ghostBtn} onClick={()=>startEditCategory(c)}>Düzenle</button>
                    <button style={{...styles.ghostBtn, color: "#ff6b6b", borderColor: "rgba(255,77,79,0.45)"}} onClick={()=>deleteCategory(c.id)}>Sil</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.blockCard}>
          <div style={styles.blockHeader}>
            <h3 style={{ margin: 0 }}>Gönderiler</h3>
          </div>
          <div style={styles.toolbar}>
            <input style={styles.input} placeholder="Ara: başlık veya içerik" value={search} onChange={(e)=>setSearch(e.target.value)} />
          </div>
          {(filteredPosts || []).length === 0 ? (
            <div style={styles.emptyBox}>Gönderi bulunamadı.</div>
          ) : (
            <div style={styles.grid}>
              {filteredPosts.map(p => (
                <article key={p.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={styles.badge}>Post</span>
                  </div>
                  <h3 style={styles.postTitle}>{p.title}</h3>
                  <p style={styles.postContent}>{expandedPosts[p.id] ? p.content : truncateContent(p.content)}</p>
                  {p.content && p.content.length > 150 && (
                    <button
                      style={styles.readMoreBtn}
                      onClick={() => togglePostExpansion(p.id)}
                    >
                      {expandedPosts[p.id] ? "Daha az göster" : "Devamını oku"}
                    </button>
                  )}
                  <div style={styles.cardFooter}>
                    <button style={styles.ghostBtn} onClick={()=>navigate("/posts")}>Görüntüle</button>
                    <button style={{...styles.ghostBtn, borderColor: "rgba(255,77,79,0.45)", color: "#ff6b6b"}} onClick={()=>deletePost(p.id)}>Sil</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section style={styles.blockCard}>
          <div style={styles.blockHeader}>
            <h3 style={{ margin: 0 }}>Yeni Admin Ekle</h3>
          </div>
          <div style={styles.toolbar}>
            <input style={styles.input} placeholder="Kullanıcı ID (GUID)" value={promoteUserId} onChange={(e)=>setPromoteUserId(e.target.value)} />
            <button style={{...styles.primaryBtn, ...(promoteSaving ? styles.buttonDisabled : {})}} disabled={promoteSaving} onClick={promoteToAdmin}>Admin Yap</button>
          </div>
        </section>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    padding: 24,
    background:
      "radial-gradient(1000px 500px at 10% -10%, rgba(100,108,255,0.18), rgba(0,0,0,0)), radial-gradient(1000px 500px at 110% 110%, rgba(100,108,255,0.18), rgba(0,0,0,0))",
  },
  container: { maxWidth: 1100, margin: "0 auto" },
  centerWrap: { minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  title: { margin: 0 },
  subtitle: { margin: 0, opacity: 0.85, fontSize: 14 },
  toolbar: { marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" },
  input: {
    padding: "12px 14px",
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.25)",
    color: "inherit",
    flex: 1,
  },
  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#646cff",
    background: "linear-gradient(135deg, #646cff, #7a83ff)",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
  },
  ghostBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,0.18)",
    background: "transparent",
    color: "inherit",
    cursor: "pointer",
  },
  buttonDisabled: { opacity: 0.7, cursor: "not-allowed" },
  blockCard: {
    marginTop: 16,
    background: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
    backdropFilter: "blur(6px)",
  },
  blockHeader: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  categoriesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginTop: 8 },
  categoryCard: {
    background: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: 12,
    boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
    backdropFilter: "blur(4px)",
  },
  catAvatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
    background: "rgba(100,108,255,0.25)",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(100,108,255,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },
  grid: { marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 },
  card: {
    background: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
    backdropFilter: "blur(6px)",
  },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
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
  postTitle: { margin: "10px 0 6px 0" },
  postContent: { margin: 0, opacity: 0.9, whiteSpace: "pre-wrap" },
  readMoreBtn: {
    marginTop: 8,
    padding: "6px 12px",
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    cursor: "pointer",
  },
  cardFooter: { marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 8 },
  emptyBox: {
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.25)",
    textAlign: "center",
    opacity: 0.9,
  },
  adminGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 },
  adminCard: {
    background: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: 12,
    boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
    backdropFilter: "blur(4px)",
  },
  adminAvatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    background: "rgba(100,108,255,0.25)",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(100,108,255,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },
  adminAvatarImg: { width: 36, height: 36, borderRadius: 999, objectFit: "cover" },
};
