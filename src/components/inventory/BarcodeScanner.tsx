
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Scan, Search, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BarcodeItem {
  id: string;
  name: string;
  barcode: string;
  current_stock: number;
  minimum_stock: number;
  unit_price: number;
  department: string;
  category: string;
}

interface BarcodeScannerProps {
  onItemFound?: (item: BarcodeItem) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onItemFound }) => {
  const [barcode, setBarcode] = useState('');
  const [foundItem, setFoundItem] = useState<BarcodeItem | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus the input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const searchByBarcode = async (searchBarcode: string) => {
    if (!searchBarcode.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, name, barcode, current_stock, minimum_stock, unit_price, department, category')
        .eq('barcode', searchBarcode.trim())
        .eq('is_active', true)
        .single();

      if (error) throw error;

      if (data) {
        setFoundItem(data);
        onItemFound?.(data);
        toast({
          title: "Item Found",
          description: `Found: ${data.name}`,
        });
      }
    } catch (error) {
      console.error('Error searching item:', error);
      setFoundItem(null);
      toast({
        title: "Item Not Found",
        description: "No item found with this barcode",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchByBarcode(barcode);
  };

  const handleBarcodeChange = (value: string) => {
    setBarcode(value);
    // Auto-search when barcode reaches typical length (8-13 digits)
    if (value.length >= 8 && value.length <= 13 && /^\d+$/.test(value)) {
      searchByBarcode(value);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          Barcode Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Scan className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              ref={inputRef}
              placeholder="Scan or enter barcode..."
              value={barcode}
              onChange={(e) => handleBarcodeChange(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading || !barcode.trim()}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>

        {foundItem && (
          <div className="border rounded-lg p-4 bg-green-50">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold">{foundItem.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{foundItem.department}</Badge>
                    <Badge variant="secondary">{foundItem.category}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Barcode: {foundItem.barcode}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  Stock: {foundItem.current_stock}
                </div>
                <div className="text-sm text-gray-600">
                  Min: {foundItem.minimum_stock}
                </div>
                <div className="text-sm font-medium">
                  UGX {foundItem.unit_price.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          Tip: Scan barcode with a scanner or manually enter the barcode number
        </div>
      </CardContent>
    </Card>
  );
};
