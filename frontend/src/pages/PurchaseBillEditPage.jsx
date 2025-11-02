import React from 'react';
import { useParams } from 'react-router-dom';

const PurchaseBillEditPage = () => {
  const { poId } = useParams();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Purchase Bill #{poId}</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <p>This is a placeholder for the Purchase Bill Edit Page.</p>
        <p>You can implement the form to edit purchase order details here.</p>
      </div>
    </div>
  );
};

export default PurchaseBillEditPage;
