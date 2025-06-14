
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, UtensilsCrossed } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  available: boolean;
}

interface MenuManagerProps {
  onMenuUpdate?: (items: MenuItem[]) => void;
}

export const MenuManager: React.FC<MenuManagerProps> = ({ onMenuUpdate }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: '1', name: 'Ugali & Beef', category: 'Main Course', price: 12000, description: 'Traditional ugali served with tender beef stew', available: true },
    { id: '2', name: 'Rice & Chicken', category: 'Main Course', price: 15000, description: 'Steamed rice with grilled chicken', available: true },
    { id: '3', name: 'Fish & Chips', category: 'Main Course', price: 18000, description: 'Fresh fish with crispy chips', available: true },
    { id: '4', name: 'Rolex', category: 'Fast Food', price: 3000, description: 'Egg rolled in chapati with vegetables', available: true },
    { id: '5', name: 'Samosa', category: 'Snacks', price: 1500, description: 'Crispy pastry with savory filling', available: true },
    { id: '6', name: 'Soda', category: 'Beverages', price: 2500, description: 'Assorted soft drinks', available: true },
  ]);

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    available: true
  });

  const categories = ['Main Course', 'Fast Food', 'Snacks', 'Beverages', 'Desserts'];

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price: '',
      description: '',
      available: true
    });
    setEditingItem(null);
  };

  const handleAddItem = () => {
    resetForm();
    setShowDialog(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      description: item.description,
      available: item.available
    });
    setShowDialog(true);
  };

  const handleDeleteItem = (itemId: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== itemId));
    toast({
      title: "Item Deleted",
      description: "Menu item has been removed successfully",
    });
    onMenuUpdate?.(menuItems.filter(item => item.id !== itemId));
  };

  const handleSaveItem = () => {
    if (!formData.name || !formData.category || !formData.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const newItem: MenuItem = {
      id: editingItem ? editingItem.id : Date.now().toString(),
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      description: formData.description,
      available: formData.available
    };

    if (editingItem) {
      setMenuItems(prev => prev.map(item => 
        item.id === editingItem.id ? newItem : item
      ));
      toast({
        title: "Item Updated",
        description: "Menu item has been updated successfully",
      });
    } else {
      setMenuItems(prev => [...prev, newItem]);
      toast({
        title: "Item Added",
        description: "New menu item has been added successfully",
      });
    }

    onMenuUpdate?.(editingItem 
      ? menuItems.map(item => item.id === editingItem.id ? newItem : item)
      : [...menuItems, newItem]
    );

    setShowDialog(false);
    resetForm();
  };

  const toggleAvailability = (itemId: string) => {
    setMenuItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, available: !item.available } : item
    ));
    onMenuUpdate?.(menuItems.map(item => 
      item.id === itemId ? { ...item, available: !item.available } : item
    ));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Main Course': return 'bg-blue-100 text-blue-800';
      case 'Fast Food': return 'bg-orange-100 text-orange-800';
      case 'Snacks': return 'bg-green-100 text-green-800';
      case 'Beverages': return 'bg-purple-100 text-purple-800';
      case 'Desserts': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" />
              Menu Management
            </CardTitle>
            <Button onClick={handleAddItem} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Menu Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">{item.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(item.category)}>
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell>UGX {item.price.toLocaleString()}</TableCell>
                  <TableCell>
                    <Button
                      variant={item.available ? "default" : "secondary"}
                      size="sm"
                      onClick={() => toggleAvailability(item.id)}
                    >
                      {item.available ? 'Available' : 'Unavailable'}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter item name"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg">
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Price (UGX)</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="Enter price"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description"
              />
            </div>
            
            <div className="flex gap-4">
              <Button onClick={handleSaveItem} className="flex-1">
                {editingItem ? 'Update Item' : 'Add Item'}
              </Button>
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
