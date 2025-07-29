// Enhanced Admin Dashboard with Role-Based UI
// Comprehensive dashboard with intelligent prescription workflow and user management

import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Alert,
  Tabs, Tab, LinearProgress, Avatar, Badge
} from '@mui/material';
import {
  Dashboard as DashboardIcon, People as PeopleIcon,
  LocalPharmacy as PharmacyIcon, Assignment as AssignmentIcon,
  Inventory as InventoryIcon, TrendingUp as TrendingUpIcon,
  Warning as WarningIcon, CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon, HourglassEmpty as HourglassIcon,
  Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon,
  Visibility as ViewIcon, VerifiedUser as VerifiedIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardAPI, userAPI, prescriptionAPI, productAPI } from '../../services/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for different sections
  const [users, setUsers] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [products, setProducts] = useState([]);
  const [verificationQueue, setVerificationQueue] = useState([]);

  // Dialog states
  const [userDialog, setUserDialog] = useState({ open: false, user: null, mode: 'create' });
  const [prescriptionDialog, setPrescriptionDialog] = useState({ open: false, prescription: null });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, usersRes, prescriptionsRes, productsRes, queueRes] = await Promise.all([
        dashboardAPI.getAdminDashboard(),
        userAPI.getUsers({ limit: 10 }),
        prescriptionAPI.getPrescriptions({ limit: 10 }),
        productAPI.getProducts({ limit: 10 }),
        prescriptionAPI.getVerificationQueue()
      ]);

      setDashboardData(dashboardRes.data);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.results || []);
      setPrescriptions(Array.isArray(prescriptionsRes.data) ? prescriptionsRes.data : prescriptionsRes.data.results || []);
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : productsRes.data.results || []);
      setVerificationQueue(Array.isArray(queueRes.data) ? queueRes.data : []);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Dashboard Overview Cards
  const DashboardCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {dashboardData?.total_users || 0}
                </Typography>
                <Typography variant="body2">Total Users</Typography>
              </Box>
              <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {dashboardData?.total_prescriptions || 0}
                </Typography>
                <Typography variant="body2">Total Prescriptions</Typography>
              </Box>
              <AssignmentIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {dashboardData?.pending_verifications || 0}
                </Typography>
                <Typography variant="body2">Pending Verifications</Typography>
              </Box>
              <HourglassIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: 'error.main', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {dashboardData?.low_stock_products || 0}
                </Typography>
                <Typography variant="body2">Low Stock Products</Typography>
              </Box>
              <WarningIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // User Management Tab
  const UserManagementTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setUserDialog({ open: true, user: null, mode: 'create' })}
        >
          Add User
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Verification</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ mr: 2 }}>
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {user.full_name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.role_display}
                    color={user.role === 'admin' ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.is_active ? 'Active' : 'Inactive'}
                    color={user.is_active ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.verification_status}
                    color={
                      user.verification_status === 'verified' ? 'success' :
                      user.verification_status === 'rejected' ? 'error' : 'warning'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(user.date_joined).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => setUserDialog({ open: true, user, mode: 'edit' })}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="primary">
                    <ViewIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // Prescription Verification Tab
  const PrescriptionVerificationTab = () => (
    <Box>
      <Typography variant="h6" mb={2}>Prescription Verification Queue</Typography>
      
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                {verificationQueue.filter(p => p.status === 'pending_verification').length}
              </Typography>
              <Typography variant="body2">Pending Verification</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">
                {verificationQueue.filter(p => p.status === 'need_clarification').length}
              </Typography>
              <Typography variant="body2">Need Clarification</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {verificationQueue.filter(p => p.status === 'verified').length}
              </Typography>
              <Typography variant="body2">Verified Today</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main">
                {verificationQueue.filter(p => p.status === 'rejected').length}
              </Typography>
              <Typography variant="body2">Rejected</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Prescription #</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>AI Confidence</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {verificationQueue.map((prescription) => (
              <TableRow key={prescription.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {prescription.prescription_number}
                  </Typography>
                </TableCell>
                <TableCell>{prescription.patient_name}</TableCell>
                <TableCell>{prescription.doctor_name}</TableCell>
                <TableCell>
                  <Chip
                    label={prescription.status_display}
                    color={
                      prescription.status === 'verified' ? 'success' :
                      prescription.status === 'rejected' ? 'error' :
                      prescription.status === 'need_clarification' ? 'warning' : 'info'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <LinearProgress
                      variant="determinate"
                      value={(prescription.ai_confidence_score || 0) * 100}
                      sx={{ width: 60, mr: 1 }}
                    />
                    <Typography variant="caption">
                      {Math.round((prescription.ai_confidence_score || 0) * 100)}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={prescription.priority_score > 80 ? 'High' : prescription.priority_score > 50 ? 'Medium' : 'Low'}
                    color={prescription.priority_score > 80 ? 'error' : prescription.priority_score > 50 ? 'warning' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(prescription.upload_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => setPrescriptionDialog({ open: true, prescription })}
                  >
                    <ViewIcon />
                  </IconButton>
                  {prescription.status === 'pending_verification' && (
                    <IconButton size="small" color="success">
                      <CheckCircleIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <DashboardCards />

      <Card>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Overview" icon={<DashboardIcon />} />
          <Tab label="User Management" icon={<PeopleIcon />} />
          <Tab label="Prescription Verification" icon={<AssignmentIcon />} />
          <Tab label="Inventory" icon={<InventoryIcon />} />
          <Tab label="Analytics" icon={<TrendingUpIcon />} />
        </Tabs>

        <CardContent>
          {activeTab === 0 && <Typography>Overview content...</Typography>}
          {activeTab === 1 && <UserManagementTab />}
          {activeTab === 2 && <PrescriptionVerificationTab />}
          {activeTab === 3 && <Typography>Inventory management...</Typography>}
          {activeTab === 4 && <Typography>Analytics and reports...</Typography>}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminDashboard;
