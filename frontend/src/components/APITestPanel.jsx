// API Test Panel Component
import React, { useState } from 'react';
import { testAllAPIs, displayTestResults } from '../utils/apiTest';
import { testCompleteProjectFlow, displayFlowTestResults } from '../utils/projectFlowTest';

const APITestPanel = () => {
  const [testResults, setTestResults] = useState(null);
  const [flowResults, setFlowResults] = useState(null);
  const [testing, setTesting] = useState(false);
  const [flowTesting, setFlowTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    try {
      const results = await testAllAPIs();
      setTestResults(results);
      displayTestResults(results);
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const runFlowTest = async () => {
    setFlowTesting(true);
    try {
      const results = await testCompleteProjectFlow();
      setFlowResults(results);
      displayFlowTestResults(results);
    } catch (error) {
      console.error('Flow test execution failed:', error);
    } finally {
      setFlowTesting(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      success: '✅',
      error: '❌',
      pending: '⏳',
      skipped: '⏭️',
    };
    return icons[status] || '❓';
  };

  const getStatusColor = (status) => {
    const colors = {
      success: 'text-green-600 bg-green-50',
      error: 'text-red-600 bg-red-50',
      pending: 'text-yellow-600 bg-yellow-50',
      skipped: 'text-gray-600 bg-gray-50',
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">🧪 System Testing</h2>
        <div className="flex space-x-3">
          <button
            onClick={runTests}
            disabled={testing || flowTesting}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              testing || flowTesting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {testing ? '🔄 Testing APIs...' : '🔧 API Tests'}
          </button>
          <button
            onClick={runFlowTest}
            disabled={testing || flowTesting}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              testing || flowTesting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {flowTesting ? '🔄 Testing Flow...' : '🚀 Full Flow Test'}
          </button>
        </div>
      </div>

      {(testResults || flowResults) && (
        <div className="space-y-6">
          {testResults && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">🔧 API Test Results:</h3>
              <div className="space-y-3">
                {Object.entries(testResults).map(([testName, result]) => (
                  <div
                    key={testName}
                    className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getStatusIcon(result.status)}</span>
                        <span className="font-medium capitalize">
                          {testName.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      <span className="text-sm font-mono">{result.status.toUpperCase()}</span>
                    </div>
                    <p className="mt-1 text-sm">{result.message}</p>

                    {result.data && result.status === 'success' && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                          View Data ({Array.isArray(result.data) ? result.data.length : 1} items)
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}

                {/* Summary */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">📊 Summary</h4>
                  {(() => {
                    const successCount = Object.values(testResults).filter(r => r.status === 'success').length;
                    const errorCount = Object.values(testResults).filter(r => r.status === 'error').length;
                    const skippedCount = Object.values(testResults).filter(r => r.status === 'skipped').length;
                    const totalCount = Object.values(testResults).length;
                    const actualTotal = totalCount - skippedCount;

                    return (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{successCount}</div>
                          <div className="text-gray-600">Passed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                          <div className="text-gray-600">Failed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-600">{skippedCount}</div>
                          <div className="text-gray-600">Skipped</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {actualTotal > 0 ? Math.round((successCount / actualTotal) * 100) : 0}%
                          </div>
                          <div className="text-gray-600">Success Rate</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {flowResults && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">🚀 Complete Flow Test Results:</h3>
              <div className="space-y-3">
                {Object.entries(flowResults).map(([testName, result]) => (
                  <div
                    key={testName}
                    className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getStatusIcon(result.status)}</span>
                        <span className="font-medium capitalize">
                          {testName.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      <span className="text-sm font-mono">{result.status.toUpperCase()}</span>
                    </div>
                    <p className="mt-1 text-sm">{result.message}</p>

                    {result.data && result.status === 'success' && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                          View Data
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>

              {/* Flow Test Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">🎯 System Health Summary</h4>
                {(() => {
                  const successCount = Object.values(flowResults).filter(r => r.status === 'success').length;
                  const errorCount = Object.values(flowResults).filter(r => r.status === 'error').length;
                  const warningCount = Object.values(flowResults).filter(r => r.status === 'warning').length;
                  const skippedCount = Object.values(flowResults).filter(r => r.status === 'skipped').length;
                  const totalCount = Object.values(flowResults).length;
                  const healthScore = Math.round(((successCount + warningCount) / totalCount) * 100);

                  return (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{successCount}</div>
                        <div className="text-gray-600">Success</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                        <div className="text-gray-600">Errors</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
                        <div className="text-gray-600">Warnings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">{skippedCount}</div>
                        <div className="text-gray-600">Skipped</div>
                      </div>
                      <div className="text-center">
                        <div
                          className={`text-2xl font-bold ${
                            healthScore >= 80
                              ? 'text-green-600'
                              : healthScore >= 60
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {healthScore}%
                        </div>
                        <div className="text-gray-600">Health Score</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {!testResults && !flowResults && !testing && !flowTesting && (
        <div className="text-center py-8 text-gray-500">
          <p>Choose a test to run:</p>
          <div className="mt-4 space-y-2 text-sm">
            <p><strong>🔧 API Tests:</strong> Test individual API endpoints</p>
            <p><strong>🚀 Full Flow Test:</strong> Test complete prescription workflow</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default APITestPanel;
