export default function SellersPage() {
  const sellers = [
    {
      id: 1,
      shopName: "Fresh Mart",
      owner: "Amit Sharma",
      email: "freshmart@gmail.com",
      category: "Grocery",
      joined: "01 Jul 2026",
      status: "Approved",
    },
    {
      id: 2,
      shopName: "Mobile Hub",
      owner: "Rahul Singh",
      email: "mobilehub@gmail.com",
      category: "Electronics",
      joined: "28 Jun 2026",
      status: "Approved",
    },
    {
      id: 3,
      shopName: "Fashion Point",
      owner: "Priya Verma",
      email: "fashionpoint@gmail.com",
      category: "Fashion",
      joined: "22 Jun 2026",
      status: "Suspended",
    },
    {
      id: 4,
      shopName: "Book World",
      owner: "Neha Gupta",
      email: "bookworld@gmail.com",
      category: "Books",
      joined: "15 Jun 2026",
      status: "Approved",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Heading */}

      <div>
        <h1 className="text-3xl font-bold text-gray-800">Sellers</h1>

        <p className="text-gray-500 mt-1">
          Manage approved marketplace sellers.
        </p>
      </div>

      {/* Search */}

      <div className="bg-white rounded-xl shadow p-5">
        <input
          type="text"
          placeholder="Search seller by shop or owner..."
          className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-600"
        />
      </div>

      {/* Table */}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-6 py-4">Shop Name</th>
                <th className="text-left px-6 py-4">Owner</th>
                <th className="text-left px-6 py-4">Email</th>
                <th className="text-left px-6 py-4">Category</th>
                <th className="text-left px-6 py-4">Joined</th>
                <th className="text-left px-6 py-4">Status</th>
                <th className="text-center px-6 py-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {sellers.map((seller) => (
                <tr key={seller.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{seller.shopName}</td>

                  <td className="px-6 py-4">{seller.owner}</td>

                  <td className="px-6 py-4">{seller.email}</td>

                  <td className="px-6 py-4">{seller.category}</td>

                  <td className="px-6 py-4">{seller.joined}</td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        seller.status === "Approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {seller.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mr-2">
                      View
                    </button>

                    <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg">
                      Suspend
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
