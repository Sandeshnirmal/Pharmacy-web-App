import React from 'react';

const InvoiceDisplay = ({ invoice, order, user }) => {
  if (!invoice || !order || !user) {
    return <div className="p-6 text-red-600">Invoice data is not available.</div>;
  }

  return (
    <div className="container mx-auto p-6 font-inter bg-white">
      <div className="header text-center mb-8 border-b-2 border-gray-200 pb-5">
        <h1 className="text-4xl font-bold text-blue-700 mb-2">Invoice</h1>
        <p className="text-lg text-gray-700"><strong>Invoice Number:</strong> {invoice.invoice_number}</p>
        <p className="text-lg text-gray-700"><strong>Invoice Date:</strong> {new Date(invoice.invoice_date).toLocaleDateString()}</p>
        <p className="text-lg text-gray-700"><strong>Due Date:</strong> {new Date(invoice.due_date).toLocaleDateString()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="invoice-details bg-gray-50 p-5 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold text-blue-600 mb-3">Order Details</h2>
          <p><strong>Order Number:</strong> ORD{order.id.toString().padStart(6, '0')}</p>
          <p><strong>Order Date:</strong> {new Date(order.order_date).toLocaleString()}</p>
          <p><strong>Status:</strong> {order.order_status}</p>
          <p><strong>Payment Method:</strong> {invoice.payment?.method || 'N/A'}</p>
          <p><strong>Payment Status:</strong> {invoice.payment?.status || 'N/A'}</p>
        </div>

        <div className="billing-shipping bg-gray-50 p-5 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold text-blue-600 mb-3">Customer Information</h2>
          <p><strong>Name:</strong> {user.full_name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Shipping Address:</strong> {order.address_full || 'N/A'}</p>
          {/* Assuming billing address is same as shipping for simplicity, or add if available in order object */}
          <p><strong>Billing Address:</strong> {order.address_full || 'N/A'}</p>
        </div>
      </div>

      <div className="order-items mb-8 bg-gray-50 p-5 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold text-blue-600 mb-3">Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase">Product</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase">Quantity</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase">Price</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items && invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200 last:border-b-0">
                  <td className="py-3 px-4 text-sm text-gray-800">{item.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{item.quantity}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">₹{parseFloat(item.unit_price).toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">₹{parseFloat(item.total_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="totals bg-gray-50 p-5 rounded-lg shadow-sm mb-8">
        <table className="min-w-full">
          <tbody>
            <tr>
              <td className="py-2 px-4 text-right text-lg text-gray-700">Subtotal:</td>
              <td className="py-2 px-4 text-right text-lg font-semibold text-gray-900">₹{parseFloat(invoice.financial.subtotal).toFixed(2)}</td>
            </tr>
            <tr>
              <td className="py-2 px-4 text-right text-lg text-gray-700">Tax:</td>
              <td className="py-2 px-4 text-right text-lg font-semibold text-gray-900">₹{parseFloat(invoice.financial.tax_amount).toFixed(2)}</td>
            </tr>
            <tr className="total-row bg-gray-100">
              <td className="py-3 px-4 text-right text-xl font-bold text-gray-800">Total Amount:</td>
              <td className="py-3 px-4 text-right text-xl font-bold text-gray-800">₹{parseFloat(invoice.financial.total_amount).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="footer text-center text-gray-600 text-sm mt-10 border-t border-gray-200 pt-5">
        <p>Thank you for your business!</p>
        <p>Pharmacy Web App</p>
      </div>
    </div>
  );
};

export default InvoiceDisplay;
