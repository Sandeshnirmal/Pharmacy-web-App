import React from 'react';

function DashboardMainContent() {
  const dashboardStats = [
    { title: 'Total Orders', value: '1,234' },
    { title: 'Average Order Value', value: '$56.78' },
    { title: 'Active Users', value: '456' },
  ];

  const recentOrders = [
    { id: '#12345', customer: 'Sophia Clark', date: '2024-01-15', status: 'Delivered', total: '$65.00' },
    { id: '#12346', customer: 'Liam Carter', date: '2024-01-16', status: 'Shipped', total: '$42.50' },
    { id: '#12347', customer: 'Olivia Bennett', date: '2024-01-17', status: 'Processing', total: '$89.99' },
    { id: '#12348', customer: 'Noah Foster', date: '2024-01-18', status: 'Cancelled', total: '$23.75' },
    { id: '#12349', customer: 'Ava Harper', date: '2024-01-19', status: 'Delivered', total: '$78.20' },
  ];

  const getStatusClass = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800'; // Slightly brighter green
      case 'Shipped':
        return 'bg-sky-100 text-sky-800';      // Brighter blue
      case 'Processing':
        return 'bg-amber-100 text-amber-800';   // Warmer yellow
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <main className="flex-1 p-4 sm:p-6 md:p-8 bg-gray-50"> {/* Changed main background to a softer gray */}
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Dashboard</h1>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {dashboardStats.map((stat) => (
          <div key={stat.title} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-lg font-medium text-gray-600 mb-2">{stat.title}</h3>
            <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-blue-50 border-b border-gray-200 text-blue-700 text-left text-sm uppercase font-semibold"> {/* Accent blue for table header */}
                <th className="px-5 py-3 rounded-tl-lg">Order ID</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 rounded-tr-lg">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, index) => (
                <tr key={order.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-200 last:border-b-0`}>
                  <td className="px-5 py-4 text-sm text-gray-900">{order.id}</td>
                  <td className="px-5 py-4 text-sm text-gray-900">{order.customer}</td>
                  <td className="px-5 py-4 text-sm text-gray-900">{order.date}</td>
                  <td className="px-5 py-4 text-sm">
                    <span
                      className={`px-3 py-1 font-semibold leading-tight rounded-full ${getStatusClass(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-900">{order.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

export default DashboardMainContent;
