'use client'

function AppTable() {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 rounded-lg shadow-sm">
        <thead className="bg-red-700 text-white">
          <tr>
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">#</th>
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">First Name</th>
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Last Name</th>
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Username</th>
          </tr>
        </thead>
        <tbody>
          <tr className="hover:bg-gray-50 transition-colors">
            <td className="border border-gray-300 px-4 py-3">1</td>
            <td className="border border-gray-300 px-4 py-3">Mark</td>
            <td className="border border-gray-300 px-4 py-3">Otto</td>
            <td className="border border-gray-300 px-4 py-3">@mdo</td>
          </tr>
          <tr className="hover:bg-gray-50 transition-colors">
            <td className="border border-gray-300 px-4 py-3">2</td>
            <td className="border border-gray-300 px-4 py-3">Jacob</td>
            <td className="border border-gray-300 px-4 py-3">Thornton</td>
            <td className="border border-gray-300 px-4 py-3">@fat</td>
          </tr>
          <tr className="hover:bg-gray-50 transition-colors">
            <td className="border border-gray-300 px-4 py-3">3</td>
            <td className="border border-gray-300 px-4 py-3">Luan</td>
            <td className="border border-gray-300 px-4 py-3">Larry</td>
            <td className="border border-gray-300 px-4 py-3">@fat</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default AppTable;