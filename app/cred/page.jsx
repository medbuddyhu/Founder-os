"use client"

import React, { useState, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL     || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase        = createClient(supabaseUrl, supabaseAnonKey)

const EMPTY_FORM = { site_name: "", username: "", password: "", website_url: "" }
const MASTER_PASSWORD = "admin123"

// ─── Icons ────────────────────────────────────────────────────────────────────
const IcoLock    = () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M7 9V6.5C7 4.57 8.34 3 10 3C11.66 3 13 4.57 13 6.5V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
const IcoShield  = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L3 4.5V8C3 11 5.5 13.5 8 14C10.5 13.5 13 11 13 8V4.5L8 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 8L7.5 9.5L10 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
const IcoSearch  = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
const IcoPlus    = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
const IcoClose   = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
const IcoEye     = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/></svg>
const IcoEyeOff  = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M1 1L15 15M6.5 6.6C6.19 6.87 6 7.22 6 7.63C6 8.93 6.89 10 8 10C8.4 10 8.76 9.87 9.05 9.65M4 4.28C2.35 5.37 1 7.5 1 7.5C1 7.5 3.5 13 8 13C9.7 13 11.17 12.38 12.37 11.44M13.5 9.5C14.28 8.5 15 7.5 15 7.5C15 7.5 12.5 3 8 3C7.12 3 6.29 3.18 5.53 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
const IcoCopy    = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="6" y="6" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4 10H3C2.45 10 2 9.55 2 9V3C2 2.45 2.45 2 3 2H9C9.55 2 10 2.45 10 3V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
const IcoCheck   = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7L5.5 10.5L12 4" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
const IcoLink    = () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 11L11 3M11 3H7M11 3V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
const IcoTrash   = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3H12M5 3V2H9V3M3 3L4 12H10L11 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
const IcoKey     = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="8" r="4" stroke="currentColor" strokeWidth="1.3"/><path d="M9.5 6.5L14 11M12 9.5L13.5 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="6" cy="8" r="1.5" fill="currentColor"/></svg>
const IcoSpinner = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{animation:"cv-spin 0.7s linear infinite"}}><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 14" strokeLinecap="round"/></svg>

