"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [focused, setFocused] = useState(false)
  const router = useRouter()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { data } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "master_password")
        .single()

      if (data && data.value === password) {
        localStorage.setItem("isLoggedIn", "true")
        router.push("/select-profile")
      } else {
        setError("Invalid access key. Try again.")
      }
    } catch {
      setError("Unable to connect. Check your network.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-root {
          min-height: 100vh;
          min-height: 100dvh;
          background: #080C14;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 20px;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Grid */
        .lp-root::before {
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
        .lp-root::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 40%, transparent 30%, #080C14 85%);
          pointer-events: none;
        }

        /* Ambient glow */
        .lp-glow {
          position: absolute;
          width: 500px; height: 500px;
          border-radius: 50%;
          top: 50%; left: 50%;
          transform: translate(-50%, -60%);
          background: radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* Card */
        .lp-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 400px;
          animation: fadeUp 0.55s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Brand */
        .lp-brand {
          text-align: center;
          margin-bottom: 40px;
        }

        .lp-logo-ring {
          width: 56px; height: 56px;
          border-radius: 18px;
          background: rgba(59,130,246,0.1);
          border: 1px solid rgba(59,130,246,0.25);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
        }

        .lp-wordmark {
          font-family: 'DM Serif Display', serif;
          font-size: 28px;
          font-weight: 400;
          color: #fff;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }

        .lp-wordmark em {
          font-style: italic;
          color: #3B82F6;
        }

        .lp-tagline {
          font-size: 12px;
          color: rgba(255,255,255,0.22);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 500;
        }

        /* Form box */
        .lp-box {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 24px;
          padding: 32px 28px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .lp-label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin-bottom: 10px;
        }

        .lp-input-wrap {
          position: relative;
          margin-bottom: 16px;
        }

        .lp-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 15px 48px 15px 18px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 400;
          color: #fff;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          letter-spacing: 0.12em;
          -webkit-text-security: disc;
          text-security: disc;
        }

        .lp-input::placeholder {
          color: rgba(255,255,255,0.18);
          letter-spacing: 0.04em;
          font-size: 14px;
        }

        .lp-input:focus {
          border-color: rgba(59,130,246,0.5);
          background: rgba(59,130,246,0.05);
        }

        .lp-input-icon {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          opacity: 0.2;
        }

        /* Button */
        .lp-btn {
          width: 100%;
          padding: 15px;
          border-radius: 14px;
          border: none;
          background: #3B82F6;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
        }

        .lp-btn:hover:not(:disabled) { background: #2563EB; }
        .lp-btn:active:not(:disabled) { transform: scale(0.98); }
        .lp-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Spinner */
        .lp-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Error */
        .lp-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 12px;
          padding: 11px 14px;
          margin-top: 14px;
          font-size: 13px;
          color: #FCA5A5;
          font-weight: 400;
          animation: fadeUp 0.2s ease both;
        }

        /* Divider */
        .lp-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
        }

        .lp-divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }

        .lp-divider-text {
          font-size: 10px;
          color: rgba(255,255,255,0.15);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 500;
          white-space: nowrap;
        }

        /* Footer */
        .lp-footer {
          text-align: center;
          margin-top: 28px;
          animation: fadeUp 0.55s 0.15s ease both;
        }

        .lp-footer p {
          font-size: 10px;
          color: rgba(255,255,255,0.1);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 500;
        }
      `}</style>

      <div className="lp-root">
        <div className="lp-glow" />

        <div className="lp-card">
          {/* Brand */}
          <div className="lp-brand">
            <div className="lp-logo-ring">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" stroke="#3B82F6" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M12 8V16M8.5 10L12 8L15.5 10" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="lp-wordmark">
              Expl<em>icity</em>
            </div>
            <p className="lp-tagline">Founder OS · Secure Terminal</p>
          </div>

          {/* Form box */}
          <div className="lp-box">
            <label className="lp-label">Access Key</label>

            <form onSubmit={handleLogin}>
              <div className="lp-input-wrap">
                <input
                  type="password"
                  placeholder="Enter your passcode"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  className="lp-input"
                  autoComplete="current-password"
                  required
                />
                <div className="lp-input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="3" y="7" width="10" height="8" rx="2" stroke="white" strokeWidth="1.2"/>
                    <path d="M5 7V5C5 3.34 6.34 2 8 2C9.66 2 11 3.34 11 5V7" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

              <button type="submit" className="lp-btn" disabled={loading || !password}>
                {loading ? (
                  <>
                    <div className="lp-spinner" />
                    Verifying…
                  </>
                ) : (
                  <>
                    Enter workspace
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7H11M8 4L11 7L8 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>

              {error && (
                <div className="lp-error">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{flexShrink:0}}>
                    <circle cx="7" cy="7" r="6" stroke="#FCA5A5" strokeWidth="1.2"/>
                    <path d="M7 4.5V7.5M7 9.5V9.6" stroke="#FCA5A5" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {error}
                </div>
              )}
            </form>

            <div className="lp-divider">
              <div className="lp-divider-line" />
              <span className="lp-divider-text">Encrypted · End-to-end secure</span>
              <div className="lp-divider-line" />
            </div>

            <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'6px'}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:'#22C55E',boxShadow:'0 0 6px #22C55E'}} />
              <span style={{fontSize:11,color:'rgba(255,255,255,0.2)',letterSpacing:'0.06em',fontWeight:500}}>
                System online
              </span>
            </div>
          </div>
        </div>

        <div className="lp-footer">
          <p>Explicity · v1.0 · All access monitored</p>
        </div>
      </div>
    </>
  )
}