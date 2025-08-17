import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { 
  Package, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Truck,
  AlertCircle,
  Eye,
  Receipt,
  Download
} from 'lucide-react';
import { orderAPI } from '../../api/apiService';

const NewOrderManagement = () => {
  const [verificationQueue, setVerificationQueue] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');

  useEffect(() => {
    loadVerificationQueue();
    loadUserOrders();
  }, []);

  const loadVerificationQueue = async () => {
    setLoading(true);
    try {
      const response = await orderAPI.getVerificationQueue();
      setVerificationQueue(response.data.orders || []);
    } catch (err) {
      setError('Failed to load verification queue');
      console.error('Load verification queue error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserOrders = async () => {
    try {
      const response = await orderAPI.getUserOrders();
      setUserOrders(response.data.orders || []);
    } catch (err) {
      console.error('Load user orders error:', err);
    }
  };

  const handleVerifyPrescription = async (orderId, approved) => {
    setLoading(true);
    try {
      const response = await orderAPI.verifyPrescription(orderId, {
        approved,
        verification_notes: verificationNotes
      });

      if (response.data.success) {
        await loadVerificationQueue();
        await loadUserOrders();
        
        setSelectedOrder(null);
        setVerificationNotes('');
        setError('');
      } else {
        setError(response.data.error || 'Failed to verify prescription');
      }
    } catch (err) {
      setError('Network error occurred while verifying prescription');
      console.error('Verify prescription error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'payment_completed': { variant: 'secondary', label: 'Payment Completed' },
      'prescription_uploaded': { variant: 'default', label: 'Prescription Uploaded' },
      'awaiting_prescription': { variant: 'destructive', label: 'Awaiting Prescription' },
      'confirmed': { variant: 'success', label: 'Confirmed' },
      'prescription_rejected': { variant: 'destructive', label: 'Prescription Rejected' },
      'processing': { variant: 'default', label: 'Processing' },
      'shipped': { variant: 'default', label: 'Shipped' },
      'delivered': { variant: 'success', label: 'Delivered' },
    };

    const config = statusConfig[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const renderOrderCard = (order, showActions = false) => (
    <Card key={order.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-semibold">Order #{order.order_number}</h4>
            <p className="text-sm text-gray-600">
              Customer: {order.user?.username || order.user?.email}
            </p>
            <p className="text-sm text-gray-600">
              Amount: ₹{order.total_amount}
            </p>
            <p className="text-sm text-gray-600">
              Payment: {order.payment_status}
            </p>
          </div>
          <div className="text-right">
            {getStatusBadge(order.status)}
            <p className="text-sm text-gray-500 mt-1">
              {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {order.delivery_address && (
          <div className="mb-3">
            <p className="text-sm font-medium">Delivery Address:</p>
            <p className="text-sm text-gray-600">
              {order.delivery_address.name}<br />
              {order.delivery_address.address_line_1}<br />
              {order.delivery_address.city}, {order.delivery_address.state} - {order.delivery_address.pincode}<br />
              Phone: {order.delivery_address.phone}
            </p>
          </div>
        )}

        {order.items && order.items.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-medium">Items ({order.items.length}):</p>
            <div className="text-sm text-gray-600">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>{item.product_name} x {item.quantity}</span>
                  <span>₹{item.total_price}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {order.prescription && (
          <div className="mb-3">
            <p className="text-sm font-medium">Prescription:</p>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="text-sm">Prescription #{order.prescription.id}</span>
              {order.prescription.image_url && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(order.prescription.image_url, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              )}
            </div>
          </div>
        )}

        {order.tracking_number && (
          <div className="mb-3">
            <p className="text-sm font-medium">Tracking:</p>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span className="text-sm">{order.tracking_number}</span>
            </div>
          </div>
        )}

        {showActions && (
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedOrder(order)}
            >
              Review Prescription
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCreateInvoice(order.id)}
            >
              <Receipt className="h-4 w-4 mr-1" />
              Create Invoice
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const handleCreateInvoice = async (orderId) => {
    try {
      const response = await fetch(`/api/order/invoices/create/${orderId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Invoice created successfully!');
      } else {
        alert('Failed to create invoice');
      }
    } catch (err) {
      console.error('Create invoice error:', err);
      alert('Error creating invoice');
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      const response = await fetch(`/api/order/invoices/${orderId}/download/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `invoice_${orderId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to download invoice');
      }
    } catch (err) {
      console.error('Download invoice error:', err);
      alert('Error downloading invoice');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            New Order Flow Management
          </CardTitle>
          <p className="text-sm text-gray-600">
            Cart → Prescription Upload → Payment (Razorpay only) → Verification → Courier Shipment
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="verification" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="verification">
                Prescription Verification ({verificationQueue.length})
              </TabsTrigger>
              <TabsTrigger value="orders">
                All Orders ({userOrders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="verification" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Orders Awaiting Prescription Verification</h3>
              </div>

              {verificationQueue.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 mb-4" />
                  <p>No orders awaiting prescription verification</p>
                </div>
              ) : (
                <div>
                  {verificationQueue.map(order => renderOrderCard(order, true))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5" />
                <h3 className="text-lg font-semibold">All Orders</h3>
              </div>

              {userOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="mx-auto h-12 w-12 mb-4" />
                  <p>No orders found</p>
                </div>
              ) : (
                <div>
                  {userOrders.map(order => (
                    <Card key={order.id} className="mb-4">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">Order #{order.order_number}</h4>
                            <p className="text-sm text-gray-600">Amount: ₹{order.total_amount}</p>
                            <p className="text-sm text-gray-600">Payment: {order.payment_status}</p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(order.status)}
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateInvoice(order.id)}
                          >
                            <Receipt className="h-4 w-4 mr-1" />
                            Invoice
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadInvoice(order.id)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prescription Verification Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Verify Prescription - Order #{selectedOrder.order_number}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p><strong>Customer:</strong> {selectedOrder.user?.email}</p>
                <p><strong>Amount:</strong> ₹{selectedOrder.total_amount}</p>
                <p><strong>Status:</strong> {getStatusBadge(selectedOrder.status)}</p>
              </div>

              {selectedOrder.prescription?.image_url && (
                <div>
                  <p className="font-medium mb-2">Prescription Image:</p>
                  <img 
                    src={selectedOrder.prescription.image_url} 
                    alt="Prescription"
                    className="max-w-full h-auto border rounded"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Verification Notes
                </label>
                <Textarea
                  placeholder="Enter verification notes..."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleVerifyPrescription(selectedOrder.id, true)}
                  disabled={loading}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {loading ? 'Approving...' : 'Approve & Confirm Order'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleVerifyPrescription(selectedOrder.id, false)}
                  disabled={loading}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {loading ? 'Rejecting...' : 'Reject Prescription'}
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setSelectedOrder(null);
                  setVerificationNotes('');
                }}
                className="w-full"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NewOrderManagement;
