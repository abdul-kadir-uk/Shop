// grocery/page.tsx
export default function GroceryDashboard() {
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 lg:mb-8">
        Grocery Dashboard
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow p-4 sm:p-6 ">
          <p className="text-gray-500">Total Products</p>
          <h3 className="text-3xl font-bold mt-2">0</h3>
        </div>

        <div className="bg-white rounded-xl shadow p-4 sm:p-6 ">
          <p className="text-gray-500">Orders</p>
          <h3 className="text-3xl font-bold mt-2">0</h3>
        </div>

        <div className="bg-white rounded-xl shadow p-4 sm:p-6 ">
          <p className="text-gray-500">Revenue</p>
          <h3 className="text-3xl font-bold mt-2">₹0</h3>
        </div>

        <div className="bg-white rounded-xl shadow p-4 sm:p-6 ">
          <p className="text-gray-500">Pending Orders</p>
          <h3 className="text-3xl font-bold mt-2">0</h3>
        </div>
      </div>
    </div>
  );
}
