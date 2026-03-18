"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
)

const COLORS = ["#4A90D9","#7B68EE","#E67E22","#2ECC71","#E74C3C","#1ABC9C","#9B59B6","#F39C12"]

function timeSince(iso) {
  if (!iso) return ""
  const d = new Date(iso), diff = Date.now() - d
  if (diff < 60000) return "just now"
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`
  return d.toLocaleDateString("en-IN", { day:"numeric", month:"short" })
}

function renderMd(text) {
  if (!text) return ""
  return text
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/^# (.+)$/gm,'<h1 style="font-size:22px;font-weight:700;margin:16px 0 6px">$1</h1>')
    .replace(/^## (.+)$/gm,'<h2 style="font-size:18px;font-weight:600;margin:14px 0 5px">$1</h2>')
    .replace(/^### (.+)$/gm,'<h3 style="font-size:15px;font-weight:600;margin:12px 0 4px">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/`(.+?)`/g,'<code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:4px;font-size:13px;font-family:monospace">$1</code>')
    .replace(/^- (.+)$/gm,'<li style="margin:3px 0">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, s=>`<ul style="padding-left:20px;margin:6px 0">${s}</ul>`)
    .replace(/^---$/gm,'<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:14px 0"/>')
    .replace(/\n\n/g,'</p><p style="margin:0 0 8px">')
    .replace(/\n/g,'<br/>')
}

// ─────────────────────────────────────────────────────────────────────────────
export default function FilesPage() {
  const [folders, setFolders]       = useState([])
  const [files, setFiles]           = useState([])
  const [activeFile, setActiveFile] = useState(null)
  const [content, setContent]       = useState("")
  const [saving, setSaving]         = useState(false)
  const [preview, setPreview]       = useState(false)
  const [loading, setLoading]       = useState(true)
  const [expanded, setExpanded]     = useState({})
  const [ctxMenu, setCtxMenu]       = useState(null)
  const [modal, setModal]           = useState(null)
  const [dragging, setDragging]     = useState(null)
  const [dragOver, setDragOver]     = useState(null)

  // Mobile: which panel — "explorer" | "editor"
  const [mobilePanel, setMobilePanel] = useState("explorer")
  const [isMobile, setIsMobile]       = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const saveTimer = useRef(null)
  const editorRef = useRef(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [{ data: fd }, { data: nd }] = await Promise.all([
      supabase.from("folders").select("*").order("name"),
      supabase.from("files").select("*").order("name"),
    ])
    setFolders(fd || [])
    setFiles(nd || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // close ctx menu
  useEffect(() => {
    const fn = () => setCtxMenu(null)
    window.addEventListener("click", fn)
    return () => window.removeEventListener("click", fn)
  }, [])

  const rootFolders = folders.filter(f => !f.parent_id)
  const subFolders  = (pid) => folders.filter(f => f.parent_id === pid)
  const folderFiles = (fid) => files.filter(f => f.folder_id === fid)
  const rootFiles   = files.filter(f => !f.folder_id)
  const toggle      = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  // ── Save ───────────────────────────────────────────────────────────────────
  const scheduleSave = (val) => {
    if (!activeFile) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => doSave(activeFile.id, val), 600)
  }

  const doSave = async (id, val) => {
    setSaving(true)
    const { data } = await supabase.from("files")
      .update({ content: val, updated_at: new Date().toISOString() })
      .eq("id", id).select().single()
    if (data) {
      setFiles(prev => prev.map(f => f.id === id ? data : f))
      setActiveFile(prev => prev?.id === id ? data : prev)
    }
    setSaving(false)
  }

  const openFile = (file) => {
    setActiveFile(file)
    setContent(file.content || "")
    setPreview(false)
    if (isMobile) { setMobilePanel("editor"); setSidebarOpen(false) }
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const createFolder = async (name, color, parentId) => {
    const { data } = await supabase.from("folders").insert({ name, color, parent_id: parentId || null }).select().single()
    if (data) { setFolders(prev => [...prev, data]); if (parentId) setExpanded(e => ({ ...e, [parentId]: true })) }
    setModal(null)
  }

  const createFile = async (name, folderId) => {
    const { data } = await supabase.from("files").insert({ name, content: "", folder_id: folderId || null }).select().single()
    if (data) { setFiles(prev => [...prev, data]); if (folderId) setExpanded(e => ({ ...e, [folderId]: true })); openFile(data) }
    setModal(null)
  }

  const renameFolder = async (id, name) => {
    const { data } = await supabase.from("folders").update({ name }).eq("id", id).select().single()
    if (data) setFolders(prev => prev.map(f => f.id === id ? data : f))
    setModal(null)
  }

  const renameFile = async (id, name) => {
    const { data } = await supabase.from("files").update({ name }).eq("id", id).select().single()
    if (data) { setFiles(prev => prev.map(f => f.id === id ? data : f)); if (activeFile?.id === id) setActiveFile(data) }
    setModal(null)
  }

  const deleteFolder = async (id) => {
    await supabase.from("folders").delete().eq("id", id)
    setFolders(prev => prev.filter(f => f.id !== id && f.parent_id !== id))
    setFiles(prev => { const gone = new Set(prev.filter(f => f.folder_id === id).map(f => f.id)); if (activeFile && gone.has(activeFile.id)) setActiveFile(null); return prev.filter(f => f.folder_id !== id) })
    setModal(null)
  }

  const deleteFile = async (id) => {
    await supabase.from("files").delete().eq("id", id)
    setFiles(prev => prev.filter(f => f.id !== id))
    if (activeFile?.id === id) { setActiveFile(null); if (isMobile) setMobilePanel("explorer") }
    setModal(null)
  }

  const moveFile = async (fileId, targetFolderId) => {
    const fid = targetFolderId === "root" ? null : targetFolderId
    const { data } = await supabase.from("files").update({ folder_id: fid }).eq("id", fileId).select().single()
    if (data) { setFiles(prev => prev.map(f => f.id === fileId ? data : f)); if (activeFile?.id === fileId) setActiveFile(data) }
    setDragging(null); setDragOver(null)
  }

  const showCtx = (e, type, item) => {
    e.preventDefault(); e.stopPropagation()
    setCtxMenu({ x: Math.min(e.clientX, window.innerWidth - 170), y: Math.min(e.clientY, window.innerHeight - 150), type, item })
  }

  // ── Explorer tree (shared between mobile and desktop) ─────────────────────
  const ExplorerTree = (
    <div style={S.tree}>
      {loading && <div style={S.treeHint}>Loading…</div>}
      {!loading && folders.length === 0 && files.length === 0 && (
        <div style={S.treeHint}>No files yet.{"\n"}Tap + to create.</div>
      )}
      <div style={{ ...S.rootDropZone, ...(dragOver === "root" ? S.dropActive : {}) }}
        onDragOver={e => { e.preventDefault(); setDragOver("root") }}
        onDragLeave={() => setDragOver(null)}
        onDrop={e => { e.preventDefault(); dragging?.type === "file" && moveFile(dragging.id, "root") }} />
      {rootFiles.map(file => (
        <FileRow key={file.id} file={file} active={activeFile?.id === file.id} depth={0}
          onOpen={openFile} onCtx={e => showCtx(e, "file", file)}
          onDragStart={() => setDragging({ type:"file", id:file.id })}
          onDragEnd={() => { setDragging(null); setDragOver(null) }} />
      ))}
      {rootFolders.map(folder => (
        <FolderNode key={folder.id} folder={folder} depth={0}
          expanded={expanded} subFolders={subFolders} folderFiles={folderFiles}
          activeFile={activeFile} dragging={dragging} dragOver={dragOver}
          onToggle={toggle} onOpenFile={openFile}
          onCtxFolder={e => showCtx(e, "folder", folder)}
          onCtxFile={(e, file) => showCtx(e, "file", file)}
          onDragStartFile={file => setDragging({ type:"file", id:file.id })}
          onDragEndFile={() => { setDragging(null); setDragOver(null) }}
          onDragOverFolder={id => setDragOver(id)}
          onDragLeaveFolder={() => setDragOver(null)}
          onDropFolder={folderId => dragging?.type === "file" && moveFile(dragging.id, folderId)} />
      ))}
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ ...S.app, flexDirection: isMobile ? "column" : "row" }}>

      {/* ══ MOBILE: Top nav bar ══════════════════════════════════════════════ */}
      {isMobile && (
        <div style={S.mobileTopBar}>
          {mobilePanel === "editor" && activeFile ? (
            <>
              <button style={S.mobileNavBtn} onClick={() => { setMobilePanel("explorer"); setActiveFile(null) }}>
                <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
                  <path d="M7.5 1.5L2 7.5l5.5 6" stroke="#4A90D9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize:15, color:"#4A90D9", marginLeft:4 }}>Files</span>
              </button>
              <span style={S.mobileFileName}>{activeFile.name}</span>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {saving && <span style={{ fontSize:11, color:"#F39C12" }}>●</span>}
                <button style={S.mobileNavBtn2}
                  onClick={() => setPreview(p => !p)}>
                  <span style={{ fontSize:12, color:"#4A90D9" }}>{preview ? "Edit" : "Preview"}</span>
                </button>
                <button style={S.mobileNavBtn2}
                  onClick={() => setModal({ type:"delete_file", item:activeFile })}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4h12M5.5 4V2.5h5V4M4 4l.8 10h6.4L12 4" stroke="#FF3B30" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <>
              <span style={S.mobileTitleText}>Explorer</span>
              <div style={{ display:"flex", gap:6 }}>
                <button style={S.mobileAddBtn} onClick={() => setModal({ type:"new_file", folderId:null })}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2C2 1.45 2.45 1 3 1H8.5L11 3.5V12C11 12.55 10.55 13 10 13H3C2.45 13 2 12.55 2 12V2z" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M5 8h4M7 6v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <span style={{ fontSize:13, marginLeft:4 }}>File</span>
                </button>
                <button style={S.mobileAddBtn} onClick={() => setModal({ type:"new_folder", parentId:null })}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 4C1 3.45 1.45 3 2 3h3.5l1.5 1.5H12c.55 0 1 .45 1 1v5c0 .55-.45 1-1 1H2c-.55 0-1-.45-1-1V4z" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M6.5 7.5h3M8 6v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <span style={{ fontSize:13, marginLeft:4 }}>Folder</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ DESKTOP SIDEBAR / MOBILE EXPLORER ═══════════════════════════════ */}
      {(!isMobile || mobilePanel === "explorer") && (
        <aside style={isMobile ? S.mobileExplorer : S.sidebar}>
          {/* Desktop header */}
          {!isMobile && (
            <div style={S.sideHeader}>
              <span style={S.sideTitle}>Explorer</span>
              <div style={S.sideActions}>
                <IconBtn title="New File" onClick={() => setModal({ type:"new_file", folderId:null })}>
                  <FileNewIcon />
                </IconBtn>
                <IconBtn title="New Folder" onClick={() => setModal({ type:"new_folder", parentId:null })}>
                  <FolderNewIcon />
                </IconBtn>
              </div>
            </div>
          )}
          {ExplorerTree}
        </aside>
      )}

      {/* ══ EDITOR ═══════════════════════════════════════════════════════════ */}
      {(!isMobile || mobilePanel === "editor") && (
        <main style={isMobile ? S.mobileEditor : S.editor}>
          {!activeFile ? (
            <EmptyEditor onNewFile={() => setModal({ type:"new_file", folderId:null })} isMobile={isMobile} />
          ) : (
            <div style={S.editorInner}>
              {/* Desktop tab bar */}
              {!isMobile && (
                <div style={S.tabBar}>
                  <div style={S.tab}>
                    <FileIconSmall />
                    <span style={S.tabName}>{activeFile.name}</span>
                    {saving && <span style={S.savingDot} />}
                  </div>
                  <div style={S.tabActions}>
                    <button style={{ ...S.tabBtn, ...(preview ? S.tabBtnActive : {}) }} onClick={() => setPreview(p => !p)}>
                      {preview ? "Edit" : "Preview"}
                    </button>
                    <span style={S.tabDate}>{timeSince(activeFile.updated_at)}</span>
                    <button style={S.tabDelBtn} onClick={() => setModal({ type:"delete_file", item:activeFile })}>
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              )}

              {/* Content */}
              {preview ? (
                <div style={isMobile ? S.mdPreviewMobile : S.mdPreview}
                  dangerouslySetInnerHTML={{ __html: `<p style="margin:0 0 8px">${renderMd(content)}</p>` }} />
              ) : (
                <textarea ref={editorRef}
                  style={isMobile ? S.codeEditorMobile : S.codeEditor}
                  value={content}
                  onChange={e => { setContent(e.target.value); scheduleSave(e.target.value) }}
                  placeholder={`# ${activeFile.name}\n\nStart writing...\n\nMarkdown supported:\n**bold**, *italic*, # Heading, - list, \`code\``}
                  spellCheck={false}
                />
              )}

              {/* Status bar */}
              {!isMobile && (
                <div style={S.statusBar}>
                  <span>{content.split("\n").length} lines</span>
                  <span>{content.length} chars</span>
                  <span>Markdown</span>
                  {saving ? <span style={{ color:"#F39C12" }}>● Saving…</span> : <span style={{ color:"#2ECC71" }}>● Saved</span>}
                </div>
              )}

              {/* Mobile status */}
              {isMobile && (
                <div style={S.mobileStatusBar}>
                  <span>{content.split("\n").length} lines · {content.length} chars</span>
                  {saving ? <span style={{ color:"#F39C12" }}>Saving…</span> : <span style={{ color:"#2ECC71" }}>Saved</span>}
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* ══ CONTEXT MENU ═════════════════════════════════════════════════════ */}
      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} type={ctxMenu.type} item={ctxMenu.item}
          onClose={() => setCtxMenu(null)}
          onNewFile={fid => { setModal({ type:"new_file", folderId:fid }); setCtxMenu(null) }}
          onNewSubfolder={pid => { setModal({ type:"new_folder", parentId:pid }); setCtxMenu(null) }}
          onRename={(type, item) => { setModal({ type: type==="folder"?"rename_folder":"rename_file", item }); setCtxMenu(null) }}
          onDelete={(type, item) => { setModal({ type: type==="folder"?"delete_folder":"delete_file", item }); setCtxMenu(null) }} />
      )}

      {/* ══ MODALS ═══════════════════════════════════════════════════════════ */}
      {modal && (
        <Modal modal={modal} isMobile={isMobile}
          onClose={() => setModal(null)}
          onCreateFolder={createFolder} onCreateFile={createFile}
          onRenameFolder={renameFolder} onRenameFile={renameFile}
          onDeleteFolder={deleteFolder} onDeleteFile={deleteFile} />
      )}
    </div>
  )
}

