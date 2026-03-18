"use client"

import { useState, useEffect } from "react"
import { createFile } from "@/services/fileService"

export default function CreateFile({ refresh }) {
  const [name, setName] = useState("")
  const [size, setSize] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeUser, setActiveUser] = useState("Founder")

  // LocalStorage se active user uthao
  useEffect(() => {
    const user = localStorage.getItem("activeUser")
    if (user) setActiveUser(user)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name || !size) return alert("Bhai, naam aur size toh daal de!")

    setLoading(true)
    
    // Naya data structure tere blueprint ke hisaab se
    const newData = {
      name: name,
      size: size,
      owner: activeUser, // Ab yahan "Me" nahi, Tanishk ya Nidhi jayega
      type: "document"
    }

    const result = await createFile(newData)

    if (result) {
      setName("")
      setSize("")
      refresh() // Table ko refresh karega
    }
    setLoading(false)
  }

  return (
    <div className="bg-white p-8 rounded-[35px] shadow-sm border border-gray-100 mb-10 transition-all hover:shadow-md font-inter">
      <div className="flex items-center gap-2 mb-6">
        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Initialize New Asset</h3>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
        <input
          placeholder="File Name (e.g. Website_Draft.pdf)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 p-4 bg-gray-50 border border-transparent rounded-[20px] outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-sm text-[#1B2559]"
        />
        <input
          placeholder="Size (e.g. 15 MB)"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="w-full md:w-40 p-4 bg-gray-50 border border-transparent rounded-[20px] outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-sm text-[#1B2559]"
        />
        <button 
          disabled={loading}
          className="bg-[#2255ff] text-white px-10 py-4 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-100 active:scale-95"
        >
          {loading ? "Deploying..." : "Deploy File"}
        </button>
      </form>
    </div>
  )
}