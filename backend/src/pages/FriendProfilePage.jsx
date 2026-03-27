import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { toTurkishCategory } from "../utils/category";
import { appRoutes } from "../utils/routes";
import {
  alertError,
  card,
  headingPage,
  headingSection,
  pillCategory,
  textMuted,
  textSmall,
} from "../utils/ui";

function venueRefId(venue) {
  if (!venue) return "";
  return String(venue._id ?? venue);
}

export default function FriendProfilePage() {
  const { id } = useParams();
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [canSeeComments, setCanSeeComments] = useState(false);
  const [canSeePosts, setCanSeePosts] = useState(false);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setError("");
    api
      .get(`/api/friends/profile/${id}`)
      .then((res) => {
        if (!active) return;
        setUser(res.data?.data?.user ?? null);
        setFavorites(Array.isArray(res.data?.data?.favorites) ? res.data.data.favorites : []);
        setPosts(Array.isArray(res.data?.data?.posts) ? res.data.data.posts : []);
        setComments(Array.isArray(res.data?.data?.comments) ? res.data.data.comments : []);
        setCanSeeComments(Boolean(res.data?.data?.canSeeComments));
        setCanSeePosts(Boolean(res.data?.data?.canSeePosts));
        setStatus("ok");
      })
      .catch((err) => {
        if (!active) return;
        setError(err.apiMessage || err.message || "Arkadaş profili yüklenemedi");
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (status === "loading") {
    return <p className={textMuted}>Profil yükleniyor…</p>;
  }

  if (status === "error") {
    return (
      <section className={card}>
        <p className={alertError} role="alert">
          {error}
        </p>
        <Link to={appRoutes.friends} className="mt-4 inline-block text-sm font-semibold text-sky-700 underline underline-offset-2">
          Arkadaşlara geri dön
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className={card}>
        <Link to={appRoutes.friends} className="text-sm font-semibold text-sky-700 underline underline-offset-2">
          ← Arkadaşlara geri dön
        </Link>
        <h1 className={`${headingPage} mt-3`}>Arkadaş profili</h1>
        <div className="mt-5 flex items-center gap-3">
          {user?.profilePhoto ? (
            <img src={user.profilePhoto} alt="Profil fotoğrafı" className="h-16 w-16 rounded-full border border-sky-100 object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-sky-100 bg-sky-50 text-lg font-semibold text-sky-700">
              {(user?.name || user?.username || "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-lg font-semibold text-stone-800">
              {[user?.name, user?.surname].filter(Boolean).join(" ") || user?.username || "Kullanıcı"}
            </p>
            {user?.username ? <p className={textMuted}>@{user.username}</p> : null}
          </div>
        </div>
      </section>

      <section className={card} aria-labelledby="friend-favorites-heading">
        <h2 id="friend-favorites-heading" className={headingSection}>
          Favori mekanları
        </h2>
        {favorites.length === 0 ? (
          <p className={`mt-4 ${textMuted}`}>Henüz favori mekan paylaşılmamış.</p>
        ) : (
          <ul className="mt-6 divide-y divide-sky-100/60">
            {favorites.map((v) => {
              const vid = venueRefId(v);
              const name = v?.name ?? "Mekan";
              const category = toTurkishCategory(v?.category ?? "");
              return (
                <li key={vid || name} className="py-4 first:pt-0">
                  <Link
                    to={vid ? appRoutes.venueDetail.replace(":id", vid) : appRoutes.venues}
                    className="text-base font-semibold text-sky-800 transition hover:text-pink-600"
                  >
                    {name}
                  </Link>
                  {category ? (
                    <p className="mt-1">
                      <span className={pillCategory}>{category}</span>
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={card} aria-labelledby="friend-posts-heading">
        <h2 id="friend-posts-heading" className={headingSection}>
          Paylaşımları
        </h2>
        {!canSeePosts ? (
          <p className={`mt-4 ${textMuted}`}>Bu kullanıcının paylaşımları gizli.</p>
        ) : posts.length === 0 ? (
          <p className={`mt-4 ${textMuted}`}>Henüz paylaşım yok.</p>
        ) : (
          <ul className="mt-6 divide-y divide-sky-100/60">
            {posts.map((post) => {
              const pid = String(post?._id ?? "");
              return (
                <li key={pid} className="py-5 first:pt-0">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{post?.text ?? ""}</p>
                  {post?.photoUrl ? (
                    <img
                      src={post.photoUrl}
                      alt="Paylaşım görseli"
                      className="mt-3 max-h-64 rounded-xl border border-sky-100 object-cover"
                    />
                  ) : null}
                  <p className={`mt-3 ${textSmall}`}>
                    {post?.createdAt
                      ? new Date(post.createdAt).toLocaleString("tr-TR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section className={card} aria-labelledby="friend-comments-heading">
        <h2 id="friend-comments-heading" className={headingSection}>
          Yorumları
        </h2>
        {!canSeeComments ? (
          <p className={`mt-4 ${textMuted}`}>Bu kullanıcının yorumları gizli.</p>
        ) : comments.length === 0 ? (
          <p className={`mt-4 ${textMuted}`}>Henüz yorum yok.</p>
        ) : (
          <ul className="mt-6 divide-y divide-sky-100/60">
            {comments.map((comment) => {
              const cid = String(comment?._id ?? "");
              const venueId = String(comment?.venue?._id ?? "");
              const venueName = String(comment?.venue?.name ?? "Mekan");
              return (
                <li key={cid} className="py-5 first:pt-0">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{comment?.text ?? ""}</p>
                  {comment?.photoUrl ? (
                    <img
                      src={comment.photoUrl}
                      alt="Yorum görseli"
                      className="mt-3 max-h-64 rounded-xl border border-sky-100 object-cover"
                    />
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <Link
                      to={venueId ? appRoutes.venueDetail.replace(":id", venueId) : appRoutes.venues}
                      className="text-sm font-semibold text-sky-700 underline underline-offset-2"
                    >
                      {venueName}
                    </Link>
                    <p className={textSmall}>
                      {comment?.createdAt
                        ? new Date(comment.createdAt).toLocaleString("tr-TR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
