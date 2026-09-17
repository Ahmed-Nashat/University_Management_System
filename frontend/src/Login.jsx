import { useState } from "react";
import {
  GraduationCap,
  ArrowRight,
  ArrowUpRight,
  LoaderCircle,
} from "lucide-react";
import { request } from "./api.js";

export default function Login({ onLogin, onDemo }) {
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const user = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ ...fields, role }),
      });
      await onLogin(user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <header className="login-brand brand">
        <GraduationCap size={30} strokeWidth={1.6} />
        <span>
          campus<span className="brand-dot">.</span>
        </span>
      </header>
      <main className="login-layout">
        <section className="login-intro">
          <p className="eyebrow">ROOM TO GROW</p>
          <h1>
            Your next chapter
            <br />
            starts here.
          </h1>
          <p>
            Classes, connections, and everything
            <br />
            you’re working toward.
          </p>
          <div className="login-art" aria-hidden="true">
            <div className="art-line" />
            <div className="art-course">
              <span>CS201</span>
              <strong>Database Systems</strong>
              <small>09:00 · Room B201</small>
            </div>
            <div className="art-course second">
              <span>CS202</span>
              <strong>Data Structures</strong>
              <small>13:00 · Room B205</small>
            </div>
            <div className="art-float glass">
              <GraduationCap size={21} />
              <span>Your future, in focus.</span>
            </div>
          </div>
        </section>
        <section className="login-form-panel">
          <div className="segmented glass login-role-switch" data-role={role} aria-label="Sign-in role">
            <button
              type="button"
              className={role === "student" ? "selected" : ""}
              aria-pressed={role === "student"}
              onClick={() => {
                setRole("student");
                setError("");
              }}
              disabled={busy}
            >
              Student
            </button>
            <button
              type="button"
              className={role === "professor" ? "selected" : ""}
              aria-pressed={role === "professor"}
              onClick={() => {
                setRole("professor");
                setError("");
              }}
              disabled={busy}
            >
              Professor
            </button>
          </div>
          <h2>Welcome back.</h2>
          <p key={`description-${role}`} className="login-role-copy">
            {role === "student"
              ? "Enter your student number to find your space."
              : "Sign in to your academic workspace."}
          </p>
          <form onSubmit={submit} className="login-transition-form">
            {role === "student" ? (
              <div className="field login-identity" key="student">
                <label htmlFor="login-number">Student number</label>
                <input
                  id="login-number"
                  name="studentNumber"
                  placeholder="STD-2026-0001"
                  autoComplete="username"
                  required
                  disabled={busy}
                />
              </div>
            ) : (
                <div className="field login-identity" key="professor">
                  <label htmlFor="login-email">Email address</label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="you@university.edu"
                    autoComplete="username"
                    required
                    disabled={busy}
                  />
                </div>
            )}
            <div className={`login-password-reveal ${role === "professor" ? "is-visible" : ""}`} aria-hidden={role !== "professor"} inert={role !== "professor"}>
              <div className="login-password-inner">
                <div className="field">
                  <label htmlFor="login-password">Password</label>
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    required={role === "professor"}
                    disabled={busy || role !== "professor"}
                  />
                </div>
              </div>
            </div>
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary" disabled={busy}>
              {busy ? (
                <>
                  <LoaderCircle className="spin" size={18} />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          <div className="preview-option">
            <span>Just taking a look?</span>
            <button onClick={() => onDemo(role)} disabled={busy}>
              Explore the {role} preview
              <ArrowUpRight size={15} />
            </button>
          </div>
        </section>
      </main>
      <footer className="login-footer">
        <span>UNIVERSITY MANAGEMENT SYSTEM</span>
        <span>A little structure. A world of possibility.</span>
      </footer>
    </div>
  );
}
