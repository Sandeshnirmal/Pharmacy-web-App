import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Search, FileText, History, AlertCircle, CheckCircle } from 'lucide-react';
import { prescriptionAPI } from '../../api/apiService';

const PrescriptionScanner = () => {
  const [prescriptionText, setPrescriptionText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('name');
  const [scanResults, setScanResults] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScanPrescription = async () => {
    if (!prescriptionText.trim()) {
      setError('Please enter prescription text');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await prescriptionAPI.scanPrescription(prescriptionText);
      setScanResults(response.data);
      
      if (response.data.success) {
        setError('');
      } else {
        setError(response.data.error || 'Failed to scan prescription');
      }
    } catch (err) {
      setError('Network error occurred while scanning prescription');
      console.error('Scan error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchMedicines = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter search query');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await prescriptionAPI.searchMedicines(searchQuery, searchType);
      setSearchResults(response.data);
      
      if (response.data.success) {
        setError('');
      } else {
        setError(response.data.error || 'Failed to search medicines');
      }
    } catch (err) {
      setError('Network error occurred while searching medicines');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadScanHistory = async () => {
    setLoading(true);
    try {
      const response = await prescriptionAPI.getScanHistory();
      setScanHistory(response.data.scans || []);
    } catch (err) {
      setError('Failed to load scan history');
      console.error('History error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderMedicineSuggestions = (suggestions) => {
    if (!suggestions || suggestions.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="mx-auto h-12 w-12 mb-4" />
          <p>No medicine suggestions found</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-lg">{suggestion.name}</h4>
                  <p className="text-sm text-gray-600">{suggestion.brand_name}</p>
                </div>
                <div className="text-right">
                  <Badge variant={suggestion.match_type === 'exact_name' ? 'default' : 'secondary'}>
                    {suggestion.match_type.replace('_', ' ')}
                  </Badge>
                  <p className="text-sm text-gray-500 mt-1">
                    Score: {(suggestion.confidence_score * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-sm"><strong>Generic:</strong> {suggestion.generic_name}</p>
                  <p className="text-sm"><strong>Manufacturer:</strong> {suggestion.manufacturer}</p>
                  <p className="text-sm"><strong>Category:</strong> {suggestion.category}</p>
                </div>
                <div>
                  <p className="text-sm"><strong>Price:</strong> ₹{suggestion.price}</p>
                  <p className="text-sm"><strong>MRP:</strong> ₹{suggestion.mrp}</p>
                  <p className="text-sm">
                    <strong>Stock:</strong> {suggestion.stock_quantity} units
                  </p>
                </div>
              </div>

              {suggestion.compositions && suggestion.compositions.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">Compositions:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.compositions.map((comp, compIndex) => (
                      <Badge 
                        key={compIndex} 
                        variant={comp.is_primary ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {comp.name} {comp.strength}{comp.unit}
                        {comp.is_primary && ' (Primary)'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {suggestion.is_prescription_required && (
                <div className="mt-2">
                  <Badge variant="destructive" className="text-xs">
                    Prescription Required
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Prescription Scanner & Medicine Search
          </CardTitle>
          <p className="text-sm text-gray-600">
            Scan prescriptions or search for medicines by name or composition. 
            This is for search purposes only and does not create orders.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="scan" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scan">Scan Prescription</TabsTrigger>
              <TabsTrigger value="search">Search Medicines</TabsTrigger>
              <TabsTrigger value="history" onClick={loadScanHistory}>Scan History</TabsTrigger>
            </TabsList>

            <TabsContent value="scan" className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Prescription Text
                </label>
                <Textarea
                  placeholder="Enter prescription text here... e.g., 'Paracetamol 650mg twice daily, Augmentin 625mg thrice daily'"
                  value={prescriptionText}
                  onChange={(e) => setPrescriptionText(e.target.value)}
                  rows={6}
                  className="w-full"
                />
              </div>
              
              <Button 
                onClick={handleScanPrescription} 
                disabled={loading || !prescriptionText.trim()}
                className="w-full"
              >
                {loading ? 'Scanning...' : 'Scan Prescription'}
              </Button>

              {scanResults && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h3 className="text-lg font-semibold">
                      Scan Results ({scanResults.total_suggestions} suggestions found)
                    </h3>
                  </div>
                  
                  {scanResults.extracted_medicines && scanResults.extracted_medicines.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Extracted Medicines:</h4>
                      <div className="flex flex-wrap gap-2">
                        {scanResults.extracted_medicines.map((medicine, index) => (
                          <Badge key={index} variant="outline">
                            {medicine.extracted_name}
                            {medicine.strength && ` ${medicine.strength}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {renderMedicineSuggestions(scanResults.suggestions)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="search" className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">
                    Search Query
                  </label>
                  <Input
                    placeholder="Enter medicine name or composition..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Search Type
                  </label>
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="name">Medicine Name</option>
                    <option value="composition">Composition</option>
                    <option value="generic">Generic Name</option>
                  </select>
                </div>
              </div>
              
              <Button 
                onClick={handleSearchMedicines} 
                disabled={loading || !searchQuery.trim()}
                className="w-full"
              >
                <Search className="h-4 w-4 mr-2" />
                {loading ? 'Searching...' : 'Search Medicines'}
              </Button>

              {searchResults && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h3 className="text-lg font-semibold">
                      Search Results ({searchResults.total_suggestions} found)
                    </h3>
                  </div>
                  {renderMedicineSuggestions(searchResults.suggestions)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <History className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Scan History</h3>
              </div>
              
              {scanHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="mx-auto h-12 w-12 mb-4" />
                  <p>No scan history found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scanHistory.map((scan, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-gray-600">
                              {new Date(scan.created_at).toLocaleString()}
                            </p>
                            <p className="text-sm">
                              <strong>Type:</strong> {scan.scan_type}
                            </p>
                            <p className="text-sm">
                              <strong>Suggestions:</strong> {scan.total_suggestions}
                            </p>
                          </div>
                          <Badge variant="outline">
                            Scan #{scan.id}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
    </div>
  );
};

export default PrescriptionScanner;
