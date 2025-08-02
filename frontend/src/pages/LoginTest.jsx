import React, { useState } from 'react';

const LoginTest = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult('Testing...');

    try {
      // Test 1: Direct fetch without axios
      const response = await fetch('http://127.0.0.1:8000/user/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@pharmacy.com',
          password: 'admin123'
        })
      });

      const data = await response.json();
      
      setResult(`
Status: ${response.status}
Response: ${JSON.stringify(data, null, 2)}
      `);

    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testLoginWithCredentials = async () => {
    setLoading(true);
    setResult('Testing with credentials...');

    try {
      // Test 2: With credentials
      const response = await fetch('http://127.0.0.1:8000/user/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: 'admin@pharmacy.com',
          password: 'admin123'
        })
      });

      const data = await response.json();
      
      setResult(`
Status: ${response.status}
Response: ${JSON.stringify(data, null, 2)}
      `);

    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testLoginAxios = async () => {
    setLoading(true);
    setResult('Testing with axios...');

    try {
      // Test 3: With axios but without interceptors
      const axios = require('axios');
      const response = await axios.post('http://127.0.0.1:8000/user/login/', {
        email: 'admin@pharmacy.com',
        password: 'admin123'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        withCredentials: false // Try without credentials first
      });

      setResult(`
Status: ${response.status}
Response: ${JSON.stringify(response.data, null, 2)}
      `);

    } catch (error) {
      setResult(`
Error: ${error.message}
Status: ${error.response?.status}
Response: ${JSON.stringify(error.response?.data, null, 2)}
      `);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Login Debug Test</h1>
      
      <div className="space-y-4 mb-8">
        <button 
          onClick={testLogin}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
        >
          Test 1: Direct Fetch
        </button>
        
        <button 
          onClick={testLoginWithCredentials}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded mr-4"
        >
          Test 2: Fetch with Credentials
        </button>
        
        <button 
          onClick={testLoginAxios}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Test 3: Axios without Credentials
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Result:</h2>
        <pre className="whitespace-pre-wrap text-sm">
          {loading ? 'Loading...' : result}
        </pre>
      </div>

      <div className="mt-8 bg-yellow-100 p-4 rounded">
        <h3 className="font-bold">Expected Credentials:</h3>
        <p>Email: admin@pharmacy.com</p>
        <p>Password: admin123</p>
      </div>
    </div>
  );
};

export default LoginTest;
