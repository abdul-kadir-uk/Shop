export default function ApprovalRequestsPage() {
  const requests = [
    {
      id: 1,
      type: "Seller",
      name: "Fresh Mart",
      owner: "Amit Sharma",
      email: "freshmart@gmail.com",
      mobile: "9876543210",
      submittedOn: "02 Jul 2026",
      status: "Pending",
    },
    {
      id: 2,
      type: "Delivery Partner",
      name: "Rahul Kumar",
      owner: "-",
      email: "rahul@gmail.com",
      mobile: "9876543211",
      submittedOn: "03 Jul 2026",
      status: "Pending",
    },
    {
      id: 3,
      type: "Seller",
      name: "Book World",
      owner: "Neha Gupta",
      email: "bookworld@gmail.com",
      mobile: "9876543212",
      submittedOn: "03 Jul 2026",
      status: "Pending",
    },
    {
      id: 4,
      type: "Delivery Partner",
      name: "Vikas Verma",
      owner: "-",
      email: "vikas@gmail.com",
      mobile: "9876543213",
      submittedOn: "04 Jul 2026",
      status: "Pending",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Heading */}

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Approval Requests
        </h1>

        <p className="text-gray-500 mt-1 text-sm md:text-base">
          Review seller and delivery partner registration requests.
        </p>
      </div>

      {/* Search */}

      <div className="bg-white rounded-xl shadow p-4 md:p-5">
        <input
          type="text"
          placeholder="Search request..."
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
                  Type
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Name / Shop
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Owner
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Email
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Mobile
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Submitted
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
              {requests.map((request) => (
                <tr key={request.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {request.type}
                  </td>

                  <td className="px-4 md:px-6 py-4 font-medium whitespace-nowrap">
                    {request.name}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {request.owner}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {request.email}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {request.mobile}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {request.submittedOn}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                      {request.status}
                    </span>
                  </td>

                  <td className="px-4 md:px-6 py-4">
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <button className="bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded-lg text-sm">
                        View
                      </button>

                      <button className="bg-green-600 hover:bg-green-700 transition text-white px-4 py-2 rounded-lg text-sm">
                        Approve
                      </button>

                      <button className="bg-red-600 hover:bg-red-700 transition text-white px-4 py-2 rounded-lg text-sm">
                        Reject
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
