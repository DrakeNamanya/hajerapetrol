import React, { useState, useEffect } from 'react';
import { Plus, Eye, Calculator, DollarSign, AlertTriangle, Save, Send, Droplets, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const FuelAttendantDashboard: React.FC = () => {
  // Initial Stock - This represents the fuel brought by trucks and poured into tanks
  const [initialStock, setInitialStock] = useState({
    petrol: { liters: 0, date: new Date().toISOString().split('T')[0] },
    diesel: { liters: 0, date: new Date().toISOString().split('T')[0] },
    kerosene: { liters: 0, date: new Date().toISOString().split('T')[0] }
  });

  // State for fuel data
  const [openingStock, setOpeningStock] = useState<any[]>([]);
  const [closingStock, setClosingStock] = useState<any[]>([]);
  const [fuelPrices, setFuelPrices] = useState({
    petrol: 0,
    diesel: 0,
    kerosene: 0
  });

  // Alerts and thresholds
  const [lowStockAlert, setLowStockAlert] = useState({
    petrol: 0,
    diesel: 0,
    kerosene: 0
  });

  // Form states
  const [showOpeningForm, setShowOpeningForm] = useState(false);
  const [showClosingForm, setShowClosingForm] = useState(false);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [showInitialStockForm, setShowInitialStockForm] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  // Form data
  const [openingFormData, setOpeningFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    pumpNumber: '1',
    fuelType: 'petrol',
    meterReading: '',
    dipstickReading: '',
    attendantAccount: ''
  });
  
  const [closingFormData, setClosingFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    pumpNumber: '1',
    fuelType: 'petrol',
    meterReading: '',
    dipstickReading: '',
    attendantAccount: ''
  });
  
  const [submissionData, setSubmissionData] = useState({
    attendantAccount: '',
    totalCashCollected: '',
    date: new Date().toISOString().split('T')[0],
    shift: '3pm'
  });

  const [initialStockForm, setInitialStockForm] = useState({
    fuelType: 'petrol',
    liters: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Fuel types and pumps
  const fuelTypes = ['petrol', 'diesel', 'kerosene'];
  const pumpNumbers = ['1', '2', '3', '4', '5'];
  const shifts = ['3pm', 'evening'];

  // Calculate total sales per fuel type
  const calculateTotalSales = () => {
    const totalSales = { petrol: 0, diesel: 0, kerosene: 0 };
    
    closingStock.forEach(closing => {
      const matchingOpening = openingStock.find(opening => 
        opening.pumpNumber === closing.pumpNumber && 
        opening.fuelType === closing.fuelType &&
        opening.date === closing.date
      );
      
      if (matchingOpening) {
        const litersSold = matchingOpening.meterReading - closing.meterReading;
        if (litersSold > 0) {
          totalSales[closing.fuelType] += litersSold;
        }
      }
    });
    
    return totalSales;
  };

  // Calculate current tank levels
  const calculateCurrentTankLevels = () => {
    const totalSales = calculateTotalSales();
    const currentLevels = {};
    
    fuelTypes.forEach(fuel => {
      currentLevels[fuel] = initialStock[fuel].liters - totalSales[fuel];
    });
    
    return currentLevels;
  };

  // Calculate weight loss reconciliation
  const calculateWeightLoss = (): Record<string, {
    initialStock: number;
    totalSales: number;
    expectedEvaporation: number;
    actualRemaining: number;
    expectedRemaining: number;
    variance: number;
    daysSinceDelivery: number;
  }> => {
    const currentDate = new Date();
    const weightLoss: Record<string, any> = {};
    
    fuelTypes.forEach(fuel => {
      const startDate = new Date(initialStock[fuel].date);
      const daysDiff = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Estimated evaporation rate: 0.1% per day (can be adjusted)
      const evaporationRate = 0.001;
      const expectedEvaporation = initialStock[fuel].liters * evaporationRate * daysDiff;
      
      const totalSales = calculateTotalSales();
      const actualRemaining = initialStock[fuel].liters - totalSales[fuel];
      const expectedRemaining = initialStock[fuel].liters - expectedEvaporation - totalSales[fuel];
      
      weightLoss[fuel] = {
        initialStock: initialStock[fuel].liters,
        totalSales: totalSales[fuel],
        expectedEvaporation: expectedEvaporation,
        actualRemaining: actualRemaining,
        expectedRemaining: expectedRemaining,
        variance: actualRemaining - expectedRemaining,
        daysSinceDelivery: daysDiff
      };
    });
    
    return weightLoss;
  };

  // Check for low stock alerts
  const checkLowStockAlerts = () => {
    const currentLevels = calculateCurrentTankLevels();
    const alerts = [];
    
    fuelTypes.forEach(fuel => {
      if (currentLevels[fuel] <= lowStockAlert[fuel]) {
        alerts.push({
          fuel: fuel,
          currentLevel: currentLevels[fuel],
          threshold: lowStockAlert[fuel]
        });
      }
    });
    
    return alerts;
  };

  // Calculate sales data
  const calculateSales = () => {
    const salesData = [];
    
    closingStock.forEach(closing => {
      const matchingOpening = openingStock.find(opening => 
        opening.pumpNumber === closing.pumpNumber && 
        opening.fuelType === closing.fuelType &&
        opening.date === closing.date
      );
      
      if (matchingOpening) {
        const litersSold = matchingOpening.meterReading - closing.meterReading;
        const revenue = litersSold * fuelPrices[closing.fuelType];
        
        salesData.push({
          ...closing,
          openingMeter: matchingOpening.meterReading,
          litersSold,
          revenue,
          pricePerLiter: fuelPrices[closing.fuelType]
        });
      }
    });
    
    return salesData;
  };

  // Validation function
  const validateMeterReading = (closingReading, fuelType, pumpNumber, date) => {
    const matchingOpening = openingStock.find(opening => 
      opening.pumpNumber === pumpNumber && 
      opening.fuelType === fuelType &&
      opening.date === date
    );
    
    if (matchingOpening && parseFloat(closingReading) > matchingOpening.meterReading) {
      return 'Closing meter reading cannot be higher than opening meter reading';
    }
    return '';
  };

  // Handle form submissions
  const handleOpeningSubmit = () => {
    if (!openingFormData.meterReading || !openingFormData.dipstickReading || !openingFormData.attendantAccount) {
      setValidationError('Please fill all required fields');
      return;
    }

    const newRecord = {
      ...openingFormData,
      id: Date.now(),
      meterReading: parseFloat(openingFormData.meterReading),
      dipstickReading: parseFloat(openingFormData.dipstickReading)
    };
    setOpeningStock([...openingStock, newRecord]);
    setOpeningFormData({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      pumpNumber: '1',
      fuelType: 'petrol',
      meterReading: '',
      dipstickReading: '',
      attendantAccount: ''
    });
    setShowOpeningForm(false);
    setValidationError('');
  };

  const handleClosingSubmit = () => {
    const error = validateMeterReading(
      closingFormData.meterReading, 
      closingFormData.fuelType, 
      closingFormData.pumpNumber, 
      closingFormData.date
    );
    
    if (error) {
      setValidationError(error);
      return;
    }

    if (!closingFormData.meterReading || !closingFormData.dipstickReading || !closingFormData.attendantAccount) {
      setValidationError('Please fill all required fields');
      return;
    }

    const newRecord = {
      ...closingFormData,
      id: Date.now(),
      meterReading: parseFloat(closingFormData.meterReading),
      dipstickReading: parseFloat(closingFormData.dipstickReading)
    };
    setClosingStock([...closingStock, newRecord]);
    setClosingFormData({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      pumpNumber: '1',
      fuelType: 'petrol',
      meterReading: '',
      dipstickReading: '',
      attendantAccount: ''
    });
    setShowClosingForm(false);
    setValidationError('');
  };

  const handleInitialStockSubmit = () => {
    if (!initialStockForm.liters) {
      setValidationError('Please enter the fuel quantity');
      return;
    }

    setInitialStock({
      ...initialStock,
      [initialStockForm.fuelType]: {
        liters: parseFloat(initialStockForm.liters),
        date: initialStockForm.date
      }
    });

    setInitialStockForm({
      fuelType: 'petrol',
      liters: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowInitialStockForm(false);
    setValidationError('');
  };

  const handleCashSubmission = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to submit fuel entries');
        return;
      }

      // Calculate total sales for fuel sold
      const totalSales = calculateTotalSales();
      const fuelSold = Object.values(totalSales).reduce((sum, liters) => sum + liters, 0);

      // Calculate opening and closing stock from first and last records
      const openingStockReading = openingStock.length > 0 ? openingStock[0].dipstickReading : 0;
      const closingStockReading = closingStock.length > 0 ? closingStock[closingStock.length - 1].dipstickReading : 0;

      // Submit fuel entry to database
      const { error } = await supabase
        .from('fuel_entries')
        .insert({
          attendant_id: user.id,
          opening_stock: openingStockReading,
          closing_stock: closingStockReading,
          fuel_sold: fuelSold,
          pump_fuel_sold: fuelSold, // Same as fuel_sold for now
          revenue_received: parseFloat(submissionData.totalCashCollected),
          fuel_type: 'petrol', // Default to petrol, can be enhanced later
          notes: `Shift: ${submissionData.shift}. Expected Revenue: UGX ${totalRevenue.toLocaleString()}`,
          status: 'submitted'
        });

      if (error) {
        console.error('Error submitting fuel entry:', error);
        toast.error('Failed to submit fuel entry');
        return;
      }

      toast.success('Fuel entry submitted successfully and sent to accountant for approval');
      
      // Reset form
      setSubmissionData({
        attendantAccount: '',
        totalCashCollected: '',
        date: new Date().toISOString().split('T')[0],
        shift: '3pm'
      });
      setShowSubmissionForm(false);
      
    } catch (error) {
      console.error('Error submitting fuel entry:', error);
      toast.error('Failed to submit fuel entry');
    }
  };

  const salesData = calculateSales();
  const totalRevenue = salesData.reduce((sum, sale) => sum + sale.revenue, 0);
  const totalLitersSold = salesData.reduce((sum, sale) => sum + sale.litersSold, 0);
  const currentTankLevels = calculateCurrentTankLevels();
  const lowStockAlerts = checkLowStockAlerts();
  const weightLossData = calculateWeightLoss();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-card rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Fuel Management Dashboard</h1>
          <p className="text-muted-foreground">Manage fuel stock, sales tracking, and attendant submissions</p>
        </div>

        {/* Low Stock Alerts */}
        {lowStockAlerts.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h3 className="font-semibold text-destructive">Low Stock Alerts</h3>
            </div>
            {lowStockAlerts.map(alert => (
              <p key={alert.fuel} className="text-destructive capitalize">
                {alert.fuel}: {alert.currentLevel.toFixed(2)}L remaining (Threshold: {alert.threshold}L)
              </p>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-primary text-primary-foreground p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80">Total Revenue Today</p>
                <p className="text-2xl font-bold">UGX {totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary-foreground/60" />
            </div>
          </div>
          
          <div className="bg-secondary text-secondary-foreground p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-foreground/80">Liters Sold</p>
                <p className="text-2xl font-bold">{totalLitersSold.toFixed(2)} L</p>
              </div>
              <Calculator className="w-8 h-8 text-secondary-foreground/60" />
            </div>
          </div>
          
          <div className="bg-accent text-accent-foreground p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-accent-foreground/80">Opening Records</p>
                <p className="text-2xl font-bold">{openingStock.length}</p>
              </div>
              <Eye className="w-8 h-8 text-accent-foreground/60" />
            </div>
          </div>
          
          <div className="bg-muted text-muted-foreground p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Closing Records</p>
                <p className="text-2xl font-bold text-foreground">{closingStock.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-muted-foreground/60" />
            </div>
          </div>

          <div className="bg-primary/90 text-primary-foreground p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80">Low Stock Alerts</p>
                <p className="text-2xl font-bold">{lowStockAlerts.length}</p>
              </div>
              <Droplets className="w-8 h-8 text-primary-foreground/60" />
            </div>
          </div>
        </div>

        {/* Current Tank Levels */}
        <div className="bg-card rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Tank Levels</h2>
          <div className="grid grid-cols-3 gap-4">
            {fuelTypes.map(fuel => {
              const current = currentTankLevels[fuel];
              const initial = initialStock[fuel].liters;
              const percentage = (current / initial) * 100;
              const isLow = current <= lowStockAlert[fuel];
              
              return (
                <div key={fuel} className={`border rounded-lg p-4 ${isLow ? 'border-destructive/30 bg-destructive/5' : 'border-border'}`}>
                  <p className="font-medium capitalize text-foreground">{fuel}</p>
                  <p className={`text-2xl font-bold ${isLow ? 'text-destructive' : 'text-primary'}`}>
                    {current.toFixed(2)} L
                  </p>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full ${percentage > 25 ? 'bg-secondary' : percentage > 10 ? 'bg-accent' : 'bg-destructive'}`}
                      style={{ width: `${Math.max(percentage, 0)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {percentage.toFixed(1)}% remaining
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Initial: {initial.toLocaleString()} L
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weight Loss Reconciliation */}
        <div className="bg-card rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Weight Loss Reconciliation
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-3 text-left">Fuel Type</th>
                  <th className="border border-border p-3 text-left">Initial Stock</th>
                  <th className="border border-border p-3 text-left">Total Sales</th>
                  <th className="border border-border p-3 text-left">Expected Evaporation</th>
                  <th className="border border-border p-3 text-left">Actual Remaining</th>
                  <th className="border border-border p-3 text-left">Expected Remaining</th>
                  <th className="border border-border p-3 text-left">Variance</th>
                  <th className="border border-border p-3 text-left">Days</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(weightLossData).map(([fuel, data]) => (
                  <tr key={fuel} className="hover:bg-muted/50">
                    <td className="border border-border p-3 capitalize font-medium">{fuel}</td>
                    <td className="border border-border p-3">{data.initialStock.toLocaleString()} L</td>
                    <td className="border border-border p-3">{data.totalSales.toFixed(2)} L</td>
                    <td className="border border-border p-3">{data.expectedEvaporation.toFixed(2)} L</td>
                    <td className="border border-border p-3">{data.actualRemaining.toFixed(2)} L</td>
                    <td className="border border-border p-3">{data.expectedRemaining.toFixed(2)} L</td>
                    <td className={`border border-border p-3 font-semibold ${data.variance < 0 ? 'text-destructive' : 'text-secondary'}`}>
                      {data.variance >= 0 ? '+' : ''}{data.variance.toFixed(2)} L
                    </td>
                    <td className="border border-border p-3">{data.daysSinceDelivery}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            * Evaporation rate calculated at 0.1% per day. Negative variance indicates higher than expected loss.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="bg-card rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowInitialStockForm(true)}
              className="bg-accent hover:bg-accent/80 text-accent-foreground px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Droplets className="w-5 h-5" />
              Update Initial Stock
            </button>
            
            <button
              onClick={() => setShowOpeningForm(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Record Opening Stock
            </button>
            
            <button
              onClick={() => setShowClosingForm(true)}
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Save className="w-5 h-5" />
              Record Closing Stock
            </button>
            
            <button
              onClick={() => setShowSubmissionForm(true)}
              className="bg-muted hover:bg-muted/80 text-muted-foreground px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Send className="w-5 h-5" />
              Submit Cash Collection
            </button>
          </div>
        </div>

        {/* Current Fuel Prices */}
        <div className="bg-card rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Fuel Prices & Low Stock Alerts (UGX per Liter)</h2>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(fuelPrices).map(([fuel, price]) => (
              <div key={fuel} className="border border-border rounded-lg p-4">
                <p className="font-medium capitalize text-foreground">{fuel}</p>
                <p className="text-2xl font-bold text-primary">UGX {price.toLocaleString()}</p>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setFuelPrices({...fuelPrices, [fuel]: parseFloat(e.target.value) || 0})}
                  className="mt-2 w-full border border-border rounded px-3 py-2 bg-background"
                  placeholder="Price per liter"
                />
                <p className="text-sm text-muted-foreground mt-2">Low Stock Alert Threshold:</p>
                <input
                  type="number"
                  value={lowStockAlert[fuel]}
                  onChange={(e) => setLowStockAlert({...lowStockAlert, [fuel]: parseFloat(e.target.value) || 0})}
                  className="mt-1 w-full border border-border rounded px-3 py-2 bg-background"
                  placeholder="Alert threshold in liters"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Sales Summary Table */}
        {salesData.length > 0 && (
          <div className="bg-card rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Sales Summary</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-3 text-left">Date</th>
                    <th className="border border-border p-3 text-left">Pump</th>
                    <th className="border border-border p-3 text-left">Fuel Type</th>
                    <th className="border border-border p-3 text-left">Opening Meter</th>
                    <th className="border border-border p-3 text-left">Closing Meter</th>
                    <th className="border border-border p-3 text-left">Liters Sold</th>
                    <th className="border border-border p-3 text-left">Price/L</th>
                    <th className="border border-border p-3 text-left">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((sale, index) => (
                    <tr key={index} className="hover:bg-muted/50">
                      <td className="border border-border p-3">{sale.date}</td>
                      <td className="border border-border p-3">Pump {sale.pumpNumber}</td>
                      <td className="border border-border p-3 capitalize">{sale.fuelType}</td>
                      <td className="border border-border p-3">{sale.openingMeter.toFixed(2)} L</td>
                      <td className="border border-border p-3">{sale.meterReading.toFixed(2)} L</td>
                      <td className="border border-border p-3">{sale.litersSold.toFixed(2)} L</td>
                      <td className="border border-border p-3">UGX {sale.pricePerLiter.toLocaleString()}</td>
                      <td className="border border-border p-3 font-semibold">UGX {sale.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Error Display */}
        {validationError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <p className="text-destructive">{validationError}</p>
          </div>
        )}

        {/* Initial Stock Form Modal */}
        {showInitialStockForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Update Initial Stock (Truck Delivery)</h3>
              <div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Fuel Type</label>
                    <select
                      value={initialStockForm.fuelType}
                      onChange={(e) => setInitialStockForm({...initialStockForm, fuelType: e.target.value})}
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                      required
                    >
                      {fuelTypes.map(type => (
                        <option key={type} value={type} className="capitalize">{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Quantity (Liters)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={initialStockForm.liters}
                      onChange={(e) => setInitialStockForm({...initialStockForm, liters: e.target.value})}
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                      placeholder="Enter liters delivered"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Delivery Date</label>
                    <input
                      type="date"
                      value={initialStockForm.date}
                      onChange={(e) => setInitialStockForm({...initialStockForm, date: e.target.value})}
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={handleInitialStockSubmit}
                    className="flex-1 bg-accent hover:bg-accent/80 text-accent-foreground py-2 rounded"
                  >
                    Update Initial Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => {setShowInitialStockForm(false); setValidationError('');}}
                    className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Opening Stock Form Modal */}
        {showOpeningForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Record Opening Stock</h3>
              <div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <input
                      type="date"
                      value={openingFormData.date}
                      onChange={(e) => setOpeningFormData({...openingFormData, date: e.target.value})}
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Time</label>
                    <input
                      type="time"
                      value={openingFormData.time}
                      onChange={(e) => setOpeningFormData({...openingFormData, time: e.target.value})}
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Pump Number</label>
                    <select
                      value={openingFormData.pumpNumber}
                      onChange={(e) => setOpeningFormData({...openingFormData, pumpNumber: e.target.value})}
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                      required
                    >
                      {pumpNumbers.map(num => (
                        <option key={num} value={num}>Pump {num}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Fuel Type</label>
                    <select
                      value={openingFormData.fuelType}
                      onChange={(e) => setOpeningFormData({...openingFormData, fuelType: e.target.value})}
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                      required
                    >
                      {fuelTypes.map(type => (
                        <option key={type} value={type} className="capitalize">{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Meter Reading (Liters)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={openingFormData.meterReading}
                      onChange={(e) => setOpeningFormData({...openingFormData, meterReading: e.target.value})}
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Dipstick Reading (Liters)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={openingFormData.dipstickReading}
                      onChange={(e) => setOpeningFormData({...openingFormData, dipstickReading: e.target.value})}
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Fuel Attendant Account</label>
                    <input
                      type="text"
                      value={openingFormData.attendantAccount}
                      onChange={(e) => setOpeningFormData({...openingFormData, attendantAccount: e.target.value})}
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={handleOpeningSubmit}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded"
                  >
                    Save Opening Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => {setShowOpeningForm(false); setValidationError('');}}
                    className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Closing Stock Form Modal */}
        {showClosingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Record Closing Stock</h3>
              <div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <input
                      type="date"
                      value={closingFormData.date}
                      onChange={(e) => setClosingFormData({...closingFormData, date: e.target.value})}
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Time</label>
                    <input
                      type="time"
                      value={closingFormData.time}
                      onChange={(e) => setClosingFormData({...closingFormData, time: e.target.value})}
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Pump Number</label>
                    <select
                      value={closingFormData.pumpNumber}
                      onChange={(e) => setClosingFormData({...closingFormData, pumpNumber: e.target.value})}
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                      required
                    >
                      {pumpNumbers.map(num => (
                        <option key={num} value={num}>Pump {num}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Fuel Type</label>
                    <select
                      value={closingFormData.fuelType}
                      onChange={(e) => setClosingFormData({...closingFormData, fuelType: e.target.value})}
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                      required
                    >
                      {fuelTypes.map(type => (
                        <option key={type} value={type} className="capitalize">{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Meter Reading (Liters)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={closingFormData.meterReading}
                      onChange={(e) => {
                        setClosingFormData({...closingFormData, meterReading: e.target.value});
                        const error = validateMeterReading(e.target.value, closingFormData.fuelType, closingFormData.pumpNumber, closingFormData.date);
                        if (error) setValidationError(error);
                        else setValidationError('');
                      }}
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Dipstick Reading (Liters)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={closingFormData.dipstickReading}
                      onChange={(e) => setClosingFormData({...closingFormData, dipstickReading: e.target.value})}
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Fuel Attendant Account</label>
                    <input
                      type="text"
                      value={closingFormData.attendantAccount}
                      onChange={(e) => setClosingFormData({...closingFormData, attendantAccount: e.target.value})}
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={handleClosingSubmit}
                    className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 rounded"
                    disabled={validationError !== ''}
                  >
                    Save Closing Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => {setShowClosingForm(false); setValidationError('');}}
                    className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cash Submission Form Modal */}
        {showSubmissionForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Submit Cash Collection</h3>
              <div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Attendant Account</label>
                    <input
                      type="text"
                      value={submissionData.attendantAccount}
                      onChange={(e) => setSubmissionData({...submissionData, attendantAccount: e.target.value})}
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Total Cash Collected (UGX)</label>
                    <input
                      type="number"
                      value={submissionData.totalCashCollected}
                      onChange={(e) => setSubmissionData({...submissionData, totalCashCollected: e.target.value})}
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <input
                      type="date"
                      value={submissionData.date}
                      onChange={(e) => setSubmissionData({...submissionData, date: e.target.value})}
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Shift</label>
                    <select
                      value={submissionData.shift}
                      onChange={(e) => setSubmissionData({...submissionData, shift: e.target.value})}
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                      required
                    >
                      {shifts.map(shift => (
                        <option key={shift} value={shift}>{shift}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="bg-primary/10 p-4 rounded">
                    <p className="text-sm text-primary">
                      <strong>Expected Revenue:</strong> UGX {totalRevenue.toLocaleString()}
                    </p>
                    <p className="text-sm text-primary">
                      <strong>Difference:</strong> UGX {(parseFloat(submissionData.totalCashCollected || '0') - totalRevenue).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={handleCashSubmission}
                    className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded"
                  >
                    Submit for Approval
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSubmissionForm(false)}
                    className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};