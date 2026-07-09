export default function CustomersPage() {
  const customers = [
    {
      id: 1,
      name: "Amit Sharma",
      email: "amit@gmail.com",
      mobile: "9876543210",
      joined: "01 Jul 2026",
      status: "Active",
    },
    {
      id: 2,
      name: "Priya Singh",
      email: "priya@gmail.com",
      mobile: "9876543211",
      joined: "28 Jun 2026",
      status: "Active",
    },
    {
      id: 3,
      name: "Rahul Kumar",
      email: "rahul@gmail.com",
      mobile: "9876543212",
      joined: "20 Jun 2026",
      status: "Blocked",
    },
    {
      id: 4,
      name: "Neha Verma",
      email: "neha@gmail.com",
      mobile: "9876543213",
      joined: "15 Jun 2026",
      status: "Active",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Heading */}

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Customers
        </h1>

        <p className="text-gray-500 mt-1 text-sm md:text-base">
          Manage all registered customers.
        </p>
      </div>

      {/* Search */}

      <div className="bg-white rounded-xl shadow p-4 md:p-5">
        <input
          type="text"
          placeholder="Search customer..."
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
                  Name
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Email
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Mobile
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Joined
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Status
                </th>

                <th className="text-center px-4 md:px-6 py-4 whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 md:px-6 py-4 font-medium whitespace-nowrap">
                    {customer.name}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {customer.email}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {customer.mobile}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {customer.joined}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        customer.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {customer.status}
                    </span>
                  </td>

                  <td className="px-4 md:px-6 py-4">
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">
                        View
                      </button>

                      <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition">
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
