"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"

// ─── Constants ────────────────────────────────────────────────────────────────
const BUCKET = "founder-vault"   // your Supabase Storage bucket name

const FILE_META = {
  pdf:   { label: "PDF",  bg: "#FCEBEB", color: "#A32D2D" },
  image: { label: "IMG",  bg: "#FAEEDA", color: "#BA7517" },
  doc:   { label: "DOC",  bg: "#E8F0FE", color: "#1a73e8" },
  link:  { label: "LINK", bg: "#E1F5EE", color: "#1D9E75" },
  other: { label: "FILE", bg: "#F1EFE8", color: "#5F5E5A" },
}

function getKind(file) {
  const t = file.type || ""
  if (t === "link") return "link"
  if (t.includes("pdf")) return "pdf"
  if (t.startsWith("image/")) return "image"
  if (t.includes("word") || t.includes("text") || t.includes("document") || t.includes("sheet")) return "doc"
  return "other"
}

function fmtSize(bytes) {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fmtDate(iso) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })
}

// ─── Preview Modal ────────────────────────────────────────────────────────────
function PreviewModal({ item, onClose }) {
  const kind = getKind(item)

  useEffect(() => {
    document.body.style.overflow = "hidden"
    const onKey = (e) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey) }
  }, [onClose])

  return (
    <div className="fv-modal-overlay" onClick={onClose}>
      <div className="fv-modal" onClick={e => e.stopPropagation()}>
        <div className="fv-modal-header">
          <span className="fv-modal-title">{item.name}</span>
          <button className="fv-modal-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 3L13 13M13 3L3 13" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="fv-modal-body">
          {kind === "image" && item.url && (
            <img src={item.url} alt={item.name} className="fv-preview-img" />
          )}
          {kind === "pdf" && item.url && (
            <iframe src={item.url} className="fv-preview-iframe" title={item.name} />
          )}
          {kind === "link" && (
            <div className="fv-preview-link">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M13 19L19 13M10 13H8C5.8 13 4 14.8 4 17C4 19.2 5.8 21 8 21H12M22 19H24C26.2 19 28 17.2 28 15C28 12.8 26.2 11 24 11H20" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p className="fv-preview-link-url">{item.url}</p>
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="fv-open-btn">
                Open link
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M3 13L13 3M13 3H8M13 3V8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          )}
          {(kind === "doc" || kind === "other") && item.url && (
            <div className="fv-preview-doc">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect x="6" y="4" width="28" height="32" rx="3" stroke="#1a73e8" strokeWidth="1.5"/>
                <path d="M12 14H28M12 20H28M12 26H22" stroke="#1a73e8" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p className="fv-preview-doc-name">{item.name}</p>
              <a href={item.url} download={item.name} className="fv-open-btn">
                Download file
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V11M5 8L8 11L11 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 13H13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FileVault() {
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)
  const [preview, setPreview]     = useState(null)
  const [dragOver, setDragOver]   = useState(false)
  const [tab, setTab]             = useState("all")   // all | pdf | image | doc | link
  const [linkInput, setLinkInput] = useState("")
  const [linkName, setLinkName]   = useState("")
  const [addingLink, setAddingLink] = useState(false)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [search, setSearch]       = useState("")
  const fileInputRef              = useRef(null)

  // ── Fetch all items from Supabase ──
  const fetchItems = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("vault_items")
      .select("*")
      .order("created_at", { ascending: false })
    if (!error && data) setItems(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  // ── Upload file to Supabase Storage + insert row ──
  const uploadFile = async (file) => {
    setUploading(true)
    setUploadPct(10)

    const ext  = file.name.split(".").pop()
    const path = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`

    // Upload to storage
    const { error: storageErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false })

    if (storageErr) { setUploading(false); setUploadPct(0); return }
    setUploadPct(70)

    // Get public URL
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
    const url = urlData?.publicUrl || ""
    setUploadPct(90)

    // Insert row into vault_items table
    await supabase.from("vault_items").insert([{
      name:       file.name,
      type:       file.type,
      size:       file.size,
      url,
      path,
      created_at: new Date().toISOString(),
    }])

    setUploadPct(100)
    setTimeout(() => { setUploading(false); setUploadPct(0); fetchItems() }, 400)
  }

  // ── Handle file input change ──
  const onFileChange = async (e) => {
    const files = Array.from(e.target.files || [])
    for (const f of files) await uploadFile(f)
    e.target.value = ""
  }

  // ── Drag & drop ──
  const onDrop = async (e) => {
    e.preventDefault(); setDragOver(false)
    const files = Array.from(e.dataTransfer.files || [])
    for (const f of files) await uploadFile(f)
  }

  // ── Save link ──
  const saveLink = async () => {
    if (!linkInput.trim()) return
    setAddingLink(true)
    const name = linkName.trim() || linkInput.trim()
    await supabase.from("vault_items").insert([{
      name,
      type:       "link",
      size:       null,
      url:        linkInput.trim().startsWith("http") ? linkInput.trim() : `https://${linkInput.trim()}`,
      path:       null,
      created_at: new Date().toISOString(),
    }])
    setLinkInput(""); setLinkName(""); setShowLinkForm(false)
    setAddingLink(false)
    fetchItems()
  }

  // ── Delete ──
  const deleteItem = async (item) => {
    if (item.path) {
      await supabase.storage.from(BUCKET).remove([item.path])
    }
    await supabase.from("vault_items").delete().eq("id", item.id)
    setItems(prev => prev.filter(i => i.id !== item.id))
  }

  // ── Filter ──
  const filtered = items.filter(item => {
    const kind = getKind(item)
    const matchTab = tab === "all" || kind === tab
    const matchSearch = item.name?.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const tabs = [
    { id: "all",   label: "All" },
    { id: "pdf",   label: "PDFs" },
    { id: "image", label: "Images" },
    { id: "doc",   label: "Docs" },
    { id: "link",  label: "Links" },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .fv-root {
          width: 100%;
          font-family: 'DM Sans', sans-serif;
          padding: 0;
        }

        /* ── Top action bar ── */
        .fv-actionbar {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .fv-search {
          flex: 1;
          min-width: 160px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          border: 0.5px solid rgba(0,0,0,0.1);
          border-radius: 10px;
          padding: 9px 12px;
        }

        .fv-search input {
          border: none;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #111;
          outline: none;
          width: 100%;
        }

        .fv-search input::placeholder { color: #bbb; }

        .fv-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 14px;
          border-radius: 10px;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s, opacity 0.15s;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          flex-shrink: 0;
        }

        .fv-action-btn.primary {
          background: #1a73e8;
          color: #fff;
        }

        .fv-action-btn.primary:hover { background: #1558b0; }
        .fv-action-btn.primary:active { opacity: 0.85; }
        .fv-action-btn.primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .fv-action-btn.secondary {
          background: #fff;
          color: #111;
          border: 0.5px solid rgba(0,0,0,0.1);
        }

        .fv-action-btn.secondary:hover { background: #f3f4f6; }

        /* ── Upload drop zone ── */
        .fv-dropzone {
          border: 1.5px dashed rgba(0,0,0,0.12);
          border-radius: 16px;
          padding: 28px 20px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          margin-bottom: 16px;
          background: #fff;
          -webkit-tap-highlight-color: transparent;
        }

        .fv-dropzone.drag-over {
          border-color: #1a73e8;
          background: #E8F0FE;
        }

        .fv-dropzone:hover { border-color: rgba(26,115,232,0.4); }

        .fv-dropzone-icon {
          width: 40px; height: 40px;
          border-radius: 12px;
          background: #E8F0FE;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 12px;
        }

        .fv-dropzone-title {
          font-size: 14px;
          font-weight: 500;
          color: #111;
          margin-bottom: 4px;
        }

        .fv-dropzone-sub {
          font-size: 12px;
          color: #aaa;
        }

        /* Upload progress */
        .fv-upload-progress {
          margin-bottom: 16px;
          background: #fff;
          border: 0.5px solid rgba(0,0,0,0.07);
          border-radius: 12px;
          padding: 14px 16px;
        }

        .fv-upload-label {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #555;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .fv-progress-bg {
          height: 4px;
          border-radius: 4px;
          background: #f0f0f0;
          overflow: hidden;
        }

        .fv-progress-fill {
          height: 100%;
          border-radius: 4px;
          background: #1a73e8;
          transition: width 0.3s ease;
        }

        /* ── Link form ── */
        .fv-link-form {
          background: #fff;
          border: 0.5px solid rgba(0,0,0,0.07);
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          animation: fv-slide-down 0.2s ease both;
        }

        @keyframes fv-slide-down {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .fv-link-input {
          width: 100%;
          padding: 10px 14px;
          border: 0.5px solid rgba(0,0,0,0.1);
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #111;
          outline: none;
          background: #f8f9fc;
          transition: border-color 0.15s;
        }

        .fv-link-input:focus { border-color: rgba(26,115,232,0.4); background: #fff; }

        .fv-link-row {
          display: flex;
          gap: 8px;
        }

        /* ── Tabs ── */
        .fv-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 14px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding-bottom: 2px;
        }

        .fv-tabs::-webkit-scrollbar { display: none; }

        .fv-tab {
          padding: 6px 14px;
          border-radius: 100px;
          border: 0.5px solid rgba(0,0,0,0.08);
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #777;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.12s, color 0.12s, border-color 0.12s;
          -webkit-tap-highlight-color: transparent;
          flex-shrink: 0;
        }

        .fv-tab.active {
          background: #1a73e8;
          color: #fff;
          border-color: transparent;
        }

        .fv-tab:hover:not(.active) { background: #f3f4f6; color: #111; }

        /* ── File grid ── */
        .fv-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        @media (min-width: 480px) {
          .fv-grid { grid-template-columns: repeat(3, 1fr); }
        }

        @media (min-width: 768px) {
          .fv-grid { grid-template-columns: repeat(4, 1fr); }
        }

        @media (min-width: 1024px) {
          .fv-grid { grid-template-columns: repeat(5, 1fr); }
        }

        /* ── File card ── */
        .fv-card {
          background: #fff;
          border: 0.5px solid rgba(0,0,0,0.07);
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        .fv-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
        .fv-card:active { transform: scale(0.97); }

        /* Thumbnail area */
        .fv-thumb {
          width: 100%;
          aspect-ratio: 4/3;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .fv-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .fv-thumb-icon {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .fv-thumb-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        /* Card footer */
        .fv-card-footer {
          padding: 10px 10px 8px;
          border-top: 0.5px solid rgba(0,0,0,0.05);
        }

        .fv-card-name {
          font-size: 11px;
          font-weight: 500;
          color: #111;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 3px;
        }

        .fv-card-meta {
          font-size: 10px;
          color: #bbb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* Delete button on card */
        .fv-card-del {
          position: absolute;
          top: 6px; right: 6px;
          width: 24px; height: 24px;
          border-radius: 50%;
          background: rgba(0,0,0,0.4);
          border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.15s;
          -webkit-tap-highlight-color: transparent;
        }

        .fv-card:hover .fv-card-del { opacity: 1; }
        /* Always show delete on touch devices */
        @media (hover: none) {
          .fv-card-del { opacity: 1; background: rgba(0,0,0,0.25); }
        }

        /* ── Empty state ── */
        .fv-empty {
          text-align: center;
          padding: 48px 20px;
          color: #ccc;
          font-size: 13px;
          line-height: 1.6;
        }

        .fv-empty-icon {
          width: 48px; height: 48px;
          border-radius: 14px;
          background: #f3f4f6;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 12px;
        }

        .fv-loading {
          text-align: center;
          padding: 48px 20px;
          font-size: 13px;
          color: #ccc;
          animation: fv-pulse 1.5s ease infinite;
        }

        @keyframes fv-pulse { 0%,100%{opacity:.5} 50%{opacity:1} }

        /* ── Modal ── */
        .fv-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: fv-fade 0.2s ease both;
        }

        @keyframes fv-fade { from{opacity:0} to{opacity:1} }

        .fv-modal {
          background: #fff;
          border-radius: 20px;
          width: 100%;
          max-width: 680px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: fv-modal-in 0.25s cubic-bezier(.22,.68,0,1.2) both;
        }

        @keyframes fv-modal-in {
          from { opacity: 0; transform: scale(0.94) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .fv-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 0.5px solid rgba(0,0,0,0.07);
          flex-shrink: 0;
        }

        .fv-modal-title {
          font-size: 14px;
          font-weight: 500;
          color: #111;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          padding-right: 12px;
        }

        .fv-modal-close {
          width: 30px; height: 30px;
          border-radius: 8px;
          border: none;
          background: transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s;
        }

        .fv-modal-close:hover { background: #f3f4f6; }

        .fv-modal-body {
          flex: 1;
          overflow: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          min-height: 200px;
        }

        .fv-preview-img {
          max-width: 100%;
          max-height: 70vh;
          border-radius: 10px;
          object-fit: contain;
          display: block;
        }

        .fv-preview-iframe {
          width: 100%;
          height: 65vh;
          border: none;
          border-radius: 10px;
        }

        .fv-preview-link, .fv-preview-doc {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          text-align: center;
          padding: 24px 0;
        }

        .fv-preview-link-url {
          font-size: 13px;
          color: #555;
          word-break: break-all;
          max-width: 400px;
        }

        .fv-preview-doc-name {
          font-size: 14px;
          font-weight: 500;
          color: #111;
        }

        .fv-open-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          border-radius: 10px;
          background: #1a73e8;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          transition: background 0.15s;
        }

        .fv-open-btn:hover { background: #1558b0; }

        /* ── Count badge ── */
        .fv-count {
          font-size: 10px;
          color: #aaa;
          font-weight: 500;
          margin-bottom: 12px;
        }
      `}</style>

      <div className="fv-root">

        {/* Action bar */}
        <div className="fv-actionbar">
          <div className="fv-search">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4.5" stroke="#aaa" strokeWidth="1.3"/>
              <path d="M10.5 10.5L14 14" stroke="#aaa" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search vault…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <button
            className="fv-action-btn primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 11V5M5 8L8 5L11 8" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 13H13" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Upload
          </button>

          <button
            className="fv-action-btn secondary"
            onClick={() => setShowLinkForm(s => !s)}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M7 9L9 7M5.5 10.5L4 12C2.9 13.1 2.9 14.9 4 16C5.1 17.1 6.9 17.1 8 16L9.5 14.5M10.5 5.5L12 4C13.1 2.9 14.9 2.9 16 4C17.1 5.1 17.1 6.9 16 8L14.5 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Link
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="*/*"
          style={{ display: "none" }}
          onChange={onFileChange}
        />

        {/* Upload progress */}
        {uploading && (
          <div className="fv-upload-progress">
            <div className="fv-upload-label">
              <span>Uploading…</span>
              <span>{uploadPct}%</span>
            </div>
            <div className="fv-progress-bg">
              <div className="fv-progress-fill" style={{ width: `${uploadPct}%` }} />
            </div>
          </div>
        )}

        {/* Link form */}
        {showLinkForm && (
          <div className="fv-link-form">
            <input
              className="fv-link-input"
              type="text"
              placeholder="Display name (optional)"
              value={linkName}
              onChange={e => setLinkName(e.target.value)}
            />
            <div className="fv-link-row">
              <input
                className="fv-link-input"
                type="url"
                placeholder="https://example.com"
                value={linkInput}
                onChange={e => setLinkInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveLink()}
                style={{ flex: 1 }}
              />
              <button
                className="fv-action-btn primary"
                onClick={saveLink}
                disabled={addingLink || !linkInput.trim()}
              >
                {addingLink ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}

        {/* Drop zone — only when not uploading */}
        {!uploading && (
          <div
            className={`fv-dropzone${dragOver ? " drag-over" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="fv-dropzone-icon">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M10 13V7M7 10L10 7L13 10" stroke="#1a73e8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 16H16" stroke="#1a73e8" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="fv-dropzone-title">
              {dragOver ? "Drop to upload" : "Tap or drag files here"}
            </div>
            <div className="fv-dropzone-sub">PDF, Images, Docs, any file</div>
          </div>
        )}

        {/* Tabs */}
        <div className="fv-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`fv-tab${tab === t.id ? " active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Count */}
        {!loading && (
          <div className="fv-count">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="fv-loading">Loading vault…</div>
        ) : filtered.length === 0 ? (
          <div className="fv-empty">
            <div className="fv-empty-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="3" width="14" height="14" rx="3" stroke="#ccc" strokeWidth="1.3"/>
                <path d="M7 10h6M10 7v6" stroke="#ccc" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            {search ? "No results found." : "Nothing here yet.\nUpload a file or save a link."}
          </div>
        ) : (
          <div className="fv-grid">
            {filtered.map(item => {
              const kind = getKind(item)
              const meta = FILE_META[kind] || FILE_META.other
              return (
                <div
                  key={item.id}
                  className="fv-card"
                  onClick={() => setPreview(item)}
                >
                  {/* Thumbnail */}
                  <div className="fv-thumb" style={{ background: meta.bg }}>
                    {kind === "image" && item.url ? (
                      <img src={item.url} alt={item.name} />
                    ) : (
                      <div className="fv-thumb-icon">
                        {kind === "pdf" && (
                          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <rect x="4" y="2" width="20" height="24" rx="2.5" stroke={meta.color} strokeWidth="1.3"/>
                            <path d="M8 10H20M8 14H20M8 18H15" stroke={meta.color} strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                        )}
                        {kind === "doc" && (
                          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <rect x="4" y="2" width="20" height="24" rx="2.5" stroke={meta.color} strokeWidth="1.3"/>
                            <path d="M8 10H20M8 14H16M8 18H12" stroke={meta.color} strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                        )}
                        {kind === "link" && (
                          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <path d="M12 16L16 12M9.5 17.5L8 19C6.3 20.7 6.3 23.5 8 25.2C9.7 26.9 12.5 26.9 14.2 25.2L15.7 23.7M18.5 10.5L20 9C21.7 7.3 21.7 4.5 20 2.8C18.3 1.1 15.5 1.1 13.8 2.8L12.3 4.3" stroke={meta.color} strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        )}
                        {kind === "other" && (
                          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <rect x="4" y="2" width="20" height="24" rx="2.5" stroke={meta.color} strokeWidth="1.3"/>
                            <path d="M8 14H20" stroke={meta.color} strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                        )}
                        <span className="fv-thumb-label" style={{ color: meta.color }}>{meta.label}</span>
                      </div>
                    )}

                    {/* Delete button */}
                    <button
                      className="fv-card-del"
                      onClick={e => { e.stopPropagation(); deleteItem(item) }}
                      title="Delete"
                    >
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2 2L10 10M10 2L2 10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>

                  {/* Footer */}
                  <div className="fv-card-footer">
                    <div className="fv-card-name">{item.name}</div>
                    <div className="fv-card-meta">
                      <span>{fmtDate(item.created_at)}</span>
                      <span>{fmtSize(item.size)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Preview modal */}
      {preview && (
        <PreviewModal item={preview} onClose={() => setPreview(null)} />
      )}
    </>
  )
}