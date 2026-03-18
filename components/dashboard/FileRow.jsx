export default function FileRow({ file }) {
  return (
    <tr className="border-b hover:bg-gray-100">

      <td className="p-3">
        {file.name}
      </td>

      <td className="p-3">
        {file.owner}
      </td>

      <td className="p-3">
        {file.size}
      </td>

    </tr>
  )
}