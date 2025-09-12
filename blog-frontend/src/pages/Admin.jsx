import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify"
import { useTranslation } from "react-i18next";

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useTranslation();
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
  const SHOW_ADMIN_LIST = true;
  const [searchParams, setSearchParams] = useSearchParams();
  const initialAdminPage = parseInt(searchParams.get("page") || "1", 10);
  const [adminPageNumber, setAdminPageNumber] = useState(initialAdminPage);

  const [adminTotalPages, setAdminTotalPages] = useState(1);
  const [adminSortBy, setAdminSortBy] = useState("date");


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

  // ⬆ useState importlarının altına ekle
  // like ve comment sayıları için yardımcı fonksiyonlar
  const fetchLikeInfo = async (postId) => {
    try {
      const res = await api.get(`/PostLikes/${postId}`);
      if (Array.isArray(res.data)) return res.data.length;
      if (Array.isArray(res.data?.items)) return res.data.items.length;
      if (typeof res.data?.count === "number") return res.data.count;
      return 0;
    } catch {
      return 0;
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

  const loadAdminPosts = async (page = adminPageNumber) => {
    try {
      const res = await api.get(`/posts/paged?pageNumber=${page}&pageSize=6`);
      const raw = res.data.items || [];

      const visiblePosts = raw.filter(p => !p.isDeleted && !p.deletedAtUtc);

      const enriched = await enrichAdminPosts(visiblePosts);
      setPosts(enriched);
      setAdminTotalPages(res.data.totalPages);
      setAdminPageNumber(res.data.pageNumber);
    } catch (err) {
      console.error("Admin posts load error", err.response?.status, err.response?.data);
toast.error(t("toast.postsLoadFailed"));
    }
  };


  const enrichAdminPosts = async (rawPosts) => {
    return Promise.all(
      (rawPosts || []).map(async (p) => {
        const likeCount = await fetchLikeInfo(p.id);
        const commentCount = await fetchCommentCount(p.id);
        return { ...p, likeCount, commentCount };
      })
    );
  };


  const isAdmin = useMemo(() => getCurrentRoleFromToken().some(r => /admin/i.test(r)), []);

  const loadAdmins = async () => {
    try {
      setAdminsLoading(true);
      const res = await api.get("/users/admins");
      setAdmins(res.data || []);
    } catch (err) {
      console.error("Adminleri yükleme hatası:", err.response?.status, err.response?.data);
      setAdmins([]);
    } finally {
      setAdminsLoading(false);
    }
  };


  useEffect(() => {
    if (!isAdmin) {
      toast.error(t("toast.adminAccessDenied"));
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
        toast.error(t("toast.dataLoadFailed"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAdmin, navigate]);


  useEffect(() => {
    loadAdminPosts(adminPageNumber);
  }, [adminPageNumber]);




  const filteredPosts = useMemo(() => {
    const term = search.trim().toLowerCase();
    let filtered = (posts || []).filter(p =>
      term ? (p.title?.toLowerCase().includes(term) || p.content?.toLowerCase().includes(term)) : true
    );

    switch (adminSortBy) {
      case "likes":
        filtered.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
        break;
      case "views":
        filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        break;
      case "comments":
        filtered.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
        break;
      case "date":
      default:
        filtered.sort((a, b) => new Date(b.createdAtUtc || b.date || 0) - new Date(a.createdAtUtc || a.date || 0));
        break;
    }

    return filtered;
  }, [posts, search, adminSortBy]);


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
        await api.put(`/categories/${editingCat.id}`, { Name: catName.trim() });
        toast.success(t("toast.categoryUpdated"));
      } else {
        await api.post(`/categories`, { Name: catName.trim() });
        toast.success(t("toast.categoryAdded"));
      }
      const res = await api.get("/categories");
      setCategories(res.data || []);
      cancelEditCategory();
    } catch (err) {
toast.error(t("toast.categorySaveFailed"));
    } finally {
      setCatSaving(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!confirm("Kategoriyi silmek istediğine emin misin?")) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success(t("toast.categoryDeleted"));
    } catch (err) {
toast.error(t("toast.categoryDeleteFailed"));
    }
  };

  const deletePost = async (id) => {
    if (!confirm("Gönderiyi silmek istediğine emin misin?")) return;
    try {
      await api.delete(`/posts/${id}`);
      await loadAdminPosts(adminPageNumber);
      toast.success(t("toast.postDeleted"));
    } catch (err) {
      toast.error(t("toast.postDeleteFailed"));
    }
  };


  // --- ekle ---
  const isSuperAdmin = useMemo(() =>
    getCurrentRoleFromToken().some(r => r.toLowerCase() === "superadmin"), []
  );

  // --- promoteToAdmin fonksiyonunu güncelle ---
  const promoteToAdmin = async () => {
    if (!promoteUserId.trim()) {
      toast.warn(t("toast.userIdRequired"));
      return;
    }
    try {
      setPromoteSaving(true);
      await api.post(`/Auth/promote-to-admin/${promoteUserId.trim()}`);
      toast.success(t("toast.userPromoted"));
      setPromoteUserId("");
      await loadAdmins(); // listeyi yenile
    } catch (err) {
      toast.error(t("toast.userPromoteFailed"));
    } finally {
      setPromoteSaving(false);
    }
  };


  // --- yeni fonksiyon: admin silme ---
  const removeAdmin = async (id) => {
    if (!confirm("Bu kullanıcının adminliğini kaldırmak istediğinize emin misiniz?")) return;
    try {
      await api.delete(`/users/remove-admin/${id}`);
      toast.success(t("toast.adminRemoved"));
      setAdmins(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      toast.error(t("toast.adminRemoveFailed"));
    }
  };



  const logout = () => {
    localStorage.removeItem("token");
    setSearchParams({ page: "1" }); // admin sayfasını sıfırla
    toast.info(t("toast.loggedOut"));
    navigate("/login");
  };


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
            <h2 style={styles.title}>{t("adminPanel")}</h2>
            <p style={styles.subtitle}>{t("adminSubtitle")}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...styles.ghostBtn, borderColor: "rgba(255, 77, 80, 1)", color: "#f30000ff" }} onClick={() => navigate("/posts")}>{t("back")}</button>
          </div>
        </header>

        <section style={styles.blockCard}>
          <div style={styles.blockHeader}>
            <h3 style={{ margin: 0 }}>{t("categories")}</h3>
          </div>
          <form onSubmit={saveCategory} style={styles.toolbar}>
            <input style={styles.input} placeholder={t("categoryName")} value={catName} onChange={(e) => setCatName(e.target.value)} />
            <button style={{ ...styles.primaryBtn, ...(catSaving ? styles.buttonDisabled : {}) }} disabled={catSaving}>{editingCat ? t("update") : t("add")}</button>
            {editingCat && <button type="button" style={styles.ghostBtn} onClick={cancelEditCategory}>{t("cancel")}</button>}
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
                    <button style={styles.ghostBtn} onClick={() => startEditCategory(c)}>{t("edit")}</button>
                    <button style={{ ...styles.ghostBtn, color: "#ff6b6b", borderColor: "rgba(255,77,79,0.45)" }} onClick={() => deleteCategory(c.id)}>{t("delete")}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.blockCard}>
          <div style={styles.blockHeader}>
            <h3 style={{ margin: 0 }}>{t("posts")}</h3>
          </div>
          <div style={styles.toolbar}>
            <input
              style={styles.input}
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              value={adminSortBy}
              onChange={(e) => setAdminSortBy(e.target.value)}
              style={styles.input}
            >
              <option value="date">{t("sortByDate")}</option>
              <option value="likes">{t("sortByLikes")}</option>
              <option value="views">{t("sortByViews")}</option>
              <option value="comments">{t("sortByComments")}</option>
            </select>
          </div>
          {(filteredPosts || []).length === 0 ? (
            <div style={styles.emptyBox}>{t("noPosts")}</div>
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
                      {expandedPosts[p.id] ? t("readLess") : t("readMore")}
                    </button>
                  )}
                  <div style={styles.cardFooter}>
                    <button
                      style={styles.ghostBtn}
                      onClick={async () => {
                        try {
                          // Backend'den page number al
                          const res = await api.get(`/posts/${p.id}/pageNumber?pageSize=6`);
                          const pageNum = res.data.pageNumber || 1;

                          // Posts sayfasına highlight ile yönlendir
                          navigate(`/posts?page=${pageNum}&highlight=${p.id}`);
                        } catch (err) {
                          console.error("Sayfa numarası alınamadı:", err);
                          toast.error(t("postOpenFailed"));
                          // fallback: en azından highlight çalışsın
                          navigate(`/posts?highlight=${p.id}`);
                        }
                      }}
                    >
                      {t("view")}
                    </button>
                    <button
                      style={{
                        ...styles.ghostBtn,
                        borderColor: "rgba(255,77,79,0.45)",
                        color: "#ff6b6b",
                      }}
                      onClick={() => deletePost(p.id)}
                    >
                      {t("delete")}
                    </button>
                  </div>

                </article>
              ))}
            </div>
          )}
          {adminTotalPages > 1 && (
            <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 12 }}>
              <button
                style={styles.ghostBtn}
                disabled={adminPageNumber === 1}
                onClick={() => {
                  const newPage = adminPageNumber - 1;
                  setAdminPageNumber(newPage);
                  setSearchParams({ page: newPage.toString() });
                }}

              >
                {t("previous")}
              </button>

              <span style={{ alignSelf: "center" }}>
                {adminPageNumber} / {adminTotalPages}
              </span>

              <button
                style={styles.ghostBtn}
                disabled={adminPageNumber === adminTotalPages}
                onClick={() => {
                  const newPage = adminPageNumber + 1;
                  setAdminPageNumber(newPage);
                  setSearchParams({ page: newPage.toString() });
                }}

              >
                {t("next")}
              </button>
            </div>
          )}

        </section>

        {/* Yeni Admin Ekle (sadece SuperAdmin görsün) */}
        {isSuperAdmin && (
          <section style={styles.blockCard}>
            <div style={styles.blockHeader}>
              <h3 style={{ margin: 0 }}>{t("newAdmin")}</h3>
            </div>
            <div style={styles.toolbar}>
              <input style={styles.input} placeholder={t("userId")} value={promoteUserId} onChange={(e) => setPromoteUserId(e.target.value)} />
              <button style={{ ...styles.primaryBtn, ...(promoteSaving ? styles.buttonDisabled : {}) }} disabled={promoteSaving} onClick={promoteToAdmin}>{t("makeAdmin")}</button>
            </div>
          </section>
        )}

        {/* Mevcut Adminler (sadece SuperAdmin görsün) */}
        {isSuperAdmin && SHOW_ADMIN_LIST && (
          <section style={styles.blockCard}>
            <div style={styles.blockHeader}>
              <h3 style={{ margin: 0 }}>{t("currentAdmins")}</h3>
            </div>
            {adminsLoading ? (
              <div style={styles.emptyBox}>{t("loadingAdmins")}</div>
            ) : admins.length === 0 ? (
              <div style={styles.emptyBox}>{t("noAdmins")}</div>
            ) : (
              <div style={styles.adminGrid}>
                {admins.map((a) => (
                  <div key={a.id} style={styles.adminCard}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {a.avatar ? (
                          <img src={a.avatar} alt={a.username} style={styles.adminAvatarImg} />
                        ) : (
                          <div style={styles.adminAvatar}>
                            {a.username
                              ? a.username.charAt(0).toUpperCase()
                              : (a.email ? a.email.charAt(0).toUpperCase() : "•")}
                          </div>
                        )}
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <strong>{a.username}</strong>
                          <span style={{ fontSize: 12, opacity: 0.8 }}>{a.email}</span>
                        </div>
                      </div>
                      <button
                        style={{ ...styles.ghostBtn, color: "#ff6b6b", borderColor: "rgba(255,77,79,0.45)" }}
                        onClick={() => removeAdmin(a.id)}
                      >
                        {t("removeAdmin")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    padding: 24,
    background:
      "radial-gradient(1000px 500px at 10% -10%, rgba(100, 108, 255, 0.32), rgba(61, 51, 51, 0)), radial-gradient(1000px 500px at 110% 110%, rgba(242, 100, 255, 0.18), rgba(0,0,0,0))",
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
    wordBreak: "break-word",
    overflowWrap: "break-word",
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
