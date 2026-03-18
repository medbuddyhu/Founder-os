"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
)

const BUCKET = "whiteboard-saves"

const STATUSES = [
  { id: "discuss", label: "Discuss", emoji: "💬", bg: "#EEF4FF", color: "#3B5BDB", border: "rgba(59,91,219,0.2)" },
  { id: "best",    label: "Best",    emoji: "🔥", bg: "#EBFBEE", color: "#2F9E44", border: "rgba(47,158,68,0.2)"  },
  { id: "worst",   label: "Worst",   emoji: "❌", bg: "#FFF5F5", color: "#C92A2A", border: "rgba(201,42,42,0.2)"  },
  { id: "pending", label: "Pending", emoji: "⏳", bg: "#FFF9DB", color: "#E67700", border: "rgba(230,119,0,0.2)"  },
]
const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.id, s]))

function fmt(iso) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const I = {
  pen:     () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  eraser:  () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9.5 3.5L12.5 6.5L6 13H3V10L9.5 3.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M3 13H13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  text:    () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4H13M8 4V13M6 13H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  save:    () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M13 14H3C2.4 14 2 13.6 2 13V3C2 2.4 2.4 2 3 2H11L14 5V13C14 13.6 13.6 14 13 14Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M5 2V6H11V2M5 9H11M5 12H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  trash:   () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3H12M5 3V2H9V3M3 3L4 12H10L11 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  close:   () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  board:   () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 14H14M5 12V14M11 12V14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  plus:    () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  search:  () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  chevD:   () => <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 4L5.5 7.5L9 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  img:     () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="6" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.1"/><path d="M2 11L5.5 7.5L8 10L10.5 7.5L14 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  spin:    () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{animation:"sg-spin .7s linear infinite"}}><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 14" strokeLinecap="round"/></svg>,
  idea:    () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1C4.8 1 3 2.8 3 5C3 6.4 3.7 7.6 4.7 8.4V10H9.3V8.4C10.3 7.6 11 6.4 11 5C11 2.8 9.2 1 7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M5 10V11C5 11.6 5.4 12 6 12H8C8.6 12 9 11.6 9 11V10" stroke="currentColor" strokeWidth="1.2"/></svg>,
  link:    () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 11L11 3M11 3H7M11 3V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  clear:   () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  check:   () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7L5.5 10.5L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

