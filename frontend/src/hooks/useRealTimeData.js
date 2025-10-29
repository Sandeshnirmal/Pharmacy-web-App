import { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';

const useRealTimeData = (fetchFunction, interval = 30000, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const { 
    enabled = true, 
    transformData = null,
    onError = null,
    onSuccess = null 
  } = options;

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setError(null);
      setLoading(true); // Set loading to true before fetching
      const response = await fetchFunction(); // Use the provided fetchFunction
      
      let processedData = response.data;
      if (transformData) {
        processedData = transformData(response.data);
      }

      setData(processedData);
      setLastUpdated(new Date());
      
      if (onSuccess) {
        onSuccess(processedData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, enabled, transformData, onError, onSuccess]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (enabled && interval > 0) {
      intervalRef.current = setInterval(fetchData, interval);
    }
  }, [fetchData, enabled, interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    fetchData(); // Initial fetch

    if (enabled && interval > 0) {
      startPolling();
    }

    return () => stopPolling();
  }, [fetchData, enabled, interval, startPolling, stopPolling]);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch,
    startPolling,
    stopPolling
  };
};

export default useRealTimeData;
