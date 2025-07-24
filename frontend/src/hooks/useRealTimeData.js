import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';

const useRealTimeData = (endpoint, interval = 30000, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

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
      const response = await axiosInstance.get(endpoint);
      
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
  }, [endpoint, enabled, transformData, onError, onSuccess]);

  useEffect(() => {
    fetchData();

    if (enabled && interval > 0) {
      const intervalId = setInterval(fetchData, interval);
      return () => clearInterval(intervalId);
    }
  }, [fetchData, enabled, interval]);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch
  };
};

export default useRealTimeData; 