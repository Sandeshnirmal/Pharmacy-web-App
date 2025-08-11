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
  Eye
} from 'lucide-react';
import { orderAPI, courierAPI } from '../../api/apiService';

const EnhancedOrderFlow = () => {
  const [ordersForReview, setOrdersForReview] = useState([]);
  const [awaitingPrescription, setAwaitingPrescription] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');

  useEffect(() => {
    loadOrdersForReview();
    loadAwaitingPrescriptionOrders();
  }, []);

  const loadOrdersForReview = async () => {
    setLoading(true);
    try {
      const response = await orderAPI.getOrdersForPrescriptionReview();
      setOrdersForReview(response.data.orders || []);
    } catch (err) {
      setError('Failed to load orders for review');
      console.error('Load orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAwaitingPrescriptionOrders = async () => {
    try {
      const response = await orderAPI.getPaidOrdersAwaitingPrescription();
      setAwaitingPrescription(response.data.orders || []);
    } catch (err) {
      console.error('Load awaiting prescription orders error:', err);
    }
  };

  const handleVerifyPrescription = async (orderId, approved) => {
    setLoading(true);
    try {
      const response = await orderAPI.verifyPrescriptionAndConfirmOrder(orderId, {
        approved,
        verification_notes: verificationNotes
      });

      if (response.data.success) {
        // Refresh the lists
        await loadOrdersForReview();
        await loadAwaitingPrescriptionOrders();
        
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
      'verified': { variant: 'success', label: 'Verified' },
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
              {order.delivery_address.address_line_1}, {order.delivery_address.city}
            </p>
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

        {showActions && (
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedOrder(order)}
            >
              Review Prescription
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            Enhanced Order Flow Management
          </CardTitle>
          <p className="text-sm text-gray-600">
            Manage orders with payment-first approach: Payment → Prescription Upload → Verification → Order Confirmation → Courier Pickup
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="review" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="review">
                Prescription Review ({ordersForReview.length})
              </TabsTrigger>
              <TabsTrigger value="awaiting">
                Awaiting Prescription ({awaitingPrescription.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="review" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Orders Awaiting Prescription Verification</h3>
              </div>

              {ordersForReview.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 mb-4" />
                  <p>No orders awaiting prescription verification</p>
                </div>
              ) : (
                <div>
                  {ordersForReview.map(order => renderOrderCard(order, true))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="awaiting" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Paid Orders Awaiting Prescription Upload</h3>
              </div>

              {awaitingPrescription.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="mx-auto h-12 w-12 mb-4" />
                  <p>No paid orders awaiting prescription upload</p>
                </div>
              ) : (
                <div>
                  {awaitingPrescription.map(order => renderOrderCard(order, false))}
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

export default EnhancedOrderFlow;
