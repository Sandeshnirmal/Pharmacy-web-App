// CustomersTable.jsx
import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom'; // Uncomment if you want to use react-router-dom for navigation

const CustomersTable = () => {
  // const navigate = useNavigate(); // Initialize useNavigate hook

  const initialCustomersData = [
    { id: '#CUST001', name: 'Alice Wonderland', email: 'alice@example.com', phone: '555-1001', totalOrders: 15, lastOrder: '2024-06-20' },
    { id: '#CUST002', name: 'Bob The Builder', email: 'bob@example.com', phone: '555-1002', totalOrders: 8, lastOrder: '2024-05-10' },
    { id: '#CUST003', name: 'Charlie Chaplin', email: 'charlie@example.com', phone: '555-1003', totalOrders: 22, lastOrder: '2024-06-28' },
    { id: '#CUST004', name: 'Diana Prince', email: 'diana@example.com', phone: '555-1004', totalOrders: 5, lastOrder: '2024-04-15' },
    { id: '#CUST005', name: 'Eve Harrington', email: 'eve@example.com', phone: '555-1005', totalOrders: 12, lastOrder: '2024-06-01' },
    { id: '#CUST006', name: 'Frank Sinatra', email: 'frank@example.com', phone: '555-1006', totalOrders: 30, lastOrder: '2024-06-25' },
    { id: '#CUST007', name: 'Grace Kelly', email: 'grace@example.com', phone: '555-1007', totalOrders: 7, lastOrder: '2024-05-22' },
    { id: '#CUST008', name: 'Harry Potter', email: 'harry@example.com', phone: '555-1008', totalOrders: 18, lastOrder: '2024-06-10' },
    { id: '#CUST009', name: 'Ivy League', email: 'ivy@example.com', phone: '555-1009', totalOrders: 10, lastOrder: '2024-04-30' },
    { id: '#CUST010', name: 'Jack Sparrow', email: 'jack@example.com', phone: '555-1010', totalOrders: 25, lastOrder: '2024-06-18' },
  ];

  const [customers, setCustomers] = useState(initialCustomersData);
  const [filteredCustomers, setFilteredCustomers] = useState(initialCustomersData);
  const [searchTerm, setSearchTerm] = useState('');

  // Effect to filter customers whenever searchTerm or customers data changes
  useEffect(() => {
    const query = searchTerm.toLowerCase();
    const newFilteredCustomers = customers.filter((customer) => {
      return (
        customer.id.toLowerCase().includes(query) ||
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query)
      );
    });
    setFilteredCustomers(newFilteredCustomers);
  }, [searchTerm, customers]);

  /**
   * Handles the click event for a "View Details" button.
   * @param {object} customer - The customer object for the clicked row.
   */
  const handleViewDetails = (customer) => {
    console.log('Viewing details for Customer ID:', customer.id);
    // In a real app, you would navigate to a detailed customer profile page:
    // navigate(`/customer-details/${customer.id}`);
    // Replaced alert() with console.log() as alert() is generally not recommended for better UX
    console.log(`Details for ${customer.name} (${customer.id})`);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter bg-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Customers</h1>
        <p className="text-lg text-gray-600 mt-2">Manage your customer base and view their order history.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search customers by ID, name, email, or phone..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white p-6 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-blue-50 border-b border-gray-200 text-blue-700 text-left text-sm uppercase font-semibold">
                <th className="px-5 py-3 rounded-tl-lg">Customer ID</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Total Orders</th>
                <th className="px-5 py-3">Last Order</th>
                <th className="px-5 py-3 rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-600 text-lg">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => (
                  <tr key={customer.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-200 last:border-b-0 hover:bg-gray-100 transition-colors duration-150`}>
                    <td className="px-5 py-4 text-sm font-medium text-gray-900">{customer.id}</td>
                    <td className="px-5 py-4 text-sm text-blue-700 hover:underline cursor-pointer">{customer.name}</td>
                    <td className="px-5 py-4 text-sm text-gray-900">{customer.email}</td>
                    <td className="px-5 py-4 text-sm text-gray-900">{customer.phone}</td>
                    <td className="px-5 py-4 text-sm text-gray-900">{customer.totalOrders}</td>
                    <td className="px-5 py-4 text-sm text-gray-900">{customer.lastOrder}</td>
                    <td className="px-5 py-4 text-sm">
                      <button
                        onClick={() => handleViewDetails(customer)}
                        className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                                   px-3 py-1.5 rounded-md font-medium transition duration-150 ease-in-out border border-blue-200 hover:border-blue-400"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomersTable;
