"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import Sidebar from "@/components/dashboard/Sidebar"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
)

function formatSize(bytes) {
  if (!bytes) return "—"
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

function formatDate(iso) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function timeSince(iso) {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso)
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return formatDate(iso)
}

export default function PdfLibrary() {
  const [pdfs, setPdfs]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [uploading, setUploading]   = useState(false)
  const [search, setSearch]         = useState("")
  const [activeTag, setActiveTag]   = useState("All")
  const [viewPdf, setViewPdf]       = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [editPdf, setEditPdf]       = useState(null)
  const [layout, setLayout]         = useState("grid")
  const [isMobile, setIsMobile]     = useState(false)

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setLayout("list")
    }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const fetchPdfs = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from("pdfs").select("*").order("created_at", { ascending: false })
    setPdfs(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchPdfs() }, [fetchPdfs])

  const allTags = ["All", ...Array.from(new Set(pdfs.flatMap(p => p.tags || []))).sort()]

  const filtered = pdfs.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.tags?.some(t => t.toLowerCase().includes(q))
    const matchTag = activeTag === "All" || p.tags?.includes(activeTag)
    return matchSearch && matchTag
  })

  const handleUpload = async ({ file, name, description, tags }) => {
    setUploading(true)
    try {
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`
      const { error: upErr } = await supabase.storage.from("pdfs").upload(path, file, { contentType: "application/pdf" })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from("pdfs").getPublicUrl(path)
      const { data, error: dbErr } = await supabase.from("pdfs").insert({ name, description, url: urlData.publicUrl, size: file.size, tags }).select().single()
      if (dbErr) throw dbErr
      setPdfs(prev => [data, ...prev])
      setShowUpload(false)
    } catch (e) { alert("Upload failed: " + e.message) }
    setUploading(false)
  }

  const handleDelete = async (pdf) => {
    if (!confirm(`"${pdf.name}" delete karna chahte ho?`)) return
    const parts = pdf.url.split("/storage/v1/object/public/pdfs/")
    if (parts[1]) await supabase.storage.from("pdfs").remove([parts[1]])
    await supabase.from("pdfs").delete().eq("id", pdf.id)
    setPdfs(prev => prev.filter(p => p.id !== pdf.id))
    if (viewPdf?.id === pdf.id) setViewPdf(null)
  }

  const handleEdit = async ({ id, name, description, tags }) => {
    const { data } = await supabase.from("pdfs").update({ name, description, tags }).eq("id", id).select().single()
    if (data) { setPdfs(prev => prev.map(p => p.id === id ? data : p)); if (viewPdf?.id === id) setViewPdf(data) }
    setEditPdf(null)
  }

  return (
    <div style={S.appWrap}>
      <Sidebar />

      <div style={S.mainWrap}>
        {/* ── HEADER ── */}
        <div style={S.header}>
          <div style={S.headerLeft}>
            <div style={S.headerIconBox}><PdfBigIcon /></div>
            <div>
              <h1 style={S.pageTitle}>PDF Library</h1>
              <p style={S.pageSub}>{pdfs.length} documents · {formatSize(pdfs.reduce((a, p) => a + (p.size || 0), 0))} total</p>
            </div>
          </div>
          <div style={S.headerRight}>
            {!isMobile && (
              <div style={S.layoutToggle}>
                {["grid", "list"].map(l => (
                  <button key={l} style={{ ...S.layoutBtn, ...(layout === l ? S.layoutBtnActive : {}) }} onClick={() => setLayout(l)}>
                    {l === "grid" ? <GridIcon /> : <ListIcon />}
                  </button>
                ))}
              </div>
            )}
            <button style={S.uploadBtn} onClick={() => setShowUpload(true)}>
              <UploadIcon />
              <span>{isMobile ? "Upload" : "Upload PDF"}</span>
            </button>
          </div>
        </div>

        {/* ── SEARCH ── */}
        <div style={S.searchRow}>
          <div style={S.searchWrap}>
            <SearchIcon />
            <input style={S.searchInput} placeholder="Search PDFs, tags…" value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button style={S.clearBtn} onClick={() => setSearch("")}>✕</button>}
          </div>
        </div>

        {/* ── TAGS ── */}
        {allTags.length > 1 && (
          <div style={S.tagsScroll}>
            <div style={S.tagsRow}>
              {allTags.map(tag => (
                <button key={tag} style={{ ...S.tagPill, ...(activeTag === tag ? S.tagPillActive : {}) }} onClick={() => setActiveTag(tag)}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── CONTENT ── */}
        <div style={S.content}>
          {loading ? (
            <div style={S.centerWrap}><div style={S.spinner} /><span style={S.loadingText}>Loading PDFs…</span></div>
          ) : filtered.length === 0 ? (
            <div style={S.centerWrap}>
              <div style={S.emptyIconWrap}><PdfBigIcon /></div>
              <p style={S.emptyTitle}>{search || activeTag !== "All" ? "No results found" : "No PDFs yet"}</p>
              <p style={S.emptyHint}>{search || activeTag !== "All" ? "Try a different search" : "Upload your first PDF"}</p>
              {!search && activeTag === "All" && (
                <button style={S.emptyUploadBtn} onClick={() => setShowUpload(true)}>Upload PDF</button>
              )}
            </div>
          ) : layout === "grid" ? (
            <div style={S.grid}>
              {filtered.map(pdf => (
                <PdfCard key={pdf.id} pdf={pdf}
                  onView={() => setViewPdf(pdf)}
                  onEdit={() => setEditPdf(pdf)}
                  onDelete={() => handleDelete(pdf)} />
              ))}
            </div>
          ) : (
            <div style={S.list}>
              {filtered.map(pdf => (
                <PdfListRow key={pdf.id} pdf={pdf}
                  onView={() => setViewPdf(pdf)}
                  onEdit={() => setEditPdf(pdf)}
                  onDelete={() => handleDelete(pdf)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── PDF VIEWER ── */}
      {viewPdf && (
        <PdfViewer pdf={viewPdf}
          onClose={() => setViewPdf(null)}
          onEdit={() => { setEditPdf(viewPdf); setViewPdf(null) }}
          onDelete={() => handleDelete(viewPdf)} />
      )}

      {showUpload && <UploadModal uploading={uploading} onClose={() => setShowUpload(false)} onUpload={handleUpload} />}
      {editPdf && <EditModal pdf={editPdf} onClose={() => setEditPdf(null)} onSave={handleEdit} />}
    </div>
  )
}

// ─── PDF Card (Grid) ──────────────────────────────────────────────────────────
function PdfCard({ pdf, onView, onEdit, onDelete }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ ...S.card, ...(hov ? S.cardHov : {}) }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={S.cardThumb} onClick={onView}>
        <PdfThumbIcon />
        {hov && <div style={S.thumbOverlay}><div style={S.thumbOpenBtn}>Open</div></div>}
      </div>
      <div style={S.cardBody}>
        <div style={S.cardTopRow}>
          <span style={S.cardName} title={pdf.name}>{pdf.name}</span>
          <div style={S.cardActions}>
            <TinyBtn title="Edit" onClick={onEdit}><EditIcon /></TinyBtn>
            <TinyBtn title="Delete" danger onClick={onDelete}><TrashIcon /></TinyBtn>
          </div>
        </div>
        {pdf.description && <p style={S.cardDesc}>{pdf.description}</p>}
        <div style={S.cardMeta}>
          <span style={S.metaText}>{formatSize(pdf.size)}</span>
          <span style={S.metaDot}>·</span>
          <span style={S.metaText}>{timeSince(pdf.created_at)}</span>
        </div>
        {pdf.tags?.length > 0 && (
          <div style={S.cardTags}>{pdf.tags.map(t => <span key={t} style={S.cardTag}>{t}</span>)}</div>
        )}
      </div>
    </div>
  )
}

// ─── PDF List Row ─────────────────────────────────────────────────────────────
function PdfListRow({ pdf, onView, onEdit, onDelete }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ ...S.listRow, ...(hov ? S.listRowHov : {}) }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={S.listIconWrap} onClick={onView}><PdfSmallIcon /></div>
      <div style={S.listBody} onClick={onView}>
        <div style={S.listName}>{pdf.name}</div>
        {pdf.description && <div style={S.listDesc}>{pdf.description}</div>}
        <div style={S.listMeta}>
          <span style={S.metaText}>{formatSize(pdf.size)}</span>
          <span style={S.metaDot}>·</span>
          <span style={S.metaText}>{timeSince(pdf.created_at)}</span>
          {pdf.tags?.map(t => <span key={t} style={S.cardTag}>{t}</span>)}
        </div>
      </div>
      <div style={S.listActions}>
        <TinyBtn title="Edit" onClick={onEdit}><EditIcon /></TinyBtn>
        <TinyBtn title="Delete" danger onClick={onDelete}><TrashIcon /></TinyBtn>
      </div>
    </div>
  )
}

// ─── PDF Viewer (full screen modal on mobile) ─────────────────────────────────
function PdfViewer({ pdf, onClose, onEdit, onDelete }) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => { setIsMobile(window.innerWidth < 768) }, [])

  return (
    <div style={S.viewerOverlay}>
      <div style={{ ...S.viewerWrap, flexDirection: isMobile ? "column" : "row" }}>
        {/* Sidebar / Top panel */}
        <div style={{ ...S.viewerPanel, ...(isMobile ? S.viewerPanelMobile : {}) }}>
          <button style={S.viewerBack} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>

          {!isMobile && (
            <div style={S.viewerThumbWrap}><PdfThumbIcon /></div>
          )}

          <div style={isMobile ? S.viewerInfoMobile : S.viewerInfo}>
            <h2 style={S.viewerName}>{pdf.name}</h2>
            {pdf.description && <p style={S.viewerDesc}>{pdf.description}</p>}
            {!isMobile && (
              <div style={S.viewerMeta}>
                <div style={S.viewerMetaRow}>
                  <span style={S.viewerMetaLabel}>Size</span>
                  <span style={S.viewerMetaVal}>{formatSize(pdf.size)}</span>
                </div>
                <div style={S.viewerMetaRow}>
                  <span style={S.viewerMetaLabel}>Uploaded</span>
                  <span style={S.viewerMetaVal}>{formatDate(pdf.created_at)}</span>
                </div>
              </div>
            )}
            {pdf.tags?.length > 0 && (
              <div style={S.cardTags}>{pdf.tags.map(t => <span key={t} style={S.cardTag}>{t}</span>)}</div>
            )}
          </div>

          <div style={isMobile ? S.viewerActionsMobile : S.viewerActions}>
            <a href={pdf.url} download={pdf.name + ".pdf"} style={S.downloadBtn}>
              <DownloadIcon /> Download
            </a>
            <button style={S.editBtn} onClick={onEdit}>Edit</button>
            <button style={S.deleteBtn} onClick={() => { onDelete(); onClose() }}>Delete</button>
          </div>
        </div>

        {/* PDF iframe */}
        <div style={S.viewerIframeWrap}>
          <iframe src={pdf.url + "#toolbar=1"} style={S.iframe} title={pdf.name} />
        </div>
      </div>
    </div>
  )
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ uploading, onClose, onUpload }) {
  const [file, setFile]         = useState(null)
  const [name, setName]         = useState("")
  const [desc, setDesc]         = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags]         = useState([])
  const [drag, setDrag]         = useState(false)
  const fileRef = useRef(null)

  const handleFile = (f) => {
    if (!f || f.type !== "application/pdf") { alert("Only PDF files allowed"); return }
    setFile(f); setName(f.name.replace(/\.pdf$/i, ""))
  }
  const addTag = (e) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault()
      const t = tagInput.trim().replace(/,/g, "")
      if (!tags.includes(t)) setTags(p => [...p, t])
      setTagInput("")
    }
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <span style={S.modalTitle}>Upload PDF</span>
          <button style={S.modalCloseBtn} onClick={onClose}>✕</button>
        </div>

        {!file ? (
          <div style={{ ...S.dropZone, ...(drag ? S.dropZoneActive : {}) }}
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}
            onClick={() => fileRef.current?.click()}>
            <div style={S.dropIconWrap}><PdfThumbIcon /></div>
            <p style={S.dropText}>Drag & drop PDF here</p>
            <p style={S.dropHint}>or tap to browse</p>
            <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }}
              onChange={e => handleFile(e.target.files[0])} />
          </div>
        ) : (
          <div style={S.fileChosen}>
            <PdfSmallIcon />
            <div style={S.fileChosenInfo}>
              <span style={S.fileChosenName}>{file.name}</span>
              <span style={S.fileChosenSize}>{formatSize(file.size)}</span>
            </div>
            <button style={S.fileChangeBtn} onClick={() => setFile(null)}>Change</button>
          </div>
        )}

        <div style={S.fields}>
          <Field label="Name *">
            <input style={S.input} placeholder="Document name" value={name} onChange={e => setName(e.target.value)} />
          </Field>
          <Field label="Description">
            <textarea style={{ ...S.input, resize: "none", height: 70 }} placeholder="Brief description…" value={desc} onChange={e => setDesc(e.target.value)} />
          </Field>
          <Field label="Tags">
            <TagsInput tags={tags} tagInput={tagInput} setTagInput={setTagInput} onKeyDown={addTag} onRemove={t => setTags(p => p.filter(x => x !== t))} />
          </Field>
        </div>

        <div style={S.modalBtns}>
          <button style={S.modalCancel} onClick={onClose}>Cancel</button>
          <button style={{ ...S.modalConfirm, opacity: (!file || !name.trim() || uploading) ? 0.5 : 1 }}
            disabled={!file || !name.trim() || uploading}
            onClick={() => onUpload({ file, name: name.trim(), description: desc.trim(), tags })}>
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ pdf, onClose, onSave }) {
  const [name, setName]         = useState(pdf.name || "")
  const [desc, setDesc]         = useState(pdf.description || "")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags]         = useState(pdf.tags || [])
  const addTag = (e) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault()
      const t = tagInput.trim().replace(/,/g, "")
      if (!tags.includes(t)) setTags(p => [...p, t])
      setTagInput("")
    }
  }
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <span style={S.modalTitle}>Edit PDF</span>
          <button style={S.modalCloseBtn} onClick={onClose}>✕</button>
        </div>
        <div style={S.fields}>
          <Field label="Name">
            <input style={S.input} value={name} onChange={e => setName(e.target.value)} autoFocus />
          </Field>
          <Field label="Description">
            <textarea style={{ ...S.input, resize: "none", height: 70 }} value={desc} onChange={e => setDesc(e.target.value)} />
          </Field>
          <Field label="Tags">
            <TagsInput tags={tags} tagInput={tagInput} setTagInput={setTagInput} onKeyDown={addTag} onRemove={t => setTags(p => p.filter(x => x !== t))} />
          </Field>
        </div>
        <div style={S.modalBtns}>
          <button style={S.modalCancel} onClick={onClose}>Cancel</button>
          <button style={S.modalConfirm} onClick={() => onSave({ id: pdf.id, name: name.trim(), description: desc.trim(), tags })}>Save</button>
        </div>
      </div>
    </div>
  )
}

// ─── Shared small components ──────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#aeaeb2", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      {children}
    </div>
  )
}

function TagsInput({ tags, tagInput, setTagInput, onKeyDown, onRemove }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 8, padding: "7px 10px", background: "#fafafa", minHeight: 40 }}>
      {tags.map(t => (
        <span key={t} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(231,76,60,0.1)", borderRadius: 20, padding: "2px 8px", fontSize: 12, color: "#E74C3C" }}>
          {t}
          <button style={{ border: "none", background: "transparent", cursor: "pointer", color: "#E74C3C", fontSize: 10, padding: 0 }} onClick={() => onRemove(t)}>✕</button>
        </span>
      ))}
      <input style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, fontFamily: "inherit", flex: 1, minWidth: 80 }}
        placeholder="Add tag, press Enter" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={onKeyDown} />
    </div>
  )
}

function TinyBtn({ title, onClick, danger, children }) {
  const [h, setH] = useState(false)
  return (
    <button title={title} onClick={e => { e.stopPropagation(); onClick() }}
      style={{ border: "none", background: h ? (danger ? "rgba(231,76,60,0.1)" : "rgba(0,0,0,0.06)") : "transparent", cursor: "pointer", width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: danger ? "#e74c3c" : "#999", padding: 0 }}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
      {children}
    </button>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function PdfBigIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M15 2H5a2 2 0 00-2 2v18a2 2 0 002 2h16a2 2 0 002-2V9l-8-7z" stroke="#E74C3C" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M15 2v7h8" stroke="#E74C3C" strokeWidth="1.5" strokeLinejoin="round"/>
      <rect x="2" y="14" width="22" height="8" rx="2" fill="#E74C3C"/>
      <text x="13" y="20.5" textAnchor="middle" fontSize="5" fontWeight="700" fill="white" fontFamily="-apple-system,sans-serif">PDF</text>
    </svg>
  )
}
function PdfThumbIcon() {
  return (
    <svg width="44" height="54" viewBox="0 0 44 54" fill="none">
      <rect x="1" y="1" width="34" height="44" rx="4" fill="#fff5f5" stroke="#fca5a5" strokeWidth="1.5"/>
      <path d="M23 1v10h12" stroke="#fca5a5" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 20h18M8 26h14M8 32h10" stroke="#fca5a5" strokeWidth="1.4" strokeLinecap="round"/>
      <rect x="0" y="34" width="44" height="18" rx="3" fill="#E74C3C"/>
      <text x="22" y="47" textAnchor="middle" fontSize="9" fontWeight="700" fill="white" fontFamily="-apple-system,sans-serif">PDF</text>
    </svg>
  )
}
function PdfSmallIcon() {
  return (
    <svg width="30" height="36" viewBox="0 0 30 36" fill="none">
      <rect x="1" y="1" width="22" height="28" rx="3" fill="#fff5f5" stroke="#fca5a5" strokeWidth="1.2"/>
      <path d="M15 1v7h8" stroke="#fca5a5" strokeWidth="1.2" strokeLinejoin="round"/>
      <rect x="0" y="22" width="30" height="12" rx="2.5" fill="#E74C3C"/>
      <text x="15" y="31" textAnchor="middle" fontSize="6" fontWeight="700" fill="white" fontFamily="-apple-system,sans-serif">PDF</text>
    </svg>
  )
}
function SearchIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.4, flexShrink: 0 }}><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> }
function UploadIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 4L7 1l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 10v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function GridIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg> }
function ListIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 3h12M1 7h12M1 11h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function EditIcon() { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/></svg> }
function TrashIcon() { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 3h9M4 3V2h4v1M3.5 3l.5 7h4l.5-7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function DownloadIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}><path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 10v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  appWrap: { display: "flex", minHeight: "100vh", background: "#f8f8f6", fontFamily: "-apple-system,'SF Pro Text','Helvetica Neue',sans-serif", color: "#1c1c1e" },
  mainWrap: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflowX: "hidden" },

  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 20px 0", gap: 12, flexWrap: "wrap" },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  headerIconBox: { width: 48, height: 48, borderRadius: 12, background: "#fff5f5", border: "1px solid #fca5a5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  pageTitle: { fontSize: 22, fontWeight: 700, letterSpacing: -0.4, margin: "0 0 2px" },
  pageSub: { fontSize: 12, color: "#aeaeb2", margin: 0 },
  headerRight: { display: "flex", alignItems: "center", gap: 8 },
  layoutToggle: { display: "flex", background: "#fff", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 8, overflow: "hidden" },
  layoutBtn: { border: "none", background: "transparent", cursor: "pointer", padding: "7px 10px", color: "#888", display: "flex", alignItems: "center" },
  layoutBtnActive: { background: "#1c1c1e", color: "#fff" },
  uploadBtn: { display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "#E74C3C", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13.5, color: "#fff", fontFamily: "inherit", fontWeight: 500, whiteSpace: "nowrap" },

  searchRow: { padding: "14px 20px 0" },
  searchWrap: { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 10, padding: "9px 12px" },
  searchInput: { border: "none", background: "transparent", outline: "none", fontSize: 14, flex: 1, color: "inherit", fontFamily: "inherit", minWidth: 0 },
  clearBtn: { border: "none", background: "transparent", cursor: "pointer", color: "#aeaeb2", fontSize: 11, padding: 0, flexShrink: 0 },

  tagsScroll: { overflowX: "auto", padding: "12px 20px 0" },
  tagsRow: { display: "flex", gap: 8, width: "max-content" },
  tagPill: { padding: "5px 14px", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 20, cursor: "pointer", fontSize: 12.5, background: "#fff", color: "#555", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 },
  tagPillActive: { background: "#E74C3C", color: "#fff", border: "0.5px solid #E74C3C" },

  content: { padding: "16px 20px 40px" },
  centerWrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 300, textAlign: "center" },
  spinner: { width: 30, height: 30, border: "3px solid rgba(0,0,0,0.08)", borderTopColor: "#E74C3C", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  loadingText: { fontSize: 14, color: "#888" },
  emptyIconWrap: { opacity: 0.3, marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: 600, margin: 0 },
  emptyHint: { fontSize: 13, color: "#aeaeb2", margin: 0 },
  emptyUploadBtn: { marginTop: 6, padding: "9px 22px", background: "#E74C3C", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13.5, fontFamily: "inherit" },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 },
  card: { background: "#fff", borderRadius: 14, border: "0.5px solid rgba(0,0,0,0.08)", overflow: "hidden", transition: "box-shadow 0.15s", cursor: "pointer" },
  cardHov: { boxShadow: "0 4px 20px rgba(0,0,0,0.1)" },
  cardThumb: { position: "relative", height: 130, background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center" },
  thumbOverlay: { position: "absolute", inset: 0, background: "rgba(231,76,60,0.1)", display: "flex", alignItems: "center", justifyContent: "center" },
  thumbOpenBtn: { background: "#E74C3C", color: "#fff", padding: "7px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 500 },
  cardBody: { padding: "11px 11px 9px" },
  cardTopRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 },
  cardName: { fontSize: 13, fontWeight: 600, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  cardActions: { display: "flex", gap: 1, flexShrink: 0 },
  cardDesc: { fontSize: 11.5, color: "#666", margin: "0 0 5px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  cardMeta: { display: "flex", alignItems: "center", gap: 5, marginBottom: 5 },
  metaText: { fontSize: 11, color: "#aeaeb2" },
  metaDot: { fontSize: 11, color: "#aeaeb2" },
  cardTags: { display: "flex", flexWrap: "wrap", gap: 4 },
  cardTag: { fontSize: 11, padding: "2px 8px", background: "rgba(231,76,60,0.08)", borderRadius: 20, color: "#E74C3C" },

  list: { display: "flex", flexDirection: "column", gap: 6 },
  listRow: { display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 12, border: "0.5px solid rgba(0,0,0,0.07)", padding: "11px 14px", cursor: "pointer", transition: "box-shadow 0.12s" },
  listRowHov: { boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  listIconWrap: { flexShrink: 0 },
  listBody: { flex: 1, minWidth: 0 },
  listName: { fontSize: 13.5, fontWeight: 500, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  listDesc: { fontSize: 12, color: "#888", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  listMeta: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
  listActions: { display: "flex", gap: 2, flexShrink: 0 },

  viewerOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 },
  viewerWrap: { display: "flex", width: "100%", maxWidth: 1100, height: "90vh", background: "#fff", borderRadius: 16, overflow: "hidden" },
  viewerPanel: { width: 260, minWidth: 260, background: "#fff", borderRight: "0.5px solid rgba(0,0,0,0.08)", padding: "16px", display: "flex", flexDirection: "column", overflow: "hidden" },
  viewerPanelMobile: { width: "100%", minWidth: "unset", borderRight: "none", borderBottom: "0.5px solid rgba(0,0,0,0.08)", maxHeight: 220, overflowY: "auto" },
  viewerBack: { display: "flex", alignItems: "center", gap: 6, border: "none", background: "transparent", cursor: "pointer", fontSize: 13.5, color: "#666", padding: "4px 0 10px", fontFamily: "inherit" },
  viewerThumbWrap: { height: 100, background: "#fff5f5", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  viewerInfo: { flex: 1, overflowY: "auto" },
  viewerInfoMobile: { display: "flex", flexDirection: "column", gap: 4 },
  viewerName: { fontSize: 15, fontWeight: 600, margin: "0 0 6px", letterSpacing: -0.2 },
  viewerDesc: { fontSize: 12.5, color: "#666", lineHeight: 1.6, margin: "0 0 10px" },
  viewerMeta: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 },
  viewerMetaRow: { display: "flex", justifyContent: "space-between" },
  viewerMetaLabel: { fontSize: 10.5, fontWeight: 600, color: "#aeaeb2", textTransform: "uppercase", letterSpacing: "0.06em" },
  viewerMetaVal: { fontSize: 12, color: "#555" },
  viewerActions: { display: "flex", flexDirection: "column", gap: 7, paddingTop: 12, borderTop: "0.5px solid rgba(0,0,0,0.07)", marginTop: "auto" },
  viewerActionsMobile: { display: "flex", gap: 8, paddingTop: 10 },
  downloadBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px", background: "#E74C3C", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: "none", fontFamily: "inherit" },
  editBtn: { padding: "8px", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 8, cursor: "pointer", fontSize: 13, background: "#fff", fontFamily: "inherit", color: "#555", flex: 1 },
  deleteBtn: { padding: "8px", border: "0.5px solid rgba(231,76,60,0.2)", borderRadius: 8, cursor: "pointer", fontSize: 13, background: "transparent", fontFamily: "inherit", color: "#e74c3c", flex: 1 },
  viewerIframeWrap: { flex: 1, display: "flex", flexDirection: "column", minHeight: 0 },
  iframe: { width: "100%", height: "100%", border: "none" },

  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 400, padding: 0 },
  modal: { background: "#fff", borderRadius: "16px 16px 0 0", padding: "20px 20px 32px", width: "100%", maxWidth: 500, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" },
  modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: 600 },
  modalCloseBtn: { border: "none", background: "rgba(0,0,0,0.06)", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 12, color: "#666" },
  dropZone: { border: "2px dashed rgba(0,0,0,0.12)", borderRadius: 12, padding: "28px 16px", textAlign: "center", cursor: "pointer", marginBottom: 16 },
  dropZoneActive: { border: "2px dashed #E74C3C", background: "rgba(231,76,60,0.04)" },
  dropIconWrap: { display: "flex", justifyContent: "center", marginBottom: 8 },
  dropText: { fontSize: 14, fontWeight: 500, margin: "0 0 3px" },
  dropHint: { fontSize: 12, color: "#aeaeb2", margin: 0 },
  fileChosen: { display: "flex", alignItems: "center", gap: 10, background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 12px", marginBottom: 14 },
  fileChosenInfo: { flex: 1, minWidth: 0 },
  fileChosenName: { fontSize: 13, fontWeight: 500, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  fileChosenSize: { fontSize: 11, color: "#aeaeb2" },
  fileChangeBtn: { border: "none", background: "transparent", cursor: "pointer", fontSize: 12.5, color: "#E74C3C", fontFamily: "inherit", flexShrink: 0 },
  fields: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 },
  input: { border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 8, padding: "9px 11px", fontSize: 14, outline: "none", fontFamily: "inherit", color: "#1c1c1e", background: "#fafafa", boxSizing: "border-box", width: "100%" },
  modalBtns: { display: "flex", gap: 8 },
  modalCancel: { flex: 1, padding: "10px", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 9, cursor: "pointer", fontSize: 14, background: "#fff", fontFamily: "inherit", color: "#555" },
  modalConfirm: { flex: 1, padding: "10px", border: "none", borderRadius: 9, cursor: "pointer", fontSize: 14, color: "#fff", background: "#E74C3C", fontFamily: "inherit", fontWeight: 500 },
}