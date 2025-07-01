// GenericsTable.jsx
import React from 'react';

const GenericsTable = () => {
  // Sample data for generics
  const genericsData = [
    { name: 'Acetaminophen', linkedBrands: 15, strength: '500mg', action: 'Pain reliever' },
    { name: 'Ibuprofen', linkedBrands: 12, strength: '200mg', action: 'Anti-inflammatory' },
    { name: 'Amoxicillin', linkedBrands: 8, strength: '250mg', action: 'Antibiotic' },
    { name: 'Lisinopril', linkedBrands: 10, strength: '10mg', action: 'Antihypertensive' },
    { name: 'Metformin', linkedBrands: 7, strength: '500mg', action: 'Antidiabetic' },
  ];

  /**
   * Handles the click event for the "Add new" button.
   * In a real application, this would trigger navigation to a new form
   * or open a modal for adding a new generic entry.
   */
  const handleAddNew = () => {
    console.log('Add new generic button clicked!');
    // Example: navigate('/add-generic'); or openAddGenericModal();
  };

  /**
   * Handles the click event for a "View" button in a table row.
   * @param {object} generic - The generic data for the clicked row.
   */
  const handleViewDetails = (generic) => {
    console.log('View details for:', generic.name);
    // In a real application, this would navigate to a detail page
    // or open a modal displaying more information about the generic.
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter"> {/* Main container with responsive padding */}
      <div className="flex justify-between items-center mb-6"> {/* Header section with title and button */}
        <h1 className="text-3xl font-semibold text-gray-800">Generics</h1>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-md
                     transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Add new
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden"> {/* Table wrapper with shadow and rounded corners */}
        <div className="overflow-x-auto"> {/* Ensures horizontal scrolling on small screens if needed */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"> {/* Table header background */}
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Generic Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Linked Brands Count
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Strength
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Drug for
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Action {/* New header for the action column */}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200"> {/* Table body background and dividers */}
              {genericsData.map((generic, index) => (
                <tr key={index} className="hover:bg-gray-50 transition duration-150 ease-in-out"> {/* Row hover effect */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {generic.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {generic.linkedBrands}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline cursor-pointer"> {/* Example: make strength clickable */}
                    {generic.strength}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline cursor-pointer"> {/* Example: make action clickable */}
                    {generic.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium"> {/* Changed text-right to text-left */}
                    <button
                      onClick={() => handleViewDetails(generic)}
                      className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                                 p-1 rounded-md transition duration-150 ease-in-out"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GenericsTable;
