"use client"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const router = useRouter()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lnd-root {
          min-height: 100vh;
          min-height: 100dvh;
          background: #080C14;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px 40px;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Grid */
        .lnd-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
          background-size: 56px 56px;
          pointer-events: none;
        }

        /* Vignette */
        .lnd-root::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 45%, transparent 30%, #080C14 85%);
          pointer-events: none;
        }

        /* Ambient glow */
        .lnd-glow {
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          top: 50%; left: 50%;
          transform: translate(-50%, -58%);
          background: radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* Content */
        .lnd-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 520px;
          width: 100%;
          animation: fadeUp 0.6s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Logo */
        .lnd-logo {
          width: 64px; height: 64px;
          border-radius: 20px;
          background: rgba(59,130,246,0.1);
          border: 1px solid rgba(59,130,246,0.2);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 32px;
        }

        /* Status pill */
        .lnd-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 5px 14px;
          border-radius: 100px;
          margin-bottom: 28px;
        }

        .lnd-pill-dot {
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

        .lnd-pill-text {
          font-size: 10px;
          font-weight: 500;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        /* Wordmark */
        .lnd-wordmark {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(42px, 11vw, 72px);
          font-weight: 400;
          color: #fff;
          line-height: 1.05;
          letter-spacing: -0.03em;
          margin-bottom: 8px;
        }

        .lnd-wordmark em {
          font-style: italic;
          color: #3B82F6;
        }

        .lnd-os-tag {
          display: inline-block;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.2);
          margin-bottom: 24px;
        }

        /* Description */
        .lnd-desc {
          font-size: 15px;
          color: rgba(255,255,255,0.35);
          line-height: 1.7;
          font-weight: 400;
          max-width: 360px;
          margin-bottom: 44px;
        }

        .lnd-desc strong {
          color: rgba(255,255,255,0.65);
          font-weight: 500;
        }

        /* CTA Button */
        .lnd-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #3B82F6;
          color: #fff;
          border: none;
          padding: 16px 32px;
          border-radius: 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: background 0.2s, transform 0.18s;
          margin-bottom: 20px;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        .lnd-btn:hover { background: #2563EB; }
        .lnd-btn:active { transform: scale(0.97); }

        .lnd-btn-arrow {
          width: 30px; height: 30px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: transform 0.2s;
        }

        .lnd-btn:hover .lnd-btn-arrow { transform: translateX(3px); }

        /* Enc note */
        .lnd-enc {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          color: rgba(255,255,255,0.15);
          letter-spacing: 0.06em;
          font-weight: 400;
        }

        /* Footer */
        .lnd-footer {
          position: absolute;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          white-space: nowrap;
        }

        .lnd-footer p {
          font-size: 10px;
          color: rgba(255,255,255,0.08);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 500;
        }
      `}</style>

      <div className="lnd-root">
        <div className="lnd-glow" />

        <div className="lnd-content">
          {/* Logo */}
          <div className="lnd-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 3L24 8.5V19.5L14 25L4 19.5V8.5L14 3Z" stroke="#3B82F6" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M14 9V19M10 11.5L14 9L18 11.5" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Status */}
          <div className="lnd-pill">
            <div className="lnd-pill-dot" />
            <span className="lnd-pill-text">System Ready</span>
          </div>

          {/* Title */}
          <h1 className="lnd-wordmark">
            Expl<em>icity</em>
          </h1>
          <span className="lnd-os-tag">Founder OS</span>

          {/* Description */}
          <p className="lnd-desc">
            The official founder portal for <strong>Explicity AI</strong>.<br />
            Initialize your session to manage your digital workspace.
          </p>

          {/* CTA */}
          <button className="lnd-btn" onClick={() => router.push("/login")}>
            Enter portal
            <div className="lnd-btn-arrow">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2.5 6.5H10.5M7 3.5L10.5 6.5L7 9.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>

          {/* Enc note */}
          <div className="lnd-enc">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="2" y="5.5" width="8" height="6" rx="1.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
              <path d="M4 5.5V4C4 2.9 4.9 2 6 2C7.1 2 8 2.9 8 4V5.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            End-to-end encrypted connection
          </div>
        </div>

        {/* Footer */}
        <div className="lnd-footer">
          <p>Explicity AI © 2026 · All rights reserved</p>
        </div>
      </div>
    </>
  )
}