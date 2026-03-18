"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { label: "Files", href: "/files", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg> },
  { label: "PDFs", href: "/pdf", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15h6"/></svg> },
  { label: "Images", href: "/images", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
  { label: "Notes", href: "/notes", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
  { label: "Tasks", href: "/tasks", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
  { label: "Suggestions", href: "/sugg", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21h6"/><path d="M9 17h6"/><path d="M12 2a7 7 0 0 0-7 7c0 2.3 1.1 4.3 2.8 5.6L8 17h8l.2-2.4c1.7-1.3 2.8-3.3 2.8-5.6a7 7 0 0 0-7-7z"/></svg> },
  { label: "Credentials", href: "/cred", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  const sidebarContent = (
    <div style={S.inner}>
      {/* Branding */}
      <div style={S.logo}>
        <div style={S.logoIcon}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <div>
          <span style={S.logoText}>EXPLICITY</span>
          <div style={S.logoSub}>Operating System</div>
        </div>
      </div>

      {/* Menu List */}
      <nav style={S.nav}>
        <div style={S.navLabel}>SYSTEM MENU</div>
        {NAV.map(item => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/")
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <div style={{ ...S.navItem, ...(active ? S.navItemActive : {}) }}>
                <span style={{ ...S.navIcon, ...(active ? S.navIconActive : {}) }}>
                  {item.icon}
                </span>
                <span style={{ ...S.navLabelText, ...(active ? S.navLabelTextActive : {}) }}>
                  {item.label}
                </span>
                {active && <div style={S.activeIndicator} />}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Profile/Signout */}
      <div style={S.bottom}>
        <button style={S.signOutBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          <span style={{ fontWeight: "600" }}>Terminate Session</span>
        </button>
      </div>
    </div>
  )

  if (!isMobile) return <aside style={S.desktop}>{sidebarContent}</aside>

  return (
    <>
      <div style={S.mobileHeader}>
         <button style={S.hamburgerBtn} onClick={() => setOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
         </button>
         <span style={S.logoTextSmall}>EXPLICITY OS</span>
      </div>

      {open && <div style={S.backdrop} onClick={() => setOpen(false)} />}

      <aside style={{ ...S.drawer, transform: open ? "translateX(0)" : "translateX(-100%)" }}>
          <div style={{ padding: "10px", display: "flex", justifyContent: "flex-end" }}>
            <button style={S.drawerClose} onClick={() => setOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          {sidebarContent}
      </aside>
    </>
  )
}

const S = {
  desktop: {
    width: 260,
    height: "100vh",
    position: "sticky",
    top: 0,
    background: "#0a0f1e", // Slightly darker for more depth
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid rgba(255,255,255,0.08)",
  },
  drawer: {
    position: "fixed",
    top: 0,
    left: 0,
    width: 280,
    height: "100vh",
    background: "#0a0f1e",
    zIndex: 1000,
    transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "20px 0 50px rgba(0,0,0,0.5)",
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(8px)",
    zIndex: 999,
  },
  mobileHeader: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    background: "#0a0f1e",
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    zIndex: 90,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  hamburgerBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "none",
    marginRight: 15,
    cursor: "pointer",
    width: 40,
    height: 40,
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoTextSmall: { color: '#fff', fontSize: 15, fontWeight: 800, letterSpacing: "1px" },
  drawerClose: {
    background: "rgba(255,255,255,0.05)",
    border: "none",
    borderRadius: "12px",
    width: 38,
    height: 38,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  inner: { display: "flex", flexDirection: "column", height: "100%", padding: "10px 0" },
  logo: { 
    display: "flex", 
    alignItems: "center", 
    gap: 14, 
    padding: "20px 24px 30px",
  },
  logoIcon: { 
    width: 42, 
    height: 42, 
    borderRadius: "12px", 
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center",
    boxShadow: "0 8px 16px rgba(37, 99, 235, 0.3)",
  },
  logoText: { fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "1.5px" },
  logoSub: { fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: "600", marginTop: "-2px", textTransform: "uppercase", letterSpacing: "1px" },
  nav: { flex: 1, padding: "0 14px", overflowY: "auto" },
  navLabel: { fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", padding: "10px 14px", fontWeight: "800", letterSpacing: "1.5px" },
  navItem: { 
    display: "flex", 
    alignItems: "center", 
    gap: 14, 
    padding: "12px 16px", 
    borderRadius: "14px", 
    marginBottom: 6, 
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "pointer",
    position: "relative",
    color: "rgba(255,255,255,0.5)",
  },
  navItemActive: { 
    background: "rgba(59,130,246,0.12)",
    color: "#fff",
  },
  navIcon: { 
    transition: "transform 0.3s",
    display: "flex",
    alignItems: "center",
  },
  navIconActive: { 
    color: "#3b82f6",
    filter: "drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))",
  },
  navLabelText: { fontSize: 14, fontWeight: "500", transition: "all 0.3s" },
  navLabelTextActive: { color: "#fff", fontWeight: "700" },
  activeIndicator: {
    position: "absolute",
    left: 0,
    width: 4,
    height: 20,
    background: "#3b82f6",
    borderRadius: "0 4px 4px 0",
    boxShadow: "0 0 10px rgba(59, 130, 246, 0.8)",
  },
  bottom: { padding: "20px 18px", borderTop: "1px solid rgba(255,255,255,0.05)" },
  signOutBtn: {
    width: "100%",
    padding: "14px",
    background: "rgba(239, 68, 68, 0.08)",
    color: "#f87171",
    border: "1px solid rgba(239, 68, 68, 0.15)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.2s",
  }
}
