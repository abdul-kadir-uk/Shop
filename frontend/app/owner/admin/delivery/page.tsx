export default function DeliveryPartnersPage() {
  const deliveryPartners = [
    {
      id: 1,
      name: "Rahul Kumar",
      email: "rahul@gmail.com",
      mobile: "9876543210",
      vehicle: "Bike",
      area: "Delhi",
      joined: "01 Jul 2026",
      status: "Approved",
    },
    {
      id: 2,
      name: "Aman Singh",
      email: "aman@gmail.com",
      mobile: "9876543211",
      vehicle: "Scooter",
      area: "Noida",
      joined: "28 Jun 2026",
      status: "Approved",
    },
    {
      id: 3,
      name: "Rohit Sharma",
      email: "rohit@gmail.com",
      mobile: "9876543212",
      vehicle: "Bike",
      area: "Ghaziabad",
      joined: "24 Jun 2026",
      status: "Suspended",
    },
    {
      id: 4,
      name: "Vikas Verma",
      email: "vikas@gmail.com",
      mobile: "9876543213",
      vehicle: "Scooter",
      area: "Faridabad",
      joined: "18 Jun 2026",
      status: "Approved",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Heading */}

      <div>
        <h1 className="text-3xl font-bold text-gray-800">Delivery Partners</h1>

        <p className="text-gray-500 mt-1">Manage approved delivery partners.</p>
      </div>

      {/* Search */}

      <div className="bg-white rounded-xl shadow p-5">
        <input
          type="text"
          placeholder="Search delivery partner..."
          className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-600"
        />
      </div>

      {/* Table */}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-6 py-4">Name</th>
                <th className="text-left px-6 py-4">Email</th>
                <th className="text-left px-6 py-4">Mobile</th>
                <th className="text-left px-6 py-4">Vehicle</th>
                <th className="text-left px-6 py-4">Area</th>
                <th className="text-left px-6 py-4">Joined</th>
                <th className="text-left px-6 py-4">Status</th>
                <th className="text-center px-6 py-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {deliveryPartners.map((partner) => (
                <tr key={partner.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{partner.name}</td>

                  <td className="px-6 py-4">{partner.email}</td>

                  <td className="px-6 py-4">{partner.mobile}</td>

                  <td className="px-6 py-4">{partner.vehicle}</td>

                  <td className="px-6 py-4">{partner.area}</td>

                  <td className="px-6 py-4">{partner.joined}</td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        partner.status === "Approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {partner.status}
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
