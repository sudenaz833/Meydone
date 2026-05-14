import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { AUTH_TOKEN_KEY } from "../utils/constants";
import { appRoutes } from "../utils/routes";
import {
  btnPrimary,
  card,
  commentAvatar,
  commentItemCard,
  commentSectionList,
  commentTextBubble,
  headingSection,
  innerWell,
  labelUi,
  linkAccent,
  textareaUi,
  textMuted,
  textSmall,
} from "../utils/ui";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function revokeBlobUrl(url) {
  if (url && String(url).startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }
}

/** İstemci tarafında JPEG sıkıştırma; sonuç File olarak multipart ile gönderilir */
function compressImageFileToJpeg(file, maxEdge = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Görsel işlenemedi"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Görsel dönüştürülemedi"));
              return;
            }
            if (blob.size > MAX_PHOTO_BYTES) {
              reject(new Error("Fotoğraf en fazla 5 MB olabilir."));
              return;
            }
            const name = file.name?.replace(/\.[^.]+$/, "") || "photo";
            resolve(new File([blob], `${name}.jpg`, { type: "image/jpeg" }));
          },
          "image/jpeg",
          quality,
        );
      };
      img.onerror = () => reject(new Error("Görsel okunamadı"));
      img.src = String(reader.result || "");
    };
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.readAsDataURL(file);
  });
}

function postCommentPhotoMultipart(commentId, file) {
  const fd = new FormData();
  fd.append("file", file, file.name || "photo.jpg");
  return api.post(`/comments/${commentId}/photo`, fd);
}

function commentKey(c) {
  return String(c._id ?? c.id ?? "");
}

function isLoggedIn() {
  return typeof window !== "undefined" && !!localStorage.getItem(AUTH_TOKEN_KEY);
}

function getCurrentUserIdFromToken() {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return null;
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(window.atob(normalized));
    const sub = typeof json?.sub === "string" ? json.sub : null;
    return sub || null;
  } catch {
    return null;
  }
}

function CommentAvatar({ user, displayName }) {
  const photo =
    typeof user?.profilePhoto === "string" && user.profilePhoto.trim()
      ? user.profilePhoto.trim()
      : null;
  const initial = (displayName || "?").trim().slice(0, 1).toUpperCase() || "?";

  if (photo) {
    return (
      <div className={commentAvatar}>
        <img src={photo} alt="" className="h-full w-full object-cover" loading="lazy" />
      </div>
    );
  }

  return (
    <div className={commentAvatar} aria-hidden>
      {initial}
    </div>
  );
}

function authorMeta(c) {
  const u = c.user && typeof c.user === "object" ? c.user : null;
  const name = u?.name?.trim() || "";
  const username = u?.username?.trim() || "";
  const displayName =
    name || username || (c.user && typeof c.user === "string" ? "Üye" : "Anonim");
  const showHandle = Boolean(username && username !== name);
  return { user: u, displayName, username, showHandle };
}

function replyKey(commentId, reply, index) {
  const rid = String(reply?._id ?? "").trim();
  if (rid) return `${commentId}:${rid}`;
  return `${commentId}:idx:${index}`;
}

