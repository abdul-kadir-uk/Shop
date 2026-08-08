"use client";

export default function GroceryOrdersPage() {
  // Later replace with API data
  const orders: any[] = [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-gray-500 mt-1">
          View and manage your customer orders.
        </p>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow border overflow-x-auto">
        {orders.length === 0 ? (
          <div className="py-20 text-center">
            <h2 className="text-2xl font-semibold">No Orders Yet</h2>

            <p className="text-gray-500 mt-2">
              Orders will appear here once customers start purchasing your
              products.
            </p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-5 py-3 text-left">Order ID</th>
                <th className="px-5 py-3 text-left">Customer</th>
                <th className="px-5 py-3 text-left">Products</th>
                <th className="px-5 py-3 text-left">Total</th>
                <th className="px-5 py-3 text-left">Payment</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-t">
                  <td className="px-5 py-4">{order.orderId}</td>

                  <td className="px-5 py-4">{order.customerName}</td>

                  <td className="px-5 py-4">{order.totalItems} Items</td>

                  <td className="px-5 py-4">₹{order.totalAmount}</td>

                  <td className="px-5 py-4">{order.paymentMethod}</td>

                  <td className="px-5 py-4">
                    <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm">
                      {order.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
