import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

import { fetchSalesData, fetchOrdersData, fetchPrescriptionsData, fetchUsersData } from '../api/reportService'; // Will create this service

const ReportsAnalytics = () => {
  const [reportType, setReportType] = useState('sales'); // 'sales', 'orders', 'prescriptions', 'users'
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [prescriptionStatus, setPrescriptionStatus] = useState('');

  useEffect(() => {
    // if (isAuthenticated) { // Removed isAuthenticated check as useAuth is not found
      fetchReportData();
    // }
  }, [reportType]); // Re-fetch when reportType changes

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      const filters = {
        start_date: startDate,
        end_date: endDate,
        status: reportType === 'orders' ? orderStatus : prescriptionStatus, // Apply status filter based on report type
      };

      // Clean up empty filters
      Object.keys(filters).forEach(key => filters[key] === '' && delete filters[key]);

      switch (reportType) {
        case 'sales':
          data = await fetchSalesData(filters);
          break;
        case 'orders':
          data = await fetchOrdersData(filters);
          break;
        case 'prescriptions':
          data = await fetchPrescriptionsData(filters);
          break;
        case 'users':
          data = await fetchUsersData(filters); // User reports might have different filters
          break;
        default:
          data = [];
      }
      setReportData(data);
    } catch (err) {
      setError('Failed to fetch report data.');
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchReportData();
  };

  const handleReportTypeChange = (event, newValue) => {
    setReportType(newValue);
    setStartDate('');
    setEndDate('');
    setOrderStatus('');
    setPrescriptionStatus('');
  };

  // if (!isAuthenticated) { // Removed isAuthenticated check as useAuth is not found
  //   return (
  //     <Box sx={{ p: 4, textAlign: 'center' }}>
  //       <Alert severity="warning'>Please log in to view reports.</Alert>
  //     </Box>
  //   );
  // }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Reporting and Analysis
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={reportType} onChange={handleReportTypeChange} centered>
          <Tab label="Sales Reports" value="sales" />
          <Tab label="Order Reports" value="orders" />
          <Tab label="Prescription Reports" value="prescriptions" />
          <Tab label="User Reports" value="users" />
        </Tabs>
      </Box>

      {/* Filter Section */}
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Filters
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          {reportType === 'orders' && (
            <TextField
              select
              label="Order Status"
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              fullWidth
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="shipped">Shipped</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
          )}

          {reportType === 'prescriptions' && (
            <TextField
              select
              label="Prescription Status"
              value={prescriptionStatus}
              onChange={(e) => setPrescriptionStatus(e.target.value)}
              fullWidth
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="verified">Verified</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="filled">Filled</MenuItem>
            </TextField>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleApplyFilters}
          >
            Apply Filters
          </Button>
        </Box>
      </Paper>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      {!loading && !error && reportData.length === 0 && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Alert severity="info">No data available for this report type with the selected filters.</Alert>
        </Box>
      )}

      {!loading && !error && reportData.length > 0 && (
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ textTransform: 'capitalize' }}>
            {reportType} Data
          </Typography>
          {/* Render report data based on type */}
          {reportType === 'sales' && <SalesTable data={reportData} />}
          {reportType === 'orders' && <OrdersTable data={reportData} />}
          {reportType === 'prescriptions' && <PrescriptionsTable data={reportData} />}
          {reportType === 'users' && <UsersTable data={reportData} />}
        </Paper>
      )}
    </Box>
  );
};

// Placeholder Tables (will be implemented in detail later)
const SalesTable = ({ data }) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Date</TableCell>
          <TableCell>Product</TableCell>
          <TableCell>Quantity</TableCell>
          <TableCell>Total Price</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((item, index) => (
          <TableRow key={index}>
            <TableCell>{item.date}</TableCell>
            <TableCell>{item.product_name}</TableCell>
            <TableCell>{item.quantity}</TableCell>
            <TableCell>{item.total_price}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

const OrdersTable = ({ data }) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Order ID</TableCell>
          <TableCell>Customer</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Total Amount</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((item, index) => (
          <TableRow key={index}>
            <TableCell>{item.order_id}</TableCell>
            <TableCell>{item.customer_name}</TableCell>
            <TableCell>{item.status}</TableCell>
            <TableCell>{item.total_amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

const PrescriptionsTable = ({ data }) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Prescription ID</TableCell>
          <TableCell>User</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Upload Date</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((item, index) => (
          <TableRow key={index}>
            <TableCell>{item.prescription_id}</TableCell>
            <TableCell>{item.user_name}</TableCell>
            <TableCell>{item.status}</TableCell>
            <TableCell>{item.upload_date}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

const UsersTable = ({ data }) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>User ID</TableCell>
          <TableCell>Username</TableCell>
          <TableCell>Email</TableCell>
          <TableCell>Registered Date</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((item, index) => (
          <TableRow key={index}>
            <TableCell>{item.user_id}</TableCell>
            <TableCell>{item.username}</TableCell>
            <TableCell>{item.email}</TableCell>
            <TableCell>{item.registered_date}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export default ReportsAnalytics;