// ─── FolderNode ───────────────────────────────────────────────────────────────
function FolderNode({ folder, depth, expanded, subFolders, folderFiles, activeFile, dragging, dragOver, onToggle, onOpenFile, onCtxFolder, onCtxFile, onDragStartFile, onDragEndFile, onDragOverFolder, onDragLeaveFolder, onDropFolder }) {
  const isOpen = expanded[folder.id]
  const subs   = subFolders(folder.id)
  const myFiles = folderFiles(folder.id)

  return (
    <div>
      <div style={{ ...S.treeRow, paddingLeft: 10 + depth * 16, ...(dragOver === folder.id ? S.dropActive : {}) }}
        onClick={() => onToggle(folder.id)}
        onContextMenu={onCtxFolder}
        onDragOver={e => { e.preventDefault(); onDragOverFolder(folder.id) }}
        onDragLeave={onDragLeaveFolder}
        onDrop={e => { e.preventDefault(); onDropFolder(folder.id) }}>
        <span style={{ ...S.arrow, transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>›</span>
        <FolderIcon color={folder.color} open={isOpen} />
        <span style={S.treeRowName}>{folder.name}</span>
        <span style={S.treeRowCount}>{myFiles.length + subs.length}</span>
      </div>
      {isOpen && (
        <div>
          {depth === 0 && subs.map(sub => (
            <FolderNode key={sub.id} folder={sub} depth={1}
              expanded={expanded} subFolders={subFolders} folderFiles={folderFiles}
              activeFile={activeFile} dragging={dragging} dragOver={dragOver}
              onToggle={onToggle} onOpenFile={onOpenFile}
              onCtxFolder={e => { e.preventDefault(); e.stopPropagation(); onCtxFolder(e) }}
              onCtxFile={onCtxFile}
              onDragStartFile={onDragStartFile} onDragEndFile={onDragEndFile}
              onDragOverFolder={onDragOverFolder} onDragLeaveFolder={onDragLeaveFolder}
              onDropFolder={onDropFolder} />
          ))}
          {myFiles.map(file => (
            <FileRow key={file.id} file={file} depth={depth+1} active={activeFile?.id === file.id}
              onOpen={onOpenFile} onCtx={e => onCtxFile(e, file)}
              onDragStart={() => onDragStartFile(file)} onDragEnd={onDragEndFile} />
          ))}
          {myFiles.length === 0 && subs.length === 0 && (
            <div style={{ ...S.treeHint, paddingLeft: 10 + (depth+1)*16, fontSize:11 }}>Empty</div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── FileRow ──────────────────────────────────────────────────────────────────
function FileRow({ file, depth, active, onOpen, onCtx, onDragStart, onDragEnd }) {
  return (
    <div draggable
      style={{ ...S.treeRow, paddingLeft: 14 + depth * 16, ...(active ? S.treeRowActive : {}) }}
      onClick={() => onOpen(file)} onContextMenu={onCtx}
      onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <FileIconSmall />
      <span style={{ ...S.treeRowName, fontWeight: active ? 500 : 400 }}>{file.name}</span>
      <span style={S.treeRowDate}>{timeSince(file.updated_at)}</span>
    </div>
  )
}

// ─── ContextMenu ──────────────────────────────────────────────────────────────
function ContextMenu({ x, y, type, item, onClose, onNewFile, onNewSubfolder, onRename, onDelete }) {
  return (
    <div style={{ ...S.ctxMenu, left: x, top: y }} onClick={e => e.stopPropagation()}>
      {type === "folder" && (
        <>
          <CtxItem icon="📄" label="New File" onClick={() => onNewFile(item.id)} />
          {!item.parent_id && <CtxItem icon="📁" label="New Subfolder" onClick={() => onNewSubfolder(item.id)} />}
          <div style={S.ctxSep} />
          <CtxItem icon="✏️" label="Rename" onClick={() => onRename("folder", item)} />
          <CtxItem icon="🗑" label="Delete" danger onClick={() => onDelete("folder", item)} />
        </>
      )}
      {type === "file" && (
        <>
          <CtxItem icon="✏️" label="Rename" onClick={() => onRename("file", item)} />
          <div style={S.ctxSep} />
          <CtxItem icon="🗑" label="Delete" danger onClick={() => onDelete("file", item)} />
        </>
      )}
    </div>
  )
}

function CtxItem({ icon, label, onClick, danger }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ ...S.ctxItem, ...(hov ? (danger ? S.ctxItemDangerHov : S.ctxItemHov) : {}) }}
      onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <span style={{ fontSize:13 }}>{icon}</span>
      <span style={{ color: danger ? "#e74c3c" : "inherit" }}>{label}</span>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ modal, isMobile, onClose, onCreateFolder, onCreateFile, onRenameFolder, onRenameFile, onDeleteFolder, onDeleteFile }) {
  const [name, setName]   = useState(modal.item?.name || "")
  const [color, setColor] = useState(modal.item?.color || COLORS[0])

  const isDel    = modal.type === "delete_folder" || modal.type === "delete_file"
  const isNew    = modal.type === "new_folder" || modal.type === "new_file"
  const isFolder = modal.type.includes("folder")

  const titles = { new_folder:"New Folder", new_file:"New File", rename_folder:"Rename Folder", rename_file:"Rename File", delete_folder:"Delete Folder?", delete_file:"Delete File?" }

  const submit = () => {
    if (!name.trim() && !isDel) return
    if (modal.type === "new_folder")    onCreateFolder(name.trim(), color, modal.parentId)
    if (modal.type === "new_file")      onCreateFile(name.trim(), modal.folderId)
    if (modal.type === "rename_folder") onRenameFolder(modal.item.id, name.trim())
    if (modal.type === "rename_file")   onRenameFile(modal.item.id, name.trim())
    if (modal.type === "delete_folder") onDeleteFolder(modal.item.id)
    if (modal.type === "delete_file")   onDeleteFile(modal.item.id)
  }

  if (isMobile) {
    return (
      <div style={S.sheetOverlay} onClick={onClose}>
        <div style={S.sheet} onClick={e => e.stopPropagation()}>
          <div style={S.sheetHandle} />
          <div style={S.sheetTitle}>{titles[modal.type]}</div>
          {isDel ? (
            <p style={S.sheetDesc}>"{modal.item?.name}" permanently delete ho jayega.{isFolder && " Iske saari files bhi."}</p>
          ) : (
            <>
              <input style={S.sheetInput} placeholder={isFolder ? "Folder name" : "File name (e.g. notes.md)"}
                value={name} autoFocus onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
              {isFolder && (
                <div style={S.colorGrid}>
                  {COLORS.map(c => (
                    <button key={c} style={{ ...S.colorDot, background:c, transform: color===c?"scale(1.25)":"scale(1)", boxShadow: color===c?`0 0 0 3px #1e1e1e, 0 0 0 5px ${c}`:"none", transition:"all 0.15s" }}
                      onClick={() => setColor(c)} />
                  ))}
                </div>
              )}
            </>
          )}
          <button style={{ ...S.sheetPrimary, background: isDel ? "#E74C3C" : (isFolder ? color : "#4A90D9"), opacity: (!name.trim() && !isDel) ? 0.4 : 1 }}
            onClick={submit}>
            {isDel ? "Delete" : isNew ? "Create" : "Rename"}
          </button>
          <button style={S.sheetSecondary} onClick={onClose}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.modalTitle}>{titles[modal.type]}</div>
        {isDel ? (
          <p style={S.modalDesc}>"{modal.item?.name}" permanently delete ho jayega.{isFolder && " Iske andar ki saari files bhi."}</p>
        ) : (
          <>
            <input style={S.modalInput} placeholder={isFolder ? "Folder name" : "File name (e.g. notes.md)"}
              value={name} autoFocus onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
            {isFolder && (
              <div style={S.colorRow}>
                {COLORS.map(c => (
                  <button key={c} style={{ ...S.colorDot2, background:c, outline: color===c?`3px solid ${c}`:"none", outlineOffset:2 }} onClick={() => setColor(c)} />
                ))}
              </div>
            )}
          </>
        )}
        <div style={S.modalBtns}>
          <button style={S.modalCancel} onClick={onClose}>Cancel</button>
          <button style={{ ...S.modalConfirm, background: isDel ? "#e74c3c" : (isFolder ? color : "#4A90D9") }} onClick={submit}>
            {isDel ? "Delete" : isNew ? "Create" : "Rename"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Empty editor ─────────────────────────────────────────────────────────────
function EmptyEditor({ onNewFile, isMobile }) {
  return (
    <div style={S.emptyView}>
      <div style={S.emptyIconBox}>
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
          <rect x="6" y="4" width="26" height="30" rx="4" fill="currentColor" opacity="0.1"/>
          <rect x="6" y="4" width="26" height="30" rx="4" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M12 14h14M12 19h14M12 24h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <p style={S.emptyTitle}>No file open</p>
      <p style={S.emptyHint}>{isMobile ? "Tap a file to open it" : "Select a file or create a new one"}</p>
      <button style={S.emptyBtn} onClick={onNewFile}>New File</button>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function FolderIcon({ color, open }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink:0, marginRight:5 }}>
      {open
        ? <path d="M1 5.5C1 4.95 1.45 4.5 2 4.5h4l1-1.5h6c.55 0 1 .45 1 1v7c0 .55-.45 1-1 1H2c-.55 0-1-.45-1-1V5.5z" fill={color} opacity="0.9"/>
        : <path d="M1 4C1 3.45 1.45 3 2 3h4l1.5 1.5H13c.55 0 1 .45 1 1v6c0 .55-.45 1-1 1H2c-.55 0-1-.45-1-1V4z" fill={color} opacity="0.85"/>
      }
    </svg>
  )
}
function FileIconSmall() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink:0, marginRight:5, opacity:0.55 }}>
      <path d="M2 1.5C2 1.22 2.22 1 2.5 1H8l3 3v7.5c0 .28-.22.5-.5.5h-8C2.22 12 2 11.78 2 11.5V1.5z" stroke="currentColor" strokeWidth="1"/>
      <path d="M8 1v3h3" stroke="currentColor" strokeWidth="1"/>
    </svg>
  )
}
function FileNewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 2C2 1.45 2.45 1 3 1H8.5L11 3.5V12C11 12.55 10.55 13 10 13H3C2.45 13 2 12.55 2 12V2z" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M8.5 1v3h3" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5 8.5h4M7 6.5v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}
function FolderNewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1 4C1 3.45 1.45 3 2 3h3.5l1.5 1.5H12c.55 0 1 .45 1 1v5c0 .55-.45 1-1 1H2c-.55 0-1-.45-1-1V4z" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M6 8h3M7.5 6.5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}
function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M1.5 3.5h10M5 3.5V2.5h3v1M4.5 5.5l.5 5M8.5 5.5l-.5 5M2.5 3.5l.7 8h5.6l.7-8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconBtn({ title, onClick, children }) {
  const [hov, setHov] = useState(false)
  return (
    <button title={title} onClick={onClick}
      style={{ ...S.iconBtn, ...(hov ? S.iconBtnHov : {}) }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </button>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  app: { display:"flex", height:"100vh", overflow:"hidden", fontFamily:"-apple-system,'SF Pro Text','Helvetica Neue',sans-serif", background:"#1e1e1e", color:"#ccc", fontSize:13 },

  // Mobile top bar
  mobileTopBar: {
    display:"flex", alignItems:"center", justifyContent:"space-between",
    background:"#252526", borderBottom:"1px solid #1a1a1a",
    padding:"10px 14px",
    paddingTop:"max(10px, env(safe-area-inset-top, 10px))",
    flexShrink:0, height:56,
  },
  mobileNavBtn: { display:"flex", alignItems:"center", border:"none", background:"transparent", cursor:"pointer", padding:0, color:"#4A90D9", fontFamily:"inherit" },
  mobileNavBtn2: { border:"none", background:"transparent", cursor:"pointer", padding:"4px 6px", display:"flex", alignItems:"center" },
  mobileFileName: { fontSize:14, fontWeight:500, color:"#ddd", flex:1, textAlign:"center", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", margin:"0 10px" },
  mobileTitleText: { fontSize:13, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"#bbb" },
  mobileAddBtn: { display:"flex", alignItems:"center", border:"1px solid rgba(255,255,255,0.12)", borderRadius:7, padding:"6px 10px", background:"transparent", color:"#ccc", cursor:"pointer", fontFamily:"inherit" },

  // Mobile explorer
  mobileExplorer: { flex:1, display:"flex", flexDirection:"column", background:"#252526", overflow:"hidden" },
  mobileEditor: { flex:1, display:"flex", flexDirection:"column", background:"#1e1e1e", overflow:"hidden" },

  // Desktop sidebar
  sidebar: { width:230, minWidth:230, display:"flex", flexDirection:"column", background:"#252526", borderRight:"1px solid #1a1a1a", overflow:"hidden" },
  sideHeader: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 10px 8px", borderBottom:"1px solid #1a1a1a", flexShrink:0 },
  sideTitle: { fontSize:11, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"#bbb" },
  sideActions: { display:"flex", gap:2 },
  iconBtn: { border:"none", background:"transparent", cursor:"pointer", color:"#888", display:"flex", alignItems:"center", justifyContent:"center", width:24, height:24, borderRadius:4, padding:0 },
  iconBtnHov: { background:"rgba(255,255,255,0.08)", color:"#ccc" },

  // Tree
  tree: { flex:1, overflowY:"auto", padding:"4px 0" },
  treeHint: { padding:"10px 14px", fontSize:11.5, color:"#666", lineHeight:1.6, whiteSpace:"pre-line" },
  treeRow: { display:"flex", alignItems:"center", padding:"5px 10px", cursor:"pointer", transition:"background 0.1s", userSelect:"none", borderRadius:4, margin:"1px 4px" },
  treeRowActive: { background:"rgba(255,255,255,0.1)" },
  treeRowName: { flex:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", fontSize:13 },
  treeRowCount: { fontSize:10.5, color:"#555", marginLeft:4 },
  treeRowDate: { fontSize:10, color:"#555", marginLeft:4, flexShrink:0 },
  arrow: { fontSize:14, color:"#666", marginRight:3, display:"inline-block", transition:"transform 0.15s", width:12, flexShrink:0 },
  rootDropZone: { height:4 },
  dropActive: { background:"rgba(74,144,217,0.15)", borderRadius:4 },

  // Desktop editor
  editor: { flex:1, display:"flex", flexDirection:"column", background:"#1e1e1e", overflow:"hidden" },
  editorInner: { flex:1, display:"flex", flexDirection:"column", overflow:"hidden" },
  emptyView: { flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10 },
  emptyIconBox: { width:72, height:72, borderRadius:16, background:"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", color:"#555" },
  emptyTitle: { fontSize:15, fontWeight:500, color:"#888" },
  emptyHint: { fontSize:12.5, color:"#555", textAlign:"center", maxWidth:260, lineHeight:1.6 },
  emptyBtn: { marginTop:6, padding:"8px 20px", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, cursor:"pointer", fontSize:13, background:"transparent", color:"#aaa", fontFamily:"inherit" },

  tabBar: { display:"flex", alignItems:"center", justifyContent:"space-between", background:"#252526", borderBottom:"1px solid #1a1a1a", padding:"0 14px", height:38, flexShrink:0 },
  tab: { display:"flex", alignItems:"center", gap:6 },
  tabName: { fontSize:13, color:"#ccc" },
  savingDot: { width:6, height:6, borderRadius:"50%", background:"#F39C12" },
  tabActions: { display:"flex", alignItems:"center", gap:10 },
  tabBtn: { border:"1px solid rgba(255,255,255,0.1)", borderRadius:5, padding:"3px 10px", cursor:"pointer", fontSize:11.5, background:"transparent", color:"#888", fontFamily:"inherit" },
  tabBtnActive: { background:"rgba(255,255,255,0.08)", color:"#ccc" },
  tabDate: { fontSize:11, color:"#555" },
  tabDelBtn: { border:"none", background:"transparent", cursor:"pointer", color:"#666", display:"flex", alignItems:"center", padding:4, borderRadius:4 },

  codeEditor: { flex:1, border:"none", outline:"none", padding:"20px 28px", fontSize:14, lineHeight:1.75, background:"#1e1e1e", color:"#d4d4d4", fontFamily:"'SF Mono','Fira Code','Consolas',monospace", resize:"none", overflowY:"auto", tabSize:2 },
  codeEditorMobile: { flex:1, border:"none", outline:"none", padding:"16px", fontSize:15, lineHeight:1.8, background:"#1e1e1e", color:"#d4d4d4", fontFamily:"'SF Mono','Fira Code','Consolas',monospace", resize:"none", overflowY:"auto", tabSize:2, WebkitTextSizeAdjust:"100%" },
  mdPreview: { flex:1, overflowY:"auto", padding:"20px 28px", fontSize:14.5, lineHeight:1.75, color:"#d4d4d4" },
  mdPreviewMobile: { flex:1, overflowY:"auto", padding:"16px", fontSize:15, lineHeight:1.8, color:"#d4d4d4" },

  statusBar: { display:"flex", gap:20, padding:"4px 16px", background:"#252526", borderTop:"1px solid #1a1a1a", fontSize:11, color:"#555", flexShrink:0 },
  mobileStatusBar: { display:"flex", justifyContent:"space-between", padding:"6px 16px", background:"#252526", borderTop:"1px solid #1a1a1a", fontSize:11, color:"#555", flexShrink:0, paddingBottom:"max(6px, env(safe-area-inset-bottom, 6px))" },

  // Context menu
  ctxMenu: { position:"fixed", background:"#2d2d2d", border:"1px solid #3a3a3a", borderRadius:8, padding:"4px", minWidth:160, zIndex:500, boxShadow:"0 8px 30px rgba(0,0,0,0.4)" },
  ctxItem: { display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:5, cursor:"pointer", fontSize:12.5, color:"#ccc" },
  ctxItemHov: { background:"rgba(255,255,255,0.07)" },
  ctxItemDangerHov: { background:"rgba(231,76,60,0.15)" },
  ctxSep: { height:"0.5px", background:"#3a3a3a", margin:"3px 6px" },

  // Desktop modal
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:400 },
  modal: { background:"#2d2d2d", borderRadius:12, padding:"22px 22px 18px", width:320, border:"1px solid #3a3a3a", boxShadow:"0 20px 60px rgba(0,0,0,0.5)" },
  modalTitle: { fontSize:16, fontWeight:600, marginBottom:14, color:"#eee" },
  modalDesc: { fontSize:13, color:"#888", lineHeight:1.6, marginBottom:18 },
  modalInput: { width:"100%", border:"1px solid #444", borderRadius:7, padding:"8px 11px", fontSize:13.5, outline:"none", background:"#1e1e1e", color:"#ddd", fontFamily:"inherit", marginBottom:12, boxSizing:"border-box" },
  colorRow: { display:"flex", gap:7, marginBottom:16, flexWrap:"wrap" },
  colorDot2: { width:22, height:22, borderRadius:"50%", border:"none", cursor:"pointer", flexShrink:0 },
  modalBtns: { display:"flex", gap:8, justifyContent:"flex-end" },
  modalCancel: { padding:"7px 14px", border:"1px solid #444", borderRadius:7, cursor:"pointer", fontSize:13, background:"transparent", color:"#aaa", fontFamily:"inherit" },
  modalConfirm: { padding:"7px 14px", border:"none", borderRadius:7, cursor:"pointer", fontSize:13, color:"#fff", fontFamily:"inherit", fontWeight:500 },

  // Mobile bottom sheet
  sheetOverlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:800, display:"flex", alignItems:"flex-end" },
  sheet: { background:"#2d2d2d", borderRadius:"20px 20px 0 0", padding:"10px 20px", paddingBottom:"max(32px, env(safe-area-inset-bottom, 32px))", width:"100%" },
  sheetHandle: { width:36, height:4, background:"rgba(255,255,255,0.2)", borderRadius:2, margin:"0 auto 18px" },
  sheetTitle: { fontSize:17, fontWeight:700, textAlign:"center", marginBottom:16, color:"#eee" },
  sheetDesc: { fontSize:14, color:"#888", textAlign:"center", lineHeight:1.6, marginBottom:20 },
  sheetInput: { width:"100%", border:"none", borderRadius:12, padding:"14px 16px", fontSize:16, outline:"none", fontFamily:"inherit", background:"#1e1e1e", color:"#ddd", boxSizing:"border-box", marginBottom:14 },
  colorGrid: { display:"flex", gap:12, justifyContent:"center", marginBottom:18, flexWrap:"wrap" },
  colorDot: { width:32, height:32, borderRadius:"50%", border:"none", cursor:"pointer" },
  sheetPrimary: { width:"100%", padding:"15px", border:"none", borderRadius:14, cursor:"pointer", fontSize:16, color:"#fff", fontFamily:"inherit", fontWeight:600, marginBottom:10 },
  sheetSecondary: { width:"100%", padding:"15px", border:"none", borderRadius:14, cursor:"pointer", fontSize:16, color:"#4A90D9", fontFamily:"inherit", fontWeight:500, background:"rgba(255,255,255,0.05)" },
}