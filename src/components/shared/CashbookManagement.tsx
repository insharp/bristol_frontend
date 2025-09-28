// components/shared/CashBookManagement.tsx
"use client";
import React, { useEffect, useState, useMemo } from "react";
import Button from "@/components/ui/button";
import ReusableTable from "@/components/ui/ReusableTable";
import SlideModal from "@/components/ui/SlideModal";
import { useCashbook, CashBookEntry, CashBookFormData, ReferenceEntry } from "@/app/hooks/useCashbook";
import { Plus, RefreshCw, Calendar, X, Search, CalendarDays } from "lucide-react";

interface CashBookManagementProps {
  title?: string;
  apiEndpoint?: string;
  permissions?: {
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canView?: boolean;
    canViewSummary?: boolean;
  };
  customActions?: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: (entry: CashBookEntry) => void;
    className?: string;
  }>;
}

// Date Range Picker Component
const DateRangePicker = ({
  startDate,
  endDate,
  onDateChange,
  isOpen,
  onToggle,
  hasCustomDateRange,
  onCancel
}: {
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  hasCustomDateRange: boolean;
  onCancel: () => void;
}) => {
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  const handleApply = () => {
    onDateChange(tempStartDate, tempEndDate);
    onToggle();
  };

  const handleCancel = () => {
    // Reset temp dates to original values
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    onCancel(); // Reset the custom date range state
    onToggle();
  };

  const getDateRangeLabel = (hasCustomRange: boolean) => {
    // If no custom range is selected, show default text
    if (!hasCustomRange) {
      return "Pick Date Range";
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    // Check if it's today
    if (startDate === endDate && startDate === today.toISOString().split('T')[0]) {
      return "Today";
    }
    
    // Custom range - show in DD/MM/YYYY format
    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    };
    
    const formattedStart = formatDate(start);
    const formattedEnd = formatDate(end);
    
    // If same date, show just one date
    if (startDate === endDate) {
      return formattedStart;
    }
    
    // Show date range
    return `${formattedStart} - ${formattedEnd}`;
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <CalendarDays className="w-4 h-4 mr-2" />
        {getDateRangeLabel(hasCustomDateRange)}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100"
      >
        <CalendarDays className="w-4 h-4 mr-2" />
        {getDateRangeLabel(hasCustomDateRange)}
      </button>
      
      <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 min-w-[320px] max-w-[400px]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
             <input
                type="date"
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// CashSummaryTable Component - Updated with sub-tabs and totals
const CashSummaryTable = ({ apiEndpoint }: { apiEndpoint?: string }) => {
  const { fetchSummary, loading } = useCashbook(apiEndpoint);
  const [summaryData, setSummaryData] = useState<any>(null);
  
  // Summary-specific state
  const [summaryTab, setSummaryTab] = useState<"Today" | "All">("Today");
  const [summaryDateRange, setSummaryDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [isSummaryDatePickerOpen, setIsSummaryDatePickerOpen] = useState(false);
  const [hasSummaryCustomDateRange, setHasSummaryCustomDateRange] = useState(false);

  // Calculate effective date range based on tab
  const effectiveDateRange = useMemo(() => {
    if (summaryTab === "Today") {
      const today = new Date().toISOString().split('T')[0];
      return { startDate: today, endDate: today };
    } else {
      // For "All" tab, only apply date filter if user has explicitly selected a custom range
      if (hasSummaryCustomDateRange) {
        return summaryDateRange;
      } else {
        // Return null to indicate no date filtering should be applied
        return null;
      }
    }
  }, [summaryTab, summaryDateRange, hasSummaryCustomDateRange]);

  // Load summary data
  useEffect(() => {
    const loadSummaryData = async () => {
      if (summaryTab === "Today") {
        // For today, use specific date range
        const today = new Date().toISOString().split('T')[0];
        const summaryResult = await fetchSummary(today, today);
        if (summaryResult.success && summaryResult.data) {
          setSummaryData(summaryResult.data);
        }
      } else {
        // For "All" tab
        if (hasSummaryCustomDateRange) {
          // Use custom date range if selected
          const summaryResult = await fetchSummary(
            summaryDateRange.startDate, 
            summaryDateRange.endDate
          );
          if (summaryResult.success && summaryResult.data) {
            setSummaryData(summaryResult.data);
          }
        } else {
          // Fetch all records without date filtering
          // You may need to adjust this based on your API - some APIs expect a very wide range
          const currentYear = new Date().getFullYear();
          const startOfYear = `${currentYear - 1}-01-01`; // Go back 1 year to get comprehensive data
          const endOfYear = `${currentYear + 1}-12-31`; // Go forward to ensure we get all data
          
          const summaryResult = await fetchSummary(startOfYear, endOfYear);
          if (summaryResult.success && summaryResult.data) {
            setSummaryData(summaryResult.data);
          }
        }
      }
    };
    loadSummaryData();
  }, [fetchSummary, summaryTab, summaryDateRange, hasSummaryCustomDateRange]);

  // Handle summary date range change
  const handleSummaryDateRangeChange = (startDate: string, endDate: string) => {
    setSummaryDateRange({ startDate, endDate });
    setHasSummaryCustomDateRange(true);
  };

  // Handle summary date range cancel
  const handleSummaryDateRangeCancel = () => {
    setHasSummaryCustomDateRange(false);
  };

  // Format date for display in Cash Summary
  const formatDateDisplay = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    
    const isToday = date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
    
    if (isToday) {
      return "Today";
    } else {
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit", 
        year: "numeric"
      });
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Process daily summaries for table display
  const tableData = useMemo(() => {
    if (!summaryData?.daily_summaries) return [];

    return summaryData.daily_summaries.map((day: any) => ({
      id: day.date,
      date: day.date,
      amount_received: parseFloat(day.total_income) || 0,
      amount_spent: parseFloat(day.total_expense) || 0,
      cash_summary: (parseFloat(day.total_income) || 0) - (parseFloat(day.total_expense) || 0),
      profit_loss: ((parseFloat(day.total_income) || 0) - (parseFloat(day.total_expense) || 0)) >= 0 ? 'Profit' : 'Loss'
    }));
  }, [summaryData]);

  // Calculate totals for the period - More comprehensive approach
  const periodTotals = useMemo(() => {
    if (!summaryData) {
      return { totalIncome: 0, totalExpense: 0, netAmount: 0, profitLoss: 'Break-even' };
    }

    let totalIncome = 0;
    let totalExpense = 0;

    // Method 1: Try direct totals from API response
    if (typeof summaryData.total_income !== 'undefined' && typeof summaryData.total_expense !== 'undefined') {
      totalIncome = parseFloat(summaryData.total_income) || 0;
      totalExpense = parseFloat(summaryData.total_expense) || 0;
      console.log('Using direct API totals:', { totalIncome, totalExpense });
    }
    // Method 2: Calculate from daily summaries
    else if (summaryData.daily_summaries && Array.isArray(summaryData.daily_summaries)) {
      totalIncome = summaryData.daily_summaries.reduce((sum: number, day: any) => {
        const dayIncome = parseFloat(day.total_income) || 0;
        return sum + dayIncome;
      }, 0);
      
      totalExpense = summaryData.daily_summaries.reduce((sum: number, day: any) => {
        const dayExpense = parseFloat(day.total_expense) || 0;
        return sum + dayExpense;
      }, 0);
      
      console.log('Calculated from daily summaries:', { 
        totalIncome, 
        totalExpense,
        dailyCount: summaryData.daily_summaries.length
      });
    }
    // Method 3: Try alternative field names
    else if (summaryData.period_income || summaryData.period_expense) {
      totalIncome = parseFloat(summaryData.period_income) || 0;
      totalExpense = parseFloat(summaryData.period_expense) || 0;
      console.log('Using period totals:', { totalIncome, totalExpense });
    }

    const netAmount = totalIncome - totalExpense;
    const profitLoss = netAmount > 0 ? 'Profit' : netAmount < 0 ? 'Loss' : 'Break-even';

    // Detailed logging for debugging
    console.log('Final Period Totals:', {
      summaryData: summaryData,
      calculationMethod: summaryData.total_income !== undefined ? 'direct' : 'calculated',
      totalIncome: totalIncome,
      totalExpense: totalExpense,
      netAmount: netAmount,
      profitLoss: profitLoss,
      dateRange: effectiveDateRange
    });

    return { totalIncome, totalExpense, netAmount, profitLoss };
  }, [summaryData, effectiveDateRange]);

  // Table columns - Wider columns for better spacing, no actions
  const columns = [
    { 
      key: "date", 
      label: "Date", 
      width: "200px", // Increased width
      render: (value: string) => (
        <span className="text-sm text-gray-900 font-medium">
          {formatDateDisplay(value)}
        </span>
      ),
    },
    {
      key: "amount_received",
      label: "Cash-In (Rs.)",
      width: "250px", // Increased width
      render: (value: number) => (
        <span className="text-sm text-green-600 font-medium">
          Rs. {formatCurrency(value)}
        </span>
      ),
    },
    {
      key: "amount_spent",
      label: "Cash-Out (Rs.)",
      width: "250px", // Increased width
      render: (value: number) => (
        <span className="text-sm text-red-600 font-medium">
          Rs. {formatCurrency(value)}
        </span>
      ),
    },
    {
      key: "cash_summary",
      label: "Net Amount (Rs.)",
      width: "250px", // Increased width
      render: (value: number) => (
        <span className={`text-sm font-medium ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          Rs. {formatCurrency(value)}
        </span>
      ),
    },
    {
      key: "profit_loss",
      label: "Result",
      width: "200px", // Increased width
      render: (value: string) => (
        <span className={`inline-flex px-3 py-2 text-sm font-medium rounded-full ${
          value === 'Profit'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      ),
    }
  ];

  return (
    <div className="space-y-4">
      {/* Summary Header with Tabs and Controls */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Cash Summary</h2>
        </div>

        {/* Today/All Sub-tabs and Date Range Picker */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-4 items-center">
            <button
              onClick={() => setSummaryTab("Today")}
              className={`px-3 py-1 text-sm font-medium border-b-2 ${
                summaryTab === "Today"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSummaryTab("All")}
              className={`px-3 py-1 text-sm font-medium border-b-2 ${
                summaryTab === "All"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              All
            </button>
          </div>

          {/* Date Range Picker - Only show for "All" tab */}
          {summaryTab === "All" && (
            <div className="relative">
              <DateRangePicker
                startDate={summaryDateRange.startDate}
                endDate={summaryDateRange.endDate}
                onDateChange={handleSummaryDateRangeChange}
                isOpen={isSummaryDatePickerOpen}
                onToggle={() => setIsSummaryDatePickerOpen(!isSummaryDatePickerOpen)}
                hasCustomDateRange={hasSummaryCustomDateRange}
                onCancel={handleSummaryDateRangeCancel}
              />
            </div>
          )}
        </div>

        {/* Period Totals Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 p-6 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Cash-In</p>
            <p className="text-xl font-bold text-green-600">Rs. {formatCurrency(periodTotals.totalIncome)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Cash-Out</p>
            <p className="text-xl font-bold text-red-600">Rs. {formatCurrency(periodTotals.totalExpense)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Net Amount</p>
            <p className={`text-xl font-bold ${periodTotals.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Rs. {formatCurrency(periodTotals.netAmount)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Result</p>
            <span className={`inline-flex px-4 py-2 text-base font-semibold rounded-full ${
              periodTotals.profitLoss === 'Profit' ? 'bg-green-100 text-green-800' :
              periodTotals.profitLoss === 'Loss' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {periodTotals.profitLoss}
            </span>
          </div>
        </div>

        {/* Close date picker when clicking outside */}
        {isSummaryDatePickerOpen && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsSummaryDatePickerOpen(false)}
          />
        )}
      </div>

      {/* Summary Table */}
      <div className="flex-1 min-h-0">
        <ReusableTable
          data={tableData}
          columns={columns}
          actions={[]} // No actions for summary view
          loading={loading}
          emptyMessage="No summary data available for the selected period."
        />
      </div>
    </div>
  );
};

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
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg max-w-md w-full mx-4 border border-white/20">
        <div className="p-6">
          <div className="flex items-center mb-4">
            {type === 'success' ? (
              <div className="w-10 h-10 bg-green-100/80 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-10 h-10 bg-red-100/80 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-700 mb-6">{message}</p>
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


// Delete Confirmation Modal
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  entryInfo,
  loading = false
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entryInfo: { type: string; amount: string; description: string; date: string };
  loading?: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-blue-50/70 bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl max-w-lg w-full mx-4 border border-white/20 relative z-[10001]">
        <div className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Entry</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete this {entryInfo.type} entry of Rs.{entryInfo.amount} for "{entryInfo.description}" on {entryInfo.date}? This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end mt-6 gap-3">
            <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CashBookManagement: React.FC<CashBookManagementProps> = ({
  title = "Cash Book",
  apiEndpoint,
  permissions = {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canView: true,
    canViewSummary: true
  },
  customActions = []
}) => {
  // Hook usage
  const {
    entries,
    summary,
    loading,
    formData,
    setFormData,
    fetchEntries,
    fetchSummary,
    createIncomeEntry,
    createExpenseEntry,
    updateEntry,
    deleteEntry,
    getEntryById
  } = useCashbook(apiEndpoint);

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [entryType, setEntryType] = useState<"income" | "expense">("income");
  const [selectedEntry, setSelectedEntry] = useState<CashBookEntry | null>(null);
  const [activeTab, setActiveTab] = useState<"Today" | "All">("Today");
  const [activeTimeFilter, setActiveTimeFilter] = useState<"Recent Expense" | "Recent Income" | "Cash Summary">("Recent Income");
  
  // Date range state
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0], // Today
    endDate: new Date().toISOString().split('T')[0]    // Today
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [hasCustomDateRange, setHasCustomDateRange] = useState(false); // Track if user has set custom range
  
  // References state
  const [newReference, setNewReference] = useState({ type: "", detail: "" });

  // Reference types
  const referenceTypes = [
    { value: "payment", label: "Payment Reference" },
    { value: "invoice", label: "Invoice Reference" },
    { value: "order", label: "Order Reference" },
    { value: "external", label: "External Reference" }
  ];

  const [formErrors, setFormErrors] = useState({
    amount: '',
    description: '',
    transaction_date: ''
  });

  // Message Modal State
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: ''
  });

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    entryId: 0,
    entryInfo: {
      type: '',
      amount: '',
      description: '',
      date: ''
    },
    isDeleting: false
  });

  // Debug state
  const [debugInfo, setDebugInfo] = useState({
    totalEntries: 0,
    filteredCount: 0,
    apiError: null as string | null
  });

  // Initialize date range to current month on mount but set flag for showing all
  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    
    // Set initial date range to current month
    setDateRange({
      startDate: firstDayOfMonth,
      endDate: todayStr
    });
    setHasCustomDateRange(false); // Initially show all records
    setActiveTab("All"); // Default to "All" to show all records initially
  }, []);

  // Utility functions
  const showSuccessMessage = (title: string, message: string) => {
    setMessageModal({ isOpen: true, type: 'success', title, message });
  };

  const showErrorMessage = (title: string, message: string) => {
    setMessageModal({ isOpen: true, type: 'error', title, message });
  };

  const closeMessageModal = () => {
    setMessageModal({ ...messageModal, isOpen: false });
  };

  // Safe number conversion utility
  const safeParseNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Safe number formatting utility
  const safeFormatNumber = (value: any, decimals: number = 2): string => {
    const num = safeParseNumber(value);
    return num.toFixed(decimals);
  };

  // Date formatting utility
  const formatDateDisplay = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    
    // Check if the date is today
    const isToday = date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
    
    if (isToday) {
      return "Today";
    } else {
      // Return date in DD/MM/YYYY format
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    }
  };

  // References helper functions
  const addReference = () => {
    if (newReference.type && newReference.detail.trim()) {
      const newRef: ReferenceEntry = {
        id: Date.now().toString(),
        type: newReference.type,
        name: referenceTypes.find(type => type.value === newReference.type)?.label || newReference.type,
        detail: newReference.detail.trim()
      };
      setFormData({
        ...formData,
        references: [...formData.references, newRef]
      });
      setNewReference({ type: "", detail: "" });
    }
  };

  const removeReference = (id: string) => {
    setFormData({
      ...formData,
      references: formData.references.filter(ref => ref.id !== id)
    });
  };

  const validateForm = () => {
    const errors = {
      amount: '',
      description: '',
      transaction_date: ''
    };

    const amountValue = safeParseNumber(formData.amount);
    if (!formData.amount || amountValue <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.transaction_date) {
      errors.transaction_date = 'Transaction date is required';
    }

    setFormErrors(errors);
    return Object.values(errors).every(error => !error);
  };

  // Modal title function
  const getModalTitle = () => {
    const typeText = entryType === 'income' ? 'Income' : 'Expense';
    switch (modalMode) {
      case "create": return `Add New ${typeText} Record`;
      case "edit": return `Edit ${typeText} Entry`;
      case "view": return `View ${typeText} Entry`;
      default: return 'Cash Book Entry';
    }
  };

  const getDynamicTitle = () => {
    let baseTitle = "";
    
    // Determine base title based on active time filter
    if (activeTimeFilter === "Recent Income") {
      baseTitle = "Income";
    } else if (activeTimeFilter === "Recent Expense") {
      baseTitle = "Expenses";
    } else {
      baseTitle = "Transactions";
    }
    
    // Add time period prefix based on active tab
    const timePrefix = activeTab === "Today" ? "Today's" : "All";
    
    return `${timePrefix} ${baseTitle}`;
  };

  // Date range change handler
  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
    setHasCustomDateRange(true); // Mark that user has selected a custom range
    // When custom date range is selected, switch to "All" tab
    setActiveTab("All");
  };

  // Handle cancel - reset to show "Pick Date Range"
  const handleDateRangeCancel = () => {
    setHasCustomDateRange(false); // Reset to show "Pick Date Range"
  };

  // Effect hooks
  useEffect(() => {
    const loadInitialData = async () => {
      console.log('Loading initial data...');
      const result = await fetchEntries();
      if (!result.success) {
        console.error('Failed to fetch entries:', result.error);
        setDebugInfo(prev => ({ ...prev, apiError: result.error || 'Unknown error' }));
        showErrorMessage('Fetch Error', result.error || 'Failed to load entries');
      } else {
        console.log('Entries loaded successfully');
        setDebugInfo(prev => ({ ...prev, apiError: null }));
      }
    };
    
    loadInitialData();
  }, [fetchEntries]);

  // Memoize filtered entries to prevent infinite re-renders
  const filteredEntries = useMemo(() => {
    let filtered = entries;
    
    // Apply transaction type filter
    if (activeTimeFilter === "Recent Income") {
      filtered = filtered.filter(entry => entry.transaction_type === 'income');
    } else if (activeTimeFilter === "Recent Expense") {
      filtered = filtered.filter(entry => entry.transaction_type === 'expense');
    }

    // Apply date filter
    if (activeTab === "Today") {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.transaction_date).toISOString().split('T')[0];
        return entryDate === today;
      });
    } else if (activeTab === "All" && hasCustomDateRange) {
      // Only apply date range filter for "All" tab if user has explicitly selected a custom range
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.transaction_date).toISOString().split('T')[0];
        return entryDate >= dateRange.startDate && entryDate <= dateRange.endDate;
      });
    }
    // If activeTab is "All" and no custom date range is set, show all entries (no date filtering)

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => {
        const matchesBasicFields = 
          entry.description.toLowerCase().includes(searchLower) ||
          (entry.special_notes && entry.special_notes.toLowerCase().includes(searchLower)) ||
          safeParseNumber(entry.amount).toString().includes(searchQuery);

        // Search in references
        let matchesReferences = false;
        if (entry.references) {
          try {
            const refs = JSON.parse(entry.references);
            if (Array.isArray(refs)) {
              matchesReferences = refs.some((ref: any) => 
                (ref.name && ref.name.toLowerCase().includes(searchLower)) ||
                (ref.detail && ref.detail.toLowerCase().includes(searchLower)) ||
                (ref.type && ref.type.toLowerCase().includes(searchLower))
              );
            }
          } catch {
            // Fallback for non-JSON references
            matchesReferences = entry.references.toLowerCase().includes(searchLower);
          }
        }

        return matchesBasicFields || matchesReferences;
      });
      console.log(`After search filter: ${filtered.length} entries`);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());

    return filtered;
  }, [entries, activeTab, activeTimeFilter, searchQuery, dateRange, hasCustomDateRange]);

  // Clear form errors when form data changes - with proper dependency control
  useEffect(() => {
    // Only clear errors if there are actually errors to clear
    const hasErrors = Object.values(formErrors).some(error => error !== '');
    if (hasErrors) {
      const timer = setTimeout(() => {
        setFormErrors({
          amount: '',
          description: '',
          transaction_date: ''
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [formData.amount, formData.description, formData.transaction_date]);

  // Table columns - Updated with separate Reference and Reference Details columns and improved date display
  const columns = [
    { 
      key: "transaction_date", 
      label: "Date", 
      width: "140px",
      render: (value: string) => (
        <span className="text-sm text-gray-900 font-medium">
          {formatDateDisplay(value)}
        </span>
      ),
    },
    {
      key: "transaction_type",
      label: "Type",
      width: "120px",
      render: (value: string) => (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          value === 'income' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {value === 'income' ? 'Income' : 'Expense'}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount (Rs.)",
      width: "200px",
      render: (value: any, row: CashBookEntry) => {
        const amount = safeParseNumber(value);
        return (
          <span className={`text-sm font-medium ${
            row.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
          }`}>
            {row.transaction_type === 'income' ? '+' : '-'}Rs. {amount.toLocaleString()}
          </span>
        );
      },
    },
    {
      key: "description",
      label: "Description",
      minWidth: "180px",
      render: (value: string) => (
        <span className="text-sm text-gray-900">{value}</span>
      ),
    },
    {
      key: "references",
      label: "Reference",
      width: "140px",
      render: (value: string) => {
        if (!value) return <span className="text-sm text-gray-400">-</span>;
        
        try {
          const refs = JSON.parse(value);
          if (Array.isArray(refs) && refs.length > 0) {
            return (
              <div className="space-y-1">
                {refs.slice(0, 2).map((ref: any, index: number) => (
                  <span 
                    key={index} 
                    className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"
                  >
                    {referenceTypes.find(type => type.value === ref.type)?.label || ref.type}
                  </span>
                ))}
                {refs.length > 2 && (
                  <span className="text-xs text-gray-500">+{refs.length - 2} more</span>
                )}
              </div>
            );
          }
        } catch {
          // Fallback for non-JSON references
          return <span className="text-sm text-gray-600">External</span>;
        }
        
        return <span className="text-sm text-gray-400">-</span>;
      },
    },
    {
      key: "reference_details",
      label: "Reference Details",
      width: "200px",
      render: (value: string, row: CashBookEntry) => {
        if (!row.references) return <span className="text-sm text-gray-400">-</span>;
        
        try {
          const refs = JSON.parse(row.references);
          if (Array.isArray(refs) && refs.length > 0) {
            return (
              <div className="space-y-1">
                {refs.slice(0, 2).map((ref: any, index: number) => (
                  <div key={index} className="text-sm text-gray-600 truncate max-w-[180px]" title={ref.detail}>
                    {ref.detail || '-'}
                  </div>
                ))}
                {refs.length > 2 && (
                  <span className="text-xs text-gray-500">+{refs.length - 2} more details</span>
                )}
              </div>
            );
          }
        } catch {
          // Fallback for non-JSON references
          return <span className="text-sm text-gray-600">{row.references}</span>;
        }
        
        return <span className="text-sm text-gray-400">-</span>;
      },
    }
  ];

  // Modal handlers
  const openCreateModal = (type: "income" | "expense") => {
    if (!permissions.canCreate) return;
    
    setEntryType(type);
    setSelectedEntry(null);
    setFormData({
      amount: "",
      description: "",
      transaction_date: new Date().toISOString().split('T')[0],
      references: [],
      special_notes: ""
    });
    setNewReference({ type: "", detail: "" });
    setFormErrors({
      amount: '',
      description: '',
      transaction_date: ''
    });
    setModalMode("create");
    setIsModalOpen(true);
  };

  const setFormDataFromEntry = (entry: CashBookEntry) => {
    let references: ReferenceEntry[] = [];
    
    // Parse references from JSON or create from existing data
    try {
      if (entry.references) {
        const parsedRefs = JSON.parse(entry.references);
        // Ensure each reference has all required fields including type
        references = parsedRefs.map((ref: any, index: number) => ({
          id: ref.id || index.toString(),
          type: ref.type || 'external', // Default to 'external' if type is missing
          name: ref.name || referenceTypes.find(type => type.value === (ref.type || 'external'))?.label || 'External Reference',
          detail: ref.detail || ''
        }));
      }
    } catch {
      // Fallback: create references from existing fields if JSON parsing fails
      if (entry.references || entry.reference_details) {
        references = [{
          id: "1",
          type: 'external', // Default type for legacy data
          name: "External Reference",
          detail: entry.reference_details || entry.references || ""
        }];
      }
    }

    setFormData({
      amount: safeParseNumber(entry.amount).toString(),
      description: entry.description,
      transaction_date: entry.transaction_date,
      references: references,
      special_notes: entry.special_notes || ""
    });
    setEntryType(entry.transaction_type);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEntry(null);
    setFormErrors({
      amount: '',
      description: '',
      transaction_date: ''
    });
  };

  // CRUD handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    console.log('Submitting form:', { modalMode, entryType, formData });

    if (modalMode === "create") {
      const result = entryType === "income" 
        ? await createIncomeEntry()
        : await createExpenseEntry();
        
      if (result.success) {
        closeModal();
        showSuccessMessage('Success!', `${entryType === 'income' ? 'Income' : 'Expense'} entry has been recorded successfully.`);
        // Refresh the entries list
        await fetchEntries();
      } else {
        showErrorMessage('Creation Failed', result.error || 'Failed to create entry');
      }
    } else if (modalMode === "edit" && selectedEntry) {
      const result = await updateEntry(selectedEntry.id, formData);
      if (result.success) {
        closeModal();
        showSuccessMessage('Success!', 'Entry has been updated successfully.');
        // Refresh the entries list
        await fetchEntries();
      } else {
        showErrorMessage('Update Failed', result.error || 'Failed to update entry');
      }
    }
  };

  // Delete handlers - Updated with new date format
  const handleDeleteClick = (entry: CashBookEntry) => {
    const date = new Date(entry.transaction_date);
    const formattedDate = date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });

    setDeleteModal({
      isOpen: true,
      entryId: entry.id,
      entryInfo: {
        type: entry.transaction_type,
        amount: safeFormatNumber(entry.amount, 2),
        description: entry.description,
        date: formattedDate
      },
      isDeleting: false
    });
  };

  const handleDeleteFromView = () => {
    if (!permissions.canDelete || !selectedEntry) return;
    
    const date = new Date(selectedEntry.transaction_date);
    const formattedDate = date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long", 
      year: "numeric"
    });

    setDeleteModal({
      isOpen: true,
      entryId: selectedEntry.id,
      entryInfo: {
        type: selectedEntry.transaction_type,
        amount: safeFormatNumber(selectedEntry.amount, 2),
        description: selectedEntry.description,
        date: formattedDate
      },
      isDeleting: false
    });
  };

  const handleConfirmDelete = async () => {
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    
    try {
      const result = await deleteEntry(deleteModal.entryId);
      if (result.success) {
        setDeleteModal({
          isOpen: false,
          entryId: 0,
          entryInfo: { type: '', amount: '', description: '', date: '' },
          isDeleting: false
        });
        setIsModalOpen(false);
        setSelectedEntry(null);
        
        setTimeout(() => {
          showSuccessMessage('Success!', 'Entry has been deleted successfully.');
        }, 100);
        
        // Refresh the entries list
        await fetchEntries();
      } else {
        showErrorMessage('Deletion Failed', result.error || 'Failed to delete entry');
        setDeleteModal(prev => ({ ...prev, isDeleting: false }));
      }
    } catch (error) {
      console.error('Failed to delete entry:', error);
      showErrorMessage('Deletion Failed', 'Failed to delete entry. Please try again.');
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleCloseDeleteModal = () => {
    if (deleteModal.isDeleting) return;
    
    setDeleteModal({
      isOpen: false,
      entryId: 0,
      entryInfo: { type: '', amount: '', description: '', date: '' },
      isDeleting: false
    });
  };

  // Table actions
  const getActions = () => {
    const defaultActions = [];

    if (permissions.canView) {
      defaultActions.push({
        label: "View",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        ),
        onClick: (entry: CashBookEntry) => {
          setSelectedEntry(entry);
          setFormDataFromEntry(entry);
          setModalMode("view");
          setIsModalOpen(true);
        },
      });
    }

    if (permissions.canEdit) {
      defaultActions.push({
        label: "Edit",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
        onClick: (entry: CashBookEntry) => {
          setSelectedEntry(entry);
          setFormDataFromEntry(entry);
          setModalMode("edit");
          setIsModalOpen(true);
        },
      });
    }

    if (permissions.canDelete) {
      defaultActions.push({
        label: "Delete",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ),
        onClick: (entry: CashBookEntry) => {
          handleDeleteClick(entry);
        },
        className: "text-red-600 hover:bg-red-50",
      });
    }

    return [...defaultActions, ...customActions];
  };

 return (
  <div className="flex-1 p-6  bg-blue-50/50 rounded-2xl  flex flex-col overflow-hidden">
    {/* Header Section */}
    <div className="mb-6">
      {/* Top Filter Tabs */}
      <div className="flex space-x-1 mb-7">
        <button
          onClick={() => setActiveTimeFilter("Recent Income")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            activeTimeFilter === "Recent Income"
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          Record Income
        </button>
        <button
          onClick={() => setActiveTimeFilter("Recent Expense")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            activeTimeFilter === "Recent Expense"
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          Record Expenses
        </button>
        <button
          onClick={() => setActiveTimeFilter("Cash Summary")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            activeTimeFilter === "Cash Summary"
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          Cash Summary
        </button>
      </div>

      {/* Title and Add Record Button - Only show for Income/Expense tabs */}
      {activeTimeFilter !== "Cash Summary" && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-600">
            {getDynamicTitle()}
          </h2>
          <div className="flex gap-2">
            {permissions.canCreate && (
              <Button 
                onClick={() => openCreateModal(activeTimeFilter === "Recent Income" ? "income" : "expense")} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                + Add {activeTimeFilter === "Recent Income" ? "Income" : "Expense"}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Today/All Filter, Date Range Picker and Search - Only show for Income/Expense tabs */}
      {activeTimeFilter !== "Cash Summary" && (
        <div className="flex justify-between items-center">
          <div className="flex space-x-4 items-center">
            {/* Today/All Tabs */}
            <button
              onClick={() => setActiveTab("Today")}
              className={`px-3 py-1 text-sm font-medium border-b-2 ${
                activeTab === "Today"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setActiveTab("All")}
              className={`px-3 py-1 text-sm font-medium border-b-2 ${
                activeTab === "All"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              All
            </button>
          </div>

          {/* Right side: Date Range Picker and Search Bar */}
          <div className="flex items-center space-x-4">
            {/* Date Range Picker - Only show for "All" tab */}
            {activeTab === "All" && (
              <DateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onDateChange={handleDateRangeChange}
                isOpen={isDatePickerOpen}
                onToggle={() => setIsDatePickerOpen(!isDatePickerOpen)}
                hasCustomDateRange={hasCustomDateRange}
                onCancel={handleDateRangeCancel}
              />
            )}

            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Close date picker when clicking outside */}
      {isDatePickerOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDatePickerOpen(false)}
        />
      )}
    </div>

    {/* Content Area - Conditional Rendering */}
    {activeTimeFilter === "Cash Summary" ? (
      // Show Cash Summary with its own tabs and controls
      <CashSummaryTable apiEndpoint={apiEndpoint} />
    ) : (
      // Show Table for Income/Expense
      <div className="flex-1 min-h-0">
        <ReusableTable
          data={filteredEntries}
          columns={columns}
          actions={getActions()}
          loading={loading}
          emptyMessage={
            searchQuery ? 
              "No entries match your search criteria." : 
              `No entries found. Click 'Add ${activeTimeFilter === "Recent Income" ? "Income" : "Expense"}' to get started.`
          }
        />
      </div>
    )}

    {/* Entry Form Modal */}
    <SlideModal isOpen={isModalOpen} onClose={closeModal} title={getModalTitle()}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Date field */}
       <input
        type="date"
        value={formData.transaction_date}
        onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
        max={new Date().toISOString().split('T')[0]} // Prevent future dates
        className={`w-full px-3 py-2 border rounded-md ${
          formErrors.transaction_date ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
        } focus:outline-none focus:ring-2`}
        readOnly={modalMode === "view"}
        required
      />

        {/* Amount field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 font-medium">Rs.</span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className={`w-full pl-12 pr-3 py-2 border rounded-md ${
                formErrors.amount ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              } focus:outline-none focus:ring-2`}
              placeholder="4500.00"
              readOnly={modalMode === "view"}
              required
            />
          </div>
          {formErrors.amount && (
            <p className="mt-1 text-sm text-red-600">{formErrors.amount}</p>
          )}
        </div>

        {/* Description field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={`w-full px-3 py-2 border rounded-md ${
              formErrors.description ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2`}
            placeholder="Enter Description"
            rows={3}
            readOnly={modalMode === "view"}
            required
          />
          {formErrors.description && (
            <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
          )}
        </div>

        {/* Special Notes field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Special Notes</label>
          <textarea
            value={formData.special_notes}
            onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Enter Any Special Notes"
            readOnly={modalMode === "view"}
          />
        </div>

        {/* References Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">References</label>
          
          {/* Add New Reference */}
          {modalMode !== "view" && (
            <div className="space-y-3 p-4 border border-gray-200 rounded-md bg-gray-50">
              {/* Reference Type Selection as Tags */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Reference Type</label>
                <div className="flex flex-wrap gap-2">
                  {referenceTypes.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setNewReference({ ...newReference, type: type.value })}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        newReference.type === type.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference Detail */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Reference Detail</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newReference.detail}
                    onChange={(e) => setNewReference({ ...newReference, detail: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter Reference Detail"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addReference();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addReference}
                    disabled={!newReference.type || !newReference.detail.trim()}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Display Added References as Tags */}
          {formData.references.length > 0 && (
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">Added References</label>
              <div className="flex flex-wrap gap-2">
                {formData.references.map((ref) => (
                  <div
                    key={ref.id}
                    className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                  >
                    <span className="font-medium mr-1">
                      {referenceTypes.find(type => type.value === ref.type)?.label || ref.type}:
                    </span>
                    <span className="max-w-[200px] truncate" title={ref.detail}>
                      {ref.detail}
                    </span>
                    {modalMode !== "view" && (
                      <button
                        type="button"
                        onClick={() => removeReference(ref.id)}
                        className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
         
          {/* Show when no references are present */}
          {formData.references.length === 0 && (
            <p className="text-sm text-gray-600 mt-3 px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
              No references added
            </p>
          )}

          {/* View Mode - Show References in Clean Format */}
          {modalMode === "view" && formData.references.length === 0 && (
            <p className="text-sm text-gray-500 italic">No references added</p>
          )}
        </div>

        {/* Button Section */}
        <div className="flex justify-end pt-4">
          {modalMode === "view" ? (
            <div className="flex gap-3">
              {permissions.canDelete && (
                <Button 
                  type="button"
                  onClick={handleDeleteFromView}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
              )}
              {permissions.canEdit && (
                <Button 
                  type="button"
                  onClick={() => {
                    setModalMode("edit");
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Edit
                </Button>
              )}
            </div>
          ) : (
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  {modalMode === "create" 
                    ? `Adding ${entryType === 'income' ? 'Income' : 'Expense'}...` 
                    : `Updating ${entryType === 'income' ? 'Income' : 'Expense'}...`
                  }
                </>
              ) : (
                modalMode === "create" 
                  ? `Add ${entryType === 'income' ? 'Income' : 'Expense'}` 
                  : `Update ${entryType === 'income' ? 'Income' : 'Expense'}`
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
    <DeleteConfirmationModal
      isOpen={deleteModal.isOpen}
      onClose={handleCloseDeleteModal}
      onConfirm={handleConfirmDelete}
      entryInfo={deleteModal.entryInfo}
      loading={deleteModal.isDeleting}
    />
  </div>
);
};

export default CashBookManagement;