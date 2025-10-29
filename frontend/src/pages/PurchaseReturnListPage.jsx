import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell,
  TableHead, TableRow, CircularProgress, Alert, Button, IconButton,
  TextField, InputAdornment
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiService from '../api/apiService';

const PurchaseReturnListPage = () => {
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchPurchaseReturns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get('/api/inventory/purchase-returns/', {
        params: { search: searchTerm }
      });
      setPurchaseReturns(response.data.results);
    } catch (err) {
      setError('Failed to fetch purchase returns.');
      console.error('Error fetching purchase returns:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchPurchaseReturns();
  }, [fetchPurchaseReturns]);

  const handleEdit = (id) => {
    navigate(`/purchase-returns/${id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this purchase return?')) {
      try {
        await apiService.delete(`/api/inventory/purchase-returns/${id}/`);
        fetchPurchaseReturns(); // Refresh the list
      } catch (err) {
        setError('Failed to delete purchase return.');
        console.error('Error deleting purchase return:', err);
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Purchase Returns
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/purchase-returns/new')}
          >
            Create New Return
          </Button>
        </Box>

        <Box mb={3}>
          <TextField
            fullWidth
            label="Search Purchase Returns (by PO ID, Supplier, Reason)"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading && <CircularProgress sx={{ my: 2 }} />}
        {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

        {!loading && purchaseReturns.length === 0 && !error && (
          <Alert severity="info">No purchase returns found.</Alert>
        )}

        {!loading && purchaseReturns.length > 0 && (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Return ID</TableCell>
                <TableCell>Purchase Order ID</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Return Date</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseReturns.map((pr) => (
                <TableRow key={pr.id}>
                  <TableCell>{pr.id}</TableCell>
                  <TableCell>{pr.purchase_order}</TableCell>
                  <TableCell>{pr.supplier_name}</TableCell>
                  <TableCell>{new Date(pr.return_date).toLocaleDateString()}</TableCell>
                  <TableCell>{parseFloat(pr.total_amount).toFixed(2)}</TableCell>
                  <TableCell>{pr.reason}</TableCell>
                  <TableCell>{pr.status}</TableCell>
                  <TableCell align="center">
                    <IconButton color="info" onClick={() => handleEdit(pr.id)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(pr.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Container>
  );
};

export default PurchaseReturnListPage;
