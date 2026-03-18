// components/dashboard/QuickAccess.js

export default function QuickAccess({ files }) { // "export default" hona chahiye
  const displayFiles = files.slice(0, 3);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {displayFiles.map((file) => (
        <div key={file.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
           <p className="font-bold">{file.name}</p>
           <p className="text-xs text-gray-400">{file.size}</p>
        </div>
      ))}
    </div>
  );
}