// ─── Whiteboard ───────────────────────────────────────────────────────────────
function Whiteboard({ onClose, onSaved }) {
  const canvasRef = useRef(null)
  const drawing   = useRef(false)
  const lastPos   = useRef(null)
  const [tool, setTool]     = useState("pen")
  const [color, setColor]   = useState("#1a1a1a")
  const [size, setSize]     = useState(3)
  const [txtVal, setTxtVal] = useState("")
  const [txtPos, setTxtPos] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState("")

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    c.width  = c.offsetWidth
    c.height = c.offsetHeight
    const ctx = c.getContext("2d")
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, c.width, c.height)
  }, [])

  const pos = (e, c) => {
    const r = c.getBoundingClientRect()
    const s = e.touches ? e.touches[0] : e
    return { x: s.clientX - r.left, y: s.clientY - r.top }
  }

  const onStart = e => {
    if (tool === "text") { setTxtPos(pos(e, canvasRef.current)); return }
    drawing.current = true
    lastPos.current = pos(e, canvasRef.current)
  }

  const onMove = e => {
    if (!drawing.current) return
    e.preventDefault()
    const c = canvasRef.current, ctx = c.getContext("2d"), p = pos(e, c)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.strokeStyle = tool === "eraser" ? "#fff" : color
    ctx.lineWidth   = tool === "eraser" ? size * 7 : size
    ctx.lineCap = ctx.lineJoin = "round"
    ctx.stroke()
    lastPos.current = p
  }

  const onEnd = () => { drawing.current = false; lastPos.current = null }

  const placeText = () => {
    if (!txtVal.trim() || !txtPos) return
    const ctx = canvasRef.current.getContext("2d")
    ctx.font = `${size * 5 + 10}px 'DM Sans',sans-serif`
    ctx.fillStyle = color
    ctx.fillText(txtVal.trim(), txtPos.x, txtPos.y)
    setTxtVal(""); setTxtPos(null)
  }

  const clearAll = () => {
    const c = canvasRef.current, ctx = c.getContext("2d")
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, c.width, c.height)
    setTxtPos(null)
  }

  const saveBoard = async () => {
    setSaving(true)
    canvasRef.current.toBlob(async blob => {
      const fn = `board_${Date.now()}.png`
      const { error: e1 } = await supabase.storage.from(BUCKET).upload(fn, blob, { contentType: "image/png" })
      if (e1) { setSaving(false); setMsg("Upload failed"); return }
      const { data: u } = supabase.storage.from(BUCKET).getPublicUrl(fn)
      const { error: e2 } = await supabase.from("whiteboard_saves").insert([{ filename: fn, url: u?.publicUrl || "", created_at: new Date().toISOString() }])
      setSaving(false)
      if (!e2) { setMsg("Saved!"); setTimeout(() => setMsg(""), 2500); onSaved?.() }
    }, "image/png")
  }

  const COLORS  = ["#1a1a1a","#e03131","#1971c2","#2f9e44","#e67700","#7048e8","#c2255c","#ffffff"]
  const TOOLS   = [{ id:"pen", lbl:"Pen", Icon:I.pen }, { id:"eraser", lbl:"Eraser", Icon:I.eraser }, { id:"text", lbl:"Text", Icon:I.text }]

  return (
    <div style={{ position:"fixed", inset:0, zIndex:90, background:"rgba(8,12,20,0.75)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:14, animation:"sg-fade .2s ease" }}>
      <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:960, height:"90dvh", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 32px 64px rgba(0,0,0,0.3)" }}>

        {/* Toolbar */}
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderBottom:"1px solid #f0f0f0", flexWrap:"wrap", flexShrink:0, background:"#fafafa" }}>

          {/* Tool group */}
          <div style={{ display:"flex", gap:3, background:"#f0f0f0", borderRadius:10, padding:3 }}>
            {TOOLS.map(t => (
              <button key={t.id} onClick={() => setTool(t.id)} title={t.lbl}
                style={{ width:32, height:32, borderRadius:8, border:"none", background: tool===t.id ? "#fff" : "transparent", color: tool===t.id ? "#1a73e8" : "#777", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow: tool===t.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition:"all .15s" }}>
                <t.Icon />
              </button>
            ))}
          </div>

          <div style={{ width:1, height:22, background:"#e8e8e8", flexShrink:0 }} />

          {/* Color palette */}
          <div style={{ display:"flex", gap:5, alignItems:"center", flexWrap:"wrap" }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                style={{ width:22, height:22, borderRadius:"50%", background:c, border: color===c ? "3px solid #1a73e8" : c==="#ffffff" ? "1.5px solid #ddd" : "1.5px solid transparent", cursor:"pointer", flexShrink:0, transition:"transform .1s", transform: color===c ? "scale(1.15)" : "scale(1)" }} />
            ))}
            {/* Custom color */}
            <div style={{ position:"relative" }}>
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                style={{ width:22, height:22, borderRadius:"50%", border:"1.5px solid #ddd", cursor:"pointer", padding:0, overflow:"hidden" }} />
            </div>
          </div>

          <div style={{ width:1, height:22, background:"#e8e8e8", flexShrink:0 }} />

          {/* Size */}
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:10, color:"#aaa", fontWeight:600, letterSpacing:"0.08em" }}>SIZE</span>
            <input type="range" min={1} max={12} value={size} onChange={e => setSize(+e.target.value)} style={{ width:70, accentColor:"#1a73e8" }} />
            <div style={{ width:size*2+4, height:size*2+4, borderRadius:"50%", background:color==="#ffffff" ? "#ddd" : color, flexShrink:0, transition:"all .15s", border:"1px solid rgba(0,0,0,0.1)" }} />
          </div>

          {/* Text input */}
          {tool === "text" && (
            <>
              <div style={{ width:1, height:22, background:"#e8e8e8", flexShrink:0 }} />
              <input type="text" value={txtVal} onChange={e => setTxtVal(e.target.value)}
                onKeyDown={e => e.key === "Enter" && placeText()}
                placeholder="Type then click on canvas…"
                style={{ flex:1, minWidth:120, padding:"7px 11px", border:"1px solid #e8e8e8", borderRadius:9, fontSize:13, outline:"none", fontFamily:"inherit", background:"#fff" }} />
              <button onClick={placeText}
                style={{ padding:"7px 13px", borderRadius:9, border:"none", background:"#1a73e8", color:"#fff", fontSize:12, fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                <I.check /> Place
              </button>
            </>
          )}

          {/* Right actions */}
          <div style={{ marginLeft:"auto", display:"flex", gap:7, alignItems:"center" }}>
            {msg && <span style={{ fontSize:12, color:"#2f9e44", fontWeight:500 }}>{msg}</span>}
            <button onClick={clearAll}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", borderRadius:9, border:"1px solid #e8e8e8", background:"#fff", fontSize:12, fontWeight:500, color:"#555", cursor:"pointer" }}>
              <I.clear /> Clear
            </button>
            <button onClick={saveBoard} disabled={saving}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:9, border:"none", background: saving ? "#aaa" : "#1a1a1a", color:"#fff", fontSize:12, fontWeight:500, cursor: saving ? "not-allowed":"pointer" }}>
              {saving ? <I.spin /> : <I.save />} {saving ? "Saving…" : "Save Board"}
            </button>
            <button onClick={onClose}
              style={{ width:32, height:32, borderRadius:9, border:"1px solid #e8e8e8", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#aaa" }}>
              <I.close />
            </button>
          </div>
        </div>

        {/* Canvas area */}
        <div style={{ flex:1, position:"relative", overflow:"hidden", background:"#fff" }}>
          {/* Grid lines for whiteboard feel */}
          <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(0,0,0,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.04) 1px,transparent 1px)", backgroundSize:"28px 28px", pointerEvents:"none", zIndex:0 }} />
          <canvas
            ref={canvasRef}
            style={{ display:"block", width:"100%", height:"100%", position:"relative", zIndex:1, touchAction:"none", cursor: tool==="eraser" ? "cell" : tool==="text" ? "text" : "crosshair" }}
            onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
            onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
          />
          {txtPos && (
            <div style={{ position:"absolute", left:txtPos.x+8, top:txtPos.y-28, background:"#1a73e8", color:"#fff", borderRadius:6, padding:"3px 8px", fontSize:10, fontWeight:500, pointerEvents:"none", zIndex:2, whiteSpace:"nowrap", boxShadow:"0 2px 8px rgba(26,115,232,0.3)" }}>
              ✏ Click canvas to place text
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Status Badge Dropdown ─────────────────────────────────────────────────────
function StatusBadge({ statusId, onChange }) {
  const [open, setOpen] = useState(false)
  const s = STATUS_MAP[statusId] || STATUS_MAP.discuss

  return (
    <div style={{ position:"relative" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px 4px 8px", borderRadius:20, border:"1.5px solid " + s.border, background:s.bg, color:s.color, fontSize:11, fontWeight:600, cursor:"pointer", WebkitTapHighlightColor:"transparent", letterSpacing:"0.02em" }}>
        <span>{s.emoji}</span> {s.label} <I.chevD />
      </button>
      {open && (
        <>
          <div style={{ position:"fixed", inset:0, zIndex:28 }} onClick={() => setOpen(false)} />
          <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, background:"#fff", borderRadius:14, border:"1px solid #f0f0f0", boxShadow:"0 8px 32px rgba(0,0,0,0.12)", zIndex:29, overflow:"hidden", minWidth:140 }}>
            {STATUSES.map(st => (
              <button key={st.id} onClick={() => { onChange(st.id); setOpen(false) }}
                style={{ width:"100%", padding:"10px 14px", border:"none", background: statusId===st.id ? st.bg : "transparent", color: statusId===st.id ? st.color : "#444", fontFamily:"inherit", fontSize:13, fontWeight: statusId===st.id ? 600 : 400, cursor:"pointer", display:"flex", alignItems:"center", gap:8, textAlign:"left", transition:"background .1s" }}>
                {st.emoji} {st.label}
                {statusId===st.id && <span style={{ marginLeft:"auto", color:st.color }}><I.check /></span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Suggestion Card ──────────────────────────────────────────────────────────
function SuggCard({ item, onStatusChange, onDelete }) {
  const s = STATUS_MAP[item.status] || STATUS_MAP.discuss
  return (
    <div className="sg-card">
      {/* Color accent bar */}
      <div style={{ height:3, background:s.color, borderRadius:"99px 99px 0 0", margin:"-18px -18px 14px", opacity:0.7 }} />

      <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:600, color:"#111", lineHeight:1.4, marginBottom: item.description ? 5 : 0 }}>
            {item.title}
          </div>
          {item.description && (
            <div style={{ fontSize:12, color:"#888", lineHeight:1.65 }}>{item.description}</div>
          )}
        </div>
        <button onClick={onDelete} className="sg-del-btn" title="Delete">
          <I.trash />
        </button>
      </div>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <StatusBadge statusId={item.status} onChange={id => onStatusChange(item.id, id)} />
        <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, color:"#bbb" }}>
          {item.by && <span style={{ fontWeight:500 }}>by {item.by}</span>}
          <span>{fmt(item.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Add Modal ────────────────────────────────────────────────────────────────
function AddModal({ onClose, onSave, saving }) {
  const [form, setForm] = useState({ title:"", description:"", status:"discuss", by:"" })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="sg-overlay" onClick={e => { if (e.target===e.currentTarget) onClose() }}>
      <div className="sg-modal">
        <div className="sg-modal-head">
          <span style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color:"#111", letterSpacing:"-0.01em" }}>New suggestion</span>
          <button onClick={onClose} className="sg-icon-btn"><I.close /></button>
        </div>
        <div className="sg-modal-body">
          <div className="sg-form-field">
            <label className="sg-label">Title <span style={{ color:"#e03131" }}>*</span></label>
            <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="What's the suggestion?"
              className="sg-input" />
          </div>
          <div className="sg-form-field">
            <label className="sg-label">Details</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Explain the idea or discussion point…" rows={3} className="sg-input sg-textarea" />
          </div>
          <div className="sg-form-field">
            <label className="sg-label">Added by</label>
            <input value={form.by} onChange={e => set("by", e.target.value)} placeholder="Your name (optional)"
              className="sg-input" />
          </div>

          <div className="sg-form-field">
            <label className="sg-label">Status</label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
              {STATUSES.map(s => (
                <button key={s.id} type="button" onClick={() => set("status", s.id)}
                  style={{ padding:"10px 12px", borderRadius:12, border:"2px solid " + (form.status===s.id ? s.color : "#f0f0f0"), background: form.status===s.id ? s.bg : "#fafafa", color: form.status===s.id ? s.color : "#777", fontFamily:"inherit", fontSize:13, fontWeight: form.status===s.id ? 600 : 400, cursor:"pointer", display:"flex", alignItems:"center", gap:6, justifyContent:"center", transition:"all .15s" }}>
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => { if (!form.title.trim()) return; onSave(form) }}
            disabled={saving || !form.title.trim()} className="sg-submit-btn">
            {saving ? <I.spin /> : <I.plus />}
            {saving ? "Adding…" : "Add suggestion"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Boards Gallery ───────────────────────────────────────────────────────────
function BoardsGallery({ boards, onDelete, loading }) {
  const [full, setFull] = useState(null)

  if (loading) return <div className="sg-loading">Loading boards…</div>
  if (!boards.length) return (
    <div className="sg-empty">
      <div className="sg-empty-icon">🎨</div>
      <div>No saved boards yet.</div>
      <div style={{ fontSize:12, marginTop:4 }}>Open the whiteboard and save your work.</div>
    </div>
  )

  return (
    <>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12 }}>
        {boards.map(b => (
          <div key={b.id} style={{ borderRadius:14, overflow:"hidden", border:"1px solid #f0f0f0", background:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", cursor:"pointer", transition:"transform .2s, box-shadow .2s" }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.1)" }}
            onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.05)" }}>
            <div onClick={() => setFull(b)} style={{ aspectRatio:"4/3", overflow:"hidden" }}>
              <img src={b.url} alt={b.filename} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
            </div>
            <div style={{ padding:"8px 12px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontSize:10, color:"#aaa", fontWeight:500 }}>{fmt(b.created_at)}</span>
              <div style={{ display:"flex", gap:6 }}>
                <a href={b.url} target="_blank" rel="noopener noreferrer"
                  style={{ color:"#bbb", display:"flex", alignItems:"center", textDecoration:"none", transition:"color .15s" }}
                  onMouseEnter={e => e.currentTarget.style.color="#1a73e8"}
                  onMouseLeave={e => e.currentTarget.style.color="#bbb"}>
                  <I.link />
                </a>
                <button onClick={() => onDelete(b)}
                  style={{ background:"none", border:"none", color:"#ddd", cursor:"pointer", display:"flex", padding:0, transition:"color .15s" }}
                  onMouseEnter={e => e.currentTarget.style.color="#c92a2a"}
                  onMouseLeave={e => e.currentTarget.style.color="#ddd"}>
                  <I.trash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full screen image view */}
      {full && (
        <div onClick={() => setFull(null)} style={{ position:"fixed", inset:0, zIndex:100, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <img src={full.url} alt="board" style={{ maxWidth:"100%", maxHeight:"90dvh", borderRadius:12, boxShadow:"0 24px 48px rgba(0,0,0,0.5)" }} />
          <button onClick={() => setFull(null)} style={{ position:"absolute", top:20, right:20, width:36, height:36, borderRadius:10, border:"none", background:"rgba(255,255,255,0.1)", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <I.close />
          </button>
        </div>
      )}
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SuggestionsPage() {
  const [items, setItems]     = useState([])
  const [boards, setBoards]   = useState([])
  const [ldItems, setLdItems] = useState(true)
  const [ldBrds, setLdBrds]   = useState(true)
  const [filter, setFilter]   = useState("all")
  const [search, setSearch]   = useState("")
  const [addModal, setAdd]    = useState(false)
  const [saving, setSaving]   = useState(false)
  const [wb, setWb]           = useState(false)
  const [tab, setTab]         = useState("suggestions")

  const fetchItems = useCallback(async () => {
    setLdItems(true)
    const { data } = await supabase.from("suggestions").select("*").order("created_at", { ascending: false })
    if (data) setItems(data)
    setLdItems(false)
  }, [])

  const fetchBoards = useCallback(async () => {
    setLdBrds(true)
    const { data } = await supabase.from("whiteboard_saves").select("*").order("created_at", { ascending: false })
    if (data) setBoards(data)
    setLdBrds(false)
  }, [])

  useEffect(() => { fetchItems(); fetchBoards() }, [fetchItems, fetchBoards])

  const handleSave = async (form) => {
    setSaving(true)
    const { error } = await supabase.from("suggestions").insert([{
      title: form.title.trim(), description: form.description.trim(),
      status: form.status, by: form.by.trim(), created_at: new Date().toISOString(),
    }])
    if (!error) { setAdd(false); fetchItems() }
    setSaving(false)
  }

  const handleStatusChange = async (id, status) => {
    setItems(prev => prev.map(i => i.id===id ? { ...i, status } : i))
    await supabase.from("suggestions").update({ status }).eq("id", id)
  }

  const handleDeleteItem = async (id) => {
    setItems(prev => prev.filter(i => i.id!==id))
    await supabase.from("suggestions").delete().eq("id", id)
  }

  const handleDeleteBoard = async (b) => {
    setBoards(prev => prev.filter(x => x.id!==b.id))
    await supabase.storage.from(BUCKET).remove([b.filename])
    await supabase.from("whiteboard_saves").delete().eq("id", b.id)
  }

  const counts = STATUSES.reduce((a, s) => { a[s.id] = items.filter(i => i.status===s.id).length; return a }, {})

  const filtered = items.filter(i =>
    (filter==="all" || i.status===filter) &&
    (i.title?.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        .sg-page { min-height:100vh; min-height:100dvh; background:#f5f5f7; font-family:'DM Sans',sans-serif; }

        /* ── Topbar ── */
        .sg-topbar { background:#fff; border-bottom:1px solid #f0f0f0; padding:12px 16px; display:flex; align-items:center; gap:10px; position:sticky; top:0; z-index:20; }
        .sg-topbar-left { flex:1; min-width:0; }
        .sg-eyebrow { font-size:10px; font-weight:600; color:#1a73e8; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:2px; display:flex; align-items:center; gap:5px; }
        .sg-title { font-family:'DM Serif Display',serif; font-size:20px; font-weight:400; color:#111; letter-spacing:-0.01em; }

        .sg-btn { display:flex; align-items:center; gap:6px; padding:9px 16px; border-radius:10px; border:none; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; cursor:pointer; white-space:nowrap; flex-shrink:0; transition:all .15s; -webkit-tap-highlight-color:transparent; }
        .sg-btn:active { opacity:.85; transform:scale(0.97); }
        .sg-btn-primary { background:#1a73e8; color:#fff; }
        .sg-btn-primary:hover { background:#1558b0; }
        .sg-btn-dark { background:#1a1a1a; color:#fff; }
        .sg-btn-dark:hover { background:#333; }

        /* ── Stats ── */
        .sg-stats { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; padding:16px 16px 0; }
        .sg-stat { border-radius:14px; padding:14px 16px; border:1px solid rgba(0,0,0,0.06); display:flex; flex-direction:column; gap:6px; }
        .sg-stat-num { font-family:'DM Serif Display',serif; font-size:28px; font-weight:400; line-height:1; letter-spacing:-0.02em; }
        .sg-stat-lbl { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; }

        /* ── Tabs ── */
        .sg-tabs { display:flex; gap:4px; padding:14px 16px 0; }
        .sg-tab { padding:8px 16px; border-radius:100px; border:1.5px solid #e8e8e8; background:#fff; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; color:#777; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all .15s; -webkit-tap-highlight-color:transparent; }
        .sg-tab.active { background:#1a1a1a; color:#fff; border-color:#1a1a1a; }
        .sg-tab:hover:not(.active) { border-color:#bbb; color:#333; }

        /* ── Toolbar ── */
        .sg-toolbar { display:flex; align-items:center; gap:8px; padding:12px 16px 0; flex-wrap:wrap; }
        .sg-search { display:flex; align-items:center; gap:8px; background:#fff; border:1px solid #e8e8e8; border-radius:11px; padding:9px 13px; flex:1; min-width:140px; transition:border-color .15s; }
        .sg-search:focus-within { border-color:#1a73e8; }
        .sg-search input { border:none; background:transparent; font-family:'DM Sans',sans-serif; font-size:13px; color:#111; outline:none; width:100%; }
        .sg-search input::placeholder { color:#bbb; }

        .sg-filters { display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; padding-bottom:1px; }
        .sg-filters::-webkit-scrollbar { display:none; }
        .sg-filter-pill { padding:6px 13px; border-radius:100px; border:1.5px solid #e8e8e8; background:#fff; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; color:#777; cursor:pointer; white-space:nowrap; flex-shrink:0; transition:all .15s; -webkit-tap-highlight-color:transparent; }
        .sg-filter-pill.active { background:#1a73e8; color:#fff; border-color:#1a73e8; }
        .sg-filter-pill:hover:not(.active) { border-color:#bbb; color:#333; }

        /* ── Content ── */
        .sg-content { padding:14px 16px 80px; }
        .sg-count { font-size:10px; font-weight:600; color:#bbb; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:14px; }
        .sg-grid { display:grid; grid-template-columns:1fr; gap:12px; }

        /* ── Card ── */
        .sg-card { background:#fff; border:1px solid #f0f0f0; border-radius:16px; padding:18px; transition:box-shadow .2s, transform .2s; }
        .sg-card:hover { box-shadow:0 6px 24px rgba(0,0,0,0.08); transform:translateY(-2px); }

        .sg-del-btn { width:28px; height:28px; border-radius:8px; border:none; background:transparent; color:#ddd; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:background .12s, color .12s; -webkit-tap-highlight-color:transparent; }
        .sg-del-btn:hover { background:#fff0f0; color:#c92a2a; }

        /* ── Empty / Loading ── */
        .sg-empty { text-align:center; padding:60px 20px; color:#bbb; }
        .sg-empty-icon { font-size:36px; margin-bottom:12px; }
        .sg-loading { text-align:center; padding:60px 20px; font-size:13px; color:#ccc; animation:sg-pulse 1.5s ease infinite; }

        /* ── Modal ── */
        .sg-overlay { position:fixed; inset:0; z-index:70; background:rgba(0,0,0,0.35); display:flex; align-items:flex-end; justify-content:center; animation:sg-fade .2s ease; backdrop-filter:blur(4px); }
        .sg-modal { background:#fff; width:100%; max-width:520px; border-radius:24px 24px 0 0; max-height:92dvh; display:flex; flex-direction:column; animation:sg-up .28s cubic-bezier(.22,.68,0,1.2); }
        .sg-modal-head { display:flex; align-items:center; justify-content:space-between; padding:18px 22px 14px; border-bottom:1px solid #f5f5f5; flex-shrink:0; }
        .sg-modal-body { overflow-y:auto; padding:18px 22px 32px; display:flex; flex-direction:column; gap:16px; }

        .sg-form-field { display:flex; flex-direction:column; gap:6px; }
        .sg-label { font-size:11px; font-weight:600; color:#aaa; text-transform:uppercase; letter-spacing:0.08em; }
        .sg-input { width:100%; padding:12px 14px; border:1.5px solid #eee; border-radius:11px; font-family:'DM Sans',sans-serif; font-size:14px; color:#111; outline:none; background:#fafafa; transition:border-color .15s, background .15s; -webkit-appearance:none; }
        .sg-input:focus { border-color:#1a73e8; background:#fff; }
        .sg-input::placeholder { color:#bbb; }
        .sg-textarea { resize:vertical; min-height:80px; }

        .sg-submit-btn { padding:14px; border-radius:12px; border:none; background:#1a73e8; color:#fff; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:background .15s, opacity .15s; -webkit-tap-highlight-color:transparent; }
        .sg-submit-btn:hover:not(:disabled) { background:#1558b0; }
        .sg-submit-btn:disabled { opacity:.5; cursor:not-allowed; }

        .sg-icon-btn { width:32px; height:32px; border-radius:9px; border:1px solid #eee; background:#fff; color:#aaa; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .15s; }
        .sg-icon-btn:hover { background:#f5f5f5; color:#555; }

        /* ── Animations ── */
        @keyframes sg-fade { from{opacity:0} to{opacity:1} }
        @keyframes sg-up   { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes sg-spin { to{transform:rotate(360deg)} }
        @keyframes sg-pulse{ 0%,100%{opacity:.4} 50%{opacity:1} }

        /* ── Responsive ── */
        @media(min-width:640px) {
          .sg-topbar  { padding:14px 24px; }
          .sg-stats   { grid-template-columns:repeat(4,1fr); padding:18px 24px 0; }
          .sg-tabs    { padding:14px 24px 0; }
          .sg-toolbar { padding:12px 24px 0; }
          .sg-content { padding:16px 24px 60px; }
          .sg-grid    { grid-template-columns:repeat(2,1fr); }
          .sg-overlay { align-items:center; padding:24px; backdrop-filter:blur(6px); }
          .sg-modal   { border-radius:20px; max-height:85vh; }
          @keyframes sg-up { from{opacity:0;transform:scale(0.95) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        }
        @media(min-width:1024px) {
          .sg-topbar  { padding:14px 32px; }
          .sg-stats   { padding:18px 32px 0; }
          .sg-tabs    { padding:14px 32px 0; }
          .sg-toolbar { padding:12px 32px 0; }
          .sg-content { padding:16px 32px 60px; }
          .sg-grid    { grid-template-columns:repeat(3,1fr); }
        }
      `}</style>

      <div className="sg-page">

        {/* Topbar */}
        <div className="sg-topbar">
          <div className="sg-topbar-left">
            <div className="sg-eyebrow"><I.idea /> Suggestions Board</div>
            <div className="sg-title">Ideas & Discussion</div>
          </div>
          <button className="sg-btn sg-btn-dark" onClick={() => setWb(true)}>
            <I.board /> Whiteboard
          </button>
          <button className="sg-btn sg-btn-primary" onClick={() => setAdd(true)}>
            <I.plus /> Add
          </button>
        </div>

        {/* Stats */}
        <div className="sg-stats">
          {STATUSES.map(s => (
            <div key={s.id} className="sg-stat" style={{ background:s.bg, borderColor:s.border }}>
              <div className="sg-stat-num" style={{ color:s.color }}>{counts[s.id] || 0}</div>
              <div className="sg-stat-lbl" style={{ color:s.color }}>{s.emoji} {s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="sg-tabs">
          <button className={"sg-tab" + (tab==="suggestions" ? " active" : "")} onClick={() => setTab("suggestions")}>
            <I.idea /> Suggestions <span style={{ background: tab==="suggestions" ? "rgba(255,255,255,0.2)" : "#f0f0f0", color: tab==="suggestions" ? "#fff" : "#888", padding:"1px 7px", borderRadius:20, fontSize:11, fontWeight:600 }}>{items.length}</span>
          </button>
          <button className={"sg-tab" + (tab==="boards" ? " active" : "")} onClick={() => setTab("boards")}>
            <I.img /> Boards <span style={{ background: tab==="boards" ? "rgba(255,255,255,0.2)" : "#f0f0f0", color: tab==="boards" ? "#fff" : "#888", padding:"1px 7px", borderRadius:20, fontSize:11, fontWeight:600 }}>{boards.length}</span>
          </button>
        </div>

        {tab === "suggestions" ? (
          <>
            <div className="sg-toolbar">
              <div className="sg-search">
                <span style={{ color:"#ccc", display:"flex", flexShrink:0 }}><I.search /></span>
                <input type="text" placeholder="Search suggestions…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="sg-filters">
                {[{ id:"all", label:"All", emoji:"📋" }, ...STATUSES].map(f => (
                  <button key={f.id} className={"sg-filter-pill" + (filter===f.id ? " active" : "")} onClick={() => setFilter(f.id)}>
                    {f.emoji} {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="sg-content">
              {!ldItems && <div className="sg-count">{filtered.length} suggestion{filtered.length!==1?"s":""}</div>}
              {ldItems ? (
                <div className="sg-loading">Loading suggestions…</div>
              ) : filtered.length === 0 ? (
                <div className="sg-empty">
                  <div className="sg-empty-icon">💬</div>
                  <div>{search ? "No suggestions match your search." : "No suggestions yet."}</div>
                  {!search && <div style={{ fontSize:12, marginTop:4 }}>Tap <strong>Add</strong> to share your first idea!</div>}
                </div>
              ) : (
                <div className="sg-grid">
                  {filtered.map(item => (
                    <SuggCard key={item.id} item={item}
                      onStatusChange={handleStatusChange}
                      onDelete={() => handleDeleteItem(item.id)} />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="sg-content">
            <div className="sg-count">{boards.length} saved board{boards.length!==1?"s":""}</div>
            <BoardsGallery boards={boards} onDelete={handleDeleteBoard} loading={ldBrds} />
          </div>
        )}
      </div>

      {addModal && <AddModal onClose={() => setAdd(false)} onSave={handleSave} saving={saving} />}

      {wb && (
        <Whiteboard
          onClose={() => setWb(false)}
          onSaved={() => { fetchBoards(); setTab("boards") }}
        />
      )}
    </>
  )
}