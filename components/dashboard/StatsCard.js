"use client"

export default function StatsCard({ title, count, color, icon }) {
  return (
    <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-50 flex items-center justify-between hover:shadow-md transition-shadow cursor-default">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-400 mb-1">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-[#1B2559]">
          {count}
        </h3>
      </div>
      
      {/* Icon Circle */}
      <div className={`${color} w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg opacity-90`}>
        <span className="text-xl">
          {icon || "⚡"}
        </span>
      </div>
    </div>
  )
}