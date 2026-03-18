"use client"

export default function FileTable({ files }) {
  if (!files || files.length === 0) {
    return (
      <div className="p-20 text-center bg-white rounded-[40px] border border-dashed border-gray-200 mt-8">
        <div className="text-4xl mb-4 opacity-20">📂</div>
        <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">
          Terminal Khali Hai. Nayi File Deploy Karein!
        </p>
      </div>
    )
  }

  return (
    <div className="mt-8 bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden font-inter">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] text-gray-400 uppercase tracking-[0.3em] border-b border-gray-50 bg-gray-50/50">
              <th className="px-8 py-5 font-black">Asset Name</th>
              <th className="px-8 py-5 font-black">Owner / Operator</th>
              <th className="px-8 py-5 font-black">Size</th>
              <th className="px-8 py-5 font-black">Deployment Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {files.map((file) => {
              // Owner check for dynamic coloring
              const isTanishk = file.owner?.includes("Tanishk");
              const isNidhi = file.owner?.includes("Harmeet") || file.owner?.includes("Nidhi");

              return (
                <tr key={file.id} className="hover:bg-blue-50/20 transition-all group">
                  {/* File Name */}
                  <td className="px-8 py-6 text-sm font-bold text-[#1B2559] flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                       <span className="text-blue-500 text-base">📄</span>
                    </div>
                    {file.name}
                  </td>

                  {/* Dynamic Owner Tag */}
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${
                      isTanishk 
                        ? "bg-blue-50 text-blue-600 border border-blue-100" 
                        : isNidhi 
                        ? "bg-pink-50 text-pink-600 border border-pink-100"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {file.owner || 'Founder'}
                    </span>
                  </td>

                  {/* Size */}
                  <td className="px-8 py-6 text-xs font-black text-gray-500 tracking-tight">
                    {file.size}
                  </td>

                  {/* Date */}
                  <td className="px-8 py-6 text-xs font-bold text-gray-400">
                    {new Date(file.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}