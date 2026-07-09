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
      status: "Blocked",
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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Delivery Partners
        </h1>

        <p className="text-gray-500 mt-1 text-sm md:text-base">
          Manage approved delivery partners.
        </p>
      </div>

      {/* Search */}

      <div className="bg-white rounded-xl shadow p-4 md:p-5">
        <input
          type="text"
          placeholder="Search delivery partner..."
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
                  Vehicle
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Area
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
              {deliveryPartners.map((partner) => (
                <tr key={partner.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 md:px-6 py-4 font-medium whitespace-nowrap">
                    {partner.name}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {partner.email}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {partner.mobile}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {partner.vehicle}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {partner.area}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {partner.joined}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
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
