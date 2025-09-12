import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow, format } from "date-fns";
import { enUS, tr } from "date-fns/locale";

export default function Posts() {
  const { t, i18n } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [search, setSearch] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const navigate = useNavigate();
  const [usePascalCase, setUsePascalCase] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPost, setDetailPost] = useState(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsPost, setCommentsPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [commentCounts, setCommentCounts] = useState({});
  const [authors, setAuthors] = useState({});
  const [expandedPosts, setExpandedPosts] = useState({});
  const [hoveredCard, setHoveredCard] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [editingCommentSaving, setEditingCommentSaving] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight") || "";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const [pageNumber, setPageNumber] = useState(initialPage);

  const [totalPages, setTotalPages] = useState(1);
  const [commentPageNumber, setCommentPageNumber] = useState(1);
  const [commentTotalPages, setCommentTotalPages] = useState(1);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setSearchParams({ page: "1" }); // çıkışta sıfırla
    navigate("/login");
    toast.info(t("toast.loggedOut"));

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
    } catch (_) {
      return "";
    }
  };

  const getRolesFromToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return [];
      const raw = token.replace(/^\"|\"$/g, "");
      const payloadPart = raw.split(".")[1];
      if (!payloadPart) return [];
      const json = JSON.parse(atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/")));
      let claim = (
        json["userRoles"] ||
        json["UserRoles"] ||
        json["roles"] ||
        json["role"] ||
        json["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
        []
      );
      let arr = [];
      if (Array.isArray(claim)) arr = claim;
      else if (typeof claim === "string") arr = claim.split(/[;,\s]+/g);
      else if (typeof claim === "object" && claim != null) arr = Object.values(claim);
      return arr.map((r) => String(r).trim().toLowerCase()).filter(Boolean);
    } catch (_) {
      return [];
    }
  };

  useEffect(() => {
    const roles = getRolesFromToken();
    setIsAdmin(roles.some(r => /admin/i.test(r)));
  }, []);

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
      return { count: undefined, liked: undefined };
    }
  };

  const enrichPosts = async (rawPosts) => {
    try {
      const results = await Promise.all(
        (rawPosts || []).map(async (p) => {
          const info = await fetchLikeInfo(p.id);
          return {
            ...p,
            likeCount: info.count ?? p.likeCount ?? 0,
            likedByCurrentUser: info.liked ?? p.likedByCurrentUser ?? false,
          };
        })
      );
      return results;
    } catch {
      return rawPosts || [];
    }
  };

  const fetchCommentCounts = async (posts) => {
    try {
      const counts = {};
      await Promise.all(
        posts.map(async (post) => {
          try {
            const res = await api.get(`/Comments/${post.id}`);
            const count = Array.isArray(res.data) ? res.data.length : (Array.isArray(res.data?.items) ? res.data.items.length : (typeof res.data?.count === "number" ? res.data.count : 0));
            counts[String(post.id)] = count;
          } catch {
            counts[String(post.id)] = 0;
          }
        })
      );
      setCommentCounts(counts);
    } catch {
    }
  };

  const fetchAuthors = async (posts) => {
    try {
      const map = {};
      await Promise.all(
        (posts || []).map(async (p) => {
          const key = p && p.authorId ? String(p.authorId) : "";
          if (!key) return;

          try {
            const res = await api.get(`/users/${key}`);
            const user = res.data;

            map[key] = {
              username: user.displayName || user.userName || "Bilinmeyen Kullanıcı",
              profileImage: user.profileImage || null,
            };
          } catch {
            map[key] = { username: "Bilinmeyen Kullanıcı", profileImage: null };
          }
        })
      );
      setAuthors(map);
    } catch (_) { }
  };

  const loadPosts = async (page = pageNumber, silent = false) => {
    try {
      if (!silent) setLoading(true); // sadece silent=false iken loading aç
      setError("");

      const [postsRes, catsRes] = await Promise.all([
        api.get(`/posts/paged?pageNumber=${page}&pageSize=6`),
        api.get("/categories"),
      ]);

      const basePosts = (postsRes.data.items || []).filter(
        (p) => !p.isDeleted && !p.deletedAtUtc
      );

      setTotalPages(postsRes.data.totalPages);
      setPageNumber(postsRes.data.pageNumber);

      setCategories(catsRes.data || []);
      const decodedId = getCurrentUserIdFromToken();
      if (decodedId) setCurrentUserId(String(decodedId));
      if ((catsRes.data || []).length > 0) {
        setCategoryId(String(catsRes.data[0].id));
      }

      const enriched = await enrichPosts(basePosts);
      await fetchCommentCounts(enriched);
      await fetchAuthors(enriched);
      setPosts(enriched);
    } catch (err) {
      console.error("Posts load error", err.response?.status, err.response?.data);
      setError("Veriler yüklenemedi");
      toast.error(t("toast.postsLoadFailed"));

    } finally {
      if (!silent) setLoading(false);
    }
  };

  const locales = {
    en: enUS,
    tr: tr,
  };

  const findDateField = (post) => {
    const dateFields = [
      'date', 'Date',
      'createdAtUtc', 'CreatedAtUtc',
      'updatedAtUtc', 'UpdatedAtUtc',
      'createdAt', 'createdDate', 'dateCreated',
      'created_at', 'created',
      'publishDate', 'publish_date'
    ];

    for (const field of dateFields) {
      const value = post?.[field];
      if (value) {
        return value;
      }
    }
    return null;
  };


  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      let date = new Date(dateString);

      // UTC → Local düzeltme (+3 Türkiye)
      date = new Date(date.getTime() + 3 * 60 * 60 * 1000);

      const locale = locales[i18n.language] || enUS;

      // 1 günden eskiyse tam tarih göster, yeniyse "5 minutes ago" gibi
      const diffMs = Date.now() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays < 7) {
        return formatDistanceToNow(date, { addSuffix: true, locale });
      }

      return format(date, "dd MMMM yyyy", { locale });
    } catch {
      return "";
    }
  };



  const truncateContent = (content, maxLength = 150) => {
    if (!content || content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + "...";
  };

  const togglePostExpansion = (postId) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const filteredPosts = useMemo(() => {
    const term = search.trim().toLowerCase();
    let filtered = posts
      .filter((p) =>
        selectedCategoryId === "all" ? true : String(p.categoryId) === String(selectedCategoryId)
      )
      .filter((p) =>
        term ? (p.title?.toLowerCase().includes(term) || p.content?.toLowerCase().includes(term)) : true
      );


    switch (sortBy) {
      case "likes":
        filtered.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
        break;
      case "views":
        filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        break;
      case "comments":
        filtered.sort((a, b) => (commentCounts[String(b.id)] || 0) - (commentCounts[String(a.id)] || 0));
        break;
      case "date":
      default:
        filtered.sort((a, b) => {
          const aDate = new Date(findDateField(a) || 0);
          const bDate = new Date(findDateField(b) || 0);
          return bDate - aDate; // yeni → eski
        });
        break;
    }

    return filtered;
  }, [posts, selectedCategoryId, search, sortBy]);

  useEffect(() => {
    loadPosts(pageNumber);
  }, [pageNumber]);


  useEffect(() => {
    if (commentsOpen && commentsPost) {
      api.get(`/Comments/${commentsPost.id}/paged?pageNumber=${commentPageNumber}&pageSize=5`)
        .then(res => {
          setComments((res.data.items || []).filter(c => !c.isDeleted && !c.deletedAtUtc));

          setCommentTotalPages(res.data.totalPages);
          setCommentPageNumber(res.data.pageNumber);
        })
        .catch(() => setComments([]));
    }
  }, [commentPageNumber, commentsOpen, commentsPost]);

  useEffect(() => {
    if (!highlightId) return;


    const el = document.querySelector(`[data-post-id="${highlightId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // İstersen 3 sn sonra query’i temizle
    const t = setTimeout(() => {
      const sp = new URLSearchParams(searchParams);
      sp.delete("highlight");
      setSearchParams(sp, { replace: true });
    }, 3000);

    return () => clearTimeout(t);
  }, [highlightId, filteredPosts, searchParams, setSearchParams]);


  const openCreate = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.warn(t("toast.mustLoginToPost"));

      navigate("/login");
      return;
    }
    setEditingPost(null);
    setTitle("");
    setContent("");
    setCategoryId(categories[0] ? String(categories[0].id) : "");
    setFormError("");
    setFormOpen(true);
  };

  const openDetail = async (post) => {
    try {
      setDetailOpen(true);
      // Backend .NET tarafında GetPostById çağrısı viewCount++ yapıyor
      const detail = await api.get(`/posts/${post.id}`);
      const updatedPost = detail.data || post;
      setDetailPost(updatedPost);
      // Listeyi de aynı veriye senkronla
      setPosts((prev) => prev.map(p => String(p.id) === String(updatedPost.id) ? updatedPost : p));
    } catch (err) {
      console.error("Open detail error:", err.response?.status, err.response?.data);
      toast.error(t("toast.postDetailFailed"));

    }
  };

  const openEdit = (post) => {
    setEditingPost(post);
    setTitle(post.title || "");
    setContent(post.content || "");
    setCategoryId(String(post.categoryId || ""));
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !categoryId) return;
    try {
      setSaving(true);
      setFormError("");

      const payloadPascal = { Title: title.trim(), Content: content.trim(), CategoryId: String(categoryId) };
      const send = async (payload) => {
        if (editingPost?.id) {
          return api.put(`/posts/${editingPost.id}`, payload);
        }
        return api.post("/posts", payload);
      };

      await send(payloadPascal);

      setFormOpen(false);
      await loadPosts(pageNumber, true); // silent reload


      toast.success(editingPost ? t("toast.postUpdated") : t("toast.postSaved"));

    } catch (err) {
      console.error("Save post error:", err.response?.status, err.response?.data);
      let backendMessage =
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message || "Gönderi kaydedilemedi.";
      setFormError(backendMessage);


      toast.error(backendMessage || t("toast.postSaveFailed"));
    } finally {
      setSaving(false);
    }
  };


  const handleDelete = async (postId) => {
    if (!confirm("Bu gönderiyi silmek istediğine emin misin?")) return;
    try {
      await api.delete(`/posts/${postId}`);
      await loadPosts(pageNumber, true); // silent reload

      toast.success(t("toast.postDeleted"));
    } catch (err) {
      console.error("Delete post error:", err.response?.status, err.response?.data);

      let backendMessage =
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message || err.response?.data?.title || err.response?.data?.error;

      if (!backendMessage) {
        backendMessage = "Gönderi silinemedi ❌";
      }

      toast.error(backendMessage || t("toast.postDeleteFailed"));
    }
  };


  const handleToggleLike = async (post) => {
    try {
      // Get current like status first
      const likedRes = await api.get(`/PostLikes/${post.id}/isLiked`).catch((e) => ({ data: false }));
      const currentlyLiked = Boolean(likedRes.data === true || likedRes.data?.isLiked === true);

      if (currentlyLiked) {
        // Unlike the post
        await api.post(`/PostLikes/unlike`, { postId: String(post.id) });
      } else {
        // Like the post
        await api.post(`/PostLikes/like`, { postId: String(post.id) });
      }

      // Update the post's like state immediately for better UX
      setPosts(prev => prev.map(p => String(p.id) === String(post.id)
        ? {
          ...p,
          likedByCurrentUser: !currentlyLiked,
          likeCount: currentlyLiked ? (p.likeCount || 1) - 1 : (p.likeCount || 0) + 1
        }
        : p));

      // Fetch updated like info from server
      const [likesAfter, likedAfter] = await Promise.all([
        api.get(`/PostLikes/${post.id}`).catch((e) => ({ data: [] })),
        api.get(`/PostLikes/${post.id}/isLiked`).catch((e) => ({ data: false })),
      ]);

      let count = 0;
      const d = likesAfter.data;
      if (Array.isArray(d)) count = d.length;
      else if (Array.isArray(d?.items)) count = d.items.length;
      else if (typeof d?.count === "number") count = d.count;

      const liked = Boolean(likedAfter.data === true || likedAfter.data?.isLiked === true);

      // Update with server data
      setPosts(prev => prev.map(p => String(p.id) === String(post.id)
        ? { ...p, likeCount: count, likedByCurrentUser: liked }
        : p));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Toggle like error:", err.response?.status, err.response?.data);
      toast.error(t("toast.likeFailed"));

    }
  };

  const openComments = async (post) => {
    try {
      setCommentsOpen(true);
      setCommentsPost(post);
      setCommentText("");
      setCommentError("");
      setEditingCommentId(null);
      setEditingCommentText("");
      const res = await api.get(`/Comments/${post.id}/paged?pageNumber=${commentPageNumber}&pageSize=5`);
      setComments((res.data.items || []).filter(c => !c.isDeleted && !c.deletedAtUtc));

      setCommentTotalPages(res.data.totalPages);
      setCommentPageNumber(res.data.pageNumber);
      const count = Array.isArray(res.data) ? res.data.length : (Array.isArray(res.data?.items) ? res.data.items.length : (typeof res.data?.count === "number" ? res.data.count : 0));
      setCommentCounts((prev) => ({ ...prev, [String(post.id)]: count }));
    } catch (err) {
      console.error("Load comments error:", err.response?.status, err.response?.data);
      setComments([]);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !commentsPost) return;
    try {
      setCommentSaving(true);
      setCommentError("");

      // 1) Yorum ekle
      await api.post(`/Comments`, {
        postId: String(commentsPost.id),
        authorId: currentUserId,
        content: commentText.trim()
      });

      // 2) Güncel listeyi paged endpoint’ten çek
      const res = await api.get(
        `/Comments/${commentsPost.id}/paged?pageNumber=1&pageSize=5`
      );

      // 3) Listeyi güncelle
      setComments((res.data.items || []).filter(c => !c.isDeleted && !c.deletedAtUtc));
      setCommentTotalPages(res.data.totalPages);
      setCommentPageNumber(res.data.pageNumber);

      // 4) Count güncelle
      const count = res.data.totalCount ?? res.data.items?.length ?? 0;
      setCommentCounts((prev) => ({ ...prev, [String(commentsPost.id)]: count }));

      setCommentText("");
      toast.success(t("toast.commentAdded"));
    } catch (err) {
      console.error("Add comment error:", err.response?.status, err.response?.data);
      const backendMessage = typeof err.response?.data === "string"
        ? err.response.data
        : (err.response?.data?.message || "Yorum eklenemedi.");
      setCommentError(backendMessage);
      toast.error(backendMessage || t("toast.commentAddFailed"));
    } finally {
      setCommentSaving(false);
    }
  };


  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/Comments/${commentId}`);

      if (commentsPost) {
        // paged endpoint ile güncel listeyi çek
        const res = await api.get(
          `/Comments/${commentsPost.id}/paged?pageNumber=1&pageSize=5`
        );

        setComments((res.data.items || []).filter(c => !c.isDeleted && !c.deletedAtUtc));
        setCommentTotalPages(res.data.totalPages);
        setCommentPageNumber(res.data.pageNumber);

        // Count güncelle
        const count = res.data.totalCount ?? res.data.items?.length ?? 0;
        setCommentCounts((prev) => ({ ...prev, [String(commentsPost.id)]: count }));
      }

      toast.success(t("toast.commentDeleted"));
    } catch (err) {
      console.error("Delete comment error:", err.response?.status, err.response?.data);

      let backendMessage =
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message || err.response?.data?.title || err.response?.data?.error;

      toast.error(backendMessage || t("toast.commentDeleteFailed"));
    }
  };



  const startEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content || comment.text || "");
    setCommentError("");
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const handleUpdateComment = async () => {
    if (!editingCommentId || !editingCommentText.trim()) return;
    try {
      setEditingCommentSaving(true);
      setCommentError("");

      // 1) Yorum güncelle
      await api.put(`/Comments/${editingCommentId}`, { content: editingCommentText.trim() });

      // 2) Güncel listeyi paged endpoint’ten çek
      const res = await api.get(
        `/Comments/${commentsPost.id}/paged?pageNumber=1&pageSize=5`
      );

      // 3) Listeyi güncelle
      setComments((res.data.items || []).filter(c => !c.isDeleted && !c.deletedAtUtc));
      setCommentTotalPages(res.data.totalPages);
      setCommentPageNumber(res.data.pageNumber);

      // 4) Count güncelle
      const count = res.data.totalCount ?? res.data.items?.length ?? 0;
      setCommentCounts((prev) => ({ ...prev, [String(commentsPost.id)]: count }));

      setEditingCommentId(null);
      setEditingCommentText("");

      toast.success(t("toast.commentUpdated"));
    } catch (err) {
      console.error("Update comment error:", err.response?.status, err.response?.data);

      let backendMessage =
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message || err.response?.data?.title || err.response?.data?.error;

      if (!backendMessage) {
        backendMessage = "Yorum güncellenemedi ❌";
      }

      setCommentError(backendMessage);
      toast.error(backendMessage || t("toast.commentUpdateFailed"));
    } finally {
      setEditingCommentSaving(false);
    }
  };



  if (loading) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.container}>
          <header style={styles.header}>
            <div>
              <div className="skeleton" style={{ width: 200, height: 24, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 300, height: 16 }} />
            </div>
            <div className="skeleton" style={{ width: 120, height: 40, borderRadius: 10 }} />
          </header>

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <div className="skeleton" style={{ width: 180, height: 40, borderRadius: 10 }} />
            <div className="skeleton" style={{ width: 180, height: 40, borderRadius: 10 }} />
            <div className="skeleton" style={{ flex: 1, height: 40, borderRadius: 10 }} />
          </div>

          <div style={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 180 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div style={styles.centerWrap}><p style={{ color: "#ff6b6b" }}>{error}</p></div>;

  return (
    <>
      <div style={styles.pageWrapper}>
        <div style={styles.container}>
          <header style={styles.header}>
            <div>
              <h2 style={styles.title}>{t("postsPageTitle")}</h2>
              <p style={styles.subtitle}>{t("postsPageSubtitle")}</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={styles.primaryBtn} onClick={openCreate}>{t("newPost")}</button>
            </div>
          </header>


          <div style={styles.toolbar}>
            <div style={styles.selectWrap}>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                style={styles.select}
              >
                <option value="all">{t("all")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={styles.selectWrap}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={styles.select}
              >
                <option value="date">{t("sortByDate")}</option>
                <option value="likes">{t("sortByLikes")}</option>
                <option value="views">{t("sortByViews")}</option>
                <option value="comments">{t("sortByComments")}</option>
              </select>
            </div>

            <input
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.search}
            />
          </div>

          {filteredPosts.length === 0 ? (
            <div style={styles.emptyBox}>{t("postNotFound")}</div>
          ) : (
            <div style={styles.grid}>
              {filteredPosts.map((post) => {
                const isOwner = currentUserId && String(post.authorId) === String(currentUserId);
                const likeCount = post.likeCount ?? 0;
                const userLiked = Boolean(post.likedByCurrentUser);

                return (
                  <article
                    key={post.id}
                    data-post-id={post.id}
                    style={{
                      ...styles.card,
                      ...(String(post.id) === String(highlightId) ? styles.highlightCard : {}),
                      ...(hoveredCard === post.id ? styles.cardHover : {})
                    }}
                    onClick={() => openDetail(post)}
                    onMouseEnter={() => setHoveredCard(post.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div style={styles.cardHeader}>
                      <div style={styles.authorInfo}>
                        <div style={styles.authorAvatar}>
                          {authors[String(post.authorId)]?.profileImage ? (
                            <img
                              src={authors[String(post.authorId)].profileImage}
                              alt="Profil"
                              style={styles.avatarImage}
                            />
                          ) : (
                            <div style={styles.avatarPlaceholder}>
                              {authors[String(post.authorId)]?.username?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                          )}
                        </div>
                        <div style={styles.authorDetails}>
                          <span style={styles.authorName}>
                            {authors[String(post.authorId)]?.username || "Bilinmeyen Kullanıcı"}
                          </span>
                          <span style={styles.postDate}>
                            {(() => {
                              const raw = findDateField(post);
                              const display = raw ? formatDate(raw) : "";
                              return display;
                            })()}
                            {(() => {
                              const createdRaw = findDateField(post);
                              const updatedRaw = post.updatedAt || post.updatedDate || post.dateUpdated || post.DateUpdated;
                              if (!createdRaw || !updatedRaw) return null;
                              if (String(updatedRaw) !== String(createdRaw)) {
                                return <span style={styles.updatedBadge}> • {t("updated")}</span>;
                              }
                              return null;
                            })()}
                          </span>
                        </div>
                      </div>
                      <span style={styles.badge}>{categories.find(c => String(c.id) === String(post.categoryId))?.name || t("category")}</span>
                    </div>
                    <h3 style={styles.postTitle}>{post.title}</h3>
                    <p style={styles.postContent}>
                      {expandedPosts[post.id] ? post.content : truncateContent(post.content)}
                    </p>
                    {post.content && post.content.length > 150 && (
                      <button
                        style={styles.readMoreBtn}
                        onClick={(e) => { e.stopPropagation(); togglePostExpansion(post.id); }}
                      >
                        {expandedPosts[post.id] ? t("readLess") : t("readMore")}
                      </button>
                    )}
                    <div style={styles.metaRow}>
                      <span title={t("views")}>👁️ {post.viewCount ?? 0}</span>
                    </div>
                    <div style={styles.cardFooter}>
                      <button
                        style={{
                          ...styles.likeBtn,
                          ...(userLiked ? {
                            background: "#ff6b6b",
                            borderColor: "#ff6b6b",
                            color: "white"
                          } : {}),
                          ...(hoveredCard === post.id ? styles.likeBtnHover : {})
                        }}
                        onClick={(e) => { e.stopPropagation(); handleToggleLike(post); }}
                        aria-pressed={userLiked}
                      >
                        {userLiked ? "❤️" : "🤍"} {likeCount}
                      </button>
                      <button
                        style={{
                          ...styles.ghostBtn,
                          marginLeft: 8,
                          ...(hoveredCard === post.id ? styles.ghostBtnHover : {})
                        }}
                        onClick={(e) => { e.stopPropagation(); openComments(post); }}
                      >
                        {t("comment")} {commentCounts[String(post.id)] != null ? commentCounts[String(post.id)] : ""}
                      </button>
                      {isOwner && (
                        <>
                          <button
                            style={{
                              ...styles.ghostBtn,
                              marginLeft: 8,
                              ...(hoveredCard === post.id ? styles.ghostBtnHover : {})
                            }}
                            onClick={(e) => { e.stopPropagation(); openEdit(post); }}
                          >
                            {t("edit")}
                          </button>
                          <button
                            style={{
                              ...styles.ghostBtn,
                              marginLeft: 8,
                              borderColor: "rgba(255,77,79,0.45)",
                              color: "#ff6b6b",
                              ...(hoveredCard === post.id ? styles.ghostBtnHover : {})
                            }}
                            onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                          >
                            {t("delete")}
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 12 }}>
            <button
              style={{
                ...styles.paginationBtn,
                ...(pageNumber === 1 ? styles.paginationBtnDisabled : {}),
              }}
              disabled={pageNumber === 1}
              onClick={() => {
                const newPage = pageNumber - 1;
                setPageNumber(newPage);
                setSearchParams({ page: newPage.toString() });
              }}
            >
              {t("previous")}
            </button>

            <span style={{ alignSelf: "center", fontWeight: 500 }}>
              {pageNumber} / {totalPages}
            </span>

            <button
              style={{
                ...styles.paginationBtn,
                ...(pageNumber === totalPages ? styles.paginationBtnDisabled : {}),
              }}
              disabled={pageNumber === totalPages}
              onClick={() => {
                const newPage = pageNumber + 1;
                setPageNumber(newPage);
                setSearchParams({ page: newPage.toString() });
              }}
            >
              {t("next")}
            </button>

          </div>
        )}

        {formOpen && (
          <div style={styles.modalOverlay} onClick={closeForm}>
            <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={{ margin: 0 }}>{editingPost ? t("editPost") : t("newPost")}</h3>
              </div>
              <form onSubmit={handleSave} style={styles.modalForm}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>{t("category")}</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    style={styles.select}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>{t("postTitle")}</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("postTitleNewPost")}
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>{t("postContent")}</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t("postContentNewPost")}
                    style={styles.textarea}
                    rows={6}
                  />
                </div>
                {formError && (
                  <div style={styles.errorBox}>{formError}</div>
                )}
                <div style={styles.modalActions}>
                  <button type="button" style={styles.ghostBtn} onClick={closeForm}>{t("cancel")}</button>
                  <button type="submit" style={{
                    ...styles.primaryBtn,
                    ...(saving ? styles.buttonDisabled : {}),
                  }} disabled={saving}>
                    {saving ? t("sending") : (editingPost ? t("update") : t("share"))}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {detailOpen && detailPost && (
          <div style={styles.modalOverlay} onClick={() => setDetailOpen(false)}>
            <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={{ margin: 0 }}>{detailPost.title}</h3>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ marginBottom: 8, display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={styles.badge}>{categories.find(c => String(c.id) === String(detailPost.categoryId))?.name || "Kategori"}</span>
                  <span>👁️ {detailPost.viewCount ?? 0}</span>
                </div>
                <p style={{ marginTop: 0, whiteSpace: "pre-wrap" }}>{detailPost.content}</p>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                  {currentUserId && String(detailPost.authorId) === String(currentUserId) && (
                    <>
                      <button style={styles.ghostBtn} onClick={() => { setDetailOpen(false); openEdit(detailPost); }}>{t("edit")}</button>
                      <button style={{ ...styles.ghostBtn, borderColor: "rgba(255,77,79,0.45)", color: "#ff6b6b" }} onClick={() => handleDelete(detailPost.id)}>Sil</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {commentsOpen && commentsPost && (
          <div style={styles.modalOverlay} onClick={() => setCommentsOpen(false)}>
            <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={{ margin: 0 }}>{t("comments")}</h3>
              </div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  {(comments || []).length === 0 ? (
                    <div style={styles.emptyBox}>{t("noCommentsYet")}</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {comments.map((c) => (
                        <div key={c.id} style={{
                          border: "1px solid rgba(255,255,255,0.18)",
                          borderRadius: 10,
                          padding: 10,
                          marginBottom: 8
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#000000ff" }}>
                            <span style={{ fontWeight: 600, color: "#433ea9ff" }}>{c.authorName}</span>
                            <span>{formatDate(c.createdAtUtc)}</span>
                          </div>

                          {editingCommentId === c.id ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                              <textarea
                                style={{ ...styles.input, minHeight: 60 }}
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                              />
                              <div style={{ display: "flex", gap: 8 }}>
                                <button
                                  style={{ ...styles.primaryBtn, ...(editingCommentSaving ? styles.buttonDisabled : {}) }}
                                  disabled={editingCommentSaving || !editingCommentText.trim()}
                                  onClick={handleUpdateComment}
                                >
                                  {t("save")}
                                </button>
                                <button style={styles.ghostBtn} onClick={cancelEditComment}>{t("cancel")}</button>
                              </div>
                            </div>
                          ) : (
                            <p
                              style={{
                                marginTop: 6,
                                whiteSpace: "pre-wrap",     // satır sonlarını (\n) korur
                                wordBreak: "break-word",    // uzun kelimeleri kırar
                                overflowWrap: "break-word", // ekstra güvenlik
                              }}
                            >
                              {c.content}
                            </p>

                          )}

                          {String(c.authorId) === String(currentUserId) && editingCommentId !== c.id && (
                            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                              <button style={styles.ghostBtn} onClick={() => startEditComment(c)}>{t("edit")}</button>
                              <button
                                style={{ ...styles.ghostBtn, borderColor: "rgba(255,77,79,0.45)", color: "#ff6b6b" }}
                                onClick={async () => { await handleDeleteComment(c.id); }}
                              >
                                {t("delete")}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}


                    </div>
                  )}
                </div>
                {commentTotalPages > 1 && (
                  <div style={{ marginTop: 12, display: "flex", justifyContent: "center", gap: 12 }}>
                    <button
                      style={styles.ghostBtn}
                      disabled={commentPageNumber === 1}
                      onClick={() => setCommentPageNumber(commentPageNumber - 1)}
                    >
                      ← Önceki
                    </button>

                    <span style={{ alignSelf: "center" }}>
                      {commentPageNumber} / {commentTotalPages}
                    </span>

                    <button
                      style={styles.ghostBtn}
                      disabled={commentPageNumber === commentTotalPages}
                      onClick={() => setCommentPageNumber(commentPageNumber + 1)}
                    >
                      Sonraki →
                    </button>
                  </div>
                )}


                {commentError && <div style={styles.errorBox}>{commentError}</div>}
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    style={{ ...styles.input, flex: 1 }}
                    placeholder={t("addCommentPlaceholder")}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <button
                    style={{ ...styles.primaryBtn, ...(commentSaving ? styles.buttonDisabled : {}) }}
                    disabled={commentSaving || !commentText.trim()}
                    onClick={handleAddComment}
                  >{t("send")}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  highlightCard: {
    border: "2px solid #646cff",                
    boxShadow: "0 0 10px rgba(100,108,255,0.5)", 
    background: "rgba(255,255,255,0.12)",        
    transform: "scale(1.02)",                   
    transition: "all 0.3s ease",
  },


  pageWrapper: {
    minHeight: "100vh",
    padding: 24,
    background:
      "radial-gradient(1000px 500px at 10% -10%, rgba(100,108,255,0.18), rgba(0,0,0,0)), radial-gradient(1000px 500px at 110% 110%, rgba(100,108,255,0.18), rgba(0,0,0,0))",
  },
  container: {
    maxWidth: 1000,
    margin: "0 auto",
  },
  centerWrap: {
    minHeight: "60vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { margin: 0 },
  subtitle: { margin: 0, opacity: 0.85, fontSize: 14 },
  toolbar: {
    marginTop: 16,
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },
  selectWrap: { minWidth: 180 },
  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.25)",
    color: "inherit",
  },
  search: {
    flex: 1,
    minWidth: 220,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.25)",
    color: "inherit",
  },
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
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "pointer",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    display: "flex",
    flexDirection: "column",
  },
  cardHover: {
    transform: "translateY(-3px) scale(1.015)",
    boxShadow:
      "0 18px 36px rgba(0,0,0,0.28), 0 8px 16px rgba(100,108,255,0.18)",
    border: "1px solid rgba(100,108,255,0.35)",
    background: "rgba(255,255,255,0.08)", 
  },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  badge: {
    display: "inline-block",
    padding: "4px 8px",
    fontSize: 12,
    borderRadius: 999,
    background: "rgba(100,108,255,0.25)",
    border: "1px solid rgba(100,108,255,0.5)",
  },
  postTitle: { margin: "10px 0 6px 0" },
  postContent: { margin: 0, opacity: 0.9, whiteSpace: "pre-wrap", flex: 1, },
  cardFooter: {
    marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 8,
    flexWrap: "wrap",
    marginTop: "auto"
  },
  metaRow: { marginTop: 8, fontSize: 13, opacity: 0.85 },
  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #646cff",
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
    transition: "all 0.2s ease",
  },
  ghostBtnHover: {
    background: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.3)",
    transform: "translateY(-1px)",
  },
  likedBtn: {
    borderColor: "rgba(255,99,132,0.6)",
    color: "#ff6384",
  },
  emptyBox: {
    marginTop: 16,
    padding: 24,
    borderRadius: 14,
    border: "1px dashed rgba(255,255,255,0.25)",
    textAlign: "center",
    opacity: 0.9,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backdropFilter: "blur(4px)",
  },

  modalCard: {
    width: "100%",
    maxWidth: 560,
    background: "rgba(183, 182, 235, 0.62)", 
    color: "#222",                         
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: 14,
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },

  modalHeader: { padding: 16, borderBottom: "1px solid rgba(255,255,255,0.18)" },
  modalForm: { padding: 16, display: "flex", flexDirection: "column", gap: 12 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, opacity: 0.9 },
  input: {
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(219, 216, 216, 0.9)",   
    color: "#222",                          
    "::placeholder": {
      color: "#666",                       
    }
  },
  textarea: {
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(225, 219, 219, 0.9)",   
    color: "#222",
    resize: "vertical",
    "::placeholder": {
      color: "#666",
    }
  },

  errorBox: {
    background: "rgba(255,77,79,0.12)",
    border: "1px solid rgba(255,77,79,0.35)",
    color: "#ff6b6b",
    padding: "10px 12px",
    borderRadius: 10,
    fontSize: 13,
  },
  modalActions: { marginTop: 4, display: "flex", justifyContent: "flex-end", gap: 8 },
  buttonDisabled: { opacity: 0.7, cursor: "not-allowed" },
  authorInfo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    overflow: "hidden",
    background: "rgba(100,108,255,0.2)",
    border: "1px solid rgba(100,108,255,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    background: "rgba(100,108,255,0.2)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  authorDetails: {
    display: "flex",
    flexDirection: "column",
  },
  authorName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#f15c51ff",
  },
  postDate: {
    fontSize: 12,
    opacity: 0.9,
    color: "#d3807aff",
  },
  updatedBadge: {
    background: "rgba(100,108,255,0.2)",
    borderRadius: 5,
    padding: "2px 6px",
    fontSize: 11,
    color: "#646cff",
    fontWeight: 500,
  },
  readMoreBtn: {
    marginTop: 8,
    padding: "6px 12px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    cursor: "pointer",
    transition: "background 0.2s ease, border-color 0.2s ease, color 0.2s ease",
  },
  likeBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,0.18)",
    background: "transparent",
    color: "inherit",
    cursor: "pointer",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    gap: 6,
    transition: "all 0.2s ease",
  },
  likeBtnHover: {
    transform: "translateY(-1px)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  paginationBtn: {
    padding: "8px 14px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    background: "white",
    color: "#333",
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.2s ease",
  },
  paginationBtnHover: {
    background: "#f3f4f6",
    borderColor: "#ccc",
  },
  paginationBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },

};