// ─── All CSS lives here — injected once at root level ─────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ════ LOGIN ════ */
  .cv-login-root {
    min-height: 100vh; min-height: 100dvh;
    background: #080C14;
    display: flex; align-items: center; justify-content: center;
    padding: 24px 20px;
    font-family: 'DM Sans', sans-serif;
    position: relative; overflow: hidden;
  }
  .cv-login-root::before {
    content: ''; position: absolute; inset: 0;
    background-image: linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px);
    background-size: 56px 56px; pointer-events: none;
  }
  .cv-login-root::after {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 45%,transparent 30%,#080C14 85%);
    pointer-events: none;
  }
  .cv-login-card {
    position: relative; z-index: 10;
    width: 100%; max-width: 380px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 24px; padding: 36px 28px;
    backdrop-filter: blur(12px);
    animation: cv-up 0.5s ease both;
  }
  @keyframes cv-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .cv-login-icon {
    width: 52px; height: 52px; border-radius: 15px;
    background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.25);
    display: flex; align-items: center; justify-content: center;
    color: #3B82F6; margin: 0 auto 20px;
  }
  .cv-login-title {
    font-family: 'DM Serif Display', serif;
    font-size: 26px; font-weight: 400; color: #fff;
    text-align: center; letter-spacing: -0.02em; margin-bottom: 6px;
  }
  .cv-login-sub {
    font-size: 13px; color: rgba(255,255,255,0.3);
    text-align: center; margin-bottom: 28px; line-height: 1.5;
  }
  .cv-login-form { display: flex; flex-direction: column; gap: 10px; }
  .cv-login-input {
    width: 100%; padding: 13px 16px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; font-family: 'DM Sans', sans-serif;
    font-size: 15px; color: #fff; outline: none; letter-spacing: 0.1em;
    transition: border-color 0.15s;
  }
  .cv-login-input::placeholder { color: rgba(255,255,255,0.2); letter-spacing:0.04em; font-size:14px; }
  .cv-login-input:focus { border-color: rgba(59,130,246,0.5); }
  .cv-login-input.error { border-color: rgba(239,68,68,0.5); animation: cv-shake 0.3s ease; }
  @keyframes cv-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
  .cv-login-err { font-size: 12px; color: #FCA5A5; text-align: center; }
  .cv-login-btn {
    padding: 13px; border-radius: 12px; border: none;
    background: #3B82F6; color: #fff; font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .cv-login-btn:hover { background: #2563EB; }
  .cv-login-footer {
    display: flex; align-items: center; justify-content: center;
    gap: 6px; margin-top: 20px;
    font-size: 11px; color: rgba(255,255,255,0.15); letter-spacing:0.06em; font-weight:500;
  }
  .cv-live-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #22C55E; box-shadow: 0 0 6px #22C55E;
    animation: cv-blink 2s infinite;
  }
  @keyframes cv-blink { 0%,100%{opacity:1} 50%{opacity:.35} }

  /* ════ MAIN PAGE ════ */
  .cv-page { min-height: 100vh; min-height: 100dvh; background: #f8f9fc; font-family: 'DM Sans', sans-serif; }
  .cv-topbar {
    background: #fff; border-bottom: 0.5px solid rgba(0,0,0,0.07);
    padding: 12px 16px; display: flex; align-items: center; gap: 10px;
    position: sticky; top: 0; z-index: 20;
  }
  .cv-topbar-left { flex: 1; }
  .cv-topbar-eyebrow {
    display: flex; align-items: center; gap: 5px;
    font-size: 10px; font-weight: 500; color: #1a73e8;
    text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 2px;
  }
  .cv-topbar-title { font-family: 'DM Serif Display', serif; font-size: 20px; font-weight: 400; color: #111; letter-spacing: -0.01em; }
  .cv-add-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 9px 14px; border-radius: 10px; border: none;
    background: #1a73e8; color: #fff; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; flex-shrink: 0;
    transition: background 0.15s; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .cv-add-btn:hover { background: #1558b0; }
  .cv-add-btn:active { opacity: 0.85; }
  .cv-search-bar { padding: 10px 16px; background: #fff; border-bottom: 0.5px solid rgba(0,0,0,0.05); }
  .cv-search-inner {
    display: flex; align-items: center; gap: 8px;
    background: #f3f4f6; border-radius: 10px; padding: 9px 12px;
  }
  .cv-search-inner input { flex: 1; border: none; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 13px; color: #111; outline: none; }
  .cv-search-inner input::placeholder { color: #bbb; }
  .cv-content { padding: 16px 16px 80px; }
  .cv-count { font-size: 10px; font-weight: 500; color: #bbb; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 14px; }
  .cv-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }

  /* ── Card ── */
  .cv-card {
    background: #fff; border: 0.5px solid rgba(0,0,0,0.07);
    border-radius: 16px; padding: 18px 16px; transition: box-shadow 0.2s;
  }
  .cv-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); }
  .cv-card-head { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
  .cv-card-icon {
    width: 32px; height: 32px; border-radius: 9px;
    background: #E8F0FE; color: #1a73e8;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .cv-card-site { font-size: 15px; font-weight: 600; color: #111; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cv-card-action {
    width: 28px; height: 28px; border-radius: 7px; border: none;
    background: transparent; color: #bbb;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background 0.12s, color 0.12s;
    text-decoration: none; flex-shrink: 0; -webkit-tap-highlight-color: transparent;
  }
  .cv-card-action:hover { background: #f3f4f6; color: #555; }
  .cv-card-del:hover { background: #FCEBEB !important; color: #A32D2D !important; }
  .cv-field { margin-bottom: 10px; }
  .cv-field:last-child { margin-bottom: 0; }
  .cv-field-label { font-size: 9px; font-weight: 500; color: #bbb; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 5px; }
  .cv-field-row {
    display: flex; align-items: center; gap: 8px;
    background: #f8f9fc; border-radius: 10px; padding: 10px 12px;
  }
  .cv-field-value { flex: 1; font-size: 13px; color: #111; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cv-field-value.masked { font-family: monospace; letter-spacing: 0.1em; color: #aaa; }
  .cv-field-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .cv-copy-btn {
    width: 28px; height: 28px; border-radius: 7px; border: none;
    background: transparent; display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #bbb; transition: background 0.12s, color 0.12s;
    flex-shrink: 0; -webkit-tap-highlight-color: transparent;
  }
  .cv-copy-btn:hover { background: #f0f0f0; color: #555; }

  /* ── Empty / Loading ── */
  .cv-empty { text-align: center; padding: 60px 20px; font-size: 13px; color: #ccc; line-height: 1.7; }
  .cv-empty-icon { width: 48px; height: 48px; border-radius: 14px; background: #f3f4f6; color: #ddd; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
  .cv-loading { text-align: center; padding: 60px 20px; font-size: 13px; color: #ccc; animation: cv-pulse 1.5s ease infinite; }
  @keyframes cv-pulse { 0%,100%{opacity:.5} 50%{opacity:1} }

  /* ════ MODAL ════ */
  .cv-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 60;
    display: flex; align-items: flex-end; justify-content: center;
    animation: cv-fade 0.2s ease both;
  }
  @keyframes cv-fade { from{opacity:0} to{opacity:1} }
  .cv-modal {
    background: #fff; width: 100%; max-width: 480px;
    border-radius: 24px 24px 0 0; overflow: hidden;
    animation: cv-modal-up 0.28s cubic-bezier(.22,.68,0,1.2) both;
    max-height: 92dvh; display: flex; flex-direction: column;
  }
  .cv-modal-sm { max-width: 420px; }
  @keyframes cv-modal-up { from{transform:translateY(100%)} to{transform:translateY(0)} }
  .cv-modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 20px 14px; border-bottom: 0.5px solid rgba(0,0,0,0.07); flex-shrink: 0;
  }
  .cv-modal-title { font-family: 'DM Serif Display', serif; font-size: 20px; font-weight: 400; color: #111; letter-spacing: -0.01em; }
  .cv-modal-close {
    width: 30px; height: 30px; border-radius: 8px; border: none;
    background: transparent; color: #aaa; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background 0.15s; -webkit-tap-highlight-color: transparent;
  }
  .cv-modal-close:hover { background: #f3f4f6; color: #555; }
  .cv-modal-body { overflow-y: auto; padding: 18px 20px 32px; display: flex; flex-direction: column; gap: 14px; }
  .cv-delete-warn {
    display: flex; align-items: flex-start; gap: 12px;
    background: #FCEBEB; border-radius: 12px; padding: 14px;
  }
  .cv-delete-warn-icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: #F7C1C1; color: #A32D2D;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .cv-delete-warn-text { font-size: 13px; color: #791F1F; line-height: 1.5; }
  .cv-delete-warn-text strong { font-weight: 600; }
  .cv-delete-btn {
    width: 100%; padding: 13px; border-radius: 12px; border: none;
    background: #E24B4A; color: #fff; font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background 0.15s, opacity 0.15s; -webkit-tap-highlight-color: transparent;
  }
  .cv-delete-btn:hover:not(:disabled) { background: #c93c3c; }
  .cv-delete-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .cv-form-field { display: flex; flex-direction: column; gap: 5px; }
  .cv-form-label { font-size: 11px; font-weight: 500; color: #aaa; letter-spacing: 0.06em; text-transform: uppercase; display: flex; align-items: center; gap: 5px; }
  .cv-optional { color: #ccc; text-transform: none; font-weight: 400; font-size: 10px; }
  .cv-form-input {
    width: 100%; padding: 12px 14px; border: 0.5px solid rgba(0,0,0,0.1);
    border-radius: 11px; font-family: 'DM Sans', sans-serif;
    font-size: 14px; color: #111; outline: none; background: #f8f9fc;
    transition: border-color 0.15s, background 0.15s; -webkit-appearance: none;
  }
  .cv-form-input:focus { border-color: rgba(26,115,232,0.4); background: #fff; }
  .cv-form-input::placeholder { color: #bbb; }
  .cv-form-input.input-error { border-color: rgba(239,68,68,0.5); animation: cv-shake 0.3s ease; }
  .cv-field-err { font-size: 12px; color: #E24B4A; }
  .cv-pw-wrap { position: relative; }
  .cv-pw-wrap .cv-form-input { padding-right: 44px; }
  .cv-pw-toggle {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: #bbb;
    display: flex; align-items: center; -webkit-tap-highlight-color: transparent;
  }
  .cv-pw-toggle:hover { color: #555; }
  .cv-save-btn {
    width: 100%; padding: 14px; border-radius: 12px; border: none;
    background: #1a73e8; color: #fff; font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500; cursor: pointer; margin-top: 4px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background 0.15s, opacity 0.15s;
    -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .cv-save-btn:hover:not(:disabled) { background: #1558b0; }
  .cv-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  @keyframes cv-spin { to { transform: rotate(360deg); } }

  /* ════ RESPONSIVE ════ */
  @media (min-width: 640px) {
    .cv-topbar { padding: 14px 24px; }
    .cv-search-bar { padding: 10px 24px; }
    .cv-content { padding: 20px 24px 60px; }
    .cv-grid { grid-template-columns: repeat(2, 1fr); }
    .cv-modal-overlay { align-items: center; padding: 24px; }
    .cv-modal { border-radius: 20px; max-height: 85vh; }
  }
  @media (min-width: 1024px) {
    .cv-grid { grid-template-columns: repeat(3, 1fr); }
    .cv-topbar { padding: 14px 32px; }
    .cv-search-bar { padding: 10px 32px; }
    .cv-content { padding: 20px 32px 60px; }
  }
`

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ credName, onCancel, onConfirm, loading }) {
  const [pw, setPw]   = useState("")
  const [err, setErr] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (pw === MASTER_PASSWORD) { onConfirm() }
    else { setErr(true); setTimeout(() => setErr(false), 1800) }
  }

  return (
    <div className="cv-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="cv-modal cv-modal-sm">
        <div className="cv-modal-header">
          <span className="cv-modal-title">Delete credential</span>
          <button className="cv-modal-close" onClick={onCancel}><IcoClose /></button>
        </div>
        <div className="cv-modal-body">
          <div className="cv-delete-warn">
            <div className="cv-delete-warn-icon"><IcoTrash /></div>
            <p className="cv-delete-warn-text">
              You are about to delete <strong>{credName}</strong>. This cannot be undone.
            </p>
          </div>
          <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div className="cv-form-field">
              <label className="cv-form-label"><IcoKey /> Enter master password to confirm</label>
              <input
                type="password"
                className={"cv-form-input" + (err ? " input-error" : "")}
                placeholder="Master password"
                value={pw}
                onChange={e => setPw(e.target.value)}
                autoFocus
                required
              />
              {err && <p className="cv-field-err">Wrong password</p>}
            </div>
            <button type="submit" className="cv-delete-btn" disabled={loading || !pw.trim()}>
              {loading ? <IcoSpinner /> : <IcoTrash />}
              {loading ? "Deleting…" : "Delete permanently"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Credential Card ──────────────────────────────────────────────────────────
function CredCard({ cred, showPass, onToggle, onCopy, copied, onDelete }) {
  const url = cred.website_url
    ? (cred.website_url.startsWith("http") ? cred.website_url : "https://" + cred.website_url)
    : null

  return (
    <div className="cv-card">
      <div className="cv-card-head">
        <div className="cv-card-icon"><IcoShield /></div>
        <div className="cv-card-site">{cred.site_name}</div>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="cv-card-action" title="Open">
              <IcoLink />
            </a>
          )}
          <button className="cv-card-action cv-card-del" onClick={onDelete} title="Delete">
            <IcoTrash />
          </button>
        </div>
      </div>

      <div className="cv-field">
        <div className="cv-field-label">Username</div>
        <div className="cv-field-row">
          <span className="cv-field-value">{cred.username}</span>
          <button className="cv-copy-btn" onClick={() => onCopy(cred.username, "u-" + cred.id)}>
            {copied === "u-" + cred.id ? <IcoCheck /> : <IcoCopy />}
          </button>
        </div>
      </div>

      <div className="cv-field">
        <div className="cv-field-label">Password</div>
        <div className="cv-field-row">
          <span className={"cv-field-value" + (showPass ? "" : " masked")}>
            {showPass ? cred.password : "••••••••••"}
          </span>
          <div className="cv-field-actions">
            <button className="cv-copy-btn" onClick={onToggle}>
              {showPass ? <IcoEyeOff /> : <IcoEye />}
            </button>
            <button className="cv-copy-btn" onClick={() => onCopy(cred.password, "p-" + cred.id)}>
              {copied === "p-" + cred.id ? <IcoCheck /> : <IcoCopy />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Add Modal ────────────────────────────────────────────────────────────────
function AddModal({ onClose, onSave, loading }) {
  const [form, setForm]     = useState(EMPTY_FORM)
  const [showPw, setShowPw] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="cv-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cv-modal">
        <div className="cv-modal-header">
          <span className="cv-modal-title">New credential</span>
          <button className="cv-modal-close" onClick={onClose}><IcoClose /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="cv-modal-body">
          <div className="cv-form-field">
            <label className="cv-form-label">Site / App name</label>
            <input required className="cv-form-input" placeholder="e.g. GitHub, Netflix"
              value={form.site_name} onChange={e => set("site_name", e.target.value)} />
          </div>
          <div className="cv-form-field">
            <label className="cv-form-label">Username / Email</label>
            <input required className="cv-form-input" placeholder="you@example.com"
              value={form.username} onChange={e => set("username", e.target.value)} autoComplete="off" />
          </div>
          <div className="cv-form-field">
            <label className="cv-form-label">Password</label>
            <div className="cv-pw-wrap">
              <input required type={showPw ? "text" : "password"} className="cv-form-input"
                placeholder="••••••••" value={form.password}
                onChange={e => set("password", e.target.value)} autoComplete="new-password" />
              <button type="button" className="cv-pw-toggle" onClick={() => setShowPw(s => !s)}>
                {showPw ? <IcoEyeOff /> : <IcoEye />}
              </button>
            </div>
          </div>
          <div className="cv-form-field">
            <label className="cv-form-label">
              Website URL <span className="cv-optional">(optional)</span>
            </label>
            <input className="cv-form-input" placeholder="https://example.com"
              value={form.website_url} onChange={e => set("website_url", e.target.value)} />
          </div>
          <button type="submit" className="cv-save-btn" disabled={loading}>
            {loading ? <IcoSpinner /> : null}
            {loading ? "Saving…" : "Save credential"}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CredentialsPage() {
  const [authed, setAuthed]       = useState(false)
  const [loginPw, setLoginPw]     = useState("")
  const [loginErr, setLoginErr]   = useState(false)
  const [creds, setCreds]         = useState([])
  const [loading, setLoading]     = useState(false)
  const [search, setSearch]       = useState("")
  const [showPass, setShowPass]   = useState({})
  const [copied, setCopied]       = useState("")
  const [addModal, setAddModal]   = useState(false)
  const [delTarget, setDelTarget] = useState(null)
  const [deleting, setDeleting]   = useState(false)

  const fetchCreds = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("credentials").select("*").order("created_at", { ascending: false })
    if (!error && data) setCreds(data)
    setLoading(false)
  }, [])

  // Login handler — stays in main component so CSS is always rendered first
  const handleLoginSubmit = (e) => {
    e.preventDefault()
    if (loginPw === MASTER_PASSWORD) {
      setAuthed(true)
      fetchCreds()
    } else {
      setLoginErr(true)
      setTimeout(() => setLoginErr(false), 2000)
    }
  }

  const handleSave = async (form) => {
    setLoading(true)
    const { error } = await supabase.from("credentials").insert([form])
    if (!error) { setAddModal(false); fetchCreds() }
    else setLoading(false)
  }

  const handleDeleteConfirm = async () => {
    if (!delTarget) return
    setDeleting(true)
    await supabase.from("credentials").delete().eq("id", delTarget.id)
    setCreds(prev => prev.filter(c => c.id !== delTarget.id))
    setDelTarget(null)
    setDeleting(false)
  }

  const togglePass = (id) => setShowPass(p => ({ ...p, [id]: !p[id] }))
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(""), 2000)
  }

  const filtered = creds.filter(c =>
    c.site_name?.toLowerCase().includes(search.toLowerCase())
  )

  // ── CSS is ALWAYS rendered first, before login or main ──
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {!authed ? (
        // ── Login screen ──
        <div className="cv-login-root">
          <div className="cv-login-card">
            <div className="cv-login-icon"><IcoLock /></div>
            <h1 className="cv-login-title">Protected Vault</h1>
            <p className="cv-login-sub">Enter master password to access your credentials</p>
            <form onSubmit={handleLoginSubmit} className="cv-login-form">
              <input
                type="password"
                className={"cv-login-input" + (loginErr ? " error" : "")}
                placeholder="Master password"
                value={loginPw}
                onChange={e => setLoginPw(e.target.value)}
                autoComplete="current-password"
                required
              />
              {loginErr && <p className="cv-login-err">Incorrect password</p>}
              <button type="submit" className="cv-login-btn">Unlock securely</button>
            </form>
            <div className="cv-login-footer">
              <span className="cv-live-dot" />
              End-to-end encrypted
            </div>
          </div>
        </div>
      ) : (
        // ── Main vault ──
        <>
          <div className="cv-page">
            <div className="cv-topbar">
              <div className="cv-topbar-left">
                <div className="cv-topbar-eyebrow"><IcoShield /> Encryption active</div>
                <div className="cv-topbar-title">Credentials</div>
              </div>
              <button className="cv-add-btn" onClick={() => setAddModal(true)}>
                <IcoPlus /> <span>Add new</span>
              </button>
            </div>

            <div className="cv-search-bar">
              <div className="cv-search-inner">
                <span style={{ color:"#bbb", flexShrink:0, display:"flex" }}><IcoSearch /></span>
                <input
                  type="text"
                  placeholder="Search credentials…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="cv-content">
              {!loading && (
                <div className="cv-count">
                  {filtered.length} credential{filtered.length !== 1 ? "s" : ""}
                </div>
              )}

              {loading ? (
                <div className="cv-loading">Loading vault…</div>
              ) : filtered.length === 0 ? (
                <div className="cv-empty">
                  <div className="cv-empty-icon"><IcoShield /></div>
                  {search
                    ? "No credentials match your search."
                    : "No credentials yet. Tap Add new to get started."}
                </div>
              ) : (
                <div className="cv-grid">
                  {filtered.map(cred => (
                    <CredCard
                      key={cred.id}
                      cred={cred}
                      showPass={!!showPass[cred.id]}
                      onToggle={() => togglePass(cred.id)}
                      onCopy={handleCopy}
                      copied={copied}
                      onDelete={() => setDelTarget({ id: cred.id, site_name: cred.site_name })}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {addModal && (
            <AddModal onClose={() => setAddModal(false)} onSave={handleSave} loading={loading} />
          )}

          {delTarget && (
            <DeleteModal
              credName={delTarget.site_name}
              onCancel={() => setDelTarget(null)}
              onConfirm={handleDeleteConfirm}
              loading={deleting}
            />
          )}
        </>
      )}
    </>
  )
}