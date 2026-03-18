"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const profiles = [
  {
    id: "01",
    name: "Tanishk",
    surname: "Sharma",
    role: "Founder , CEO , CIO , CFO , COO",
    initials: "TS",
    accent: "#3B82F6",
    accentMuted: "rgba(59,130,246,0.12)",
    accentBorder: "rgba(59,130,246,0.3)",
    glowColor: "rgba(59,130,246,0.18)",
  },
  {
    id: "02",
    name: "Harmeet",
    surname: "Kaur(Nidhi)",
    role: "Co-Founder, COO , HR , CFO",
    initials: "HK",
    accent: "#EC4899",
    accentMuted: "rgba(236,72,153,0.12)",
    accentBorder: "rgba(236,72,153,0.3)",
    glowColor: "rgba(236,72,153,0.18)",
  },
]

export default function SelectProfile() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [hoveredId, setHoveredId] = useState(null)
  const [tappedId, setTappedId] = useState(null)

  useEffect(() => {
    setMounted(true)
    if (!localStorage.getItem("isLoggedIn")) {
      router.push("/login")
    }
  }, [router])

  const selectUser = (name, role) => {
    localStorage.setItem("activeUser", name)
    localStorage.setItem("userRole", role)
    router.push("/dashboard")
  }

  const handleTap = (p) => {
    setTappedId(p.id)
    setTimeout(() => selectUser(`${p.name} ${p.surname}`, p.role), 180)
  }

  if (!mounted) return null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .sp-root {
          min-height: 100vh;
          min-height: 100dvh;
          background: #080C14;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 20px 40px;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .sp-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 56px 56px;
          pointer-events: none;
        }

        .sp-root::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 50%, transparent 35%, #080C14 90%);
          pointer-events: none;
        }

        .sp-header {
          text-align: center;
          margin-bottom: 40px;
          position: relative;
          z-index: 10;
          animation: fadeUp 0.5s ease both;
          width: 100%;
        }

        .sp-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 5px 14px;
          border-radius: 100px;
          margin-bottom: 22px;
        }

        .sp-eyebrow-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #22C55E;
          box-shadow: 0 0 7px #22C55E;
          animation: blink 2s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }

        .sp-eyebrow-text {
          font-size: 10px;
          font-weight: 500;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .sp-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(34px, 9vw, 58px);
          font-weight: 400;
          color: #fff;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 10px;
        }

        .sp-title em {
          font-style: italic;
          color: rgba(255,255,255,0.3);
        }

        .sp-subtitle {
          font-size: 12px;
          color: rgba(255,255,255,0.18);
          font-weight: 400;
          letter-spacing: 0.06em;
        }

        /* Mobile: stacked list layout */
        .sp-grid {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 10;
        }

        .sp-card {
          position: relative;
          cursor: pointer;
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03);
          padding: 22px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          overflow: hidden;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition: transform 0.3s cubic-bezier(.22,.68,0,1.2),
                      border-color 0.25s ease,
                      background 0.25s ease;
          animation: fadeUp 0.5s ease both;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          user-select: none;
        }

        .sp-card:nth-child(2) { animation-delay: 0.08s; }
        .sp-card:active { transform: scale(0.97); }

        .sp-card-glow {
          position: absolute;
          width: 160px; height: 160px;
          border-radius: 50%;
          top: -60px; right: -40px;
          filter: blur(50px);
          opacity: 0;
          transition: opacity 0.35s ease;
          pointer-events: none;
        }

        .sp-card.is-active .sp-card-glow { opacity: 1; }

        .sp-avatar {
          width: 50px; height: 50px;
          border-radius: 14px;
          display: flex;
          align-items: center; justify-content: center;
          font-size: 16px; font-weight: 600;
          flex-shrink: 0;
          transition: transform 0.25s ease;
        }

        .sp-card.is-active .sp-avatar { transform: scale(1.06); }

        .sp-card-body { flex: 1; min-width: 0; }

        .sp-card-index {
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 3px;
          opacity: 0.5;
        }

        .sp-card-name {
          font-family: 'DM Serif Display', serif;
          font-size: 20px; font-weight: 400;
          color: #fff;
          line-height: 1.2;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sp-card-name span {
          color: rgba(255,255,255,0.35);
          transition: color 0.25s;
        }

        .sp-card.is-active .sp-card-name span { color: rgba(255,255,255,0.65); }

        .sp-card-role {
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.25);
          margin-top: 4px;
          transition: color 0.25s;
        }

        .sp-card.is-active .sp-card-role { color: rgba(255,255,255,0.5); }

        .sp-arrow {
          width: 32px; height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: border-color 0.25s, background 0.25s, transform 0.25s;
        }

        .sp-card.is-active .sp-arrow {
          border-color: rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.06);
          transform: translateX(3px);
        }

        .sp-footer {
          margin-top: 36px;
          text-align: center;
          position: relative;
          z-index: 10;
          animation: fadeUp 0.5s 0.2s ease both;
        }

        .sp-footer p {
          font-size: 10px;
          color: rgba(255,255,255,0.1);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 500;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Tablet/Desktop: side-by-side cards */
        @media (min-width: 600px) {
          .sp-grid {
            flex-direction: row;
            max-width: 680px;
          }

          .sp-card {
            flex: 1;
            flex-direction: column;
            align-items: flex-start;
            padding: 30px 26px 26px;
            gap: 0;
          }

          .sp-avatar { margin-bottom: 22px; }
          .sp-card-body { width: 100%; }
          .sp-card-name { font-size: 24px; white-space: normal; }
          .sp-card-role { margin-bottom: 24px; }
          .sp-arrow { margin-top: auto; }
        }
      `}</style>

      <div className="sp-root">
        <div className="sp-header">
          <div className="sp-eyebrow">
            <div className="sp-eyebrow-dot" />
            <span className="sp-eyebrow-text">Secure Session Active</span>
          </div>
          <h1 className="sp-title">
            Who's<br /><em>working today?</em>
          </h1>
          <p className="sp-subtitle">Founder OS · Select your identity</p>
        </div>

        <div className="sp-grid">
          {profiles.map((p) => {
            const isActive = hoveredId === p.id || tappedId === p.id
            return (
              <div
                key={p.id}
                className={`sp-card${isActive ? " is-active" : ""}`}
                style={{
                  borderColor: isActive ? p.accentBorder : undefined,
                  background: isActive ? "rgba(255,255,255,0.05)" : undefined,
                }}
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
                onTouchStart={() => setHoveredId(p.id)}
                onTouchEnd={() => setHoveredId(null)}
                onClick={() => handleTap(p)}
              >
                <div className="sp-card-glow" style={{ background: p.glowColor }} />

                <div
                  className="sp-avatar"
                  style={{
                    background: p.accentMuted,
                    border: `1px solid ${p.accentBorder}`,
                    color: p.accent,
                  }}
                >
                  {p.initials}
                </div>

                <div className="sp-card-body">
                  <div className="sp-card-index" style={{ color: p.accent }}>
                    Identity {p.id}
                  </div>
                  <div className="sp-card-name">
                    {p.name} <span>{p.surname}</span>
                  </div>
                  <div className="sp-card-role">{p.role}</div>
                </div>

                <div className="sp-arrow">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path
                      d="M2.5 6.5H10.5M7 3.5L10.5 6.5L7 9.5"
                      stroke="rgba(255,255,255,0.45)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            )
          })}
        </div>

        <div className="sp-footer">
          <p>Founder OS · v1.0 · Encrypted Access</p>
        </div>
      </div>
    </>
  )
}