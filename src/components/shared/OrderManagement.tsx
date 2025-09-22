import React, { useState, useEffect } from 'react';
import { 
  useOrderManagement, 
  OrderStatus, 
  ProductFilterType,
  SingleOrderCreate,
  SingleOrderResponse,
  BulkOrderDefaultCreate,
  BulkOrderDefaultResponse,
  BulkOrderCustomCreate,      
  BulkOrderCustomResponse,
  ORDER_STATUS_OPTIONS,
  SIZE_OPTIONS,
  PRODUCT_FILTER_OPTIONS
} from '@/app/hooks/useOrder';
import ReusableTable from '../ui/ReusableTable';
import Button from '@/components/ui/button';
import SlideModal from '@/components/ui/SlideModal';
import { Plus, RefreshCw, X, Trash2 } from 'lucide-react';

interface SingleOrderManagementProps {
  title?: string;
  apiEndpoint?: string;
  permissions?: {
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canView?: boolean;
  };
  tableActions?: {
    showViewButton?: boolean;
    showEditButton?: boolean;
    showDeleteButton?: boolean;
  };
  viewModalButtons?: {
    showEditButton?: boolean;
    showDeleteButton?: boolean;
  };
  customActions?: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: (order: SingleOrderResponse | BulkOrderDefaultResponse) => void;
    className?: string;
  }>;
}

interface FormData {
  customerId: string;
  orderType: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  stylePreferences: string;
  specialNotes: string;
  status?: OrderStatus;
}

// New interface for bulk default form data
interface BulkDefaultFormData {
  customerId: string;
  productId: string;
  unitPrice: string;
  stylePreferences: string;
  specialNotes: string;
  status?: OrderStatus;
  sizeQuantities: Array<{
    size: string;
    quantity: string;
  }>;
}

// Add this after BulkDefaultFormData interface
interface BulkCustomFormData {
  bulkId: string;
  orderType: string;
  productId: string; 
  quantity: string;
  unitPrice: string;
  stylePreferences: string;
  specialNotes: string;
  status?: OrderStatus;
  batchName?: string;
}

interface FormErrors {
  customerId?: string;
  orderType?: string;
  productId?: string;
  quantity?: string;
  unitPrice?: string;
  sizeQuantities?: string;
   bulkId?: string; 
}


// Tab types
type TabType = 'single' | 'bulk' | 'default';


