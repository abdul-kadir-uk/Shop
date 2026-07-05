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
        <h1 className="text-3xl font-bold text-gray-800">Approval Requests</h1>

        <p className="text-gray-500 mt-1">
          Review seller and delivery partner registration requests.
        </p>
      </div>

      {/* Search */}

      <div className="bg-white rounded-xl shadow p-5">
        <input
          type="text"
          placeholder="Search request..."
          className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-600"
        />
      </div>

      {/* Table */}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-6 py-4">Type</th>
                <th className="text-left px-6 py-4">Name / Shop</th>
                <th className="text-left px-6 py-4">Owner</th>
                <th className="text-left px-6 py-4">Email</th>
                <th className="text-left px-6 py-4">Mobile</th>
                <th className="text-left px-6 py-4">Submitted</th>
                <th className="text-left px-6 py-4">Status</th>
                <th className="text-center px-6 py-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4">{request.type}</td>

                  <td className="px-6 py-4 font-medium">{request.name}</td>

                  <td className="px-6 py-4">{request.owner}</td>

                  <td className="px-6 py-4">{request.email}</td>

                  <td className="px-6 py-4">{request.mobile}</td>

                  <td className="px-6 py-4">{request.submittedOn}</td>

                  <td className="px-6 py-4">
                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                      {request.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center space-x-2">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                      View
                    </button>

                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                      Approve
                    </button>

                    <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
                      Reject
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
