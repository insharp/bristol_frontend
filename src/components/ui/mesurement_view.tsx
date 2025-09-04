import { MeasurementField, ProductMeasurement } from '@/app/hooks/useProductMeasurements';
import React, { useState, useEffect } from 'react';


interface MeasurementViewProps {
  measurement: ProductMeasurement;
  onClose: () => void;
  getMeasurementFields: (productId: number) => Promise<MeasurementField[]>;
}

const MeasurementView: React.FC<MeasurementViewProps> = ({ 
  measurement, 
  onClose, 
  getMeasurementFields 
}) => {
  const [measurementFields, setMeasurementFields] = useState<MeasurementField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeasurementFields();
  }, [measurement.product_id]);

  const loadMeasurementFields = async () => {
    try {
      const fields = await getMeasurementFields(measurement.product_id);
      setMeasurementFields(fields);
    } catch (error) {
      console.error('Failed to load measurement fields:', error);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Product ID</label>
            <p className="mt-1 text-lg text-gray-900">{measurement.product_id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Product Name</label>
            <p className="mt-1 text-lg text-gray-900">{measurement.product_name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Size</label>
            <p className="mt-1 text-lg text-gray-900">{measurement.size}</p>
          </div>
        </div>

        {/* Measurements */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Measurements</h3>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Check if measurements exist and is an array */}
              {measurement.measurements && Array.isArray(measurement.measurements) ? (
                measurement.measurements.length > 0 ? (
                  measurement.measurements.map((measurementItem, index) => {
                    const displayName = `${measurementItem.field_name}`;
                    
                    return (
                      <div key={measurementItem.field_id || index} className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-700">{displayName}</span>
                        <span className="text-sm text-gray-900">{measurementItem.value}</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 italic">No measurements recorded</p>
                )
              ) : (
                <p className="text-sm text-gray-500 italic">No measurements data available</p>
              )}
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
          <p>Created: {new Date(measurement.created_at).toLocaleString()}</p>
          <p>Updated: {new Date(measurement.updated_at).toLocaleString()}</p>
        </div>

        {/* Close Button */}
        <div className="pt-4">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeasurementView;