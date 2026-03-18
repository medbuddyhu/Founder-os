"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
)

// ─────────────────────────────────────────────────────────────────────────────
export default function GalleryPage() {
  const [images, setImages]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [uploading, setUploading]   = useState(false)
  const [search, setSearch]         = useState("")
  const [activeTag, setActiveTag]   = useState("All")
  const [lightbox, setLightbox]     = useState(null) // image object
  const [showUpload, setShowUpload] = useState(false)
  const [editImage, setEditImage]   = useState(null) // for edit modal
  const fileRef = useRef(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchImages = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("images")
      .select("*")
      .order("created_at", { ascending: false })
    setImages(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchImages() }, [fetchImages])

  // ── All tags ───────────────────────────────────────────────────────────────
  const allTags = ["All", ...Array.from(new Set(images.flatMap(i => i.tags || []))).sort()]

  // ── Filtered images ────────────────────────────────────────────────────────
  const filtered = images.filter(img => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      img.name?.toLowerCase().includes(q) ||
      img.description?.toLowerCase().includes(q) ||
      img.tags?.some(t => t.toLowerCase().includes(q))
    const matchTag = activeTag === "All" || img.tags?.includes(activeTag)
    return matchSearch && matchTag
  })

  // ── Upload image ───────────────────────────────────────────────────────────
  const handleUpload = async ({ file, name, description, tags }) => {
    setUploading(true)
    try {
      const ext  = file.name.split(".").pop()
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

      const { error: upErr } = await supabase.storage
        .from("images")
        .upload(path, file, { contentType: file.type })

      if (upErr) throw upErr

      const { data: urlData } = supabase.storage
        .from("images")
        .getPublicUrl(path)

      const { data, error: dbErr } = await supabase
        .from("images")
        .insert({ name, description, url: urlData.publicUrl, tags })
        .select()
        .single()

      if (dbErr) throw dbErr
      setImages(prev => [data, ...prev])
      setShowUpload(false)
    } catch (e) {
      alert("Upload failed: " + e.message)
    }
    setUploading(false)
  }

  // ── Delete image ───────────────────────────────────────────────────────────
  const handleDelete = async (img) => {
    // extract storage path from url
    const parts = img.url.split("/storage/v1/object/public/images/")
    if (parts[1]) {
      await supabase.storage.from("images").remove([parts[1]])
    }
    await supabase.from("images").delete().eq("id", img.id)
    setImages(prev => prev.filter(i => i.id !== img.id))
    if (lightbox?.id === img.id) setLightbox(null)
  }

  // ── Edit image meta ────────────────────────────────────────────────────────
  const handleEdit = async ({ id, name, description, tags }) => {
    const { data } = await supabase
      .from("images")
      .update({ name, description, tags })
      .eq("id", id)
      .select()
      .single()
    if (data) {
      setImages(prev => prev.map(i => i.id === id ? data : i))
      if (lightbox?.id === id) setLightbox(data)
    }
    setEditImage(null)
  }

  // ── Keyboard nav in lightbox ───────────────────────────────────────────────
  useEffect(() => {
    if (!lightbox) return
    const handler = (e) => {
      const idx = filtered.findIndex(i => i.id === lightbox.id)
      if (e.key === "ArrowRight" && idx < filtered.length - 1) setLightbox(filtered[idx + 1])
      if (e.key === "ArrowLeft"  && idx > 0)                   setLightbox(filtered[idx - 1])
      if (e.key === "Escape") setLightbox(null)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [lightbox, filtered])

  // ── Masonry columns (3 col) ────────────────────────────────────────────────
  const cols = [[], [], []]
  filtered.forEach((img, i) => cols[i % 3].push(img))

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>

      {/* ── HEADER ── */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <h1 style={S.headerTitle}>Gallery</h1>
          <span style={S.headerCount}>{filtered.length} images</span>
        </div>

        <div style={S.headerRight}>
          {/* Search */}
          <div style={S.searchWrap}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity:0.45, flexShrink:0 }}>
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input style={S.searchInput} placeholder="Search images, tags…"
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button style={S.clearBtn} onClick={() => setSearch("")}>✕</button>
            )}
          </div>

          {/* Upload button */}
          <button style={S.uploadBtn} onClick={() => setShowUpload(true)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v9M3.5 4L7 1l3.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 10v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Upload
          </button>
        </div>
      </div>

      {/* ── TAGS FILTER ── */}
      <div style={S.tagsRow}>
        {allTags.map(tag => (
          <button key={tag}
            style={{ ...S.tagPill, ...(activeTag === tag ? S.tagPillActive : {}) }}
            onClick={() => setActiveTag(tag)}>
            {tag}
          </button>
        ))}
      </div>

      {/* ── GRID ── */}
      {loading ? (
        <div style={S.loadingWrap}>
          <div style={S.spinner} />
          <span style={{ color:"#888", fontSize:14 }}>Loading…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={S.emptyWrap}>
          <div style={S.emptyIcon}>🖼</div>
          <p style={S.emptyTitle}>No images found</p>
          <p style={S.emptyHint}>Upload your first image or change the filter</p>
          <button style={S.emptyUploadBtn} onClick={() => setShowUpload(true)}>Upload Image</button>
        </div>
      ) : (
        <div style={S.masonryGrid}>
          {cols.map((col, ci) => (
            <div key={ci} style={S.masonryCol}>
              {col.map(img => (
                <ImageCard key={img.id} img={img}
                  onOpen={() => setLightbox(img)}
                  onEdit={() => setEditImage(img)}
                  onDelete={() => handleDelete(img)}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <Lightbox
          img={lightbox}
          total={filtered.length}
          index={filtered.findIndex(i => i.id === lightbox.id)}
          onClose={() => setLightbox(null)}
          onPrev={() => {
            const idx = filtered.findIndex(i => i.id === lightbox.id)
            if (idx > 0) setLightbox(filtered[idx - 1])
          }}
          onNext={() => {
            const idx = filtered.findIndex(i => i.id === lightbox.id)
            if (idx < filtered.length - 1) setLightbox(filtered[idx + 1])
          }}
          onEdit={() => { setEditImage(lightbox); setLightbox(null) }}
          onDelete={() => handleDelete(lightbox)}
        />
      )}

      {/* ── UPLOAD MODAL ── */}
      {showUpload && (
        <UploadModal
          uploading={uploading}
          onClose={() => setShowUpload(false)}
          onUpload={handleUpload}
        />
      )}

      {/* ── EDIT MODAL ── */}
      {editImage && (
        <EditModal
          img={editImage}
          onClose={() => setEditImage(null)}
          onSave={handleEdit}
        />
      )}
    </div>
  )
}

// ─── ImageCard ────────────────────────────────────────────────────────────────
function ImageCard({ img, onOpen, onEdit, onDelete }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={S.card}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}>
      {/* Image */}
      <div style={S.cardImgWrap} onClick={onOpen}>
        <img src={img.url} alt={img.name} style={S.cardImg}
          loading="lazy" onError={e => { e.target.style.display = "none" }} />
        {hov && <div style={S.cardOverlay} />}
        {hov && (
          <div style={S.cardExpandIcon}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7 3H3v4M11 3h4v4M7 15H3v-4M11 15h4v-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={S.cardBody}>
        <div style={S.cardTopRow}>
          <span style={S.cardName}>{img.name}</span>
          <div style={S.cardActions}>
            <ActionBtn title="Edit" onClick={onEdit}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
              </svg>
            </ActionBtn>
            <ActionBtn title="Delete" danger onClick={onDelete}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1.5 3h9M4 3V2h4v1M3.5 3l.5 7h4l.5-7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </ActionBtn>
          </div>
        </div>
        {img.description && (
          <p style={S.cardDesc}>{img.description}</p>
        )}
        {img.tags?.length > 0 && (
          <div style={S.cardTags}>
            {img.tags.map(t => <span key={t} style={S.cardTag}>{t}</span>)}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ img, total, index, onClose, onPrev, onNext, onEdit, onDelete }) {
  return (
    <div style={S.lbOverlay} onClick={onClose}>
      {/* Prev */}
      {index > 0 && (
        <button style={{ ...S.lbNav, left:16 }} onClick={e => { e.stopPropagation(); onPrev() }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 4L7 10l6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Next */}
      {index < total - 1 && (
        <button style={{ ...S.lbNav, right:16 }} onClick={e => { e.stopPropagation(); onNext() }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 4l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Content */}
      <div style={S.lbContent} onClick={e => e.stopPropagation()}>
        <img src={img.url} alt={img.name} style={S.lbImg} />

        <div style={S.lbPanel}>
          <div style={S.lbPanelTop}>
            <div>
              <h2 style={S.lbName}>{img.name}</h2>
              {img.description && <p style={S.lbDesc}>{img.description}</p>}
              {img.tags?.length > 0 && (
                <div style={S.lbTags}>
                  {img.tags.map(t => <span key={t} style={S.lbTag}>{t}</span>)}
                </div>
              )}
              <p style={S.lbDate}>{new Date(img.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}</p>
            </div>

            <div style={S.lbActions}>
              <button style={S.lbActionBtn} onClick={onEdit}>Edit</button>
              <button style={{ ...S.lbActionBtn, ...S.lbDeleteBtn }} onClick={() => { onDelete(); onClose() }}>Delete</button>
            </div>
          </div>

          <div style={S.lbCounter}>{index + 1} / {total}</div>
        </div>
      </div>

      {/* Close */}
      <button style={S.lbClose} onClick={onClose}>✕</button>
    </div>
  )
}

// ─── UploadModal ──────────────────────────────────────────────────────────────
function UploadModal({ uploading, onClose, onUpload }) {
  const [file, setFile]         = useState(null)
  const [preview, setPreview]   = useState(null)
  const [name, setName]         = useState("")
  const [desc, setDesc]         = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags]         = useState([])
  const [drag, setDrag]         = useState(false)
  const fileRef = useRef(null)

  const handleFile = (f) => {
    if (!f || !f.type.startsWith("image/")) return
    setFile(f)
    setName(f.name.replace(/\.[^.]+$/, ""))
    setPreview(URL.createObjectURL(f))
  }

  const addTag = (e) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault()
      const t = tagInput.trim().replace(/,/g, "")
      if (!tags.includes(t)) setTags(prev => [...prev, t])
      setTagInput("")
    }
  }

  const removeTag = (t) => setTags(prev => prev.filter(x => x !== t))

  const submit = () => {
    if (!file || !name.trim()) return
    onUpload({ file, name: name.trim(), description: desc.trim(), tags })
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, width:460 }} onClick={e => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <span style={S.modalTitle}>Upload Image</span>
          <button style={S.modalCloseBtn} onClick={onClose}>✕</button>
        </div>

        {/* Drop zone */}
        {!preview ? (
          <div
            style={{ ...S.dropZone, ...(drag ? S.dropZoneActive : {}) }}
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}
            onClick={() => fileRef.current?.click()}>
            <div style={S.dropIcon}>📸</div>
            <p style={S.dropText}>Drag & drop image here</p>
            <p style={S.dropHint}>or click to browse</p>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }}
              onChange={e => handleFile(e.target.files[0])} />
          </div>
        ) : (
          <div style={S.previewWrap}>
            <img src={preview} style={S.previewImg} alt="preview" />
            <button style={S.changeImgBtn} onClick={() => { setFile(null); setPreview(null) }}>
              Change Image
            </button>
          </div>
        )}

        {/* Fields */}
        <div style={S.fields}>
          <div style={S.fieldRow}>
            <label style={S.label}>Name *</label>
            <input style={S.input} placeholder="Image name"
              value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div style={S.fieldRow}>
            <label style={S.label}>Description</label>
            <textarea style={{ ...S.input, ...S.textarea }}
              placeholder="Add a description…"
              value={desc} onChange={e => setDesc(e.target.value)} />
          </div>

          <div style={S.fieldRow}>
            <label style={S.label}>Tags</label>
            <div style={S.tagInputWrap}>
              {tags.map(t => (
                <span key={t} style={S.tagChip}>
                  {t}
                  <button style={S.tagRemoveBtn} onClick={() => removeTag(t)}>✕</button>
                </span>
              ))}
              <input style={S.tagInput}
                placeholder="Add tag, press Enter"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag} />
            </div>
          </div>
        </div>

        <div style={S.modalBtns}>
          <button style={S.modalCancel} onClick={onClose}>Cancel</button>
          <button
            style={{ ...S.modalConfirm, opacity: (!file || !name.trim() || uploading) ? 0.5 : 1 }}
            disabled={!file || !name.trim() || uploading}
            onClick={submit}>
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── EditModal ────────────────────────────────────────────────────────────────
function EditModal({ img, onClose, onSave }) {
  const [name, setName]         = useState(img.name || "")
  const [desc, setDesc]         = useState(img.description || "")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags]         = useState(img.tags || [])

  const addTag = (e) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault()
      const t = tagInput.trim().replace(/,/g, "")
      if (!tags.includes(t)) setTags(prev => [...prev, t])
      setTagInput("")
    }
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, width:420 }} onClick={e => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <span style={S.modalTitle}>Edit Image</span>
          <button style={S.modalCloseBtn} onClick={onClose}>✕</button>
        </div>

        <img src={img.url} alt={img.name}
          style={{ width:"100%", height:180, objectFit:"cover", borderRadius:8, marginBottom:16 }} />

        <div style={S.fields}>
          <div style={S.fieldRow}>
            <label style={S.label}>Name</label>
            <input style={S.input} value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div style={S.fieldRow}>
            <label style={S.label}>Description</label>
            <textarea style={{ ...S.input, ...S.textarea }}
              value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div style={S.fieldRow}>
            <label style={S.label}>Tags</label>
            <div style={S.tagInputWrap}>
              {tags.map(t => (
                <span key={t} style={S.tagChip}>
                  {t}
                  <button style={S.tagRemoveBtn} onClick={() => setTags(p => p.filter(x => x !== t))}>✕</button>
                </span>
              ))}
              <input style={S.tagInput} placeholder="Add tag, press Enter"
                value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag} />
            </div>
          </div>
        </div>

        <div style={S.modalBtns}>
          <button style={S.modalCancel} onClick={onClose}>Cancel</button>
          <button style={S.modalConfirm}
            onClick={() => onSave({ id:img.id, name:name.trim(), description:desc.trim(), tags })}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ActionBtn({ title, onClick, danger, children }) {
  const [h, setH] = useState(false)
  return (
    <button title={title} onClick={e => { e.stopPropagation(); onClick() }}
      style={{
        border:"none", background: h ? (danger ? "rgba(231,76,60,0.12)" : "rgba(0,0,0,0.07)") : "transparent",
        cursor:"pointer", width:24, height:24, borderRadius:5,
        display:"flex", alignItems:"center", justifyContent:"center",
        color: danger ? "#e74c3c" : "#888", padding:0,
      }}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
      {children}
    </button>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight:"100vh", background:"#f8f8f6",
    fontFamily:"-apple-system,'SF Pro Text','Helvetica Neue',sans-serif",
    color:"#1c1c1e", padding:"0 0 60px",
  },

  // Header
  header: {
    display:"flex", alignItems:"center", justifyContent:"space-between",
    padding:"24px 32px 0", flexWrap:"wrap", gap:12,
  },
  headerLeft: { display:"flex", alignItems:"baseline", gap:10 },
  headerTitle: { fontSize:26, fontWeight:700, letterSpacing:-0.5, margin:0 },
  headerCount: { fontSize:13, color:"#aeaeb2" },
  headerRight: { display:"flex", alignItems:"center", gap:10 },

  // Search
  searchWrap: {
    display:"flex", alignItems:"center", gap:8,
    background:"#fff", border:"0.5px solid rgba(0,0,0,0.12)",
    borderRadius:10, padding:"8px 12px", width:240,
  },
  searchInput: {
    border:"none", background:"transparent", outline:"none",
    fontSize:13.5, flex:1, color:"inherit", fontFamily:"inherit",
  },
  clearBtn: {
    border:"none", background:"transparent", cursor:"pointer",
    color:"#aeaeb2", fontSize:11, padding:0,
  },

  // Upload btn
  uploadBtn: {
    display:"flex", alignItems:"center", gap:7,
    padding:"9px 18px", background:"#1c1c1e",
    border:"none", borderRadius:10, cursor:"pointer",
    fontSize:13.5, color:"#fff", fontFamily:"inherit", fontWeight:500,
  },

  // Tags
  tagsRow: {
    display:"flex", gap:8, padding:"18px 32px 0",
    flexWrap:"wrap",
  },
  tagPill: {
    padding:"5px 14px", border:"0.5px solid rgba(0,0,0,0.12)",
    borderRadius:20, cursor:"pointer", fontSize:12.5,
    background:"#fff", color:"#555", fontFamily:"inherit",
    transition:"all 0.12s",
  },
  tagPillActive: {
    background:"#1c1c1e", color:"#fff", border:"0.5px solid #1c1c1e",
  },

  // Loading
  loadingWrap: {
    display:"flex", flexDirection:"column", alignItems:"center",
    justifyContent:"center", gap:12, minHeight:400,
  },
  spinner: {
    width:32, height:32, border:"3px solid rgba(0,0,0,0.08)",
    borderTopColor:"#1c1c1e", borderRadius:"50%",
    animation:"spin 0.8s linear infinite",
  },

  // Empty
  emptyWrap: {
    display:"flex", flexDirection:"column", alignItems:"center",
    justifyContent:"center", gap:10, minHeight:400,
  },
  emptyIcon: { fontSize:48, marginBottom:4 },
  emptyTitle: { fontSize:17, fontWeight:600, margin:0 },
  emptyHint:  { fontSize:13.5, color:"#aeaeb2", margin:0 },
  emptyUploadBtn: {
    marginTop:8, padding:"9px 22px",
    background:"#1c1c1e", color:"#fff",
    border:"none", borderRadius:10, cursor:"pointer",
    fontSize:13.5, fontFamily:"inherit",
  },

  // Masonry
  masonryGrid: {
    display:"grid", gridTemplateColumns:"repeat(3, 1fr)",
    gap:16, padding:"20px 32px 0", alignItems:"start",
  },
  masonryCol: { display:"flex", flexDirection:"column", gap:16 },

  // Card
  card: {
    background:"#fff", borderRadius:14,
    border:"0.5px solid rgba(0,0,0,0.08)",
    overflow:"hidden", transition:"transform 0.15s, box-shadow 0.15s",
  },
  cardImgWrap: { position:"relative", cursor:"pointer", overflow:"hidden" },
  cardImg: { width:"100%", display:"block", objectFit:"cover" },
  cardOverlay: {
    position:"absolute", inset:0,
    background:"rgba(0,0,0,0.25)",
  },
  cardExpandIcon: {
    position:"absolute", top:"50%", left:"50%",
    transform:"translate(-50%,-50%)",
    background:"rgba(0,0,0,0.5)", borderRadius:"50%",
    width:40, height:40, display:"flex",
    alignItems:"center", justifyContent:"center",
  },
  cardBody: { padding:"12px 12px 10px" },
  cardTopRow: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 },
  cardName: { fontSize:13.5, fontWeight:600, flex:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  cardActions: { display:"flex", gap:2, flexShrink:0 },
  cardDesc: { fontSize:12.5, color:"#666", margin:"0 0 8px", lineHeight:1.5,
    display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" },
  cardTags: { display:"flex", flexWrap:"wrap", gap:4 },
  cardTag: {
    fontSize:11, padding:"2px 8px",
    background:"rgba(0,0,0,0.06)", borderRadius:20, color:"#666",
  },

  // Lightbox
  lbOverlay: {
    position:"fixed", inset:0, background:"rgba(0,0,0,0.92)",
    display:"flex", alignItems:"center", justifyContent:"center",
    zIndex:500,
  },
  lbContent: {
    display:"flex", maxWidth:"90vw", maxHeight:"88vh",
    borderRadius:16, overflow:"hidden",
    background:"#1a1a1a",
  },
  lbImg: {
    maxWidth:"60vw", maxHeight:"88vh",
    objectFit:"contain", display:"block",
  },
  lbPanel: {
    width:260, padding:"24px 20px",
    display:"flex", flexDirection:"column", justifyContent:"space-between",
    background:"#1a1a1a", borderLeft:"1px solid rgba(255,255,255,0.06)",
    overflowY:"auto",
  },
  lbPanelTop: { display:"flex", flexDirection:"column", gap:12 },
  lbName: { fontSize:17, fontWeight:600, color:"#eee", margin:"0 0 6px", letterSpacing:-0.2 },
  lbDesc: { fontSize:13.5, color:"#888", lineHeight:1.6, margin:"0 0 10px" },
  lbTags: { display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 },
  lbTag: {
    fontSize:11.5, padding:"3px 10px",
    background:"rgba(255,255,255,0.08)", borderRadius:20, color:"#aaa",
  },
  lbDate: { fontSize:11.5, color:"#555" },
  lbActions: { display:"flex", gap:8, marginTop:4 },
  lbActionBtn: {
    flex:1, padding:"8px", border:"1px solid rgba(255,255,255,0.12)",
    borderRadius:8, cursor:"pointer", fontSize:12.5,
    background:"transparent", color:"#ccc", fontFamily:"inherit",
  },
  lbDeleteBtn: { borderColor:"rgba(231,76,60,0.3)", color:"#e74c3c" },
  lbCounter: { fontSize:12, color:"#555", textAlign:"center", paddingTop:16 },
  lbNav: {
    position:"fixed", top:"50%", transform:"translateY(-50%)",
    background:"rgba(255,255,255,0.08)", border:"none",
    borderRadius:"50%", width:44, height:44,
    display:"flex", alignItems:"center", justifyContent:"center",
    cursor:"pointer", zIndex:501,
  },
  lbClose: {
    position:"fixed", top:20, right:20,
    background:"rgba(255,255,255,0.1)", border:"none",
    borderRadius:"50%", width:36, height:36,
    display:"flex", alignItems:"center", justifyContent:"center",
    cursor:"pointer", color:"#fff", fontSize:14, zIndex:501,
  },

  // Modals
  overlay: {
    position:"fixed", inset:0, background:"rgba(0,0,0,0.45)",
    display:"flex", alignItems:"center", justifyContent:"center", zIndex:400,
  },
  modal: {
    background:"#fff", borderRadius:16, padding:"22px 22px 18px",
    width:400, maxHeight:"90vh", overflowY:"auto",
    boxShadow:"0 24px 80px rgba(0,0,0,0.2)",
  },
  modalHeader: {
    display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18,
  },
  modalTitle: { fontSize:17, fontWeight:600 },
  modalCloseBtn: {
    border:"none", background:"rgba(0,0,0,0.06)", borderRadius:"50%",
    width:28, height:28, cursor:"pointer", fontSize:12, color:"#666",
  },

  // Drop zone
  dropZone: {
    border:"2px dashed rgba(0,0,0,0.15)", borderRadius:12,
    padding:"32px 20px", textAlign:"center", cursor:"pointer",
    marginBottom:16, transition:"all 0.15s",
  },
  dropZoneActive: {
    border:"2px dashed #4A90D9", background:"rgba(74,144,217,0.05)",
  },
  dropIcon: { fontSize:36, marginBottom:8 },
  dropText: { fontSize:14, fontWeight:500, margin:"0 0 4px" },
  dropHint: { fontSize:12.5, color:"#aeaeb2", margin:0 },
  previewWrap: { position:"relative", marginBottom:16, borderRadius:10, overflow:"hidden" },
  previewImg: { width:"100%", maxHeight:200, objectFit:"cover", display:"block" },
  changeImgBtn: {
    position:"absolute", bottom:8, right:8,
    background:"rgba(0,0,0,0.55)", color:"#fff",
    border:"none", borderRadius:6, padding:"5px 10px",
    fontSize:12, cursor:"pointer", fontFamily:"inherit",
  },

  // Fields
  fields: { display:"flex", flexDirection:"column", gap:12, marginBottom:18 },
  fieldRow: { display:"flex", flexDirection:"column", gap:4 },
  label: { fontSize:12, fontWeight:500, color:"#888", textTransform:"uppercase", letterSpacing:"0.05em" },
  input: {
    border:"0.5px solid rgba(0,0,0,0.15)", borderRadius:8,
    padding:"8px 11px", fontSize:13.5, outline:"none",
    fontFamily:"inherit", color:"#1c1c1e", background:"#fafafa",
    boxSizing:"border-box", width:"100%",
  },
  textarea: { resize:"none", height:72, lineHeight:1.55 },
  tagInputWrap: {
    display:"flex", flexWrap:"wrap", gap:6,
    border:"0.5px solid rgba(0,0,0,0.15)", borderRadius:8,
    padding:"7px 10px", background:"#fafafa", minHeight:40,
  },
  tagChip: {
    display:"flex", alignItems:"center", gap:4,
    background:"rgba(0,0,0,0.07)", borderRadius:20,
    padding:"2px 8px", fontSize:12, color:"#444",
  },
  tagRemoveBtn: {
    border:"none", background:"transparent", cursor:"pointer",
    color:"#999", fontSize:10, padding:0, lineHeight:1,
  },
  tagInput: {
    border:"none", background:"transparent", outline:"none",
    fontSize:13, fontFamily:"inherit", flex:1, minWidth:100,
  },

  // Btns
  modalBtns: { display:"flex", gap:8, justifyContent:"flex-end" },
  modalCancel: {
    padding:"8px 18px", border:"0.5px solid rgba(0,0,0,0.15)",
    borderRadius:8, cursor:"pointer", fontSize:13.5,
    background:"#fff", fontFamily:"inherit", color:"#555",
  },
  modalConfirm: {
    padding:"8px 18px", border:"none", borderRadius:8,
    cursor:"pointer", fontSize:13.5, color:"#fff",
    background:"#1c1c1e", fontFamily:"inherit", fontWeight:500,
  },
}