"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
)

const PRIORITIES = [
  { id: "high",   label: "High",   color: "#C92A2A", bg: "#FFF5F5", border: "rgba(201,42,42,0.2)"  },
  { id: "medium", label: "Medium", color: "#E67700", bg: "#FFF9DB", border: "rgba(230,119,0,0.2)"  },
  { id: "low",    label: "Low",    color: "#2F9E44", bg: "#EBFBEE", border: "rgba(47,158,68,0.2)"  },
]
const PMAP = Object.fromEntries(PRIORITIES.map(p => [p.id, p]))

function fmt(iso) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"2-digit" })
}
function fmtTime(iso) {
  if (!iso) return ""
  return new Date(iso).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })
}
function isToday(iso) {
  if (!iso) return false
  const d = new Date(iso), n = new Date()
  return d.getDate()===n.getDate() && d.getMonth()===n.getMonth() && d.getFullYear()===n.getFullYear()
}
function isPast(iso) {
  if (!iso) return false
  return new Date(iso) < new Date()
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const I = {
  plus:   () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  close:  () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  check:  () => <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 7L5.5 10.5L12 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  trash:  () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3H12M5 3V2H9V3M3 3L4 12H10L11 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  task:   () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  meet:   () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 3V1M11 3V1M2 7H14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  clock:  () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M7 4V7L9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  user:   () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M2 12C2 9.8 4.2 8 7 8C9.8 8 12 9.8 12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  search: () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  spin:   () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{animation:"tk-spin .7s linear infinite"}}><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 14" strokeLinecap="round"/></svg>,
  edit:   () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5L11.5 4.5L5 11H3V9L9.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  flag:   () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 2V12M3 2H11L9 5H11L9 8H3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  loc:    () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1C4.8 1 3 2.8 3 5C3 7.8 7 13 7 13C7 13 11 7.8 11 5C11 2.8 9.2 1 7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><circle cx="7" cy="5" r="1.5" fill="currentColor"/></svg>,
}

