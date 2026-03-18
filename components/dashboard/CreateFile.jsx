"use client"

import { useState } from "react"
import { createFile } from "@/services/fileService"

export default function CreateFile({ refresh }) {
  const [name, setName] = useState("")
  const [size, setSize] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name || !size) return alert("Please fill name and size")

    setLoading(true)
    
    // Supabase mein data bhejna
    const newData = {
      name: name,
      size: size,
      owner: "Me", // Filhal default "Me" rakh rahe hain
    }

    const result = await createFile(newData)

    if (result) {
      // Form khali karna
      setName("")
      setSize("")
      // Page.js ko bolna ki naya data fetch kare
      refresh()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Add New Record</h3>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-4">
        <input
          placeholder="File Name (e.g. Resume.pdf)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-w-[200px] border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 ring-blue-100 transition-all text-sm"
        />
        <input
          placeholder="Size (e.g. 2.5 MB)"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="w-32 border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 ring-blue-100 transition-all text-sm"
        />
        <button 
          disabled={loading}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-100"
        >
          {loading ? "Adding..." : "Add File"}
        </button>
      </form>
    </div>
  )
}