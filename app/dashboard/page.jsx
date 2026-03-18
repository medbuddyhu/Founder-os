"use client"

import { useEffect, useState } from "react"
import Sidebar from "@/components/dashboard/Sidebar"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"

const COLORS = ["#4A90D9","#7B68EE","#E67E22","#2ECC71","#E74C3C","#1ABC9C","#9B59B6","#F39C12"]

function timeSince(iso) {
  if (!iso) return ""
  const d = new Date(iso), diff = Date.now() - d
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

export default function DashboardPage() {
  const [stats, setStats]           = useState({ files: 0, pdfs: 0, images: 0, folders: 0 })
  const [loading, setLoading]       = useState(true)
  const [folderName, setFolderName] = useState("")
  const [folderColor, setFolderColor] = useState(COLORS[0])
  const [creating, setCreating]     = useState(false)
  const [recentFiles, setRecentFiles]   = useState([])
  const [recentImages, setRecentImages] = useState([])
  const [isMobile, setIsMobile]     = useState(false)
  const [showFolderForm, setShowFolderForm] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  async function loadStats() {
    setLoading(true)
    const [
      { data: files }, { data: pdfs }, { data: images }, { data: folders },
      { data: recentF }, { data: recentI },
    ] = await Promise.all([
      supabase.from("files").select("id"),
      supabase.from("pdfs").select("id"),
      supabase.from("images").select("id"),
      supabase.from("folders").select("id"),
      supabase.from("files").select("id,name,updated_at").order("updated_at", { ascending: false }).limit(5),
      supabase.from("images").select("id,name,url,created_at").order("created_at", { ascending: false }).limit(4),
    ])
    setStats({ files: files?.length||0, pdfs: pdfs?.length||0, images: images?.length||0, folders: folders?.length||0 })
    setRecentFiles(recentF || [])
    setRecentImages(recentI || [])
    setLoading(false)
  }

  async function createFolder() {
    if (!folderName.trim()) return
    setCreating(true)
    await supabase.from("folders").insert([{ name: folderName.trim(), color: folderColor }])
    setFolderName("")
    setCreating(false)
    setShowFolderForm(false)
    loadStats()
  }

  useEffect(() => { loadStats() }, [])

  const statCards = [
    { label:"Files",   value:stats.files,   color:"#4A90D9", bg:"#EBF4FF", href:"/files",
      icon:<svg width="20" height="20" viewBox="0 0 22 22" fill="none"><path d="M13 2H6a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V9l-5-7z" stroke="#4A90D9" strokeWidth="1.6" strokeLinejoin="round"/><path d="M13 2v7h7" stroke="#4A90D9" strokeWidth="1.6" strokeLinejoin="round"/><path d="M8 13h6M8 17h4" stroke="#4A90D9" strokeWidth="1.4" strokeLinecap="round"/></svg> },
    { label:"PDFs",    value:stats.pdfs,    color:"#E74C3C", bg:"#FFF0EF", href:"/pdf",
      icon:<svg width="20" height="20" viewBox="0 0 22 22" fill="none"><path d="M13 2H6a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V9l-5-7z" stroke="#E74C3C" strokeWidth="1.6" strokeLinejoin="round"/><path d="M13 2v7h7" stroke="#E74C3C" strokeWidth="1.6" strokeLinejoin="round"/><rect x="4" y="13" width="14" height="6" rx="1.5" fill="#E74C3C"/><text x="11" y="18" textAnchor="middle" fontSize="4.5" fontWeight="700" fill="white" fontFamily="sans-serif">PDF</text></svg> },
    { label:"Images",  value:stats.images,  color:"#7B68EE", bg:"#F0EEFF", href:"/images",
      icon:<svg width="20" height="20" viewBox="0 0 22 22" fill="none"><rect x="2" y="4" width="18" height="14" rx="3" stroke="#7B68EE" strokeWidth="1.6"/><circle cx="7.5" cy="9" r="1.8" stroke="#7B68EE" strokeWidth="1.3"/><path d="M2 15l5-4 4 4 3-3 6 5" stroke="#7B68EE" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { label:"Folders", value:stats.folders, color:"#E67E22", bg:"#FFF5EB", href:"/files",
      icon:<svg width="20" height="20" viewBox="0 0 22 22" fill="none"><path d="M2 7C2 5.9 2.9 5 4 5h4l2 2h8c1.1 0 2 .9 2 2v7c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V7z" stroke="#E67E22" strokeWidth="1.6" strokeLinejoin="round"/></svg> },
  ]

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f8f8f6", fontFamily:"-apple-system,'SF Pro Text','Helvetica Neue',sans-serif" }}>
      <Sidebar />

      <div style={{ flex:1, overflowY:"auto", minWidth:0 }}>

        {/* ── MOBILE header ── */}
        {isMobile && (
          <div style={S.mobileHeader}>
            <div>
              <h1 style={S.mobileTitleText}>Dashboard</h1>
              <p style={S.mobileDateText}>{new Date().toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" })}</p>
            </div>
            <button style={S.mobileNewFolderBtn} onClick={() => setShowFolderForm(true)}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M1 4.5C1 4 1.45 3.5 2 3.5h3l1.5 1.5H13c.55 0 1 .45 1 1v6c0 .55-.45 1-1 1H2c-.55 0-1-.45-1-1V4.5z" stroke="white" strokeWidth="1.2"/>
                <path d="M7.5 7.5v3M6 9h3" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <span>New Folder</span>
            </button>
          </div>
        )}

        {/* ── DESKTOP header ── */}
        {!isMobile && (
          <div style={S.desktopHeader}>
            <h1 style={S.desktopTitle}>Dashboard</h1>
            <p style={S.desktopDate}>{new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}</p>
          </div>
        )}

        <div style={{ padding: isMobile ? "0 14px 80px" : "0 36px 40px" }}>

          {/* ── STAT CARDS ── */}
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 10 : 16, marginBottom: isMobile ? 16 : 28 }}>
            {statCards.map(card => (
              <Link key={card.label} href={card.href} style={{ textDecoration:"none" }}>
                <div style={isMobile ? { ...S.statCardMobile } : { ...S.statCardDesktop }}
                  onMouseEnter={!isMobile ? e => { e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.09)"; e.currentTarget.style.transform="translateY(-1px)" } : undefined}
                  onMouseLeave={!isMobile ? e => { e.currentTarget.style.boxShadow="none"; e.currentTarget.style.transform="translateY(0)" } : undefined}
                >
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: isMobile ? 10 : 14 }}>
                    <div style={{ width: isMobile?36:42, height: isMobile?36:42, borderRadius: isMobile?10:12, background:card.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {card.icon}
                    </div>
                    {!isMobile && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity:0.3 }}>
                        <path d="M3 7h8M7 3l4 4-4 4" stroke="#1c1c1e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ fontSize: isMobile ? 22 : 28, fontWeight:700, color:"#1c1c1e", letterSpacing:-0.5, marginBottom:2 }}>
                    {loading ? "—" : card.value.toLocaleString()}
                  </div>
                  <div style={{ fontSize: isMobile ? 12 : 12.5, color:"#aeaeb2", fontWeight:500 }}>{card.label}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* ── DESKTOP: 2-col bottom ── */}
          {!isMobile && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <FolderForm
                folderName={folderName} setFolderName={setFolderName}
                folderColor={folderColor} setFolderColor={setFolderColor}
                creating={creating} onCreate={createFolder} />
              <RecentPanel
                loading={loading} recentFiles={recentFiles}
                recentImages={recentImages} timeSince={timeSince} />
            </div>
          )}

          {/* ── MOBILE: Recent panel always visible ── */}
          {isMobile && (
            <RecentPanel
              loading={loading} recentFiles={recentFiles}
              recentImages={recentImages} timeSince={timeSince} isMobile />
          )}
        </div>
      </div>

      {/* ── MOBILE: New Folder bottom sheet ── */}
      {isMobile && showFolderForm && (
        <div style={S.sheetOverlay} onClick={() => setShowFolderForm(false)}>
          <div style={S.sheet} onClick={e => e.stopPropagation()}>
            <div style={S.sheetHandle} />
            <h3 style={S.sheetTitle}>New Folder</h3>

            <label style={S.sheetLabel}>Folder Name</label>
            <input
              style={S.sheetInput}
              placeholder="e.g. Project Alpha"
              value={folderName}
              autoFocus
              onChange={e => setFolderName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createFolder()}
            />

            <label style={S.sheetLabel}>Color</label>
            <div style={S.colorGrid}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setFolderColor(c)} style={{
                  width:32, height:32, borderRadius:"50%", background:c, border:"none", cursor:"pointer",
                  transform: folderColor===c ? "scale(1.22)" : "scale(1)",
                  boxShadow: folderColor===c ? `0 0 0 3px #f8f8f6, 0 0 0 5px ${c}` : "none",
                  transition:"all 0.15s",
                }} />
              ))}
            </div>

            <button
              style={{ ...S.sheetPrimary, background: folderName.trim() ? folderColor : "#ddd", opacity: creating ? 0.6 : 1 }}
              onClick={createFolder}
              disabled={!folderName.trim() || creating}>
              {creating ? "Creating…" : "Create Folder"}
            </button>
            <button style={S.sheetSecondary} onClick={() => setShowFolderForm(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Folder Form (desktop) ────────────────────────────────────────────────────
function FolderForm({ folderName, setFolderName, folderColor, setFolderColor, creating, onCreate }) {
  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <div style={{ ...S.cardIconBox, background:"#FFF5EB" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1 5C1 4.45 1.45 4 2 4h3l1.5 1.5H13c.55 0 1 .45 1 1v6c0 .55-.45 1-1 1H2c-.55 0-1-.45-1-1V5z" stroke="#E67E22" strokeWidth="1.3"/>
            <path d="M8 8v4M6 10h4" stroke="#E67E22" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 style={S.cardTitle}>New Folder</h2>
      </div>

      <label style={S.fieldLabel}>Folder Name</label>
      <input value={folderName} onChange={e => setFolderName(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onCreate()}
        placeholder="e.g. Project Alpha"
        style={S.fieldInput} />

      <label style={{ ...S.fieldLabel, marginTop:12 }}>Color</label>
      <div style={{ display:"flex", gap:8, marginBottom:18 }}>
        {["#4A90D9","#7B68EE","#E67E22","#2ECC71","#E74C3C","#1ABC9C","#9B59B6","#F39C12"].map(c => (
          <button key={c} onClick={() => setFolderColor(c)} style={{
            width:22, height:22, borderRadius:"50%", background:c, border:"none", cursor:"pointer", flexShrink:0,
            outline: folderColor===c ? `3px solid ${c}` : "none", outlineOffset:2,
          }} />
        ))}
      </div>

      <button onClick={onCreate} disabled={!folderName.trim() || creating}
        style={{ ...S.primaryBtn, background: folderName.trim() ? folderColor : "rgba(0,0,0,0.06)", color: folderName.trim() ? "#fff" : "#aeaeb2", cursor: folderName.trim() ? "pointer" : "not-allowed" }}>
        {creating ? "Creating…" : "Create Folder"}
      </button>
    </div>
  )
}

// ─── Recent Panel ─────────────────────────────────────────────────────────────
function RecentPanel({ loading, recentFiles, recentImages, timeSince, isMobile }) {
  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <div style={{ ...S.cardIconBox, background:"#EBF4FF" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="#4A90D9" strokeWidth="1.3"/>
            <path d="M8 5v3.5l2.5 1.5" stroke="#4A90D9" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 style={S.cardTitle}>Recent Files</h2>
      </div>

      {loading ? (
        <div style={{ fontSize:13, color:"#aeaeb2", padding:"8px 0" }}>Loading…</div>
      ) : recentFiles.length === 0 ? (
        <div style={{ fontSize:13, color:"#aeaeb2", padding:"8px 0", textAlign:"center" }}>No files yet</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
          {recentFiles.map(f => (
            <div key={f.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:8 }}
              onMouseEnter={e => e.currentTarget.style.background="#f8f8f6"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              <div style={{ width:30, height:30, borderRadius:7, background:"#EBF4FF", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M8 1.5H3.5C3 1.5 2.5 2 2.5 2.5v9c0 .5.5 1 1 1h7c.5 0 1-.5 1-1V6l-3.5-4.5z" stroke="#4A90D9" strokeWidth="1.1"/>
                  <path d="M8 1.5V6H11.5" stroke="#4A90D9" strokeWidth="1.1"/>
                </svg>
              </div>
              <span style={{ flex:1, fontSize:13, color:"#1c1c1e", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {f.name || "Untitled"}
              </span>
              <span style={{ fontSize:11, color:"#aeaeb2", flexShrink:0 }}>{timeSince(f.updated_at)}</span>
            </div>
          ))}
        </div>
      )}

      {recentImages.length > 0 && (
        <div style={{ marginTop:14, paddingTop:12, borderTop:"0.5px solid rgba(0,0,0,0.07)" }}>
          <div style={{ fontSize:11, fontWeight:600, color:"#aeaeb2", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>
            Recent Images
          </div>
          <div style={{ display:"flex", gap:8, flexWrap: isMobile ? "wrap" : "nowrap" }}>
            {recentImages.map(img => (
              <div key={img.id} style={{ width:52, height:52, borderRadius:8, overflow:"hidden", flexShrink:0, background:"#f0edf6", border:"0.5px solid rgba(0,0,0,0.08)" }}>
                <img src={img.url} alt={img.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}
                  onError={e => { e.target.style.display="none" }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  // Mobile header
  mobileHeader: {
    display:"flex", alignItems:"center", justifyContent:"space-between",
    padding:"16px 14px 12px",
    paddingTop:"max(16px, env(safe-area-inset-top, 16px))",
    background:"#f8f8f6", borderBottom:"0.5px solid rgba(0,0,0,0.07)",
    marginBottom:14, position:"sticky", top:0, zIndex:10,
  },
  mobileTitleText: { fontSize:22, fontWeight:700, letterSpacing:-0.3, margin:"0 0 2px", color:"#1c1c1e" },
  mobileDateText: { fontSize:12, color:"#aeaeb2", margin:0 },
  mobileNewFolderBtn: {
    display:"flex", alignItems:"center", gap:6,
    background:"#E67E22", color:"#fff", border:"none",
    borderRadius:10, padding:"8px 14px", cursor:"pointer",
    fontSize:13, fontWeight:500, fontFamily:"inherit",
  },

  // Desktop header
  desktopHeader: { padding:"32px 36px 20px" },
  desktopTitle: { fontSize:26, fontWeight:700, letterSpacing:-0.5, margin:"0 0 4px", color:"#1c1c1e" },
  desktopDate: { fontSize:13.5, color:"#aeaeb2", margin:0 },

  // Stat cards
  statCardDesktop: {
    background:"#fff", borderRadius:16, border:"0.5px solid rgba(0,0,0,0.07)",
    padding:"20px 20px 18px", transition:"box-shadow 0.15s, transform 0.15s", cursor:"pointer",
  },
  statCardMobile: {
    background:"#fff", borderRadius:14, border:"0.5px solid rgba(0,0,0,0.07)",
    padding:"14px 14px 12px", cursor:"pointer",
  },

  // Cards
  card: {
    background:"#fff", borderRadius:16, border:"0.5px solid rgba(0,0,0,0.07)",
    padding:"18px 18px 16px", marginBottom:12,
  },
  cardHeader: { display:"flex", alignItems:"center", gap:10, marginBottom:16 },
  cardIconBox: { width:32, height:32, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  cardTitle: { fontSize:15, fontWeight:600, margin:0, color:"#1c1c1e" },

  // Form fields
  fieldLabel: { fontSize:11, fontWeight:600, color:"#aeaeb2", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 },
  fieldInput: { width:"100%", border:"0.5px solid rgba(0,0,0,0.15)", borderRadius:8, padding:"9px 12px", fontSize:13.5, outline:"none", fontFamily:"inherit", color:"#1c1c1e", background:"#fafafa", boxSizing:"border-box", marginBottom:0 },
  primaryBtn: { width:"100%", padding:"10px", border:"none", borderRadius:9, fontSize:13.5, fontFamily:"inherit", fontWeight:500, transition:"all 0.15s" },

  // Bottom sheet
  sheetOverlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:900, display:"flex", alignItems:"flex-end" },
  sheet: {
    background:"#f8f8f6", borderRadius:"20px 20px 0 0",
    padding:"10px 20px",
    paddingBottom:"max(32px, env(safe-area-inset-bottom, 32px))",
    width:"100%",
  },
  sheetHandle: { width:36, height:4, background:"rgba(0,0,0,0.15)", borderRadius:2, margin:"0 auto 18px" },
  sheetTitle: { fontSize:18, fontWeight:700, margin:"0 0 18px", color:"#1c1c1e" },
  sheetLabel: { fontSize:11, fontWeight:600, color:"#aeaeb2", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:8 },
  sheetInput: { width:"100%", border:"0.5px solid rgba(0,0,0,0.15)", borderRadius:12, padding:"13px 14px", fontSize:16, outline:"none", fontFamily:"inherit", color:"#1c1c1e", background:"#fff", boxSizing:"border-box", marginBottom:16 },
  colorGrid: { display:"flex", gap:12, marginBottom:22, flexWrap:"wrap" },
  sheetPrimary: { width:"100%", padding:"14px", border:"none", borderRadius:13, cursor:"pointer", fontSize:16, color:"#fff", fontFamily:"inherit", fontWeight:600, marginBottom:10, transition:"all 0.15s" },
  sheetSecondary: { width:"100%", padding:"14px", border:"none", borderRadius:13, cursor:"pointer", fontSize:16, color:"#007AFF", fontFamily:"inherit", fontWeight:500, background:"#fff" },
}