import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { AUTH_TOKEN_KEY } from "../utils/constants";
import { appRoutes } from "../utils/routes";
import {
  alertError,
  alertWarn,
  btnAccept,
  btnDangerOutline,
  btnPrimary,
  btnSoft,
  card,
  cardAccent,
  headingPage,
  headingSection,
  inputUi,
  labelUi,
  linkAccent,
  textMuted,
  textSmall,
} from "../utils/ui";

function userId(u) {
  if (!u) return "";
  return String(u._id ?? u);
}

export default function FriendsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [commentLikeNotifications, setCommentLikeNotifications] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [toUsername, setToUsername] = useState("");
  const [sendError, setSendError] = useState("");
  const [sendBusy, setSendBusy] = useState(false);
  const [actionBusyId, setActionBusyId] = useState(null);
  const [removeBusyId, setRemoveBusyId] = useState(null);

  const loadAll = useCallback(async () => {
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
      setStatus("guest");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const [meRes, friendsRes, pendingRes, commentLikesRes] = await Promise.all([
        api.get("/auth/me"),
        api.get("/friends"),
        api.get("/friends/pending"),
        api.get("/notifications/comment-likes"),
      ]);
      const me = meRes.data?.data?.user ?? null;
      setCurrentUser(me);
      const f = friendsRes.data?.data?.friends;
      setFriends(Array.isArray(f) ? f : []);
      const inc = pendingRes.data?.data?.incoming;
      const out = pendingRes.data?.data?.outgoing;
      setIncoming(Array.isArray(inc) ? inc : []);
      setOutgoing(Array.isArray(out) ? out : []);
      const likeItems = commentLikesRes.data?.data?.items;
      setCommentLikeNotifications(Array.isArray(likeItems) ? likeItems : []);

      setStatus("ok");
    } catch (err) {
      setError(err.apiMessage || err.message || "Arkadaşlar yüklenemedi");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function sendRequest(e) {
    e.preventDefault();
    setSendError("");
    const trimmed = toUsername.trim();
    if (!trimmed) {
      setSendError("Kullanıcı adı girin.");
      return;
    }
    setSendBusy(true);
    try {
      await api.post("/friends/request", { username: trimmed });
      setToUsername("");
      await loadAll();
    } catch (err) {
      setSendError(err.apiMessage || err.message || "İstek gönderilemedi");
    } finally {
      setSendBusy(false);
    }
  }

  async function respond(requestId, action) {
    setError("");
    setActionBusyId(requestId);
    try {
      await api.put(`/friends/accept/${requestId}`, { action });
      await loadAll();
    } catch (err) {
      setError(err.apiMessage || err.message || "İstek güncellenemedi");
    } finally {
      setActionBusyId(null);
    }
  }

  async function removeFriend(friendUserId) {
    setError("");
    setRemoveBusyId(friendUserId);
    try {
      await api.delete(`/friends/${friendUserId}`);
      await loadAll();
    } catch (err) {
      setError(err.apiMessage || err.message || "Arkadaş kaldırılamadı");
    } finally {
      setRemoveBusyId(null);
    }
  }

  function askRemoveFriend(friendUserId) {
    const ok = window.confirm("Bu kişiyi arkadaşlıktan silmek istediğinize emin misiniz?");
    if (!ok) return;
    removeFriend(friendUserId);
  }

  if (status === "guest") {
    return (
      <section className={card}>
        <h1 className={headingPage}>Arkadaşlar</h1>
        <p className={`mt-3 ${textMuted}`}>
          <Link to={appRoutes.login} className={linkAccent}>
            Giriş yapın
          </Link>{" "}
          — arkadaşlık isteklerini ve listenizi yönetin.
        </p>
      </section>
    );
  }

  if (status === "loading") {
    return <p className={textMuted}>Yükleniyor…</p>;
  }

  if (status === "error") {
    return (
      <p className={alertError} role="alert">
        {error}
      </p>
    );
  }

  if (currentUser?.role === "admin" || currentUser?.role === "owner") {
    return (
      <section className={card}>
        <h1 className={headingPage}>Arkadaşlar</h1>
        <p className={`mt-3 ${textMuted}`}>Bu hesap tipinde arkadaşlık özelliği kapalıdır.</p>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <header className={cardAccent}>
        <h1 className={headingPage}>Arkadaşlar</h1>
        <p className={`mt-2 max-w-2xl ${textMuted}`}>
          Kullanıcı adı ile istek gönderin, gelenleri yanıtlayın ve bağlantılarınızı yönetin.
        </p>
        {incoming.length > 0 ? (
          <p className="mt-3 inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
            {incoming.length} yeni arkadaşlık isteğiniz var
          </p>
        ) : null}
      </header>

      {error ? (
        <p className={alertWarn} role="alert">
          {error}
        </p>
      ) : null}

      <section className={card} aria-labelledby="send-heading">
        <h2 id="send-heading" className={headingSection}>
          Arkadaşlık isteği gönder
        </h2>
        <p className={`mt-2 ${textMuted}`}>
          Karşı tarafın kullanıcı adını girin. Kendi kullanıcı adınızı{" "}
          <Link to={appRoutes.profile} className={linkAccent}>
            Profil
          </Link>
          &apos;de görebilirsiniz.
        </p>
        <form className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={sendRequest}>
          <div className="min-w-0 flex-1">
            <label htmlFor="friend-to-username" className={labelUi}>
              Kullanıcı adı
            </label>
            <input
              id="friend-to-username"
              name="username"
              type="text"
              autoComplete="off"
              placeholder="örn. ahmet_35"
              value={toUsername}
              onChange={(e) => setToUsername(e.target.value)}
              className={inputUi}
            />
          </div>
          <button
            type="submit"
            disabled={sendBusy}
            className={`${btnPrimary} w-full sm:w-auto sm:min-w-[180px] sm:shrink-0`}
          >
            {sendBusy ? "Gönderiliyor…" : "İstek gönder"}
          </button>
        </form>
        {sendError ? (
          <p className="mt-3 text-sm text-rose-800" role="alert">
            {sendError}
          </p>
        ) : null}
      </section>

      <section className={card} aria-labelledby="incoming-heading">
        <h2 id="incoming-heading" className={headingSection}>
          Gelen istekler
        </h2>
        {incoming.length === 0 ? (
          <p className={`mt-4 ${textMuted}`}>Bekleyen istek yok.</p>
        ) : (
          <ul className="mt-6 divide-y divide-rose-100/50">
            {incoming.map((req) => {
              const rid = String(req._id);
              const from = req.from;
              const name = from?.name || from?.username || "Kullanıcı";
              const busy = actionBusyId === rid;
              return (
                <li key={rid} className="flex flex-wrap items-center justify-between gap-4 py-5 first:pt-0">
                  <div>
                    <p className="font-semibold text-stone-800">{name}</p>
                    {from?.username ? <p className={`${textSmall} text-stone-500`}>@{from.username}</p> : null}
                    <p className={`mt-1 font-mono ${textSmall} text-stone-400`}>{userId(from)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => respond(rid, "accept")}
                      className={btnAccept}
                    >
                      Kabul et
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => respond(rid, "reject")}
                      className={btnSoft}
                    >
                      Reddet
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={card} aria-labelledby="comment-like-heading">
        <h2 id="comment-like-heading" className={headingSection}>
          Yorum beğeni bildirimleri
        </h2>
        {commentLikeNotifications.length === 0 ? (
          <p className={`mt-4 ${textMuted}`}>Henüz yorum beğeni bildirimi yok.</p>
        ) : (
          <ul className="mt-6 divide-y divide-rose-100/50">
            {commentLikeNotifications.map((item) => {
              const key = String(item.commentId ?? item.updatedAt ?? Math.random());
              const venueName = item?.venue?.name ?? "Mekan";
              const likeCount = Number(item?.likeCount ?? 0);
              const likers = Array.isArray(item?.likers) ? item.likers : [];
              const likerPreview = likers
                .slice(0, 2)
                .map((u) => u?.name || u?.username || "Bir kullanıcı")
                .filter(Boolean)
                .join(", ");
              const extra = likeCount > 2 ? ` ve ${likeCount - 2} kişi daha` : "";
              const when = item?.updatedAt
                ? new Date(item.updatedAt).toLocaleString("tr-TR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })
                : "";

              return (
                <li key={key} className="py-4 first:pt-0">
                  <p className="font-semibold text-stone-800">
                    {venueName} mekanındaki yorumunuz beğenildi.
                  </p>
                  {likerPreview ? (
                    <p className={`mt-1 ${textSmall} text-stone-600`}>
                      Beğenen: {likerPreview}
                      {extra}
                    </p>
                  ) : null}
                  {item?.commentPreview ? (
                    <p className={`mt-2 ${textSmall} rounded-xl border border-rose-100/80 bg-violet-50/50 px-3 py-2 text-stone-700`}>
                      "{item.commentPreview}"
                    </p>
                  ) : null}
                  {when ? <p className={`mt-2 ${textSmall} text-stone-500`}>{when}</p> : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={card} aria-labelledby="outgoing-heading">
        <h2 id="outgoing-heading" className={headingSection}>
          Gönderilen istekler
        </h2>
        {outgoing.length === 0 ? (
          <p className={`mt-4 ${textMuted}`}>Bekleyen giden istek yok.</p>
        ) : (
          <ul className="mt-6 divide-y divide-rose-100/50">
            {outgoing.map((req) => {
              const to = req.to;
              const name = to?.name || to?.username || "Kullanıcı";
              return (
                <li key={String(req._id)} className="py-4 first:pt-0">
                  <p className="font-semibold text-stone-800">{name}</p>
                  {to?.username ? <p className={`${textSmall} text-stone-500`}>@{to.username}</p> : null}
                  <p className={`mt-1 font-mono ${textSmall} text-stone-400`}>{userId(to)}</p>
                  <p className={`mt-2 ${textSmall} font-medium text-amber-800`}>Yanıt bekleniyor</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={card} aria-labelledby="friends-heading">
        <h2 id="friends-heading" className={headingSection}>
          Arkadaşlarınız
        </h2>
        {friends.length === 0 ? (
          <p className={`mt-4 ${textMuted}`}>Henüz arkadaş yok.</p>
        ) : (
          <ul className="mt-6 divide-y divide-rose-100/50">
            {friends.map((row) => {
              const f = row.friend;
              const fid = userId(f);
              const name = f?.name || f?.username || "Kullanıcı";
              const busy = removeBusyId === fid;
              const isProfilePrivate = String(f?.profileVisibility ?? "public") === "private";
              const isVenueOwner = String(f?.role ?? "") === "owner";
              return (
                <li
                  key={String(row.friendshipId ?? fid)}
                  className="flex flex-wrap items-center justify-between gap-4 py-5 first:pt-0"
                >
                  <div>
                    <p className="font-semibold text-stone-800">{name}</p>
                    {f?.username ? <p className={`${textSmall} text-stone-500`}>@{f.username}</p> : null}
                    <p className={`mt-1 font-mono ${textSmall} text-stone-400`}>{fid}</p>
                    {fid && !isProfilePrivate && !isVenueOwner ? (
                      <Link
                        to={appRoutes.friendProfile.replace(":id", fid)}
                        className="mt-2 inline-block text-sm font-semibold text-violet-700 underline underline-offset-2"
                      >
                        Profili gör
                      </Link>
                    ) : fid && isVenueOwner ? (
                      <p className={`mt-2 ${textSmall} text-stone-500`}>
                        Mekan sahibi hesapları için profil sayfası açılmaz.
                      </p>
                    ) : fid ? (
                      <p className={`mt-2 ${textSmall} text-stone-500`}>
                        Bu profil gizli.
                      </p>
                    ) : null}
                    {row.friendsSince ? (
                      <p className={`mt-2 ${textSmall} text-stone-500`}>
                        Arkadaşlık tarihi:{" "}
                        {new Date(row.friendsSince).toLocaleDateString("tr-TR", {
                          dateStyle: "medium",
                        })}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => askRemoveFriend(fid)}
                    className={btnDangerOutline}
                  >
                    {busy ? "Siliniyor…" : "Arkadaşlıktan sil"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
