"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@supabase/supabase-js"

// --- Supabase Config ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- Date Formatter ---
function fmtDate(iso) {
  if (!iso) return ""
  const d = new Date(iso), diff = Date.now() - d
  if (diff < 60000) return "Just now"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

export default function NotesApp() {
  const [screen, setScreen] = useState("folders") // folders, notes, editor
  const [folders, setFolders] = useState([])
  const [notes, setNotes] = useState([])
  const [activeFolder, setActiveFolder] = useState(null)
  const [activeNote, setActiveNote] = useState(null)
  
  // Editor States
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Folder Creation States
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")

  const saveTimer = useRef(null)

  // 1. Fetch Everything
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: fd }, { data: nd }] = await Promise.all([
        supabase.from("folders").select("*").order("created_at"),
        supabase.from("notes").select("*").order("updated_at", { ascending: false }),
      ])
      setFolders(fd || [])
      setNotes(nd || [])
    } catch (err) {
      console.error("Fetch Error:", err)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // 2. Create New Note (FIXED LOGIC)
  const handleNewNote = async () => {
    const fid = activeFolder?.id || null
    
    const { data, error } = await supabase.from("notes")
      .insert([{ title: "", body: "", folder_id: fid }])
      .select()
      .single()

    if (error) {
      console.error("Create Note Error:", error.message)
      alert("Note nahi ban pa raha: " + error.message)
      return
    }

    if (data) {
      setNotes(prev => [data, ...prev])
      setActiveNote(data)
      setTitle("")
      setBody("")
      setScreen("editor")
    }
  }

  // 3. Auto-Save Logic
  const triggerSave = (t, b) => {
    setTitle(t)
    setBody(b)
    if (!activeNote) return

    setSaving(true)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const { error } = await supabase
        .from("notes")
        .update({ title: t, body: b, updated_at: new Date().toISOString() })
        .eq("id", activeNote.id)
      
      if (error) console.error("Save Error:", error.message)
      setSaving(false)
    }, 800)
  }

  // 4. Create Folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    const { error } = await supabase.from("folders").insert([{ name: newFolderName, color: '#4A90D9' }])
    if (error) alert(error.message)
    else {
      setNewFolderName("")
      setShowNewFolder(false)
      fetchAll()
    }
  }

  return (
    <div style={S.root}>
      
      {/* --- FOLDERS SCREEN --- */}
      {screen === "folders" && (
        <div style={S.container}>
          <div style={S.header}>
            <h1 style={S.largeTitle}>Notes</h1>
          </div>
          <div style={S.content}>
            <div style={S.card}>
              <div style={S.row} onClick={() => { setActiveFolder(null); setScreen("notes") }}>
                <div style={{...S.iconBox, background: '#FFB800'}}><NoteIcon /></div>
                <span style={S.rowLabel}>All Notes</span>
                <span style={S.count}>{notes.length}</span>
                <Chevron />
              </div>
              {folders.map(f => (
                <div key={f.id} style={S.row} onClick={() => { setActiveFolder(f); setScreen("notes") }}>
                  <div style={{...S.iconBox, background: f.color}}><FolderIcon /></div>
                  <span style={S.rowLabel}>{f.name}</span>
                  <span style={S.count}>{notes.filter(n => n.folder_id === f.id).length}</span>
                  <Chevron />
                </div>
              ))}
            </div>
          </div>
          <footer style={S.footer}>
            <button style={S.textBtn} onClick={() => setShowNewFolder(true)}>New Folder</button>
            <button style={S.composeBtn} onClick={handleNewNote}><ComposeIcon /></button>
          </footer>
        </div>
      )}

      {/* --- NOTES LIST SCREEN --- */}
      {screen === "notes" && (
        <div style={S.container}>
          <div style={S.header}>
            <button style={S.backBtn} onClick={() => setScreen("folders")}>
              <ChevronLeft /> Folders
            </button>
            <h1 style={S.largeTitle}>{activeFolder ? activeFolder.name : "All Notes"}</h1>
          </div>
          <div style={S.content}>
            <div style={S.card}>
              {notes.filter(n => activeFolder ? n.folder_id === activeFolder.id : true).map(note => (
                <div key={note.id} style={S.row} onClick={() => { setActiveNote(note); setTitle(note.title); setBody(note.body); setScreen("editor") }}>
                   <div style={{flex: 1}}>
                      <div style={{fontWeight: 600, fontSize: 16}}>{note.title || "Untitled Note"}</div>
                      <div style={{color: '#8e8e93', fontSize: 14}}>{fmtDate(note.updated_at)}</div>
                   </div>
                   <Chevron />
                </div>
              ))}
            </div>
          </div>
          <footer style={S.footer}>
            <div style={{flex: 1}} />
            <button style={S.composeBtn} onClick={handleNewNote}><ComposeIcon /></button>
          </footer>
        </div>
      )}

      {/* --- EDITOR SCREEN --- */}
      {screen === "editor" && (
        <div style={{...S.container, background: '#fff'}}>
          <div style={S.editorHeader}>
             <button style={S.backBtn} onClick={() => { setScreen("notes"); fetchAll(); }}>
                <ChevronLeft /> Notes
             </button>
             {saving && <span style={{fontSize: 12, color: '#FFB800'}}>Saving...</span>}
          </div>
          <div style={{padding: '0 20px'}}>
            <input 
              style={S.titleInput} 
              value={title} 
              placeholder="Title" 
              onChange={(e) => triggerSave(e.target.value, body)}
            />
            <textarea 
              style={S.bodyInput} 
              value={body} 
              placeholder="Start typing..." 
              onChange={(e) => triggerSave(title, e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Modal: New Folder */}
      {showNewFolder && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <h3 style={{marginBottom: 15, textAlign: 'center'}}>New Folder</h3>
            <input 
              style={S.modalInput} 
              autoFocus 
              value={newFolderName}
              placeholder="Enter name" 
              onChange={e => setNewFolderName(e.target.value)}
            />
            <div style={{display: 'flex', gap: 10, marginTop: 20}}>
              <button style={{...S.modalBtn, background: '#eee'}} onClick={() => setShowNewFolder(false)}>Cancel</button>
              <button style={{...S.modalBtn, background: '#3b82f6', color: '#fff'}} onClick={handleCreateFolder}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Icons ---
const ComposeIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const Chevron = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
const ChevronLeft = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="3"><path d="M15 18l-6-6 6-6"/></svg>
const FolderIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z"/></svg>
const NoteIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>

// --- Inline Styles ---
const S = {
  root: { background: '#f2f2f7', minHeight: '100vh', fontFamily: 'sans-serif', color: '#1c1c1e' },
  container: { display: 'flex', flexDirection: 'column', minHeight: '100vh' },
  header: { padding: '50px 20px 10px' },
  largeTitle: { fontSize: 34, fontWeight: '800', margin: '5px 0' },
  content: { flex: 1, padding: '10px 20px' },
  card: { background: '#fff', borderRadius: 12, overflow: 'hidden' },
  row: { display: 'flex', alignItems: 'center', padding: '15px', gap: 15, cursor: 'pointer', borderBottom: '0.5px solid #f2f2f7' },
  rowLabel: { flex: 1, fontSize: 17 },
  count: { color: '#8e8e93' },
  iconBox: { width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  footer: { position: 'fixed', bottom: 0, width: '100%', maxWidth: 'inherit', height: 70, background: '#f2f2f7', borderTop: '0.5px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 100 },
  composeBtn: { background: 'none', border: 'none', cursor: 'pointer' },
  textBtn: { color: '#FFB800', fontSize: 17, background: 'none', border: 'none', fontWeight: '500' },
  backBtn: { background: 'none', border: 'none', display: 'flex', alignItems: 'center', color: '#FFB800', fontSize: 17, padding: 0 },
  editorHeader: { padding: '50px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  titleInput: { width: '100%', border: 'none', fontSize: 28, fontWeight: 'bold', outline: 'none', margin: '20px 0' },
  bodyInput: { width: '100%', border: 'none', fontSize: 18, outline: 'none', minHeight: '60vh', resize: 'none' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', padding: 25, borderRadius: 20, width: '85%', maxWidth: 300 },
  modalInput: { width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ddd', outline: 'none' },
  modalBtn: { flex: 1, padding: 12, borderRadius: 10, border: 'none', fontWeight: '600', cursor: 'pointer' }
}