export default function VenueCommentSection({
  venueId,
  comments,
  setComments,
  hideRating = false,
  /** Başka mekanlarda sahip hesabı: beğeni/yanıt kapalı */
  disableInteractions = false,
  /** Mekan sahibi: yeni üst düzey yorum formu gösterme (yanıt + beğeni açık kalır) */
  disableRootCommentForm = false,
}) {
  const [text, setText] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [likeBusyId, setLikeBusyId] = useState(null);
  const [deleteBusyId, setDeleteBusyId] = useState(null);
  const [editBusyId, setEditBusyId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editSessionOriginalPhotoUrl, setEditSessionOriginalPhotoUrl] = useState("");
  const [editPhotoFile, setEditPhotoFile] = useState(null);
  const [editPhotoPreviewBlob, setEditPhotoPreviewBlob] = useState("");
  const [editServerPhotoCleared, setEditServerPhotoCleared] = useState(false);
  const [likeError, setLikeError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [editError, setEditError] = useState("");
  const [replyBusyId, setReplyBusyId] = useState(null);
  const [replyDeleteBusyId, setReplyDeleteBusyId] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyError, setReplyError] = useState("");
  const [editingReplyKey, setEditingReplyKey] = useState(null);
  const [editingReplyText, setEditingReplyText] = useState("");
  const [replyEditBusyId, setReplyEditBusyId] = useState(null);

  const loggedIn = isLoggedIn();
  const currentUserId = getCurrentUserIdFromToken();

  async function refreshComments() {
    const { data } = await api.get(`/venues/${venueId}/comments`);
    const items = Array.isArray(data?.data?.items) ? data.data.items : [];
    setComments(items);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!loggedIn) {
      setFormError("Yorum yazmak için giriş yapın.");
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) {
      setFormError("Yorum metni gerekli.");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post("/comments", {
        venue: venueId,
        text: trimmed,
      });
      const newId = data?.data?.comment?._id ?? data?.data?.comment?.id;
      if (photoFile && newId) {
        try {
          await postCommentPhotoMultipart(String(newId), photoFile);
        } catch (photoErr) {
          setFormError(
            photoErr.apiMessage ||
              photoErr.message ||
              "Yorum kaydedildi; fotoğraf multipart ile yüklenemedi.",
          );
          setText("");
          revokeBlobUrl(photoPreviewUrl);
          setPhotoPreviewUrl("");
          setPhotoFile(null);
          await refreshComments();
          return;
        }
      }
      setText("");
      revokeBlobUrl(photoPreviewUrl);
      setPhotoPreviewUrl("");
      setPhotoFile(null);
      await refreshComments();
    } catch (err) {
      setFormError(err.apiMessage || err.message || "Yorum gönderilemedi");
    } finally {
      setSubmitting(false);
    }
  }

  function clearSelectedPhoto() {
    revokeBlobUrl(photoPreviewUrl);
    setPhotoPreviewUrl("");
    setPhotoFile(null);
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError("");
    if (!file.type.startsWith("image/")) {
      setFormError("Lütfen sadece görsel dosyası seçin.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setFormError("Fotoğraf en fazla 5 MB olabilir.");
      e.target.value = "";
      return;
    }
    try {
      const jpegFile = await compressImageFileToJpeg(file);
      revokeBlobUrl(photoPreviewUrl);
      setPhotoFile(jpegFile);
      setPhotoPreviewUrl(URL.createObjectURL(jpegFile));
    } catch (err) {
      setFormError(err.message || "Fotoğraf işlenemedi.");
    } finally {
      e.target.value = "";
    }
  }

  async function handleLike(commentId) {
    setLikeError("");
    if (!loggedIn) {
      setLikeError("Yorumları beğenmek için giriş yapın.");
      return;
    }
    setLikeBusyId(commentId);
    try {
      const { data } = await api.post(`/comments/${commentId}/like`);
      const updated = data?.data?.comment;
      if (!updated) {
        await refreshComments();
        return;
      }
      setComments((prev) =>
        prev.map((c) => (commentKey(c) === String(commentId) ? { ...c, ...updated } : c)),
      );
    } catch (err) {
      setLikeError(err.apiMessage || err.message || "Beğeni kaydedilemedi");
    } finally {
      setLikeBusyId(null);
    }
  }

  async function handleDelete(commentId) {
    setDeleteError("");
    if (!loggedIn) {
      setDeleteError("Yorum silmek için giriş yapın.");
      return;
    }
    const confirmDelete = window.confirm("Bu yorumu silmek istediğinize emin misiniz?");
    if (!confirmDelete) return;

    setDeleteBusyId(commentId);
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => commentKey(c) !== String(commentId)));
    } catch (err) {
      setDeleteError(err.apiMessage || err.message || "Yorum silinemedi");
    } finally {
      setDeleteBusyId(null);
    }
  }

  function startEdit(comment) {
    setEditError("");
    revokeBlobUrl(editPhotoPreviewBlob);
    setEditPhotoPreviewBlob("");
    setEditPhotoFile(null);
    setEditServerPhotoCleared(false);
    setEditSessionOriginalPhotoUrl(typeof comment.photoUrl === "string" ? comment.photoUrl : "");
    setEditingId(commentKey(comment));
    setEditText(String(comment.text || ""));
  }

  function cancelEdit() {
    revokeBlobUrl(editPhotoPreviewBlob);
    setEditPhotoPreviewBlob("");
    setEditingId(null);
    setEditText("");
    setEditPhotoFile(null);
    setEditSessionOriginalPhotoUrl("");
    setEditServerPhotoCleared(false);
    setEditError("");
  }

  async function saveEdit(commentId) {
    setEditError("");
    const trimmed = editText.trim();
    if (!trimmed) {
      setEditError("Yorum metni boş olamaz.");
      return;
    }
    setEditBusyId(commentId);
    try {
      if (editPhotoFile) {
        await api.put(`/comments/${commentId}`, { text: trimmed });
        await postCommentPhotoMultipart(String(commentId), editPhotoFile);
      } else if (editServerPhotoCleared && editSessionOriginalPhotoUrl) {
        await api.put(`/comments/${commentId}`, { text: trimmed, photoUrl: null });
      } else {
        await api.put(`/comments/${commentId}`, { text: trimmed });
      }
      await refreshComments();
      cancelEdit();
    } catch (err) {
      setEditError(err.apiMessage || err.message || "Yorum güncellenemedi");
    } finally {
      setEditBusyId(null);
    }
  }

  async function handleEditPhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditError("");
    if (!file.type.startsWith("image/")) {
      setEditError("Lütfen sadece görsel dosyası seçin.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setEditError("Fotoğraf en fazla 5 MB olabilir.");
      e.target.value = "";
      return;
    }
    try {
      const jpegFile = await compressImageFileToJpeg(file);
      revokeBlobUrl(editPhotoPreviewBlob);
      setEditPhotoFile(jpegFile);
      setEditPhotoPreviewBlob(URL.createObjectURL(jpegFile));
      setEditServerPhotoCleared(false);
    } catch (err) {
      setEditError(err.message || "Fotoğraf işlenemedi.");
    } finally {
      e.target.value = "";
    }
  }

  function clearEditPhoto() {
    if (editPhotoFile) {
      revokeBlobUrl(editPhotoPreviewBlob);
      setEditPhotoPreviewBlob("");
      setEditPhotoFile(null);
      return;
    }
    if (editSessionOriginalPhotoUrl) {
      setEditServerPhotoCleared(true);
    }
  }

  async function handleReply(commentId) {
    setReplyError("");
    if (!loggedIn) {
      setReplyError("Yorumlara cevap vermek için giriş yapın.");
      return;
    }
    const text = String(replyDrafts[commentId] ?? "").trim();
    if (!text) {
      setReplyError("Cevap metni boş olamaz.");
      return;
    }
    setReplyBusyId(commentId);
    try {
      const { data } = await api.post(`/comments/${commentId}/replies`, { text });
      const updated = data?.data?.comment;
      if (updated) {
        setComments((prev) =>
          prev.map((c) => (commentKey(c) === String(commentId) ? { ...c, ...updated } : c)),
        );
      } else {
        await refreshComments();
      }
      setReplyDrafts((prev) => ({ ...prev, [commentId]: "" }));
    } catch (err) {
      setReplyError(err.apiMessage || err.message || "Cevap gönderilemedi");
    } finally {
      setReplyBusyId(null);
    }
  }

  function startReplyEdit(commentId, reply, index) {
    setReplyError("");
    setEditingReplyKey(replyKey(commentId, reply, index));
    setEditingReplyText(String(reply?.text ?? ""));
  }

  function cancelReplyEdit() {
    setEditingReplyKey(null);
    setEditingReplyText("");
  }

  async function saveReplyEdit(commentId, replyId) {
    setReplyError("");
    const trimmed = String(editingReplyText ?? "").trim();
    if (!trimmed) {
      setReplyError("Cevap metni boş olamaz.");
      return;
    }
    if (!replyId) {
      setReplyError("Bu cevap düzenlenemiyor.");
      return;
    }
    const busyKey = `${commentId}:${replyId}`;
    setReplyEditBusyId(busyKey);
    try {
      const { data } = await api.put(`/comments/${commentId}/replies/${replyId}`, { text: trimmed });
      const updated = data?.data?.comment;
      if (updated) {
        setComments((prev) =>
          prev.map((c) => (commentKey(c) === String(commentId) ? { ...c, ...updated } : c)),
        );
      } else {
        await refreshComments();
      }
      cancelReplyEdit();
    } catch (err) {
      setReplyError(err.apiMessage || err.message || "Cevap güncellenemedi");
    } finally {
      setReplyEditBusyId(null);
    }
  }

  async function deleteReply(commentId, replyId) {
    setReplyError("");
    if (!replyId) {
      setReplyError("Bu cevap silinemiyor.");
      return;
    }
    const ok = window.confirm("Bu cevabı silmek istediğinize emin misiniz?");
    if (!ok) return;
    const busyKey = `${commentId}:${replyId}`;
    setReplyDeleteBusyId(busyKey);
    try {
      const { data } = await api.delete(`/comments/${commentId}/replies/${replyId}`);
      const updated = data?.data?.comment;
      if (updated) {
        setComments((prev) =>
          prev.map((c) => (commentKey(c) === String(commentId) ? { ...c, ...updated } : c)),
        );
      } else {
        await refreshComments();
      }
      if (editingReplyKey === busyKey) cancelReplyEdit();
    } catch (err) {
      setReplyError(err.apiMessage || err.message || "Cevap silinemedi");
    } finally {
      setReplyDeleteBusyId(null);
    }
  }

  return (
    <section
      className={`${card} relative overflow-hidden border-rose-100/50 bg-gradient-to-br from-white/90 via-violet-50/25 to-rose-50/30`}
      aria-labelledby="comments-heading"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-pink-200/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-violet-200/25 blur-3xl"
        aria-hidden
      />

      <div className="relative">
        <h2 id="comments-heading" className={headingSection}>
          Yorumlar
        </h2>
        <p className={`mt-2 ${textMuted}`}>
          {comments.length === 0
            ? "Henüz yorum yok."
            : `${comments.length} yorum`}
        </p>

        {disableInteractions ? (
          <div className={`mt-6 ${innerWell}`}>
            <p className={`text-sm ${textMuted}`}>
              Mekan sahibi hesabıyla yalnızca kendi işletmenizin sayfasında yorumlara beğeni verebilir veya yanıt
              yazabilirsiniz.
            </p>
          </div>
        ) : null}

        {!disableInteractions && loggedIn && !disableRootCommentForm ? (
          <form className="mt-8 space-y-5 border-b border-rose-100/50 pb-10" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="comment-text" className={labelUi}>
                Yorum
              </label>
              <textarea
                id="comment-text"
                name="text"
                rows={4}
                maxLength={2000}
                required
                placeholder="Deneyiminizi paylaşın…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className={textareaUi}
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="comment-photo" className={labelUi}>
                Fotoğraf (opsiyonel)
              </label>
              <input
                id="comment-photo"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="block w-full rounded-xl border border-rose-100/80 bg-white px-3 py-2 text-sm text-stone-700"
              />
              {photoPreviewUrl ? (
                <div className="space-y-2">
                  <img
                    src={photoPreviewUrl}
                    alt="Seçilen yorum görseli önizlemesi"
                    className="max-h-28 w-40 rounded-xl border border-rose-100/80 object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearSelectedPhoto}
                    className="text-sm font-medium text-rose-700 underline underline-offset-2"
                  >
                    Fotoğrafı kaldır
                  </button>
                </div>
              ) : null}
            </div>
            {formError ? (
              <p className="text-sm text-rose-800" role="alert">
                {formError}
              </p>
            ) : null}
            <button type="submit" disabled={submitting} className={btnPrimary}>
              {submitting ? "Gönderiliyor…" : "Yorumu gönder"}
            </button>
          </form>
        ) : null}

        {!disableInteractions && loggedIn && disableRootCommentForm ? (
          <p className={`mt-6 border-b border-rose-100/50 pb-8 text-sm ${textMuted}`}>
            İşletme hesabıyla yeni müşteri yorumu açamazsınız; aşağıdaki yorumlara <strong className="text-stone-700">beğeni</strong> verebilir ve{" "}
            <strong className="text-stone-700">yanıt</strong> yazabilirsiniz.
          </p>
        ) : null}

        {!disableInteractions && !loggedIn ? (
          <div className={`mt-6 ${innerWell}`}>
            <p className={`text-sm ${textMuted}`}>
              <Link to={appRoutes.login} className={linkAccent}>
                Giriş yapın
              </Link>{" "}
              — yorum eklemek veya beğenmek için.
            </p>
          </div>
        ) : null}

        {likeError ? (
          <p className="mt-6 text-sm text-rose-800" role="alert">
            {likeError}
          </p>
        ) : null}
        {deleteError ? (
          <p className="mt-2 text-sm text-rose-800" role="alert">
            {deleteError}
          </p>
        ) : null}
        {editError ? (
          <p className="mt-2 text-sm text-rose-800" role="alert">
            {editError}
          </p>
        ) : null}
        {replyError ? (
          <p className="mt-2 text-sm text-rose-800" role="alert">
            {replyError}
          </p>
        ) : null}

        {comments.length > 0 ? (
          <div className={`mt-10 ${commentSectionList}`}>
            <div
              className="pointer-events-none absolute right-6 top-6 h-24 w-24 rounded-full bg-rose-200/20 blur-2xl"
              aria-hidden
            />
            <ul className="relative flex flex-col gap-6 sm:gap-7">
              {comments.map((c, index) => {
                const cid = commentKey(c);
                const { user, displayName, username, showHandle } = authorMeta(c);
                const created =
                  c.createdAt != null
                    ? new Date(c.createdAt).toLocaleString("tr-TR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "";
                const likes = Array.isArray(c.likedBy) ? c.likedBy.length : 0;
                const liking = likeBusyId === cid;
                const deleting = deleteBusyId === cid;
                const editing = editingId === cid;
                const editSaving = editBusyId === cid;
                const ownerId =
                  c.user && typeof c.user === "object" ? String(c.user._id || "") : String(c.user || "");
                const canManage = Boolean(currentUserId && ownerId && currentUserId === ownerId);

                return (
                  <li key={cid || `comment-${index}`} className={commentItemCard}>
                    <div className="flex gap-4">
                      <CommentAvatar user={user} displayName={displayName} />
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-stone-800">{displayName}</p>
                            {showHandle ? (
                              <p className={`mt-0.5 ${textSmall} font-medium text-violet-600`}>
                                @{username}
                              </p>
                            ) : null}
                            {created ? (
                              <p className={`mt-1 ${textSmall} text-stone-500`}>{created}</p>
                            ) : null}
                          </div>
                          {!hideRating && Number.isFinite(Number(c.rating)) ? (
                            <span className="shrink-0 rounded-full bg-amber-100/90 px-3 py-1 text-xs font-semibold text-amber-800 shadow-sm">
                              ★ {c.rating}/5
                            </span>
                          ) : null}
                        </div>

                        <div className={commentTextBubble}>
                          {editing ? (
                            <div className="space-y-3">
                              <div>
                                <label htmlFor={`edit-text-${cid}`} className={labelUi}>
                                  Yorum
                                </label>
                                <textarea
                                  id={`edit-text-${cid}`}
                                  rows={4}
                                  maxLength={2000}
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className={textareaUi}
                                />
                              </div>
                              <div className="space-y-2">
                                <label htmlFor={`edit-photo-${cid}`} className={labelUi}>
                                  Fotoğraf
                                </label>
                                <input
                                  id={`edit-photo-${cid}`}
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  onChange={handleEditPhotoChange}
                                  className="block w-full rounded-xl border border-rose-100/80 bg-white px-3 py-2 text-sm text-stone-700"
                                />
                                {editPhotoPreviewBlob ||
                                (!editServerPhotoCleared && editSessionOriginalPhotoUrl) ? (
                                  <div className="space-y-2">
                                    <img
                                      src={
                                        editPhotoPreviewBlob || editSessionOriginalPhotoUrl || ""
                                      }
                                      alt="Düzenleme görseli önizlemesi"
                                      className="max-h-28 w-40 rounded-xl border border-rose-100/80 object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={clearEditPhoto}
                                      className="text-sm font-medium text-rose-700 underline underline-offset-2"
                                    >
                                      Fotoğrafı kaldır
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="whitespace-pre-wrap break-words">{c.text}</p>
                              {c.photoUrl ? (
                                <a
                                  href={c.photoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-3 block"
                                >
                                  <img
                                    src={c.photoUrl}
                                    alt="Yorum görseli"
                                    className="h-28 w-40 rounded-xl border border-rose-100/80 object-cover"
                                    loading="lazy"
                                  />
                                </a>
                              ) : null}
                            </>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <button
                            type="button"
                            disabled={liking || disableInteractions}
                            onClick={() => handleLike(cid)}
                            aria-label={
                              liking
                                ? "Beğeni kaydediliyor"
                                : `Bu yorumu beğen, şu ana kadar ${likes} beğeni`
                            }
                            className="inline-flex items-center gap-2 rounded-full border border-pink-200/80 bg-gradient-to-r from-pink-50/90 to-rose-50/80 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm shadow-pink-100/40 transition hover:border-rose-300/80 hover:from-pink-100/80 hover:to-rose-100/70 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <span className="text-base leading-none" aria-hidden>
                              ♥
                            </span>
                            <span aria-hidden>{liking ? "…" : likes}</span>
                          </button>
                          {c.photoUrl ? <span className={`${textSmall} text-stone-500`}>Fotoğraflı</span> : null}
                          {!disableInteractions && canManage ? (
                            <>
                              {editing ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={editSaving}
                                    onClick={() => saveEdit(cid)}
                                    className="inline-flex items-center rounded-full border border-rose-200/70 bg-violet-50/70 px-3 py-1.5 text-xs font-semibold text-violet-800 transition hover:border-violet-200 hover:bg-violet-100/80 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {editSaving ? "Kaydediliyor…" : "Kaydet"}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={editSaving}
                                    onClick={cancelEdit}
                                    className="inline-flex items-center rounded-full border border-stone-200/80 bg-stone-50/80 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-100/80 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    İptal
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startEdit(c)}
                                  className="inline-flex items-center rounded-full border border-amber-200/80 bg-amber-50/80 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100/80"
                                >
                                  Düzenle
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={deleting || editing}
                                onClick={() => handleDelete(cid)}
                                className="inline-flex items-center rounded-full border border-rose-200/80 bg-rose-50/80 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100/80 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deleting ? "Siliniyor…" : "Sil"}
                              </button>
                            </>
                          ) : null}
                        </div>
                        <div className="mt-2 rounded-xl border border-rose-100/80/80 bg-white/70 p-3">
                          <p className="text-xs font-semibold text-stone-700">Yoruma cevaplar</p>
                          {Array.isArray(c.replies) && c.replies.length > 0 ? (
                            <ul className="mt-2 space-y-2">
                              {c.replies.map((r, ridx) => {
                                const rUser = r?.user && typeof r.user === "object" ? r.user : null;
                                const rName = rUser?.name || rUser?.username || "Kullanıcı";
                                const rid = String(r?._id ?? "");
                                const rUserId = String(rUser?._id ?? r?.user ?? "");
                                const canManageReply =
                                  !disableInteractions &&
                                  Boolean(currentUserId && rUserId && currentUserId === rUserId);
                                const key = replyKey(cid, r, ridx);
                                const editingReply = editingReplyKey === key;
                                const replyBusyKey = `${cid}:${rid}`;
                                const savingReply = replyEditBusyId === replyBusyKey;
                                const deletingReply = replyDeleteBusyId === replyBusyKey;
                                return (
                                  <li key={`${r?.createdAt ?? "reply"}-${ridx}`} className="rounded-lg border border-rose-100/80 bg-violet-50/50 px-3 py-2">
                                    <p className="text-xs font-semibold text-stone-800">{rName}</p>
                                    {editingReply ? (
                                      <div className="mt-1 space-y-2">
                                        <input
                                          type="text"
                                          value={editingReplyText}
                                          onChange={(e) => setEditingReplyText(e.target.value)}
                                          maxLength={1000}
                                          className="w-full rounded-lg border border-rose-100/80 bg-white px-3 py-2 text-sm text-stone-700"
                                        />
                                        <div className="flex flex-wrap gap-2">
                                          <button
                                            type="button"
                                            disabled={savingReply}
                                            onClick={() => saveReplyEdit(cid, rid)}
                                            className="rounded-lg border border-violet-200/80 bg-violet-50/80 px-2.5 py-1 text-xs font-semibold text-violet-800 disabled:opacity-50"
                                          >
                                            {savingReply ? "Kaydediliyor..." : "Kaydet"}
                                          </button>
                                          <button
                                            type="button"
                                            disabled={savingReply}
                                            onClick={cancelReplyEdit}
                                            className="rounded-lg border border-stone-200/80 bg-stone-50/80 px-2.5 py-1 text-xs font-semibold text-stone-700 disabled:opacity-50"
                                          >
                                            İptal
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="mt-1 text-sm text-stone-700">{String(r?.text ?? "")}</p>
                                    )}
                                    {canManageReply && !editingReply ? (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() => startReplyEdit(cid, r, ridx)}
                                          className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-2.5 py-1 text-xs font-semibold text-amber-700"
                                        >
                                          Düzenle
                                        </button>
                                        <button
                                          type="button"
                                          disabled={deletingReply}
                                          onClick={() => deleteReply(cid, rid)}
                                          className="rounded-lg border border-rose-200/80 bg-rose-50/80 px-2.5 py-1 text-xs font-semibold text-rose-700 disabled:opacity-50"
                                        >
                                          {deletingReply ? "Siliniyor..." : "Sil"}
                                        </button>
                                      </div>
                                    ) : null}
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p className="mt-2 text-xs text-stone-500">Henüz cevap yok.</p>
                          )}
                          {loggedIn && !disableInteractions ? (
                            <div className="mt-3 flex gap-2">
                              <input
                                type="text"
                                value={replyDrafts[cid] ?? ""}
                                onChange={(e) =>
                                  setReplyDrafts((prev) => ({ ...prev, [cid]: e.target.value }))
                                }
                                placeholder="Yoruma cevap yaz..."
                                className="w-full rounded-lg border border-rose-100/80 bg-white px-3 py-2 text-sm text-stone-700"
                              />
                              <button
                                type="button"
                                disabled={replyBusyId === cid}
                                onClick={() => handleReply(cid)}
                                className="shrink-0 rounded-lg border border-rose-200/80 bg-rose-50/80 px-3 py-2 text-xs font-semibold text-violet-800 hover:bg-rose-100/80 disabled:opacity-50"
                              >
                                {replyBusyId === cid ? "..." : "Cevapla"}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