// Message Modal Component
const MessageModal = ({
  isOpen,
  onClose,
  type,
  title,
  message
}: {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  title: string;
  message: string;
}) => {
  if (!isOpen) return null;
  

  return (
    <div className="fixed inset-0 bg-blue-50/70 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center mb-4">
            {type === 'success' ? (
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex justify-end">
            <Button
              onClick={onClose}
              className={`${
                type === 'success' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              } text-white`}
            >
              OK
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SingleOrderManagement: React.FC<SingleOrderManagementProps> = ({
  title = "Orders",
  apiEndpoint,
  permissions = {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canView: true,
  },
  tableActions = {
    showViewButton: true,
    showEditButton: true,
    showDeleteButton: true,
  },
  viewModalButtons = {
    showEditButton: true,
    showDeleteButton: true,
  },
  customActions = []
}) => {
  const {
    singleOrders: { 
      createSingleOrder, 
      getAllSingleOrders, 
      updateSingleOrder,
      deleteSingleOrder,
      loading: singleOrderLoading, 
      error: singleOrderError 
    },
  bulkCustomOrders: {                    
    createBulkCustomOrder,
    getAllBulkCustomOrders,
    updateBulkCustomOrder,
    deleteBulkCustomOrder,
    getAllBulkIds,           
    bulkIds,                 
    bulkIdsLoading,         
    bulkIdsError,           
    loading: bulkCustomOrderLoading,
    error: bulkCustomOrderError
  },
    bulkDefaultOrders: {
      createBulkDefaultOrder,
      getAllBulkDefaultOrders,
      updateBulkDefaultOrder,
      deleteBulkDefaultOrder,
      loading: bulkDefaultOrderLoading,
      error: bulkDefaultOrderError
    },
    dropdownData: { customers, products, customersLoading, productsLoading },
    measurements,
    getCustomerDisplayName,
    getProductDisplayName,
    getProductById,
    getCustomerById,
    enrichBulkCustomOrders,
    isLoading
  } = useOrderManagement();

const checkMeasurementExists = async (customerId: number, productId: number) => {
  try {
    const measurement = await measurements.getCustomerProductMeasurements(customerId, productId);
    
    // Debug logging
    console.log('Measurement response:', measurement);
    console.log('Type of response:', typeof measurement);
    console.log('Is array?', Array.isArray(measurement));
    console.log('Length if array:', Array.isArray(measurement) ? measurement.length : 'N/A');
    
    // Handle different response types
    if (Array.isArray(measurement)) {
      return measurement.length > 0;
    } else if (measurement && typeof measurement === 'object') {
      return Object.keys(measurement).length > 0;
    } else {
      return !!measurement;
    }
  } catch (error) {
    console.error('Error checking measurements:', error);
    return false;
  }
};



const checkProductMeasurementsExist = async (productId: number, sizes: string[]) => {
  try {
    const missingMeasurements: string[] = [];
    
    // Check each selected size
    for (const size of sizes) {
      // Convert display size (XL) to backend format (extra_large)
      const backendSize = convertSizeToBackend(size);
      const measurement = await measurements.getProductMeasurementsBySize(productId, backendSize);
      
      if (!measurement) {
        missingMeasurements.push(size);
      }
    }
    
    return {
      isValid: missingMeasurements.length === 0,
      missingMeasurements
    };
  } catch (error) {
    console.error('Error checking product measurements:', error);
    return {
      isValid: false,
      missingMeasurements: sizes // Assume all are missing on error
    };
  }
};

// Helper function to convert display size to backend format
const convertSizeToBackend = (size: string): string => {
  const sizeMap: Record<string, string> = {
    'XXS': 'double_extra_small',
    'XS': 'extra_small',
    'S': 'small',
    'M': 'medium',
    'L': 'large',
    'XL': 'extra_large',
    'XXL': 'double_large',
    'XXXL': 'triple_extra_large'
  };
  
  return sizeMap[size] || size.toLowerCase();
};

const convertSizeToDisplay = (backendSize: string): string => {
  const sizeMap: Record<string, string> = {
    'double_extra_small': 'XXS',
    'extra_small': 'XS',
    'small': 'S',
    'medium': 'M',
    'large': 'L',
    'extra_large': 'XL',
    'double_large': 'XXL',
    'triple_extra_large': 'XXXL'
  };
  
  return sizeMap[backendSize] || backendSize;
};

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('single');

  

  const [formData, setFormData] = useState<FormData>({
    customerId: '',
    orderType: 'single',
    productId: '',
    quantity: '',
    unitPrice: '',
    stylePreferences: '',
    specialNotes: ''
  });

  
  // New state for bulk default form
  const [bulkDefaultFormData, setBulkDefaultFormData] = useState<BulkDefaultFormData>({
    customerId: '',
    productId: '',
    unitPrice: '',
    stylePreferences: '',
    specialNotes: '',
    sizeQuantities: []
  });

const [bulkCustomFormData, setBulkCustomFormData] = useState<BulkCustomFormData>({
    bulkId: '',
    orderType: 'bulk',
    productId: '',
    quantity: '',
    unitPrice: '',
    stylePreferences: '',
    specialNotes: ''
});




  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [orders, setOrders] = useState<SingleOrderResponse[]>([]);
  const [bulkDefaultOrders, setBulkDefaultOrders] = useState<BulkOrderDefaultResponse[]>([]);
  const [bulkCustomOrders, setBulkCustomOrders] = useState<BulkOrderCustomResponse[]>([]);
  const [selectedCustomerForBulkProducts, setSelectedCustomerForBulkProducts] = useState<number | null>(null);
  const [bulkProductFilterType, setBulkProductFilterType] = useState<ProductFilterType>(ProductFilterType.DEFAULT);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<{
    order: SingleOrderResponse | BulkOrderDefaultResponse | BulkOrderCustomResponse;
    customerName: string;
  } | null>(null);
      const [searchQuery, setSearchQuery] = useState("");
      const [isModalOpen, setIsModalOpen] = useState(false);
      const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
      const [selectedOrder, setSelectedOrder] = useState<SingleOrderResponse | BulkOrderDefaultResponse | null>(null);

  // Message Modal State
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: ''
  });

  // Add product filter state - ADD THESE LINES
const [productFilterType, setProductFilterType] = useState<ProductFilterType>(ProductFilterType.DEFAULT);
const [selectedCustomerForProducts, setSelectedCustomerForProducts] = useState<number | null>(null);

  // Helper functions to determine if table action buttons should be shown
  const shouldShowViewAction = () => permissions.canView && tableActions.showViewButton;
  const shouldShowEditAction = () => permissions.canEdit && tableActions.showEditButton;
  const shouldShowDeleteAction = () => permissions.canDelete && tableActions.showDeleteButton;
  const shouldShowEditButton = () => permissions.canEdit && viewModalButtons.showEditButton;
  const shouldShowDeleteButton = () => permissions.canDelete && viewModalButtons.showDeleteButton;

  // Message handlers
  const showSuccessMessage = (title: string, message: string) => {
    setMessageModal({ isOpen: true, type: 'success', title, message });
  };

  const showErrorMessage = (title: string, message: string) => {
    setMessageModal({ isOpen: true, type: 'error', title, message });
  };

  const closeMessageModal = () => {
    setMessageModal({ ...messageModal, isOpen: false });
  };

  // Auto-fill unit price when product is selected
useEffect(() => {
  if (formData.productId && 
      formData.productId !== 'custom' && 
      productFilterType === ProductFilterType.DEFAULT) { 
    const selectedProduct = getProductById(parseInt(formData.productId));
    if (selectedProduct) {
      setFormData(prev => ({
        ...prev,
        unitPrice: selectedProduct.base_price.toString()
      }));
    }
  } else if (formData.productId === 'custom' || productFilterType === ProductFilterType.CUSTOM) {
    setFormData(prev => ({
      ...prev,
      unitPrice: ''
    }));
  }
}, [formData.productId, productFilterType, getProductById]);

  // Auto-fill unit price for bulk default orders
  useEffect(() => {
    if (bulkDefaultFormData.productId) {
      const selectedProduct = getProductById(parseInt(bulkDefaultFormData.productId));
      if (selectedProduct) {
        setBulkDefaultFormData(prev => ({
          ...prev,
          unitPrice: selectedProduct.base_price.toString()
        }));
      }
    }
  }, [bulkDefaultFormData.productId, getProductById]);

  // Load orders on component mount and tab change
  useEffect(() => {
    loadOrders();
  }, [activeTab]);

useEffect(() => {
  if (activeTab === 'bulk') {
    getAllBulkIds();
  }
}, [activeTab, getAllBulkIds]);

// Replace this useEffect in your component
useEffect(() => {
  // Only auto-fill unit price when a DEFAULT product is selected (not custom products)
  if (bulkCustomFormData.productId && 
      bulkCustomFormData.productId !== 'custom' && 
      bulkProductFilterType === ProductFilterType.DEFAULT) {
    const selectedProduct = getProductById(parseInt(bulkCustomFormData.productId));
    if (selectedProduct) {
      setBulkCustomFormData(prev => ({
        ...prev,
        unitPrice: selectedProduct.base_price.toString()
      }));
    }
  } else if ((bulkCustomFormData.productId === 'custom' || bulkProductFilterType === ProductFilterType.CUSTOM) && 
             modalMode === "create") { 
    // Clear unit price for custom products - user must enter manually
    setBulkCustomFormData(prev => ({
      ...prev,
      unitPrice: ''
    }));
  }
}, [bulkCustomFormData.productId, bulkProductFilterType, getProductById, modalMode]); 

// Helper function to get display name for delete confirmation
const getOrderDisplayName = (order: SingleOrderResponse | BulkOrderDefaultResponse | BulkOrderCustomResponse) => {
  let customerId: number;
  let customerName: string;
  
  if ('quantity' in order && 'customerid' in order) {
    // Single order
    customerId = order.customerid;
  } else if ('Bulkid' in order) {
    // Bulk custom order
    const bulkData = bulkIds.find(bulk => bulk.id === order.Bulkid);
    if (bulkData) {
      const customer = getCustomerById(bulkData.corporate_customer_id);
      return customer ? (customer.company_name || getCustomerDisplayName(customer)) : `Bulk ID: ${order.Bulkid}`;
    }
    return `Bulk ID: ${order.Bulkid}`;
  } else {
    // Bulk default order
    customerId = order.CustomerID;
  }
  
  const customer = getCustomerById(customerId);
  return customer ? getCustomerDisplayName(customer) : `Customer ${customerId}`;
};

// New function to confirm deletion
const confirmDelete = async () => {
  if (!orderToDelete) return;

  try {
    let customerIdDisplay: string;
    
    if ('quantity' in orderToDelete.order && 'customerid' in orderToDelete.order) {
      customerIdDisplay = orderToDelete.order.customerid.toString();
    } else if ('Bulkid' in orderToDelete.order) {
      customerIdDisplay = orderToDelete.order.Bulkid.toString();
    } else {
      customerIdDisplay = orderToDelete.order.CustomerID.toString();
    }
    
    await handleDeleteOrder(orderToDelete.order.order_id, customerIdDisplay);
    setIsDeleteModalOpen(false);
    setOrderToDelete(null);
  } catch (err) {
    console.error(`Failed to delete order:`, err);
    showErrorMessage('Deletion Failed', 'Failed to delete order. Please try again.');
  }
};


const loadOrders = async () => {
  try {
    if (activeTab === 'single') {
      const orderData = await getAllSingleOrders();
      if (orderData) {
        setOrders(orderData);
      }
    } else if (activeTab === 'bulk') { 
      const bulkCustomOrderData = await getAllBulkCustomOrders();
      if (bulkCustomOrderData) {
        // Use the enrichment function here
        const enrichedOrders = await enrichBulkCustomOrders(bulkCustomOrderData);
        setBulkCustomOrders(enrichedOrders);
      }
    } else if (activeTab === 'default') {
      const bulkOrderData = await getAllBulkDefaultOrders();
      if (bulkOrderData) {
        setBulkDefaultOrders(bulkOrderData);
      }
    }
  } catch (error) {
    console.error('Failed to load orders:', error);
    showErrorMessage('Load Error', 'Failed to load orders');
  }
};


  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (activeTab === 'single') {
      if (!formData.customerId) {
        errors.customerId = 'Customer is required';
      }
      if (!formData.orderType) {
        errors.orderType = 'Order type is required';
      }
      if (!formData.productId) {
        errors.productId = 'Product category is required';
      }
      if (!formData.quantity || parseInt(formData.quantity) <= 0) {
        errors.quantity = 'Quantity must be greater than 0';
      }
      if (!formData.unitPrice || parseFloat(formData.unitPrice) <= 0) {
        errors.unitPrice = 'Unit price must be greater than 0';
      }
    } else if (activeTab === 'bulk') { 
        if (!bulkCustomFormData.bulkId) {
          errors.bulkId = 'Bulk ID is required';
        }
        if (!bulkCustomFormData.orderType) {
          errors.orderType = 'Order type is required';
        }
        if (!bulkCustomFormData.productId) {  // ADD THIS
          errors.productId = 'Product category is required';
        }
        if (!bulkCustomFormData.quantity || parseInt(bulkCustomFormData.quantity) <= 0) {
          errors.quantity = 'Quantity must be greater than 0';
        }
        if (!bulkCustomFormData.unitPrice || parseFloat(bulkCustomFormData.unitPrice) <= 0) {
          errors.unitPrice = 'Unit price must be greater than 0';
      }
    } else if (activeTab === 'default') {
      if (!bulkDefaultFormData.customerId) {
        errors.customerId = 'Customer is required';
      }
      if (!bulkDefaultFormData.productId) {
        errors.productId = 'Product category is required';
      }
      if (!bulkDefaultFormData.unitPrice || parseFloat(bulkDefaultFormData.unitPrice) <= 0) {
        errors.unitPrice = 'Unit price must be greater than 0';
      }
      if (bulkDefaultFormData.sizeQuantities.length === 0) {
        errors.sizeQuantities = 'At least one size with quantity is required';
      } else {
        const hasValidQuantity = bulkDefaultFormData.sizeQuantities.some(sq => 
          sq.quantity && parseInt(sq.quantity) > 0
        );
        if (!hasValidQuantity) {
          errors.sizeQuantities = 'At least one size must have a quantity greater than 0';
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBulkDefaultInputChange = (field: keyof BulkDefaultFormData, value: string) => {
    setBulkDefaultFormData(prev => ({ ...prev, [field]: value }));
    
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };


const handleBulkCustomInputChange = (field: keyof BulkCustomFormData, value: string) => {
  setBulkCustomFormData(prev => ({ ...prev, [field]: value }));
  
  
  if (formErrors[field as keyof FormErrors]) {
    setFormErrors(prev => ({ ...prev, [field]: undefined }));
  }
};
  // Helper functions for bulk default size quantities
  const addSizeQuantity = () => {
    setBulkDefaultFormData(prev => ({
      ...prev,
      sizeQuantities: [...prev.sizeQuantities, { size: 'S', quantity: '' }]
    }));
    
    if (formErrors.sizeQuantities) {
      setFormErrors(prev => ({ ...prev, sizeQuantities: undefined }));
    }
  };

  const updateSizeQuantity = (index: number, field: 'size' | 'quantity', value: string) => {
    setBulkDefaultFormData(prev => ({
      ...prev,
      sizeQuantities: prev.sizeQuantities.map((sq, i) => 
        i === index ? { ...sq, [field]: value } : sq
      )
    }));
    
    if (formErrors.sizeQuantities) {
      setFormErrors(prev => ({ ...prev, sizeQuantities: undefined }));
    }
  };

  const removeSizeQuantity = (index: number) => {
    setBulkDefaultFormData(prev => ({
      ...prev,
      sizeQuantities: prev.sizeQuantities.filter((_, i) => i !== index)
    }));
  };

  const setFormDataFromOrder = (order: SingleOrderResponse | BulkOrderDefaultResponse | BulkOrderCustomResponse) => {
  if ('quantity' in order && 'customerid' in order) {
    // Single order
    setFormData({
      customerId: order.customerid.toString(),
      orderType: 'single',
      productId: order.productid.toString(),
      quantity: order.quantity.toString(),
      unitPrice: order.unitprice.toString(),
      stylePreferences: order.stylepreference || '',
      specialNotes: order.speacial_requests || '',
      status: order.status
    });
  } 
  else if ('Bulkid' in order) {
    // Bulk custom order
    const bulkData = bulkIds.find(bulk => bulk.id === order.Bulkid);
    const productId = bulkData ? bulkData.product_id.toString() : '';
    const batchName = bulkData ? bulkData.batch_name || '' : '';
    
    // CRITICAL: Set the product filter type FIRST before setting form data
    if (bulkData) {
      const product = getProductById(bulkData.product_id);
      if (product?.customer_id) {
        setBulkProductFilterType(ProductFilterType.CUSTOM);
        setSelectedCustomerForBulkProducts(bulkData.corporate_customer_id);
      } else {
        setBulkProductFilterType(ProductFilterType.DEFAULT);
        setSelectedCustomerForBulkProducts(null);
      }
    }
    
    // THEN set the form data
    setBulkCustomFormData({
      bulkId: order.Bulkid.toString(),
      orderType: 'bulk', 
      productId: productId,
      quantity: order.quantity.toString(),
      unitPrice: order.unit_price?.toString() || '',
      stylePreferences: order.stylepreference || '',
      specialNotes: order.speacial_requests || '',
      status: order.status,
      batchName: batchName
    });
  }
  else {
    const sizeQuantities = Object.entries(order.quantity_by_size).map(([size, qty]) => ({
      size: convertSizeToDisplay(size), // Convert backend format to display format
      quantity: qty.toString()
    }));
    
    setBulkDefaultFormData({
      customerId: order.CustomerID.toString(),
      productId: order.ProductID.toString(),
      unitPrice: order.unitprice.toString(),
      stylePreferences: order.style_preference || '',
      specialNotes: order.speacial_request || '',
      status: order.status,
      sizeQuantities
    });
  }
};
  // Modal handlers
  const openCreateModal = () => {
    if (!permissions.canCreate) return;
    
    setSelectedOrder(null);
    if (activeTab === 'single') {
      setFormData({
        customerId: '',
        orderType: 'single',
        productId: '',
        quantity: '',
        unitPrice: '',
        stylePreferences: '',
        specialNotes: ''
      });
    } else if (activeTab === 'bulk') {
    setBulkCustomFormData({
      bulkId: '',
      orderType: 'bulk',
      productId: '',
      quantity: '',
      unitPrice: '',
      stylePreferences: '',
      specialNotes: ''
    });
  } else if (activeTab === 'default') {
      setBulkDefaultFormData({
        customerId: '',
        productId: '',
        unitPrice: '',
        stylePreferences: '',
        specialNotes: '',
        sizeQuantities: [{ size: 'S', quantity: '' }]
      });
    }
    setFormErrors({});
    setModalMode("create");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
    setFormErrors({});
  };

  // CRUD handlers

const handleCreateOrder = async () => {
  if (!validateForm()) return;
  
  try {
    if (activeTab === 'single') {
      const customerId = parseInt(formData.customerId);
      const productId = parseInt(formData.productId);
      
      const measurementExists = await checkMeasurementExists(customerId, productId);
      if (!measurementExists) {
        const customer = getCustomerById(customerId);
        const customerName = customer ? getCustomerDisplayName(customer) : `Customer ${customerId}`;
        const product = getProductById(productId);
        const productName = product ? product.category_name : `Product ${productId}`;
        showErrorMessage('Measurements Required', `No measurements found for ${customerName} and ${productName}. Please add measurements before creating the order.`);
        return;
      }

      const orderData: SingleOrderCreate = {
        customerid: parseInt(formData.customerId),
        productid: formData.productId === 'custom' ? 0 : parseInt(formData.productId),
        quantity: parseInt(formData.quantity),
        unitprice: parseFloat(formData.unitPrice),
        status: OrderStatus.ORDER_CONFIREMED,
        stylepreference: formData.stylePreferences || undefined,
        speacial_requests: formData.specialNotes || undefined,
      };

      const result = await createSingleOrder(orderData);
      if (result) {
        closeModal();
        showSuccessMessage('Success!', `Order for Customer ID: ${formData.customerId} has been created successfully.`);
        await loadOrders();
      }
    } else if (activeTab === 'bulk') { 
      
      // Fixed: Added missing product_id field for bulk custom orders
      const orderData: BulkOrderCustomCreate = {
        Bulkid: parseInt(bulkCustomFormData.bulkId),
        unit_price: parseFloat(bulkCustomFormData.unitPrice),
        quantity: parseInt(bulkCustomFormData.quantity),
        status: OrderStatus.ORDER_CONFIREMED,
        stylepreference: bulkCustomFormData.stylePreferences || undefined,
        speacial_requests: bulkCustomFormData.specialNotes || undefined,
      };

      const result = await createBulkCustomOrder(orderData);
      if (result) {
        closeModal();
        showSuccessMessage('Success!', `Bulk custom order for Bulk ID: ${bulkCustomFormData.bulkId} has been created successfully.`);
        await loadOrders();
      }
    } else if (activeTab === 'default') {
     const selectedSizes = bulkDefaultFormData.sizeQuantities
        .filter(sq => sq.quantity && parseInt(sq.quantity) > 0)
        .map(sq => sq.size);

      if (selectedSizes.length === 0) {
        showErrorMessage('Validation Error', 'At least one size with quantity greater than 0 is required.');
        return;
      }

      // Check if product measurements exist for all selected sizes
      const measurementCheck = await checkProductMeasurementsExist(
        parseInt(bulkDefaultFormData.productId), 
        selectedSizes
      );

      if (!measurementCheck.isValid) {
        const product = getProductById(parseInt(bulkDefaultFormData.productId));
        const productName = product ? product.category_name : 'selected product';
        const missingSizesText = measurementCheck.missingMeasurements.join(', ');
        
        showErrorMessage(
          'Product Measurements Required', 
          `No standard measurements found for ${productName} in size(s): ${missingSizesText}. Please add product measurements for these sizes before creating the order.`
        );
        return;
      }

      // Create quantity_by_size object
      const quantityBySize: Record<string, number> = {};
      bulkDefaultFormData.sizeQuantities.forEach(sq => {
        if (sq.quantity && parseInt(sq.quantity) > 0) {
          // Convert to backend format
          const backendSize = convertSizeToBackend(sq.size);
          quantityBySize[backendSize] = parseInt(sq.quantity);
        }
      });

      const orderData: BulkOrderDefaultCreate = {
        CustomerID: parseInt(bulkDefaultFormData.customerId),
        ProductID: parseInt(bulkDefaultFormData.productId),
        quantity_by_size: quantityBySize,
        unitprice: parseFloat(bulkDefaultFormData.unitPrice),
        status: OrderStatus.ORDER_CONFIREMED,
        style_preference: bulkDefaultFormData.stylePreferences || undefined,
        speacial_request: bulkDefaultFormData.specialNotes || undefined,
      };

      const result = await createBulkDefaultOrder(orderData);
      if (result) {
        closeModal();
        const customer = getCustomerById(parseInt(bulkDefaultFormData.customerId));
        const customerName = customer ? getCustomerDisplayName(customer) : 'Customer';
        showSuccessMessage('Success!', `Default order for ${customerName} has been created successfully.`);
        await loadOrders();
      }
    }
  } catch (error: any) {
  console.error('Failed to create default order:', error);
  
  // Get product name for better error context
  const product = getProductById(parseInt(bulkDefaultFormData.productId));
  const productName = product ? product.category_name : 'this product';
  
  // Check if it's a size-related error
  if (error?.message?.toLowerCase().includes('measurements','not','exist')) {
    showErrorMessage('Invalid Size', `No standard sizes found for ${productName}. Please add available sizes for this product before creating the order.`);
  } else {
    showErrorMessage('Creation Failed', `Failed to create  default order for ${productName}. Please try again.`);
  }
}
};

  const handleUpdateOrder = async () => {
    if (!validateForm() || !selectedOrder) return;
    
    try {
      if (activeTab === 'single' && 'quantity' in selectedOrder) {
        const orderData = {
          customerid: parseInt(formData.customerId),
          productid: formData.productId === 'custom' ? 0 : parseInt(formData.productId),
          quantity: parseInt(formData.quantity),
          unitprice: parseFloat(formData.unitPrice),
          status: formData.status || selectedOrder.status,
          stylepreference: formData.stylePreferences || undefined,
          speacial_requests: formData.specialNotes || undefined,
        };

        const result = await updateSingleOrder(selectedOrder.order_id, orderData);
        if (result) {
          closeModal();
          const customer = getCustomerById(parseInt(formData.customerId));
          const customerName = customer ? getCustomerDisplayName(customer) : 'Customer';
          showSuccessMessage('Success!', `Order for Customer ID: ${formData.customerId} has been updated successfully.`);
          await loadOrders();
        }
      }else if (activeTab === 'bulk' && 'Bulkid' in selectedOrder) {
      // Update bulk custom order
      const orderData = {
        Bulkid: parseInt(bulkCustomFormData.bulkId),
        unit_price: parseFloat(bulkCustomFormData.unitPrice),
        quantity: parseInt(bulkCustomFormData.quantity),
        status: bulkCustomFormData.status || selectedOrder.status,
        stylepreference: bulkCustomFormData.stylePreferences || undefined,
        speacial_requests: bulkCustomFormData.specialNotes || undefined,
      };

      const result = await updateBulkCustomOrder(selectedOrder.order_id, orderData);
      if (result) {
        closeModal();
        showSuccessMessage('Success!', `Bulk custom order for Bulk ID: ${bulkCustomFormData.bulkId} has been updated successfully.`);
        await loadOrders();
      }
    }  else if (activeTab === 'default' && !('quantity' in selectedOrder)) {
        // Create quantity_by_size object
           const selectedSizes = bulkDefaultFormData.sizeQuantities
        .filter(sq => sq.quantity && parseInt(sq.quantity) > 0)
        .map(sq => sq.size);

      if (selectedSizes.length === 0) {
        showErrorMessage('Validation Error', 'At least one size with quantity greater than 0 is required.');
        return;
      }

      // Check if product measurements exist for all selected sizes
      const measurementCheck = await checkProductMeasurementsExist(
        parseInt(bulkDefaultFormData.productId), 
        selectedSizes
      );

      if (!measurementCheck.isValid) {
        const product = getProductById(parseInt(bulkDefaultFormData.productId));
        const productName = product ? product.category_name : 'selected product';
        const missingSizesText = measurementCheck.missingMeasurements.join(', ');
        
        showErrorMessage(
          'Product Measurements Required', 
          `No standard measurements found for ${productName} in size(s): ${missingSizesText}. Please add product measurements for these sizes before updating the order.`
        );
        return;
      }

      // Create quantity_by_size object
      const quantityBySize: Record<string, number> = {};
      bulkDefaultFormData.sizeQuantities.forEach(sq => {
        if (sq.quantity && parseInt(sq.quantity) > 0) {
          // Convert to backend format
          const backendSize = convertSizeToBackend(sq.size);
          quantityBySize[backendSize] = parseInt(sq.quantity);
        }
      });

      const orderData = {
        CustomerID: parseInt(bulkDefaultFormData.customerId),
        ProductID: parseInt(bulkDefaultFormData.productId),
        quantity_by_size: quantityBySize,
        unitprice: parseFloat(bulkDefaultFormData.unitPrice),
        status: bulkDefaultFormData.status || selectedOrder.status,
        style_preference: bulkDefaultFormData.stylePreferences || undefined,
        speacial_request: bulkDefaultFormData.specialNotes || undefined,
      };

      const result = await updateBulkDefaultOrder(selectedOrder.order_id, orderData);
      if (result) {
        closeModal();
        const customer = getCustomerById(parseInt(bulkDefaultFormData.customerId));
        const customerName = customer ? getCustomerDisplayName(customer) : 'Customer';
        showSuccessMessage('Success!', `Default order for ${customerName} has been updated successfully.`);
        await loadOrders();
      }
    }
    } catch (error) {
      console.error('Failed to update order:', error);
      showErrorMessage('Update Failed', 'Failed to update order');
    }
  };

 const handleDeleteOrder = async (orderId: number, customerIdDisplay: string) => {
    try {
      if (activeTab === 'single') {
        await deleteSingleOrder(orderId);
        showSuccessMessage('Success!', `Order for Customer ID: ${customerIdDisplay} has been deleted.`);
      }else if (activeTab === 'bulk') {
      await deleteBulkCustomOrder(orderId);
      showSuccessMessage('Success!', `Bulk custom order for Bulk ID: ${customerIdDisplay} has been deleted.`);
    } else if (activeTab === 'default') {
        await deleteBulkDefaultOrder(orderId);
       showSuccessMessage('Success!', `Default order for Customer ID: ${customerIdDisplay} has been deleted.`);
      }
      await loadOrders();
    } catch (error) {
      console.error('Failed to delete order:', error);
      showErrorMessage('Deletion Failed', 'Failed to delete order');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modalMode === "create") {
      await handleCreateOrder();
    } else if (modalMode === "edit") {
      await handleUpdateOrder();
    }
  };

  // Filter orders based on search and active tab
const getFilteredOrders = () => {
  let filteredData: (SingleOrderResponse | BulkOrderDefaultResponse | BulkOrderCustomResponse)[] = [];
  
  if (activeTab === 'single') {
    filteredData = orders;
  } else if (activeTab === 'bulk') {
    filteredData = bulkCustomOrders; 
  } else if (activeTab === 'default') {
    filteredData = bulkDefaultOrders;
  }
  
  if (!searchQuery) return filteredData;

  const searchLower = searchQuery.toLowerCase();
  return filteredData.filter(order => {
    let customerId: number;
    let customerName: string;
    let productId: number;
    let productName: string;
    
    if ('quantity' in order && 'customerid' in order) {
      // Single order
      customerId = order.customerid;
      productId = order.productid;
    } else if ('Bulkid' in order) {
  // Bulk custom order - search by customer name, product name, bulk ID, and order ID
  const bulkData = bulkIds.find(bulk => bulk.id === order.Bulkid);
  let customerName = `Bulk ${order.Bulkid}`;
  let productName = 'Unknown Product';
  
  if (bulkData) {
    const customer = getCustomerById(bulkData.corporate_customer_id);
    customerName = customer ? (customer.company_name || getCustomerDisplayName(customer)) : `Customer ${bulkData.corporate_customer_id}`;
    
    const product = getProductById(bulkData.product_id);
    productName = product ? getProductDisplayName(product) : `Product ${bulkData.product_id}`;
  }
  
  return (
    customerName.toLowerCase().includes(searchLower) ||
    productName.toLowerCase().includes(searchLower) ||
    order.order_id.toString().includes(searchLower) ||
    order.Bulkid.toString().includes(searchLower)
  );
} else {
      // Bulk default order
      customerId = order.CustomerID;
      productId = order.ProductID;
    }
    
    const customer = getCustomerById(customerId);
    customerName = customer ? getCustomerDisplayName(customer) : `Customer ${customerId}`;
    const product = getProductById(productId);
    productName = product ? getProductDisplayName(product) : `Product ${productId}`;
    
    return (
      customerName.toLowerCase().includes(searchLower) ||
      productName.toLowerCase().includes(searchLower) ||
      order.order_id.toString().includes(searchLower)
    );
  });
};

  const filteredOrders = getFilteredOrders();

  // Table configuration for single orders
  const getSingleOrderTableColumns = () => [
    {
      key: 'order_id',
      label: 'Order_ID',
      width: '100px',
      render: (value: number) => `${value}`
    },
    {
      key: 'customerid',
      label: 'Customer_ID',
      width: '120px',
      render: (value: number) => `${value}`
    },
    {
      key: 'customer_name',
      label: 'Customer Name',
      minWidth: '150px',
      render: (value: any, row: any) => {
        const customer = getCustomerById(row.customerid);
        return customer ? getCustomerDisplayName(customer) : `Customer ${row.customerid}`;
      }
    },
    {
      key: 'productid',
      label: 'Product_ID',
      width: '120px',
      render: (value: number) => {
        if (value === 0) return 'Custom';
        return `${value}`;
      }
    },
    {
      key: 'product_name',
      label: 'Product Name',
      minWidth: '150px',
      render: (value: any, row: any) => {
        if (row.productid === 0) return 'Custom';
        const product = getProductById(row.productid);
        return product ? product.category_name : `Product ${row.productid}`;
      }
    },
   
    {
      key: 'quantity',
      label: 'Quantity',
      width: '100px',
      render: (value: number) => `${value}`
    },
    {
      key: 'unitprice',
      label: 'Unit Price',
      render: (value: number) => `Rs.${value.toFixed(2)}`,
      width: '120px'
    },
    {
      key: 'status',
      label: 'Status',
      width: '140px', 
      render: (value: OrderStatus) => {
        const getStatusConfig = (status: OrderStatus) => {
          switch (status) {
            case OrderStatus.ORDER_CONFIREMED:
              return { label: 'Order Confirmed', className: 'bg-yellow-400 text-black' };
            case OrderStatus.FABRIC_READY:
              return { label: 'Fabric Ready', className: 'bg-orange-400 text-black' };
            case OrderStatus.CUTTING:
              return { label: 'Cutting', className: 'bg-pink-400 text-black' };
            case OrderStatus.STITCHING:
              return { label: 'Stitching', className: 'bg-gray-400 text-black' };
            case OrderStatus.FITTING:
              return { label: 'Fitting', className: 'bg-pink-300 text-black' };
            case OrderStatus.READY_FOR_PICKUP:
              return { label: 'Ready for Pickup', className: 'bg-blue-400 text-white' };
            case OrderStatus.COMPLETED:
              return { label: 'Completed', className: 'bg-green-400 text-black' };
            default:
              return { label: status, className: 'bg-gray-500 text-white' };
          }
        };

        const config = getStatusConfig(value);
        return (
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${config.className}`}>
            {config.label}
          </span>
        );
      }
    }
  ];

  // Table configuration for bulk default orders
  const getBulkDefaultTableColumns = () => [
    {
      key: 'order_id',
      label: 'Order_ID',
      width: '100px',
      render: (value: number) => `${value}`
    },
    {
      key: 'CustomerID',
      label: 'Customer_ID',
      width: '120px',
      render: (value: number) => `${value}`
    },
    {
      key: 'customer_name',
      label: 'Customer Name',
      minWidth: '150px',
      render: (value: any, row: any) => {
        const customer = getCustomerById(row.CustomerID);
        return customer ? getCustomerDisplayName(customer) : `Customer ${row.CustomerID}`;
      }
    },
    {
      key: 'product_name',
      label: 'Product Name',
      minWidth: '150px',
      render: (value: any, row: any) => {
        const product = getProductById(row.ProductID);
        return product ? product.category_name : `Product ${row.ProductID}`;
      }
    },
    
    {
    key: 'sizes',
    label: 'Size',
    width: '110px',
    render: (value: any, row: any) => {
      const sizes = Object.keys(row.quantity_by_size);
      return sizes.join(', ');
    }
  },
  {
    key: 'quantities',
    label: 'Quantity',
    width: '150px',
    render: (value: any, row: any) => {
      const quantities = Object.values(row.quantity_by_size);
      return quantities.join(', ');
    }
  },
    {
      key: 'unitprice',
      label: 'Unit Price',
      render: (value: number) => `Rs.${value.toFixed(2)}`,
      width: '120px'
    },
    {
      key: 'status',
      label: 'Status',
      width: '140px', 
      render: (value: OrderStatus) => {
        const getStatusConfig = (status: OrderStatus) => {
          switch (status) {
            case OrderStatus.ORDER_CONFIREMED:
              return { label: 'Order Confirmed', className: 'bg-yellow-400 text-black' };
            case OrderStatus.FABRIC_READY:
              return { label: 'Fabric Ready', className: 'bg-orange-400 text-black' };
            case OrderStatus.CUTTING:
              return { label: 'Cutting', className: 'bg-pink-400 text-black' };
            case OrderStatus.STITCHING:
              return { label: 'Stitching', className: 'bg-gray-400 text-black' };
            case OrderStatus.FITTING:
              return { label: 'Fitting', className: 'bg-pink-300 text-black' };
            case OrderStatus.READY_FOR_PICKUP:
              return { label: 'Ready for Pickup', className: 'bg-blue-400 text-white' };
            case OrderStatus.COMPLETED:
              return { label: 'Completed', className: 'bg-green-400 text-black' };
            default:
              return { label: status, className: 'bg-gray-500 text-white' };
          }
        };

        const config = getStatusConfig(value);
        return (
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${config.className}`}>
            {config.label}
          </span>
        );
      }
    }
  ];


// Update the getBulkCustomTableColumns function in your component

const getBulkCustomTableColumns = () => [
  {
    key: 'order_id',
    label: 'Order_ID',
    width: '100px',
    render: (value: number) => `${value}`
  },
  {
    key: 'Bulkid',
    label: 'Bulk_ID',
    width: '100px',
    render: (value: number) => `${value}`
  },
  {
    key: 'customer_name',
    label: 'Customer Name',
    minWidth: '150px',
    render: (value: any, row: any) => {
      // Find the bulk data to get the corporate_customer_id
      const bulkData = bulkIds.find(bulk => bulk.id === row.Bulkid);
      if (bulkData) {
        const customer = getCustomerById(bulkData.corporate_customer_id);
        return customer ? (customer.company_name || getCustomerDisplayName(customer)) : `Customer ${bulkData.corporate_customer_id}`;
      }
      return `Bulk ID: ${row.Bulkid}`;
    }
  },
  {
    key: 'batch_name',
    label: 'Batch Name',
    minWidth: '130px',
    render: (value: any, row: any) => {
      // Find the bulk data to get the batch_name
      const bulkData = bulkIds.find(bulk => bulk.id === row.Bulkid);
      return bulkData?.batch_name || 'No Batch Name';
    }
  },
  {
    key: 'product_id',
    label: 'Product_ID',
    width: '120px',
    render: (value: any, row: any) => {
      // Find the bulk data to get the product_id
      const bulkData = bulkIds.find(bulk => bulk.id === row.Bulkid);
      if (bulkData) {
        return `${bulkData.product_id}`;
      }
      return 'N/A';
    }
  },
  {
    key: 'product_name',
    label: 'Product Name',
    minWidth: '150px',
    render: (value: any, row: any) => {
      // Find the bulk data to get the product_id, then get product name
      const bulkData = bulkIds.find(bulk => bulk.id === row.Bulkid);
      if (bulkData) {
        const product = getProductById(bulkData.product_id);
        return product ? product.category_name : `Product ${bulkData.product_id}`;
      }
      return 'Unknown Product';
    }
  },
  {
    key: 'quantity',
    label: 'Quantity',
    width: '100px',
    render: (value: number) => `${value}`
  },
  {
    key: 'unit_price',
    label: 'Unit_Price',
    render: (value: number) => `Rs.${value.toFixed(2)}`,
    width: '120px'
  },
 
  {
    key: 'status',
    label: 'Status',
    width: '140px', 
    render: (value: OrderStatus) => {
      const getStatusConfig = (status: OrderStatus) => {
        switch (status) {
          case OrderStatus.ORDER_CONFIREMED:
            return { label: 'Order Confirmed', className: 'bg-yellow-400 text-black' };
          case OrderStatus.FABRIC_READY:
            return { label: 'Fabric Ready', className: 'bg-orange-400 text-black' };
          case OrderStatus.CUTTING:
            return { label: 'Cutting', className: 'bg-pink-400 text-black' };
          case OrderStatus.STITCHING:
            return { label: 'Stitching', className: 'bg-gray-400 text-black' };
          case OrderStatus.FITTING:
            return { label: 'Fitting', className: 'bg-pink-300 text-black' };
          case OrderStatus.READY_FOR_PICKUP:
            return { label: 'Ready for Pickup', className: 'bg-blue-400 text-white' };
          case OrderStatus.COMPLETED:
            return { label: 'Completed', className: 'bg-green-400 text-black' };
          default:
            return { label: status, className: 'bg-gray-500 text-white' };
        }
      };

      const config = getStatusConfig(value);
      return (
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${config.className}`}>
          {config.label}
        </span>
      );
    }
  }
];

  // Table actions based on permissions and tableActions settings
  const getActions = () => {
    const defaultActions = [];

    if (shouldShowViewAction()) {
      defaultActions.push({
        label: "View",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        ),
        onClick: (order: SingleOrderResponse | BulkOrderDefaultResponse) => {
          setSelectedOrder(order);
          setFormDataFromOrder(order);
          setModalMode("view");
          setIsModalOpen(true);
        },
      });
    }

    if (shouldShowEditAction()) {
      defaultActions.push({
        label: "Edit",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
        onClick: (order: SingleOrderResponse | BulkOrderDefaultResponse |BulkOrderDefaultResponse) => {
          setSelectedOrder(order);
          setFormDataFromOrder(order);
          setModalMode("edit");
          setIsModalOpen(true);
        },
      });
    }

    if (shouldShowDeleteAction()) {
      defaultActions.push({
        label: "Delete",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ),
       onClick: (order: SingleOrderResponse | BulkOrderDefaultResponse | BulkOrderCustomResponse) => {
        const customerName = getOrderDisplayName(order);
        setOrderToDelete({ order, customerName });
        setIsDeleteModalOpen(true);
      },
        
        className: "text-red-600 hover:bg-red-50",
      });
    }

    return [...defaultActions, ...customActions];
  };

  const getModalTitle = () => {
    switch (modalMode) {
      case "create": return `Create New ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Order`;
      case "edit": return "Edit Order";
      case "view": return "View Order";
    }
  };

  const getTabLabel = (tab: TabType) => {
    return tab.charAt(0).toUpperCase() + tab.slice(1);
  };

  // Get appropriate table columns based on active tab
  const getTableColumns = () => {
    if (activeTab === 'single') {
      return getSingleOrderTableColumns();
    } else if (activeTab === 'bulk') {
    return getBulkCustomTableColumns(); 
  }else if (activeTab === 'default') {
      return getBulkDefaultTableColumns();
    }
    return [];
  };

const getLoadingState = () => {
  if (activeTab === 'single') {
    return singleOrderLoading;
  } else if (activeTab === 'bulk') {
    return bulkCustomOrderLoading || bulkIdsLoading;  // Add bulkIdsLoading here
  } else if (activeTab === 'default') {
    return bulkDefaultOrderLoading;
  }
  return false;
};

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <main className="flex-1 p-6 bg-gray-50 flex flex-col overflow-hidden">

      {/* Header Section */}
      <div className="flex-shrink-0 mb-6">
        {/* Main Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {permissions.canCreate && (
            <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white">
              + Add Order
            </Button>
          )}
        </div>

        {/* Order Type Tabs with Search Bar */}
        <div className="flex justify-between items-center border-b border-gray-200 mb-2 pb-2">
          {/* Left side - Order Type Tabs */}
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("single")}
              className={`pb-1 px-1 font-medium text-sm transition-colors ${
                activeTab === "single"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Single
            </button>
            <button
              onClick={() => setActiveTab("bulk")}
              className={`pb-1 px-1 font-medium text-sm transition-colors ${
                activeTab === "bulk"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Bulk
            </button>
            <button
              onClick={() => setActiveTab("default")}
              className={`pb-1 px-1 font-medium text-sm transition-colors ${
                activeTab === "default"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Default
            </button>
          </div>

          {/* Right side - Search Bar */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
              />
            </div>
          </div>
        </div>
      </div>

        {/* Table Container */}
        <div className="flex-1 min-h-0 bg-white rounded-lg border border-gray-200">
          <ReusableTable
            data={filteredOrders}
            columns={getTableColumns()}
            actions={getActions()}
            loading={getLoadingState()}
            emptyMessage={`No ${activeTab} orders found. Click "Add Order" to get started.`}
          />
        </div>

        {/* Order Form Modal */}
        <SlideModal isOpen={isModalOpen} onClose={closeModal} title={getModalTitle()}>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {activeTab === 'single' ? (
              // Single Order Form
              <>
                {/* Customer Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Customer ID *</label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => handleInputChange('customerId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      formErrors.customerId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } focus:outline-none focus:ring-2`}
                    disabled={modalMode === "view" || customersLoading}
                    required
                  >
                    <option value="">Select Customer ID</option>
                    {customers
                    .filter((customer) => customer.customer_type === 'individual')
                    .map((customer) => (
                     <option key={customer.id} value={customer.id}>
                      {customer.id} - {getCustomerDisplayName(customer)}
                    </option>
                    ))}
                  </select>
                  {formErrors.customerId && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.customerId}</p>
                  )}
                </div>
                {/* Order Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">Order Type *</label>
                  <select
                    value={formData.orderType}
                    onChange={(e) => handleInputChange('orderType', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      formErrors.orderType ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } focus:outline-none focus:ring-2`}
                    disabled={modalMode === "view"}
                    required
                  >
                    <option value="">Select Order Type</option>
                    <option value="single">Single</option>
                    <option value="bulk">Bulk</option>
                  </select>
                  {formErrors.orderType && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.orderType}</p>
                  )}
                </div>

                {/* Product Category */}
                {/* Product Type Selection - SINGLE ORDER ONLY */}
                <div>
                  <label className="block text-sm font-medium mb-2">Product Type *</label>
                  <select
                    value={productFilterType}
                    onChange={(e) => {
                      const newType = e.target.value as ProductFilterType;
                      setProductFilterType(newType);
                      handleInputChange('productId', '');
                      
                      // Automatically use the selected customer for custom products
                      if (newType === ProductFilterType.CUSTOM && formData.customerId) {
                        setSelectedCustomerForProducts(parseInt(formData.customerId));
                      } else if (newType === ProductFilterType.DEFAULT) {
                        setSelectedCustomerForProducts(null);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={modalMode === "view"}
                  >
                    {PRODUCT_FILTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>


               {/* Product Category - SINGLE ORDER ONLY */}
                <div>
                  <label className="block text-sm font-medium mb-2">Product Category *</label>
                  {modalMode === "view" ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                      {(() => {
                        if (formData.productId === '0' || formData.productId === 'custom') {
                          return 'Custom Product';
                        }
                        const product = getProductById(parseInt(formData.productId));
                        return product ? `${product.category_name} ${product.customer_id ? '(Custom)' : ''}` : `Product ID: ${formData.productId}`;
                      })()}
                    </div>
                  ) : (
                    <>
                      <select
                        value={formData.productId}
                        onChange={(e) => handleInputChange('productId', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          formErrors.productId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        } focus:outline-none focus:ring-2`}
                        disabled={productsLoading || (productFilterType === ProductFilterType.CUSTOM && !formData.customerId)}
                        required
                      >
                        <option value="">
                          {productFilterType === ProductFilterType.CUSTOM && !formData.customerId 
                            ? "Select customer first" 
                            : "Select Product"
                          }
                        </option>
                        {products
                          .filter((product) => {
                            if (productFilterType === ProductFilterType.DEFAULT) {
                              return !product.customer_id; // Default products
                            } else if (productFilterType === ProductFilterType.CUSTOM) {
                              // Use the customer selected for the order
                              return product.customer_id === parseInt(formData.customerId);
                            }
                            return true;
                          })
                          .map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.category_name} {product.customer_id ? '(Custom)' : ''}
                            </option>
                          ))
                        }
                      </select>
                      {formErrors.productId && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.productId}</p>
                      )}
                    </>
                  )}
                </div>
                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium mb-2">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      formErrors.quantity ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } focus:outline-none focus:ring-2`}
                    placeholder="Enter quantity"
                    readOnly={modalMode === "view"}
                    required
                  />
                  {formErrors.quantity && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.quantity}</p>
                  )}
                </div>

                {/* Unit Price */}
                <div>
                <label className="block text-sm font-medium mb-2">Unit Price *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => handleInputChange('unitPrice', e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg ${
                      formErrors.unitPrice ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } focus:outline-none focus:ring-2`}
                    placeholder="00.00"
                    readOnly={modalMode === "view"}
                    required
                  />
                </div>
                {formErrors.unitPrice && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.unitPrice}</p>
                )}
             </div>
               {/* Style Preferences */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {productFilterType === ProductFilterType.CUSTOM ? 'Style & Material Preference' : 'Style Preferences'}
                  </label>
                  {modalMode === "view" ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                      {formData.stylePreferences || `No ${productFilterType === ProductFilterType.CUSTOM ? 'style & material preferences' : 'style preferences'} provided`}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.stylePreferences}
                      onChange={(e) => handleInputChange('stylePreferences', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Enter ${productFilterType === ProductFilterType.CUSTOM ? 'style & material preferences' : 'style preferences'}`}
                    />
                  )}
                </div>

                {/* Special Notes */}
                <div>
                  <label className="block text-sm font-medium mb-2">Special Notes</label>
                  {modalMode === "view" ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 min-h-[80px]">
                      {formData.specialNotes || 'No special notes provided'}
                    </div>
                  ) : (
                    <textarea
                      rows={3}
                      value={formData.specialNotes}
                      onChange={(e) => handleInputChange('specialNotes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter any special notes"
                    />
                  )}
                </div>

                {/* Status (for view/edit mode) */}
                {(modalMode === "view" || modalMode === "edit") && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Status *</label>
                    {modalMode === "view" ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                        {(() => {
                          const getStatusConfig = (status: OrderStatus) => {
                            switch (status) {
                              case OrderStatus.ORDER_CONFIREMED:
                                return { label: 'Order Confirmed', className: 'bg-yellow-400 text-black' };
                              case OrderStatus.FABRIC_READY:
                                return { label: 'Fabric Ready', className: 'bg-orange-400 text-black' };
                              case OrderStatus.CUTTING:
                                return { label: 'Cutting', className: 'bg-pink-400 text-black' };
                              case OrderStatus.STITCHING:
                                return { label: 'Stitching', className: 'bg-gray-400 text-black' };
                              case OrderStatus.FITTING:
                                return { label: 'Fitting', className: 'bg-pink-300 text-black' };
                              case OrderStatus.READY_FOR_PICKUP:
                                return { label: 'Ready for Pickup', className: 'bg-blue-400 text-white' };
                              case OrderStatus.COMPLETED:
                                return { label: 'Completed', className: 'bg-green-400 text-black' };
                              default:
                                return { label: formData.status || 'Unknown', className: 'bg-gray-500 text-white' };
                            }
                          };
                          
                          const config = getStatusConfig(formData.status!);
                          return (
                            <span className={`inline-block px-3 py-1 text-sm font-medium rounded ${config.className}`}>
                              {config.label}
                            </span>
                          );
                        })()}
                      </div>
                    ) : (
                      <select
                        value={formData.status || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as OrderStatus }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select</option>
                        {ORDER_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </>
            ) : activeTab === 'bulk' ? (
          // Bulk Custom Order Form
          <>
            {/* Bulk ID */}
            <div>
             <label className="block text-sm font-medium mb-2">Bulk ID *</label>
              <select
                value={bulkCustomFormData.bulkId}
                onChange={(e) => handleBulkCustomInputChange('bulkId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.bulkId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                disabled={modalMode === "view" || bulkIdsLoading}
                required
              >
                <option value="">Select Bulk ID</option>
                {bulkIds.map((bulkData) => {
                  // Get the customer data using the corporate_customer_id
                  const customer = getCustomerById(bulkData.corporate_customer_id);
                  const customerName = customer ? (customer.company_name || getCustomerDisplayName(customer)) : `Customer ID: ${bulkData.corporate_customer_id}`;
                  
                  return (
                    <option key={bulkData.id} value={bulkData.id}>
                       {bulkData.id} - {customerName} ({bulkData.batch_name || 'No Batch Name'})
                    </option>
                  );
                })}
              </select>
              {bulkIdsLoading && (
                <p className="mt-1 text-sm text-blue-600">Loading bulk IDs...</p>
              )}
              {bulkIdsError && (
                <p className="mt-1 text-sm text-red-600">Error loading bulk IDs: {bulkIdsError}</p>
              )}
              {formErrors.bulkId && (
                <p className="mt-1 text-sm text-red-600">{formErrors.bulkId}</p>
              )}
            </div>

           {/* Product Type Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Product Type *</label>
              <select
                value={bulkProductFilterType}
                onChange={(e) => {
                  const newType = e.target.value as ProductFilterType;
                  setBulkProductFilterType(newType);
                  handleBulkCustomInputChange('productId', '');
                  
                  if (newType === ProductFilterType.CUSTOM && bulkCustomFormData.bulkId && bulkIds.length > 0) {
                    const selectedBulkData = bulkIds.find(bulk => bulk.id.toString() === bulkCustomFormData.bulkId);
                    if (selectedBulkData) {
                      setSelectedCustomerForBulkProducts(selectedBulkData.corporate_customer_id);
                    }
                  } else if (newType === ProductFilterType.DEFAULT) {
                    setSelectedCustomerForBulkProducts(null);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={modalMode === "view"}
              >
                {PRODUCT_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

          {/* Product Category Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Product Category *</label>
            {modalMode === "view" ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                {(() => {
                  const bulkData = bulkIds.find(bulk => bulk.id.toString() === bulkCustomFormData.bulkId);
                  if (bulkData) {
                    const product = getProductById(bulkData.product_id);
                    return product ? `${product.category_name} ${product.customer_id ? '(Custom)' : ''}` : `Product ID: ${bulkData.product_id}`;
                  }
                  return 'Unknown Product';
                })()}
              </div>
            ) : (
              <>
                <select
                  value={bulkCustomFormData.productId}
                  onChange={(e) => handleBulkCustomInputChange('productId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    formErrors.productId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2`}
                  disabled={productsLoading || (bulkProductFilterType === ProductFilterType.CUSTOM && !bulkCustomFormData.bulkId)}
                  required
                >
                  <option value="">
                    {bulkProductFilterType === ProductFilterType.CUSTOM && !bulkCustomFormData.bulkId 
                      ? "Select bulk ID first" 
                      : "Select Product"
                    }
                  </option>
                  {products
                    .filter((product) => {
                      if (bulkProductFilterType === ProductFilterType.DEFAULT) {
                        return !product.customer_id;
                      } else if (bulkProductFilterType === ProductFilterType.CUSTOM) {
                        if (bulkCustomFormData.bulkId && bulkIds.length > 0) {
                          const selectedBulkData = bulkIds.find(bulk => bulk.id.toString() === bulkCustomFormData.bulkId);
                          return selectedBulkData && product.customer_id === selectedBulkData.corporate_customer_id;
                        }
                        return false;
                      }
                      return true;
                    })
                    .map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.category_name} {product.customer_id ? '(Custom)' : ''}
                      </option>
                    ))
                  }
                </select>
                {formErrors.productId && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.productId}</p>
                )}
              </>
            )}
          </div>
            {/* Order Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Order Type *</label>
              <select
                value={bulkCustomFormData.orderType}
                onChange={(e) => handleBulkCustomInputChange('orderType', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.orderType ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                disabled={modalMode === "view"}
                required
              >
                <option value="">Select Order Type</option>
                <option value="bulk">Bulk</option>
                <option value="custom">Custom</option>
              </select>
              {formErrors.orderType && (
                <p className="mt-1 text-sm text-red-600">{formErrors.orderType}</p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium mb-2">Quantity *</label>
              <input
                type="number"
                min="1"
                value={bulkCustomFormData.quantity}
                onChange={(e) => handleBulkCustomInputChange('quantity', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.quantity ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                placeholder="Enter quantity"
                readOnly={modalMode === "view"}
                required
              />
              {formErrors.quantity && (
                <p className="mt-1 text-sm text-red-600">{formErrors.quantity}</p>
              )}
            </div>

            {/* Unit Price */}
          <div>
          <label className="block text-sm font-medium mb-2">Unit Price *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
              Rs.
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={bulkCustomFormData.unitPrice}
              onChange={(e) => handleBulkCustomInputChange('unitPrice', e.target.value)}
              className={`w-full pl-12 pr-3 py-2 border rounded-lg ${
                formErrors.unitPrice ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              } focus:outline-none focus:ring-2`}
              placeholder="00.00"
              readOnly={modalMode === "view"}
              required
            />
          </div>
          {formErrors.unitPrice && (
            <p className="mt-1 text-sm text-red-600">{formErrors.unitPrice}</p>
          )}
        </div>

          {/* Style Preferences */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {bulkProductFilterType === ProductFilterType.CUSTOM ? 'Style & Material Preference' : 'Style Preferences'}
            </label>
            {modalMode === "view" ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                {bulkCustomFormData.stylePreferences || `No ${bulkProductFilterType === ProductFilterType.CUSTOM ? 'style & material preferences' : 'style preferences'} provided`}
              </div>
            ) : (
              <input
                type="text"
                value={bulkCustomFormData.stylePreferences}
                onChange={(e) => handleBulkCustomInputChange('stylePreferences', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Enter ${bulkProductFilterType === ProductFilterType.CUSTOM ? 'style & material preferences' : 'style preferences'}`}
              />
            )}
          </div>

            {/* Special Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">Special Notes</label>
              {modalMode === "view" ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 min-h-[80px]">
                  {bulkCustomFormData.specialNotes || 'No special notes provided'}
                </div>
              ) : (
                <textarea
                  rows={3}
                  value={bulkCustomFormData.specialNotes}
                  onChange={(e) => handleBulkCustomInputChange('specialNotes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter any special notes"
                />
              )}
            </div>

            {/* Status (for view/edit mode) */}
            {(modalMode === "view" || modalMode === "edit") && (
              <div>
                <label className="block text-sm font-medium mb-2">Status *</label>
                {modalMode === "view" ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    {(() => {
                      const getStatusConfig = (status: OrderStatus) => {
                        switch (status) {
                          case OrderStatus.ORDER_CONFIREMED:
                            return { label: 'Order Confirmed', className: 'bg-yellow-400 text-black' };
                          case OrderStatus.FABRIC_READY:
                            return { label: 'Fabric Ready', className: 'bg-orange-400 text-black' };
                          case OrderStatus.CUTTING:
                            return { label: 'Cutting', className: 'bg-pink-400 text-black' };
                          case OrderStatus.STITCHING:
                            return { label: 'Stitching', className: 'bg-gray-400 text-black' };
                          case OrderStatus.FITTING:
                            return { label: 'Fitting', className: 'bg-pink-300 text-black' };
                          case OrderStatus.READY_FOR_PICKUP:
                            return { label: 'Ready for Pickup', className: 'bg-blue-400 text-white' };
                          case OrderStatus.COMPLETED:
                            return { label: 'Completed', className: 'bg-green-400 text-black' };
                          default:
                            return { label: bulkCustomFormData.status || 'Unknown', className: 'bg-gray-500 text-white' };
                        }
                      };
                      
                      const config = getStatusConfig(bulkCustomFormData.status!);
                      return (
                        <span className={`inline-block px-3 py-1 text-sm font-medium rounded ${config.className}`}>
                          {config.label}
                        </span>
                      );
                    })()}
                  </div>
                ) : (
          <select
            value={bulkCustomFormData.status || ''}
            onChange={(e) => setBulkCustomFormData(prev => ({ ...prev, status: e.target.value as OrderStatus }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select</option>
            {ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
    )}
  </>
): activeTab === 'default' ? (
              // Bulk Default Order Form
              <>
                {/* Customer Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Customer ID *</label>
                  <select
                    value={bulkDefaultFormData.customerId}
                    onChange={(e) => handleBulkDefaultInputChange('customerId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      formErrors.customerId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } focus:outline-none focus:ring-2`}
                    disabled={modalMode === "view" || customersLoading}
                    required
                  >
                    <option value="">Select Customer ID</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                     {customer.id} - {getCustomerDisplayName(customer)}
                      </option>
                    ))}
                  </select>
                  {formErrors.customerId && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.customerId}</p>
                  )}
                </div>

                {/* Product Category */}
                    <div>
                  <label className="block text-sm font-medium mb-2">Product Category *</label>
                  <select
                    value={bulkDefaultFormData.productId}
                    onChange={(e) => handleBulkDefaultInputChange('productId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      formErrors.productId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } focus:outline-none focus:ring-2`}
                    disabled={modalMode === "view" || productsLoading}
                    required
                  >
                    <option value="">Select Product Category</option>
                    {products
                      .filter((product) => !product.customer_id) // Only show default products (non-custom)
                      .map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.category_name}
                        </option>
                      ))}
                  </select>
                  {formErrors.productId && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.productId}</p>
                  )}
                </div>

                {/* Size and Quantity Section */}
                <div>
           <div className="grid grid-cols-2 gap-4 mb-2">
            <label className="block text-sm font-medium">Size *</label>
            <label className="block text-sm font-medium -ml-7 ">Quantity *</label>
          </div>
                            
                  <div className="space-y-3">
                    {bulkDefaultFormData.sizeQuantities.map((sizeQuantity, index) => (
                     <div key={index} className="flex gap-2 w-full">
                      <select
                          value={sizeQuantity.size}
                          onChange={(e) => updateSizeQuantity(index, 'size', e.target.value)}
                          className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={modalMode === "view"}
                        >
                          {SIZE_OPTIONS.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="0"
                          value={sizeQuantity.quantity}
                          onChange={(e) => updateSizeQuantity(index, 'quantity', e.target.value)}
                          className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter quantity"
                          readOnly={modalMode === "view"}
                         />
                          {modalMode !== "view" && (
                            <Button
                              type="button"
                              onClick={() => removeSizeQuantity(index)}
                              className="bg-red-600 hover:bg-red-700 text-white p-2 flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                      </div>
                    ))}
                    
                    {modalMode !== "view" && (
                      <Button
                        type="button"
                        onClick={addSizeQuantity}
                        className="bg-blue-600 hover:bg-blue-700 text-white w-full flex items-center justify-center mt-3"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    )}
                    
                    {bulkDefaultFormData.sizeQuantities.length === 0 && modalMode === "view" && (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                        No size quantities specified
                      </div>
                    )}
                  </div>
                  
                  {formErrors.sizeQuantities && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.sizeQuantities}</p>
                  )}
                </div>

                {/* Unit Price */}
               <div>
                <label className="block text-sm font-medium mb-2">Unit Price *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bulkDefaultFormData.unitPrice}
                    onChange={(e) => handleBulkDefaultInputChange('unitPrice', e.target.value)}
                    className={`w-full pl-12 pr-3 py-2 border rounded-lg ${
                      formErrors.unitPrice ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } focus:outline-none focus:ring-2`}
                    placeholder="00.00"
                    readOnly={modalMode === "view"}
                    required
                  />
                </div>
                {formErrors.unitPrice && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.unitPrice}</p>
                )}
              </div>
                              {/* Style Preferences */}
                <div>
                  <label className="block text-sm font-medium mb-2">Style Preferences</label>
                  {modalMode === "view" ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                      {bulkDefaultFormData.stylePreferences || 'No style preferences provided'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={bulkDefaultFormData.stylePreferences}
                      onChange={(e) => handleBulkDefaultInputChange('stylePreferences', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter style preferences"
                    />
                  )}
                </div>

                {/* Special Notes */}
                <div>
                  <label className="block text-sm font-medium mb-2">Special Notes</label>
                  {modalMode === "view" ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 min-h-[80px]">
                      {bulkDefaultFormData.specialNotes || 'No special notes provided'}
                    </div>
                  ) : (
                    <textarea
                      rows={3}
                      value={bulkDefaultFormData.specialNotes}
                      onChange={(e) => handleBulkDefaultInputChange('specialNotes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter any special notes"
                    />
                  )}
                </div>

                {/* Status (for view/edit mode) */}
                {(modalMode === "view" || modalMode === "edit") && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Status *</label>
                    {modalMode === "view" ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                        {(() => {
                          const getStatusConfig = (status: OrderStatus) => {
                            switch (status) {
                              case OrderStatus.ORDER_CONFIREMED:
                                return { label: 'Order Confirmed', className: 'bg-yellow-400 text-black' };
                              case OrderStatus.FABRIC_READY:
                                return { label: 'Fabric Ready', className: 'bg-orange-400 text-black' };
                              case OrderStatus.CUTTING:
                                return { label: 'Cutting', className: 'bg-pink-400 text-black' };
                              case OrderStatus.STITCHING:
                                return { label: 'Stitching', className: 'bg-gray-400 text-black' };
                              case OrderStatus.FITTING:
                                return { label: 'Fitting', className: 'bg-pink-300 text-black' };
                              case OrderStatus.READY_FOR_PICKUP:
                                return { label: 'Ready for Pickup', className: 'bg-blue-400 text-white' };
                              case OrderStatus.COMPLETED:
                                return { label: 'Completed', className: 'bg-green-400 text-black' };
                              default:
                                return { label: bulkDefaultFormData.status || 'Unknown', className: 'bg-gray-500 text-white' };
                            }
                          };
                          
                          const config = getStatusConfig(bulkDefaultFormData.status!);
                          return (
                            <span className={`inline-block px-3 py-1 text-sm font-medium rounded ${config.className}`}>
                              {config.label}
                            </span>
                          );
                        })()}
                      </div>
                    ) : (
                      <select
                        value={bulkDefaultFormData.status || ''}
                        onChange={(e) => setBulkDefaultFormData(prev => ({ ...prev, status: e.target.value as OrderStatus }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select</option>
                        {ORDER_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </>
            ) : null}

            {/* Button Section */}
            <div className="flex justify-end pt-4 gap-3">
              {modalMode === "view" ? (
                <>
                 {shouldShowDeleteButton() && (
                  <Button 
                    type="button"
                    onClick={() => {
                      if (!selectedOrder) return;
                      
                      // Close the view modal first
                      setIsModalOpen(false);
                      
                      // Set up the delete modal with the selected order
                      setTimeout(() => {
                        const customerName = getOrderDisplayName(selectedOrder);
                        setOrderToDelete({ order: selectedOrder, customerName });
                        setIsDeleteModalOpen(true);
                      }, 100);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete
                  </Button>
                )}
                  {shouldShowEditButton() && (
                    <Button 
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setTimeout(() => {
                          setModalMode("edit");
                          setIsModalOpen(true);
                        }, 100);
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Edit
                    </Button>
                  )}
                </>
              ) : (
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={getLoadingState() || isLoading}
                >
                  {getLoadingState() ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      {modalMode === "create" ? "Creating..." : "Updating..."}
                    </>
                  ) : (
                    modalMode === "create" ? "Create Order" : "Update Order"
                  )}
                </Button>
              )}
            </div>
          </form>
        </SlideModal>

        {/* Message Modal */}
        <MessageModal
          isOpen={messageModal.isOpen}
          onClose={closeMessageModal}
          type={messageModal.type}
          title={messageModal.title}
          message={messageModal.message}
        />

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div 
              className="fixed inset-0 bg-blue-50/70 bg-opacity-50 transition-opacity"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setOrderToDelete(null);
              }}
            />
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                &#8203;
              </span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <Trash2 className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Delete Order
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete the order for "{orderToDelete ? orderToDelete.customerName : 'this customer'}"? This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={getLoadingState()}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {getLoadingState() ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setOrderToDelete(null);
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SingleOrderManagement;