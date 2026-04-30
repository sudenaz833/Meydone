import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import FloatingField from "../components/FloatingField";
import api from "../services/api";
import { AUTH_TOKEN_KEY } from "../utils/constants";
import { appRoutes } from "../utils/routes";
import { IoChevronBack } from 'react-icons/io5'; // 1. İkonu ekledik
import {
  alertError,
  authBtnPrimary,
  authCard,
  authHeading,
  authPageGlow,
  authPageWash,
  authPageWrap,
  authSubtext,
  linkAccent,
  textMuted,
} from "../utils/ui";

const LOGIN_VALIDATION_MESSAGE =
  "Lütfen zorunlu alanları eksiksiz ve doğru formatta doldurunuz.";

function isValidEmailShape(value) {
  return /^\S+@\S+\.\S+$/.test(String(value).trim());
}

function extractToken(payload) {
  if (!payload || typeof payload !== "object") return null;
  const inner = payload.data && typeof payload.data === "object" ? payload.data : null;
  const candidates = [
    payload.token,
    payload.accessToken,
    payload.jwt,
    inner?.token,
    inner?.accessToken,
    inner?.jwt,
  ];
  const found = candidates.find((v) => typeof v === "string" && v.length > 0);
  return found ?? null;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function performLogin(loginEmail, loginPassword) {
    setError("");
    setSubmitting(true);

    try {
      const { data } = await api.post("/auth/login", {
        email: loginEmail.trim(),
        password: loginPassword,
      });
      const token = extractToken(data);

      if (!token) {
        setError("Giriş başarılı ancak sunucu token döndürmedi. API yanıtını kontrol edin.");
        return;
      }

      localStorage.setItem(AUTH_TOKEN_KEY, token);
      const from = location.state?.from;
      const dest =
        from && typeof from.pathname === "string"
          ? `${from.pathname}${from.search || ""}`
          : appRoutes.home;
      navigate(dest, { replace: true });
    } catch (err) {
      const status = err.apiStatus;
      if (status === 400) {
        setError(LOGIN_VALIDATION_MESSAGE);
        return;
      }
      setError(err.apiMessage || err.message || "Giriş başarısız");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const id = String(email ?? "").trim();
    const pass = String(password ?? "");

    if (!id || !pass.trim()) {
      setError(LOGIN_VALIDATION_MESSAGE);
      return;
    }

    if (id.includes("@") && !isValidEmailShape(id)) {
      setError(LOGIN_VALIDATION_MESSAGE);
      return;
    }

    performLogin(id, pass);
  }

  return (
    <div className={`${authPageWrap} relative`}> {/* relative ekledik ki buton buraya göre hizalansın */}
      <div className={authPageWash} aria-hidden />
      <div className={authPageGlow} aria-hidden />

      {/* 2. GERİ TUŞU: Ekranın sol üstüne şık bir buton */}
      <button 
        onClick={() => navigate(appRoutes.home)} 
        className="absolute top-6 left-6 p-2 rounded-full bg-white/20 hover:bg-white/40 active:scale-95 transition-all z-20 text-slate-700"
        title="Geri Dön"
      >
        <IoChevronBack size={28} />
      </button>

      <section className={authCard}>
        <h1 className={authHeading}>Tekrar hoş geldiniz</h1>
        <p className={authSubtext}>E-posta/kullanıcı adı ve şifrenizle giriş yapın.</p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <FloatingField
            id="login-email"
            label="E-posta veya kullanıcı adı"
            type="text"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FloatingField
            id="login-password"
            label="Şifre"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error ? (
            <p className={alertError} role="alert">
              {error}
            </p>
          ) : null}

          <div className="pt-1">
            <button type="submit" disabled={submitting} className={authBtnPrimary}>
              {submitting ? "Giriş yapılıyor…" : "Giriş Yap"}
            </button>
          </div>
        </form>

        <p className={`mt-10 text-center text-sm ${textMuted}`}>
          Hesabınız yok mu?{" "}
          <Link to={appRoutes.register} className={linkAccent}>
            Üye olun
          </Link>
        </p>
      </section>
    </div>
  );
}