// ─── Task Modal ───────────────────────────────────────────────────────────────
function TaskModal({ onClose, onSave, saving, initial }) {
  const today = new Date().toISOString().split("T")[0]
  const [form, setForm] = useState(initial || { title:"", notes:"", priority:"medium", due_date:"", assigned_to:"" })
  const set = (k,v) => setForm(f => ({...f,[k]:v}))

  return (
    <div className="tk-overlay" onClick={e => { if (e.target===e.currentTarget) onClose() }}>
      <div className="tk-modal">
        <div className="tk-modal-head">
          <span className="tk-modal-title">{initial ? "Edit task" : "New task"}</span>
          <button className="tk-icon-btn" onClick={onClose}><I.close /></button>
        </div>
        <div className="tk-modal-body">
          <div className="tk-field">
            <label className="tk-label">Task title <span style={{color:"#e03131"}}>*</span></label>
            <input className="tk-input" value={form.title} onChange={e=>set("title",e.target.value)} placeholder="What needs to be done?" autoFocus />
          </div>
          <div className="tk-field">
            <label className="tk-label">Notes</label>
            <textarea className="tk-input tk-textarea" value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Add details or context…" rows={3} />
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
            <div className="tk-field">
              <label className="tk-label">Due date</label>
              <input type="date" className="tk-input" min={today} value={form.due_date} onChange={e=>set("due_date",e.target.value)} />
            </div>
            <div className="tk-field">
              <label className="tk-label">Assigned to</label>
              <input className="tk-input" value={form.assigned_to} onChange={e=>set("assigned_to",e.target.value)} placeholder="Name…" />
            </div>
          </div>
          <div className="tk-field">
            <label className="tk-label">Priority</label>
            <div style={{display:"flex", gap:8}}>
              {PRIORITIES.map(p => (
                <button key={p.id} type="button" onClick={()=>set("priority",p.id)}
                  style={{flex:1, padding:"9px 8px", borderRadius:10, border:"2px solid "+(form.priority===p.id?p.color:"#eee"), background:form.priority===p.id?p.bg:"#fafafa", color:form.priority===p.id?p.color:"#888", fontFamily:"inherit", fontSize:12, fontWeight:form.priority===p.id?600:400, cursor:"pointer", transition:"all .15s"}}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <button className="tk-submit-btn" onClick={()=>{if(!form.title.trim())return;onSave(form)}} disabled={saving||!form.title.trim()}>
            {saving?<I.spin />:<I.check />} {saving?"Saving…":initial?"Save changes":"Add task"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Meeting Modal ────────────────────────────────────────────────────────────
function MeetingModal({ onClose, onSave, saving }) {
  const now = new Date()
  const pad = n => String(n).padStart(2,"0")
  const [form, setForm] = useState({
    title:"", with_whom:"",
    date:`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`,
    time:`${pad(now.getHours())}:${pad(now.getMinutes())}`,
    duration:"30", notes:"", location:""
  })
  const set = (k,v) => setForm(f => ({...f,[k]:v}))

  return (
    <div className="tk-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="tk-modal">
        <div className="tk-modal-head">
          <span className="tk-modal-title">Schedule meeting</span>
          <button className="tk-icon-btn" onClick={onClose}><I.close /></button>
        </div>
        <div className="tk-modal-body">
          <div className="tk-field">
            <label className="tk-label">Meeting title <span style={{color:"#e03131"}}>*</span></label>
            <input className="tk-input" value={form.title} onChange={e=>set("title",e.target.value)} placeholder="What's this meeting about?" autoFocus />
          </div>
          <div className="tk-field">
            <label className="tk-label">With</label>
            <input className="tk-input" value={form.with_whom} onChange={e=>set("with_whom",e.target.value)} placeholder="Person or team name" />
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
            <div className="tk-field">
              <label className="tk-label">Date</label>
              <input type="date" className="tk-input" value={form.date} onChange={e=>set("date",e.target.value)} />
            </div>
            <div className="tk-field">
              <label className="tk-label">Time</label>
              <input type="time" className="tk-input" value={form.time} onChange={e=>set("time",e.target.value)} />
            </div>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
            <div className="tk-field">
              <label className="tk-label">Duration</label>
              <select className="tk-input" value={form.duration} onChange={e=>set("duration",e.target.value)}>
                {["15","30","45","60","90","120"].map(d=><option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div className="tk-field">
              <label className="tk-label">Location / Link</label>
              <input className="tk-input" value={form.location} onChange={e=>set("location",e.target.value)} placeholder="Office / Meet link" />
            </div>
          </div>
          <div className="tk-field">
            <label className="tk-label">Notes / Agenda</label>
            <textarea className="tk-input tk-textarea" value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="What to discuss…" rows={2} />
          </div>
          <button className="tk-submit-btn" onClick={()=>{if(!form.title.trim())return;onSave(form)}} disabled={saving||!form.title.trim()}>
            {saving?<I.spin />:<I.meet />} {saving?"Scheduling…":"Schedule meeting"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, onToggle, onDelete, onEdit }) {
  const p    = PMAP[task.priority] || PMAP.medium
  const over = task.due_date && isPast(task.due_date+"T23:59") && !task.completed
  const soon = task.due_date && isToday(task.due_date+"T12:00") && !task.completed

  return (
    <div className={"tk-card"+(task.completed?" done":"")}>
      <button className={"tk-cb"+(task.completed?" checked":"")} onClick={()=>onToggle(task)}>
        {task.completed && <I.check />}
      </button>
      <div style={{flex:1, minWidth:0}}>
        <div style={{display:"flex", alignItems:"flex-start", gap:8, marginBottom:6}}>
          <span className={"tk-task-title"+(task.completed?" strikethrough":"")}>{task.title}</span>
          <span style={{fontSize:10, fontWeight:600, color:p.color, background:p.bg, border:"1px solid "+p.border, borderRadius:20, padding:"2px 8px", whiteSpace:"nowrap", flexShrink:0}}>
            {p.label}
          </span>
        </div>
        {task.notes && !task.completed && (
          <div style={{fontSize:12, color:"#aaa", marginBottom:6, lineHeight:1.5}}>{task.notes}</div>
        )}
        <div style={{display:"flex", alignItems:"center", gap:10, flexWrap:"wrap"}}>
          {task.due_date && (
            <span style={{display:"flex", alignItems:"center", gap:4, fontSize:11, fontWeight:500, color:over?"#c92a2a":soon?"#e67700":"#bbb"}}>
              <I.clock /> {over?"Overdue · ":soon?"Today · ":""}{fmt(task.due_date)}
            </span>
          )}
          {task.assigned_to && (
            <span style={{display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#bbb"}}>
              <I.user /> {task.assigned_to}
            </span>
          )}
          {task.completed && <span style={{fontSize:11, color:"#2f9e44", fontWeight:600}}>✓ Done</span>}
        </div>
      </div>
      <div style={{display:"flex", gap:3, flexShrink:0}}>
        {!task.completed && <button className="tk-act-btn" onClick={()=>onEdit(task)}><I.edit /></button>}
        <button className="tk-act-btn tk-del" onClick={()=>onDelete(task.id)}><I.trash /></button>
      </div>
    </div>
  )
}

// ─── Meeting Card ─────────────────────────────────────────────────────────────
function MeetingCard({ meeting, onDelete }) {
  const dt   = meeting.scheduled_at ? new Date(meeting.scheduled_at) : null
  const past = dt && dt < new Date()
  const today = dt && isToday(meeting.scheduled_at)

  return (
    <div className={"tk-card"+(past?" done":"")} style={{borderLeft: today && !past ? "3px solid #1a73e8" : undefined}}>
      <div style={{width:44, flexShrink:0, textAlign:"center", paddingTop:2}}>
        {dt ? (
          <>
            <div style={{fontSize:20, fontFamily:"'DM Serif Display',serif", color:past?"#bbb":today?"#1a73e8":"#111", lineHeight:1}}>{dt.getDate()}</div>
            <div style={{fontSize:9, fontWeight:600, color:"#bbb", textTransform:"uppercase", letterSpacing:"0.06em"}}>
              {dt.toLocaleString("en-IN",{month:"short"})}
            </div>
          </>
        ) : <div style={{fontSize:22}}>📅</div>}
      </div>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:14, fontWeight:600, color:past?"#aaa":"#111", marginBottom:5, lineHeight:1.3}}>
          {meeting.title}
          {today && !past && <span style={{marginLeft:8, fontSize:10, fontWeight:600, color:"#1a73e8", background:"#EEF4FF", borderRadius:6, padding:"2px 7px"}}>Today</span>}
        </div>
        <div style={{display:"flex", flexWrap:"wrap", gap:8, alignItems:"center"}}>
          {dt && (
            <span style={{display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#aaa"}}>
              <I.clock /> {fmtTime(meeting.scheduled_at)}{meeting.duration&&` · ${meeting.duration} min`}
            </span>
          )}
          {meeting.with_whom && (
            <span style={{display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#aaa"}}>
              <I.user /> {meeting.with_whom}
            </span>
          )}
          {meeting.location && (
            <span style={{display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#bbb", background:"#f5f5f5", borderRadius:6, padding:"1px 8px"}}>
              <I.loc /> {meeting.location}
            </span>
          )}
        </div>
        {meeting.notes && (
          <div style={{fontSize:12, color:"#bbb", marginTop:5, lineHeight:1.5}}>{meeting.notes}</div>
        )}
      </div>
      <button className="tk-act-btn tk-del" onClick={()=>onDelete(meeting.id)}><I.trash /></button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TaskPage() {
  const [tasks, setTasks]         = useState([])
  const [meetings, setMeetings]   = useState([])
  const [ldTasks, setLdTasks]     = useState(true)
  const [ldMeets, setLdMeets]     = useState(true)
  const [tab, setTab]             = useState("tasks")
  const [filter, setFilter]       = useState("all")
  const [search, setSearch]       = useState("")
  const [taskModal, setTaskModal] = useState(false)
  const [meetModal, setMeetModal] = useState(false)
  const [editTask, setEditTask]   = useState(null)
  const [saving, setSaving]       = useState(false)

  const fetchTasks = useCallback(async () => {
    setLdTasks(true)
    const { data } = await supabase.from("tasks").select("*").order("created_at",{ascending:false})
    if (data) setTasks(data)
    setLdTasks(false)
  }, [])

  const fetchMeetings = useCallback(async () => {
    setLdMeets(true)
    const { data } = await supabase.from("meetings").select("*").order("scheduled_at",{ascending:true})
    if (data) setMeetings(data)
    setLdMeets(false)
  }, [])

  useEffect(() => { fetchTasks(); fetchMeetings() }, [fetchTasks, fetchMeetings])

  const handleSaveTask = async (form) => {
    setSaving(true)
    if (editTask) {
      await supabase.from("tasks").update({...form, updated_at:new Date().toISOString()}).eq("id",editTask.id)
      setTasks(prev => prev.map(t => t.id===editTask.id?{...t,...form}:t))
      setEditTask(null)
    } else {
      const { data } = await supabase.from("tasks").insert([{...form, completed:false, created_at:new Date().toISOString()}]).select()
      if (data) setTasks(prev=>[data[0],...prev])
    }
    setTaskModal(false)
    setSaving(false)
  }

  const handleToggle = async (task) => {
    const val = !task.completed
    setTasks(prev=>prev.map(t=>t.id===task.id?{...t,completed:val}:t))
    await supabase.from("tasks").update({completed:val, completed_at:val?new Date().toISOString():null}).eq("id",task.id)
  }

  const handleDeleteTask = async (id) => {
    setTasks(prev=>prev.filter(t=>t.id!==id))
    await supabase.from("tasks").delete().eq("id",id)
  }

  const handleSaveMeeting = async (form) => {
    setSaving(true)
    const scheduled_at = form.date&&form.time ? new Date(`${form.date}T${form.time}`).toISOString() : null
    const { data } = await supabase.from("meetings").insert([{
      title:form.title.trim(), with_whom:form.with_whom.trim(), scheduled_at,
      duration:form.duration, notes:form.notes.trim(), location:form.location.trim(),
      created_at:new Date().toISOString()
    }]).select()
    if (data) setMeetings(prev=>[...prev,data[0]].sort((a,b)=>new Date(a.scheduled_at)-new Date(b.scheduled_at)))
    setMeetModal(false)
    setSaving(false)
  }

  const handleDeleteMeeting = async (id) => {
    setMeetings(prev=>prev.filter(m=>m.id!==id))
    await supabase.from("meetings").delete().eq("id",id)
  }

  const pending  = tasks.filter(t=>!t.completed).length
  const done     = tasks.filter(t=>t.completed).length
  const highCnt  = tasks.filter(t=>t.priority==="high"&&!t.completed).length
  const upcoming = meetings.filter(m=>m.scheduled_at&&!isPast(m.scheduled_at))
  const todayMtg = meetings.filter(m=>m.scheduled_at&&isToday(m.scheduled_at)&&!isPast(m.scheduled_at))

  const FILTERS = [
    {id:"all",     label:"All",       cnt:tasks.length},
    {id:"pending", label:"Pending",   cnt:pending},
    {id:"today",   label:"Due Today", cnt:tasks.filter(t=>t.due_date&&isToday(t.due_date+"T12:00")&&!t.completed).length},
    {id:"high",    label:"High",      cnt:highCnt},
    {id:"done",    label:"Done",      cnt:done},
  ]

  const filtered = tasks.filter(t => {
    const q = search.toLowerCase()
    const mS = t.title?.toLowerCase().includes(q)||t.notes?.toLowerCase().includes(q)
    const mF = filter==="all" ? true
             : filter==="pending" ? !t.completed
             : filter==="done"    ? t.completed
             : filter==="high"    ? t.priority==="high"&&!t.completed
             : filter==="today"   ? t.due_date&&isToday(t.due_date+"T12:00")&&!t.completed
             : true
    return mS && mF
  })

  const pendingFiltered   = filtered.filter(t=>!t.completed)
  const completedFiltered = filtered.filter(t=>t.completed)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        .tk-page{min-height:100vh;min-height:100dvh;background:#f5f5f7;font-family:'DM Sans',sans-serif}

        .tk-topbar{background:#fff;border-bottom:1px solid #f0f0f0;padding:12px 16px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:20}
        .tk-topbar-left{flex:1;min-width:0}
        .tk-eyebrow{font-size:10px;font-weight:600;color:#1a73e8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px;display:flex;align-items:center;gap:5px}
        .tk-title{font-family:'DM Serif Display',serif;font-size:20px;color:#111;letter-spacing:-0.01em}

        .tk-btn{display:flex;align-items:center;gap:6px;padding:9px 14px;border-radius:10px;border:none;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .15s;-webkit-tap-highlight-color:transparent}
        .tk-btn:active{opacity:.85;transform:scale(0.97)}
        .tk-btn-p{background:#1a73e8;color:#fff}.tk-btn-p:hover{background:#1558b0}
        .tk-btn-d{background:#1a1a1a;color:#fff}.tk-btn-d:hover{background:#333}

        .tk-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;padding:16px 16px 0}
        .tk-stat{background:#fff;border:1px solid #f0f0f0;border-radius:14px;padding:14px 16px}
        .tk-stat-n{font-family:'DM Serif Display',serif;font-size:28px;color:#111;line-height:1;letter-spacing:-0.02em;margin-bottom:4px}
        .tk-stat-l{font-size:10px;font-weight:600;color:#bbb;text-transform:uppercase;letter-spacing:0.08em}

        .tk-tabs{display:flex;gap:4px;padding:14px 16px 0}
        .tk-tab{padding:8px 16px;border-radius:100px;border:1.5px solid #e8e8e8;background:#fff;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;color:#777;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .15s;-webkit-tap-highlight-color:transparent}
        .tk-tab.on{background:#1a1a1a;color:#fff;border-color:#1a1a1a}
        .tk-tab:hover:not(.on){border-color:#bbb;color:#333}
        .tk-tab-n{padding:1px 7px;border-radius:20px;font-size:11px;font-weight:600;background:rgba(255,255,255,0.2)}
        .tk-tab:not(.on) .tk-tab-n{background:#f0f0f0;color:#888}

        .tk-toolbar{display:flex;align-items:center;gap:8px;padding:12px 16px 0;flex-wrap:wrap}
        .tk-search{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #e8e8e8;border-radius:11px;padding:9px 13px;flex:1;min-width:140px;transition:border-color .15s}
        .tk-search:focus-within{border-color:#1a73e8}
        .tk-search input{border:none;background:transparent;font-family:'DM Sans',sans-serif;font-size:13px;color:#111;outline:none;width:100%}
        .tk-search input::placeholder{color:#bbb}

        .tk-filters{display:flex;gap:5px;overflow-x:auto;scrollbar-width:none}
        .tk-filters::-webkit-scrollbar{display:none}
        .tk-pill{padding:6px 12px;border-radius:100px;border:1.5px solid #e8e8e8;background:#fff;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;color:#777;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .15s;-webkit-tap-highlight-color:transparent}
        .tk-pill.on{background:#1a73e8;color:#fff;border-color:#1a73e8}
        .tk-pill:hover:not(.on){border-color:#bbb;color:#333}

        .tk-content{padding:14px 16px 80px}
        .tk-count{font-size:10px;font-weight:600;color:#bbb;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px}
        .tk-list{display:flex;flex-direction:column;gap:8px}
        .tk-sec{font-size:11px;font-weight:600;color:#bbb;text-transform:uppercase;letter-spacing:0.1em;margin:16px 0 8px}

        /* Card */
        .tk-card{background:#fff;border:1px solid #f0f0f0;border-radius:14px;padding:14px;display:flex;align-items:flex-start;gap:12px;transition:box-shadow .2s,transform .2s}
        .tk-card:hover{box-shadow:0 4px 16px rgba(0,0,0,0.07);transform:translateY(-1px)}
        .tk-card.done{opacity:0.58;background:#fafafa}

        /* Checkbox */
        .tk-cb{width:22px;height:22px;border-radius:6px;border:2px solid #ddd;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;transition:all .15s;color:#fff;-webkit-tap-highlight-color:transparent}
        .tk-cb.checked{background:#2f9e44;border-color:#2f9e44;animation:tk-pop .2s ease}
        .tk-cb:hover:not(.checked){border-color:#1a73e8}

        .tk-task-title{font-size:14px;font-weight:500;color:#111;line-height:1.35}
        .tk-task-title.strikethrough{text-decoration:line-through;color:#bbb}

        .tk-act-btn{width:28px;height:28px;border-radius:8px;border:none;background:transparent;color:#ddd;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .12s,color .12s;-webkit-tap-highlight-color:transparent}
        .tk-act-btn:hover{background:#f0f0f0;color:#555}
        .tk-del:hover{background:#fff0f0 !important;color:#c92a2a !important}

        .tk-today-hi{display:inline-flex;align-items:center;gap:6px;background:#EEF4FF;color:#3B5BDB;border-radius:10px;padding:9px 14px;font-size:12px;font-weight:500;margin-bottom:14px}

        .tk-empty{text-align:center;padding:60px 20px;color:#bbb}
        .tk-empty-i{font-size:36px;margin-bottom:12px}
        .tk-loading{text-align:center;padding:60px 20px;font-size:13px;color:#ccc;animation:tk-pulse 1.5s ease infinite}

        /* Modal */
        .tk-overlay{position:fixed;inset:0;z-index:70;background:rgba(0,0,0,0.35);display:flex;align-items:flex-end;justify-content:center;animation:tk-fade .2s ease;backdrop-filter:blur(4px)}
        .tk-modal{background:#fff;width:100%;max-width:520px;border-radius:24px 24px 0 0;max-height:92dvh;display:flex;flex-direction:column;animation:tk-up .28s cubic-bezier(.22,.68,0,1.2)}
        .tk-modal-head{display:flex;align-items:center;justify-content:space-between;padding:18px 22px 14px;border-bottom:1px solid #f5f5f5;flex-shrink:0}
        .tk-modal-title{font-family:'DM Serif Display',serif;font-size:22px;color:#111;letter-spacing:-0.01em}
        .tk-modal-body{overflow-y:auto;padding:18px 22px 32px;display:flex;flex-direction:column;gap:14px}

        .tk-field{display:flex;flex-direction:column;gap:6px}
        .tk-label{font-size:11px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:0.08em}
        .tk-input{width:100%;padding:11px 14px;border:1.5px solid #eee;border-radius:11px;font-family:'DM Sans',sans-serif;font-size:14px;color:#111;outline:none;background:#fafafa;transition:border-color .15s,background .15s;-webkit-appearance:none}
        .tk-input:focus{border-color:#1a73e8;background:#fff}
        .tk-input::placeholder{color:#bbb}
        .tk-textarea{resize:vertical;min-height:72px}

        .tk-submit-btn{padding:14px;border-radius:12px;border:none;background:#1a73e8;color:#fff;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:background .15s,opacity .15s;-webkit-tap-highlight-color:transparent}
        .tk-submit-btn:hover:not(:disabled){background:#1558b0}
        .tk-submit-btn:disabled{opacity:.5;cursor:not-allowed}

        .tk-icon-btn{width:32px;height:32px;border-radius:9px;border:1px solid #eee;background:#fff;color:#aaa;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s}
        .tk-icon-btn:hover{background:#f5f5f5;color:#555}

        @keyframes tk-fade{from{opacity:0}to{opacity:1}}
        @keyframes tk-up{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes tk-spin{to{transform:rotate(360deg)}}
        @keyframes tk-pulse{0%,100%{opacity:.4}50%{opacity:1}}
        @keyframes tk-pop{0%{transform:scale(0.8)}60%{transform:scale(1.15)}100%{transform:scale(1)}}

        @media(min-width:640px){
          .tk-topbar{padding:14px 24px}
          .tk-stats{grid-template-columns:repeat(4,1fr);padding:18px 24px 0}
          .tk-tabs,.tk-toolbar{padding-left:24px;padding-right:24px}
          .tk-content{padding:16px 24px 60px}
          .tk-overlay{align-items:center;padding:24px}
          .tk-modal{border-radius:20px;max-height:85vh}
          @keyframes tk-up{from{opacity:0;transform:scale(0.95) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
        }
        @media(min-width:1024px){
          .tk-topbar{padding:14px 32px}
          .tk-stats{padding:18px 32px 0}
          .tk-tabs,.tk-toolbar{padding-left:32px;padding-right:32px}
          .tk-content{padding:16px 32px 60px}
        }
      `}</style>

      <div className="tk-page">
        {/* Topbar */}
        <div className="tk-topbar">
          <div className="tk-topbar-left">
            <div className="tk-eyebrow"><I.task /> Task Manager</div>
            <div className="tk-title">Tasks & Meetings</div>
          </div>
          <button className="tk-btn tk-btn-d" onClick={()=>setMeetModal(true)}>
            <I.meet /> Schedule
          </button>
          <button className="tk-btn tk-btn-p" onClick={()=>{setEditTask(null);setTaskModal(true)}}>
            <I.plus /> Task
          </button>
        </div>

        {/* Stats */}
        <div className="tk-stats">
          <div className="tk-stat">
            <div className="tk-stat-n">{pending}</div>
            <div className="tk-stat-l">⏳ Pending</div>
          </div>
          <div className="tk-stat">
            <div className="tk-stat-n" style={{color:"#2f9e44"}}>{done}</div>
            <div className="tk-stat-l">✅ Done</div>
          </div>
          <div className="tk-stat">
            <div className="tk-stat-n" style={{color:"#c92a2a"}}>{highCnt}</div>
            <div className="tk-stat-l">🔴 High priority</div>
          </div>
          <div className="tk-stat">
            <div className="tk-stat-n" style={{color:"#1a73e8"}}>{upcoming.length}</div>
            <div className="tk-stat-l">📅 Upcoming</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tk-tabs">
          <button className={"tk-tab"+(tab==="tasks"?" on":"")} onClick={()=>setTab("tasks")}>
            <I.task /> Tasks <span className="tk-tab-n">{tasks.length}</span>
          </button>
          <button className={"tk-tab"+(tab==="meetings"?" on":"")} onClick={()=>setTab("meetings")}>
            <I.meet /> Meetings <span className="tk-tab-n">{meetings.length}</span>
          </button>
        </div>

        {tab==="tasks" ? (
          <>
            <div className="tk-toolbar">
              <div className="tk-search">
                <span style={{color:"#ccc",display:"flex",flexShrink:0}}><I.search /></span>
                <input type="text" placeholder="Search tasks…" value={search} onChange={e=>setSearch(e.target.value)} />
              </div>
              <div className="tk-filters">
                {FILTERS.map(f=>(
                  <button key={f.id} className={"tk-pill"+(filter===f.id?" on":"")} onClick={()=>setFilter(f.id)}>
                    {f.label}{f.cnt>0&&<span style={{opacity:0.65}}> ({f.cnt})</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="tk-content">
              {!ldTasks && <div className="tk-count">{filtered.length} task{filtered.length!==1?"s":""}</div>}
              {ldTasks ? (
                <div className="tk-loading">Loading tasks…</div>
              ) : filtered.length===0 ? (
                <div className="tk-empty">
                  <div className="tk-empty-i">{filter==="done"?"✅":"📋"}</div>
                  <div>{search?"No tasks match your search.":filter==="done"?"No completed tasks yet.":"No tasks here."}</div>
                  {!search&&filter==="all"&&<div style={{fontSize:12,marginTop:4}}>Tap <strong>+ Task</strong> to add one!</div>}
                </div>
              ) : (
                <div className="tk-list">
                  {pendingFiltered.map(t=>(
                    <TaskCard key={t.id} task={t} onToggle={handleToggle} onDelete={handleDeleteTask}
                      onEdit={t=>{setEditTask(t);setTaskModal(true)}} />
                  ))}
                  {completedFiltered.length>0 && (
                    <>
                      {pendingFiltered.length>0&&<div className="tk-sec">Completed</div>}
                      {completedFiltered.map(t=>(
                        <TaskCard key={t.id} task={t} onToggle={handleToggle} onDelete={handleDeleteTask}
                          onEdit={t=>{setEditTask(t);setTaskModal(true)}} />
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="tk-content">
            {todayMtg.length>0&&(
              <div className="tk-today-hi">
                <I.meet /> {todayMtg.length} meeting{todayMtg.length!==1?"s":""} today
              </div>
            )}
            {!ldMeets&&<div className="tk-count">{meetings.length} meeting{meetings.length!==1?"s":""}</div>}
            {ldMeets ? (
              <div className="tk-loading">Loading meetings…</div>
            ) : meetings.length===0 ? (
              <div className="tk-empty">
                <div className="tk-empty-i">📅</div>
                <div>No meetings scheduled yet.</div>
                <div style={{fontSize:12,marginTop:4}}>Tap <strong>Schedule</strong> to add one!</div>
              </div>
            ) : (
              <>
                {upcoming.length>0&&(
                  <>
                    <div className="tk-sec">Upcoming</div>
                    <div className="tk-list">
                      {upcoming.map(m=><MeetingCard key={m.id} meeting={m} onDelete={handleDeleteMeeting}/>)}
                    </div>
                  </>
                )}
                {meetings.filter(m=>isPast(m.scheduled_at)).length>0&&(
                  <>
                    <div className="tk-sec" style={{marginTop:24}}>Past</div>
                    <div className="tk-list">
                      {meetings.filter(m=>isPast(m.scheduled_at)).map(m=><MeetingCard key={m.id} meeting={m} onDelete={handleDeleteMeeting}/>)}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {taskModal&&<TaskModal onClose={()=>{setTaskModal(false);setEditTask(null)}} onSave={handleSaveTask} saving={saving} initial={editTask}/>}
      {meetModal&&<MeetingModal onClose={()=>setMeetModal(false)} onSave={handleSaveMeeting} saving={saving}/>}
    </>
  )
}