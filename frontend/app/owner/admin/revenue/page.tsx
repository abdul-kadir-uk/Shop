export default function RevenuePage() {
  const monthlyRevenue = [
    {
      month: "January",
      orders: 1245,
      revenue: "₹12,45,000",
    },
    {
      month: "February",
      orders: 1398,
      revenue: "₹14,18,000",
    },
    {
      month: "March",
      orders: 1560,
      revenue: "₹16,72,000",
    },
    {
      month: "April",
      orders: 1715,
      revenue: "₹18,54,000",
    },
    {
      month: "May",
      orders: 1820,
      revenue: "₹20,13,000",
    },
    {
      month: "June",
      orders: 1945,
      revenue: "₹22,85,000",
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Heading */}

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Revenue
        </h1>

        <p className="text-gray-500 mt-2 text-sm md:text-base">
          Monitor the financial performance of your marketplace.
        </p>
      </div>

      {/* Summary Cards */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-green-600 rounded-xl text-white p-5 md:p-6 shadow-lg">
          <p className="text-base md:text-lg">Today's Revenue</p>

          <h2 className="text-2xl md:text-3xl font-bold mt-3">₹24,500</h2>
        </div>

        <div className="bg-blue-600 rounded-xl text-white p-5 md:p-6 shadow-lg">
          <p className="text-base md:text-lg">Weekly Revenue</p>

          <h2 className="text-2xl md:text-3xl font-bold mt-3">₹1,72,000</h2>
        </div>

        <div className="bg-purple-600 rounded-xl text-white p-5 md:p-6 shadow-lg">
          <p className="text-base md:text-lg">Monthly Revenue</p>

          <h2 className="text-2xl md:text-3xl font-bold mt-3">₹6,85,000</h2>
        </div>

        <div className="bg-orange-600 rounded-xl text-white p-5 md:p-6 shadow-lg">
          <p className="text-base md:text-lg">Total Revenue</p>

          <h2 className="text-2xl md:text-3xl font-bold mt-3">₹18,42,500</h2>
        </div>
      </div>

      {/* Revenue Chart */}

      <div className="bg-white rounded-xl shadow p-5 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold mb-6">
          Revenue Analytics
        </h2>

        <div className="h-56 md:h-72 border-2 border-dashed rounded-xl flex items-center justify-center text-gray-500 text-base md:text-lg">
          Revenue Chart (Coming Soon)
        </div>
      </div>

      {/* Monthly Revenue */}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-5 md:p-6 border-b">
          <h2 className="text-lg md:text-xl font-semibold">Monthly Revenue</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Month
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Orders
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Revenue
                </th>
              </tr>
            </thead>

            <tbody>
              {monthlyRevenue.map((item) => (
                <tr key={item.month} className="border-t hover:bg-gray-50">
                  <td className="px-4 md:px-6 py-4 font-medium whitespace-nowrap">
                    {item.month}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {item.orders}
                  </td>

                  <td className="px-4 md:px-6 py-4 font-semibold text-green-700 whitespace-nowrap">
                    {item.revenue}
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
