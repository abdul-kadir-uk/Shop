export default function OrdersPage() {
  const orders = [
    {
      id: "#ORD1001",
      customer: "Amit Sharma",
      seller: "Fresh Mart",
      deliveryPartner: "Rahul Kumar",
      amount: "₹1,250",
      payment: "Online",
      status: "Delivered",
      date: "05 Jul 2026",
    },
    {
      id: "#ORD1002",
      customer: "Priya Singh",
      seller: "Mobile Hub",
      deliveryPartner: "Aman Singh",
      amount: "₹18,999",
      payment: "Online",
      status: "Out for Delivery",
      date: "05 Jul 2026",
    },
    {
      id: "#ORD1003",
      customer: "Rahul Kumar",
      seller: "Book World",
      deliveryPartner: "-",
      amount: "₹750",
      payment: "Cash on Delivery",
      status: "Processing",
      date: "04 Jul 2026",
    },
    {
      id: "#ORD1004",
      customer: "Neha Verma",
      seller: "Fashion Point",
      deliveryPartner: "Vikas Verma",
      amount: "₹2,450",
      payment: "Online",
      status: "Cancelled",
      date: "03 Jul 2026",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-700";

      case "Out for Delivery":
        return "bg-blue-100 text-blue-700";

      case "Processing":
        return "bg-yellow-100 text-yellow-700";

      case "Cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Heading */}

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Orders</h1>

        <p className="text-gray-500 mt-1 text-sm md:text-base">
          Monitor all marketplace orders.
        </p>
      </div>

      {/* Search */}

      <div className="bg-white rounded-xl shadow p-4 md:p-5">
        <input
          type="text"
          placeholder="Search by Order ID, Customer or Seller..."
          className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-600"
        />
      </div>

      {/* Orders Table */}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Order ID
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Customer
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Seller
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Delivery Partner
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Amount
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Payment
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Status
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Date
                </th>

                <th className="text-center px-4 md:px-6 py-4 whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 md:px-6 py-4 font-semibold whitespace-nowrap">
                    {order.id}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {order.customer}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {order.seller}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {order.deliveryPartner}
                  </td>

                  <td className="px-4 md:px-6 py-4 font-medium whitespace-nowrap">
                    {order.amount}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {order.payment}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        order.status,
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {order.date}
                  </td>

                  <td className="px-4 md:px-6 py-4">
                    <div className="flex justify-center">
                      <button className="bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded-lg text-sm">
                        View
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
