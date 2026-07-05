export default function AdminDashboardPage() {
  const stats = [
    {
      title: "Customers",
      value: "1,250",
      color: "bg-blue-500",
    },
    {
      title: "Sellers",
      value: "245",
      color: "bg-green-500",
    },
    {
      title: "Delivery Partners",
      value: "78",
      color: "bg-yellow-500",
    },
    {
      title: "Orders",
      value: "8,460",
      color: "bg-purple-500",
    },
  ];

  const pendingRequests = [
    {
      name: "Fresh Mart",
      type: "Seller",
      status: "Pending",
    },
    {
      name: "Rahul Kumar",
      type: "Delivery Partner",
      status: "Pending",
    },
    {
      name: "Daily Needs",
      type: "Seller",
      status: "Pending",
    },
  ];

  const recentOrders = [
    {
      id: "#1001",
      customer: "Amit",
      amount: "₹1,250",
      status: "Delivered",
    },
    {
      id: "#1002",
      customer: "Priya",
      amount: "₹890",
      status: "Processing",
    },
    {
      id: "#1003",
      customer: "Rahul",
      amount: "₹2,430",
      status: "Out for Delivery",
    },
    {
      id: "#1004",
      customer: "Neha",
      amount: "₹640",
      status: "Delivered",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Heading */}

      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

        <p className="text-gray-500 mt-2">
          Welcome to the Marketplace Admin Dashboard.
        </p>
      </div>

      {/* Statistics */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((item) => (
          <div
            key={item.title}
            className={`${item.color} rounded-xl p-6 text-white shadow-lg`}
          >
            <h2 className="text-lg font-medium">{item.title}</h2>

            <p className="text-4xl font-bold mt-3">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue */}

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-6">Revenue Overview</h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-gray-500">Today</p>
            <h3 className="text-2xl font-bold mt-2">₹24,500</h3>
          </div>

          <div>
            <p className="text-gray-500">This Week</p>
            <h3 className="text-2xl font-bold mt-2">₹1,72,000</h3>
          </div>

          <div>
            <p className="text-gray-500">This Month</p>
            <h3 className="text-2xl font-bold mt-2">₹6,85,000</h3>
          </div>

          <div>
            <p className="text-gray-500">Total Revenue</p>
            <h3 className="text-2xl font-bold mt-2 text-green-600">
              ₹18,42,500
            </h3>
          </div>
        </div>
      </div>

      {/* Pending Requests & Recent Orders */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Pending Requests */}

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-5">
            Pending Approval Requests
          </h2>

          <div className="space-y-4">
            {pendingRequests.map((request, index) => (
              <div
                key={index}
                className="flex justify-between items-center border rounded-lg p-4"
              >
                <div>
                  <p className="font-semibold">{request.name}</p>

                  <p className="text-gray-500 text-sm">{request.type}</p>
                </div>

                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-5">Recent Orders</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Order ID</th>

                  <th className="text-left py-3">Customer</th>

                  <th className="text-left py-3">Amount</th>

                  <th className="text-left py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-none">
                    <td className="py-4">{order.id}</td>

                    <td>{order.customer}</td>

                    <td>{order.amount}</td>

                    <td>{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
