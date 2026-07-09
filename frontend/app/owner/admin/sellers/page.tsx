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
      status: "Blocked",
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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Sellers
        </h1>

        <p className="text-gray-500 mt-1 text-sm md:text-base">
          Manage approved marketplace sellers.
        </p>
      </div>

      {/* Search */}

      <div className="bg-white rounded-xl shadow p-4 md:p-5">
        <input
          type="text"
          placeholder="Search seller by shop or owner..."
          className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-600"
        />
      </div>

      {/* Table */}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Shop Name
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Owner
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Email
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Category
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Joined
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Status
                </th>

                <th className="text-center px-4 md:px-6 py-4 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {sellers.map((seller) => (
                <tr key={seller.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 md:px-6 py-4 font-medium whitespace-nowrap">
                    {seller.shopName}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {seller.owner}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {seller.email}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {seller.category}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {seller.joined}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
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

                  <td className="px-4 md:px-6 py-4">
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <button className="bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded-lg text-sm">
                        View
                      </button>

                      <button className="bg-yellow-500 hover:bg-yellow-600 transition text-white px-4 py-2 rounded-lg text-sm">
                        Block
                      </button>
                    </div>
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
