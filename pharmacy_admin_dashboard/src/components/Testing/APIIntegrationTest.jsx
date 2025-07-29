// API Integration Test Component
// Comprehensive frontend testing of enhanced API endpoints

import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, LinearProgress, Alert, Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import {
  dashboardAPI, userAPI, prescriptionAPI, productAPI, workflowAPI, authAPI
} from '../../services/api';

const APIIntegrationTest = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [testing, setTesting] = useState(false);
  const [currentTest, setCurrentTest] = useState('');

  const testSuites = [
    {
      name: 'Authentication & Authorization',
      tests: [
        { name: 'Get Current User', api: () => authAPI.getCurrentUser() },
        { name: 'Token Refresh', api: () => authAPI.refreshToken() },
      ]
    },
    {
      name: 'Dashboard APIs',
      tests: [
        { name: 'Admin Dashboard', api: () => dashboardAPI.getAdminDashboard() },
        { name: 'Pharmacist Dashboard', api: () => dashboardAPI.getPharmacistDashboard() },
        { name: 'Verifier Dashboard', api: () => dashboardAPI.getVerifierDashboard() },
      ]
    },
    {
      name: 'User Management',
      tests: [
        { name: 'Get Users', api: () => userAPI.getUsers() },
        { name: 'Get User Roles', api: () => userAPI.getRoles() },
        { name: 'Role Statistics', api: () => userAPI.getRoleStatistics() },
      ]
    },
    {
      name: 'Product Management',
      tests: [
        { name: 'Get Products', api: () => productAPI.getProducts() },
        { name: 'Get Compositions', api: () => productAPI.getCompositions() },
        { name: 'Inventory Summary', api: () => productAPI.getInventorySummary() },
        { name: 'Low Stock Alert', api: () => productAPI.getLowStockAlert() },
      ]
    },
    {
      name: 'Prescription Workflow',
      tests: [
        { name: 'Get Prescriptions', api: () => prescriptionAPI.getPrescriptions() },
        { name: 'Verification Queue', api: () => prescriptionAPI.getVerificationQueue() },
        { name: 'Prescription Analytics', api: () => prescriptionAPI.getAnalytics() },
        { name: 'Prescription Medicines', api: () => prescriptionAPI.getPrescriptionMedicines() },
      ]
    },
    {
      name: 'Workflow & Audit',
      tests: [
        { name: 'Workflow Logs', api: () => workflowAPI.getPrescriptionLogs() },
        { name: 'AI Processing Logs', api: () => workflowAPI.getAILogs() },
        { name: 'AI Performance Metrics', api: () => workflowAPI.getAIPerformanceMetrics() },
      ]
    }
  ];

  const runTest = async (testName, apiCall) => {
    setCurrentTest(testName);
    const startTime = Date.now();
    
    try {
      const response = await apiCall();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      return {
        name: testName,
        success: true,
        status: response.status,
        duration,
        data: response.data,
        message: `Success (${duration}ms)`
      };
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      return {
        name: testName,
        success: false,
        status: error.response?.status || 0,
        duration,
        error: error.response?.data || error.message,
        message: `Failed: ${error.response?.status || 'Network Error'} (${duration}ms)`
      };
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setTestResults([]);
    
    const allResults = [];
    
    for (const suite of testSuites) {
      for (const test of suite.tests) {
        const result = await runTest(test.name, test.api);
        result.suite = suite.name;
        allResults.push(result);
        setTestResults([...allResults]);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    setCurrentTest('');
    setTesting(false);
  };

  const getTestSummary = () => {
    const total = testResults.length;
    const passed = testResults.filter(r => r.success).length;
    const failed = total - passed;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    
    return { total, passed, failed, successRate };
  };

  const TestResultsTable = ({ results }) => (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Test</TableCell>
            <TableCell>Suite</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Duration</TableCell>
            <TableCell>Message</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {results.map((result, index) => (
            <TableRow key={index}>
              <TableCell>
                <Box display="flex" alignItems="center">
                  {result.success ? (
                    <CheckIcon color="success" sx={{ mr: 1, fontSize: 16 }} />
                  ) : (
                    <ErrorIcon color="error" sx={{ mr: 1, fontSize: 16 }} />
                  )}
                  {result.name}
                </Box>
              </TableCell>
              <TableCell>{result.suite}</TableCell>
              <TableCell>
                <Chip
                  label={result.status}
                  color={result.success ? 'success' : 'error'}
                  size="small"
                />
              </TableCell>
              <TableCell>{result.duration}ms</TableCell>
              <TableCell>{result.message}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const TestSuiteAccordion = ({ suite, results }) => {
    const suiteResults = results.filter(r => r.suite === suite.name);
    const passed = suiteResults.filter(r => r.success).length;
    const total = suiteResults.length;
    
    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" width="100%">
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {suite.name}
            </Typography>
            {total > 0 && (
              <Chip
                label={`${passed}/${total}`}
                color={passed === total ? 'success' : passed > 0 ? 'warning' : 'error'}
                size="small"
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {suite.tests.map((test, index) => {
              const result = suiteResults.find(r => r.name === test.name);
              return (
                <ListItem key={index}>
                  <ListItemIcon>
                    {result ? (
                      result.success ? (
                        <CheckIcon color="success" />
                      ) : (
                        <ErrorIcon color="error" />
                      )
                    ) : (
                      <PlayIcon color="disabled" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={test.name}
                    secondary={result ? result.message : 'Not tested'}
                  />
                </ListItem>
              );
            })}
          </List>
        </AccordionDetails>
      </Accordion>
    );
  };

  const summary = getTestSummary();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        API Integration Test
      </Typography>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        Comprehensive testing of enhanced API endpoints for the Intelligent Pharmacy Management System.
        Current user: {user?.full_name} ({user?.role})
      </Typography>

      {/* Test Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Test Controls</Typography>
            <Box>
              <Button
                variant="contained"
                startIcon={<PlayIcon />}
                onClick={runAllTests}
                disabled={testing}
                sx={{ mr: 1 }}
              >
                Run All Tests
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => setTestResults([])}
                disabled={testing}
              >
                Clear Results
              </Button>
            </Box>
          </Box>
          
          {testing && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Running: {currentTest}
              </Typography>
              <LinearProgress />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Test Summary */}
      {testResults.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="primary">
                  {summary.total}
                </Typography>
                <Typography variant="body2">Total Tests</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="success.main">
                  {summary.passed}
                </Typography>
                <Typography variant="body2">Passed</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="error.main">
                  {summary.failed}
                </Typography>
                <Typography variant="body2">Failed</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="info.main">
                  {summary.successRate}%
                </Typography>
                <Typography variant="body2">Success Rate</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Test Results by Suite */}
      {testResults.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Test Results by Suite
            </Typography>
            {testSuites.map((suite, index) => (
              <TestSuiteAccordion
                key={index}
                suite={suite}
                results={testResults}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Detailed Results Table */}
      {testResults.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Detailed Test Results
            </Typography>
            <TestResultsTable results={testResults} />
          </CardContent>
        </Card>
      )}

      {/* API Status Alert */}
      {testResults.length > 0 && (
        <Alert
          severity={summary.successRate >= 90 ? 'success' : summary.successRate >= 70 ? 'warning' : 'error'}
          sx={{ mt: 2 }}
        >
          API Integration Status: {summary.successRate >= 90 ? 'Excellent' : summary.successRate >= 70 ? 'Good' : 'Needs Attention'} 
          ({summary.passed}/{summary.total} tests passed)
        </Alert>
      )}
    </Box>
  );
};

export default APIIntegrationTest;
