import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Button, Paper, Grid, TextField,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton,
  CircularProgress, Alert, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import apiService from '../api/apiService';
import ModalSearchSelect from '../components/ModalSearchSelect'; // Assuming this component exists

const PurchaseReturnForm = () => {
  const { id } = useParams(); // For editing an existing return, if needed
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [returnDate, setReturnDate] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [returnItems, setReturnItems] = useState([]); // Items being returned

  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
  const [selectedPurchaseOrderItem, setSelectedPurchaseOrderItem] = useState(null); // To link return item to PO item

  useEffect(() => {
    if (id) {
      // Fetch existing purchase return for editing
      // This part can be implemented later if editing is required
      // For now, focus on creation
    }
  }, [id]);

  const fetchPurchaseOrder = useCallback(async (poId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get(`/inventory/purchase-orders/${poId}/`);
      setPurchaseOrder(response.data);
      // Initialize return items based on purchase order items
      setReturnItems(response.data.items.map(item => ({
        purchase_order_item: item.id,
        product: item.product,
        product_name: item.product_details.name,
        quantity: 0, // Default to 0, user will input
        unit_price: item.unit_price,
        max_return_quantity: item.quantity - item.returned_quantity, // Max quantity that can be returned
      })));
    } catch (err) {
      setError('Failed to fetch purchase order.');
      console.error('Error fetching purchase order:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePurchaseOrderSelect = (selectedPo) => {
    if (selectedPo) {
      fetchPurchaseOrder(selectedPo.id);
    } else {
      setPurchaseOrder(null);
      setReturnItems([]);
    }
  };

  const handleQuantityChange = (index, value) => {
    const newReturnItems = [...returnItems];
    const item = newReturnItems[index];
    const parsedValue = parseInt(value, 10);

    if (!isNaN(parsedValue) && parsedValue >= 0 && parsedValue <= item.max_return_quantity) {
      item.quantity = parsedValue;
    } else if (value === '') {
      item.quantity = ''; // Allow empty input temporarily
    }
    setReturnItems(newReturnItems);
  };

  const handleRemoveItem = (index) => {
    const newReturnItems = returnItems.filter((_, i) => i !== index);
    setReturnItems(newReturnItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!purchaseOrder) {
      setError('Please select a Purchase Order.');
      setLoading(false);
      return;
    }

    const itemsToReturn = returnItems.filter(item => item.quantity > 0);

    if (itemsToReturn.length === 0) {
      setError('Please add at least one item to return with a quantity greater than 0.');
      setLoading(false);
      return;
    }

    const payload = {
      purchase_order: purchaseOrder.id,
      return_date: returnDate || new Date().toISOString().split('T')[0],
      reason,
      notes,
      items: itemsToReturn.map(item => ({
        purchase_order_item: item.purchase_order_item,
        product: item.product,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    };

    try {
      const response = await apiService.post('/inventory/purchase-returns/', payload);
      setSuccess('Purchase return created successfully!');
      console.log('Purchase Return Response:', response.data);
      // Optionally navigate or reset form
      setPurchaseOrder(null);
      setReturnDate('');
      setReason('');
      setNotes('');
      setReturnItems([]);
    } catch (err) {
      setError('Failed to create purchase return.');
      console.error('Error creating purchase return:', err.response ? err.response.data : err);
    } finally {
      setLoading(false);
    }
  };

  const searchPurchaseOrders = useCallback(async (query) => {
    try {
      const response = await apiService.get(`/inventory/purchase-orders/?search=${query}`);
      return response.data.results.map(po => ({
        id: po.id,
        name: `PO #${po.id} - ${po.supplier_name} - ${po.invoice_number || 'N/A'}`,
        original: po,
      }));
    } catch (error) {
      console.error('Error searching purchase orders:', error);
      return [];
    }
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {id ? 'Edit Purchase Return' : 'Create Purchase Return'}
        </Typography>

        {loading && <CircularProgress sx={{ my: 2 }} />}
        {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ my: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ModalSearchSelect
                label="Select Purchase Order"
                searchFunction={searchPurchaseOrders}
                onSelect={handlePurchaseOrderSelect}
                selectedItem={purchaseOrder ? { id: purchaseOrder.id, name: `PO #${purchaseOrder.id} - ${purchaseOrder.supplier_name} - ${purchaseOrder.invoice_number || 'N/A'}` } : null}
                clearOnSelect={false}
                // You might want to disable this if a PO is already selected and you're editing
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Return Date"
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason for Return"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                multiline
                rows={2}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>

          {purchaseOrder && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom>
                Items to Return from PO #{purchaseOrder.id}
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Max Return Qty</TableCell>
                    <TableCell align="right">Return Quantity</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {returnItems.map((item, index) => (
                    <TableRow key={item.purchase_order_item}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell align="right">{item.unit_price}</TableCell>
                      <TableCell align="right">{item.max_return_quantity}</TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          inputProps={{ min: 0, max: item.max_return_quantity }}
                          size="small"
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton onClick={() => handleRemoveItem(index)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {returnItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No items available for return from this Purchase Order.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Purchase Return'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default PurchaseReturnForm;
