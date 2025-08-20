"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconPlus, IconHome, IconMapPin, IconUserCheck, IconCurrencyDollar, IconUpload, IconX, IconLoader2 } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface AddPropertyModalProps {
  onPropertyAdded?: () => void;
}

export default function AddPropertyModal({ onPropertyAdded }: AddPropertyModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Info
    propertyId: "",
    name: "",
    type: "single_family",
    owner: "",
    yearBuilt: new Date().getFullYear(),
    
    // Address
    address: "",
    city: "",
    state: "",
    zipCode: "",
    county: "",
    market: "",
    
    // Details
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 0,
    monthlyRent: 0,
    
    // Status
    status: "active",
    isCore: true,
    inDisposition: false,
    section8: false,
    insurance: true,
    squatters: false,
    ownership: true,
    
    // Utilities
    utilities: {
      power: false,
      water: false,
      gas: false,
    },
    
    // Management
    propertyManagerId: "",
    seniorPropertyManagerId: "",
    
    // Additional
    notes: "",
    images: [] as File[],
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUtilityChange = (utility: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      utilities: {
        ...prev.utilities,
        [utility]: value
      }
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...Array.from(files)]
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Generate property ID if not provided
      const propertyId = formData.propertyId || `PROP-${Date.now()}`;
      
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          propertyId,
          color: formData.isCore ? 7 : 11, // 7 for core (green), 11 for non-core (orange)
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create property");
      }

      setOpen(false);
      onPropertyAdded?.();
      
      // Reset form
      setFormData({
        propertyId: "",
        name: "",
        type: "single_family",
        owner: "",
        yearBuilt: new Date().getFullYear(),
        address: "",
        city: "",
        state: "",
        zipCode: "",
        county: "",
        market: "",
        bedrooms: 1,
        bathrooms: 1,
        squareFeet: 0,
        monthlyRent: 0,
        status: "active",
        isCore: true,
        inDisposition: false,
        section8: false,
        insurance: true,
        squatters: false,
        ownership: true,
        utilities: { power: false, water: false, gas: false },
        propertyManagerId: "",
        seniorPropertyManagerId: "",
        notes: "",
        images: [],
      });
    } catch (error) {
      console.error("Error creating property:", error);
      alert("Failed to create property. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="flex items-center gap-2">
          <IconPlus className="h-4 w-4" />
          Add Property
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[640px] sm:max-w-[640px] overflow-y-auto" side="right">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-2xl font-semibold">Add New Property</SheetTitle>
          <SheetDescription className="text-base">
            Enter the property details. Fields marked with * are required.
          </SheetDescription>
        </SheetHeader>
        
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 h-11 bg-muted/50">
            <TabsTrigger value="basic" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Basic</TabsTrigger>
            <TabsTrigger value="address" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Address</TabsTrigger>
            <TabsTrigger value="details" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Details</TabsTrigger>
            <TabsTrigger value="status" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Status</TabsTrigger>
            <TabsTrigger value="management" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="propertyId" className="text-sm font-medium">Property ID</Label>
                <Input
                  id="propertyId"
                  placeholder="PROP-001 (auto-generated if empty)"
                  value={formData.propertyId}
                  onChange={(e) => handleInputChange("propertyId", e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Property Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Oakwood Apartments #101"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">
                  Property Type <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_family">Single Family</SelectItem>
                    <SelectItem value="multi_family">Multi Family</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner" className="text-sm font-medium">Owner</Label>
                <Input
                  id="owner"
                  placeholder="Property owner name"
                  value={formData.owner}
                  onChange={(e) => handleInputChange("owner", e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearBuilt" className="text-sm font-medium">Year Built</Label>
                <Input
                  id="yearBuilt"
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={formData.yearBuilt}
                  onChange={(e) => handleInputChange("yearBuilt", parseInt(e.target.value))}
                  className="h-10"
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="address" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Street Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  placeholder="123 Main Street"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium">City</Label>
                <Input
                  id="city"
                  placeholder="Dallas"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium">State</Label>
                <Input
                  id="state"
                  placeholder="TX"
                  maxLength={2}
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value.toUpperCase())}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode" className="text-sm font-medium">ZIP Code</Label>
                <Input
                  id="zipCode"
                  placeholder="75201"
                  maxLength={10}
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange("zipCode", e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="county" className="text-sm font-medium">County</Label>
                <Input
                  id="county"
                  placeholder="Dallas County"
                  value={formData.county}
                  onChange={(e) => handleInputChange("county", e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="market" className="text-sm font-medium">Market</Label>
                <Input
                  id="market"
                  placeholder="Dallas Metro"
                  value={formData.market}
                  onChange={(e) => handleInputChange("market", e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="details" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="bedrooms" className="text-sm font-medium">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange("bedrooms", parseInt(e.target.value))}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms" className="text-sm font-medium">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={(e) => handleInputChange("bathrooms", parseFloat(e.target.value))}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="squareFeet" className="text-sm font-medium">Square Feet</Label>
                <Input
                  id="squareFeet"
                  type="number"
                  min="0"
                  value={formData.squareFeet}
                  onChange={(e) => handleInputChange("squareFeet", parseInt(e.target.value))}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyRent" className="text-sm font-medium">Monthly Rent ($)</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  min="0"
                  value={formData.monthlyRent}
                  onChange={(e) => handleInputChange("monthlyRent", parseFloat(e.target.value))}
                  className="h-10"
                />
              </div>
            </div>
            
            <Card className="p-4">
              <Label className="text-sm font-medium mb-3 block">Utilities</Label>
              <div className="flex gap-6">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="power"
                    checked={formData.utilities.power}
                    onCheckedChange={(checked) => handleUtilityChange("power", checked)}
                  />
                  <Label htmlFor="power" className="cursor-pointer">Power</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Switch
                    id="water"
                    checked={formData.utilities.water}
                    onCheckedChange={(checked) => handleUtilityChange("water", checked)}
                  />
                  <Label htmlFor="water" className="cursor-pointer">Water</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Switch
                    id="gas"
                    checked={formData.utilities.gas}
                    onCheckedChange={(checked) => handleUtilityChange("gas", checked)}
                  />
                  <Label htmlFor="gas" className="cursor-pointer">Gas</Label>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="status" className="space-y-4 mt-4">
            <Card className="p-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">Property Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="vacant">Vacant</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="pending_turn">Pending Turn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <Label htmlFor="isCore" className="font-medium">Core Property</Label>
                  <p className="text-sm text-muted-foreground">Is this a core property?</p>
                </div>
                <Switch
                  id="isCore"
                  checked={formData.isCore}
                  onCheckedChange={(checked) => handleInputChange("isCore", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <Label htmlFor="section8" className="font-medium">Section 8</Label>
                  <p className="text-sm text-muted-foreground">Eligible for Section 8 housing?</p>
                </div>
                <Switch
                  id="section8"
                  checked={formData.section8}
                  onCheckedChange={(checked) => handleInputChange("section8", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <Label htmlFor="insurance" className="font-medium">Insurance</Label>
                  <p className="text-sm text-muted-foreground">Property has insurance?</p>
                </div>
                <Switch
                  id="insurance"
                  checked={formData.insurance}
                  onCheckedChange={(checked) => handleInputChange("insurance", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <Label htmlFor="ownership" className="font-medium">Ownership</Label>
                  <p className="text-sm text-muted-foreground">Do we own this property?</p>
                </div>
                <Switch
                  id="ownership"
                  checked={formData.ownership}
                  onCheckedChange={(checked) => handleInputChange("ownership", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <Label htmlFor="inDisposition" className="font-medium">In Disposition</Label>
                  <p className="text-sm text-muted-foreground">Property in disposal process?</p>
                </div>
                <Switch
                  id="inDisposition"
                  checked={formData.inDisposition}
                  onCheckedChange={(checked) => handleInputChange("inDisposition", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <Label htmlFor="squatters" className="font-medium">Squatters</Label>
                  <p className="text-sm text-muted-foreground">Are there squatters present?</p>
                </div>
                <Switch
                  id="squatters"
                  checked={formData.squatters}
                  onCheckedChange={(checked) => handleInputChange("squatters", checked)}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="management" className="space-y-6 mt-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about the property..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="images" className="text-sm font-medium">Property Images</Label>
                <div>
                  <Input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Label
                    htmlFor="images"
                    className="flex items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="text-center">
                      <IconUpload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Click to upload images
                      </p>
                    </div>
                  </Label>
                </div>
                
                {formData.images.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {formData.images.map((file, index) => (
                      <div key={index} className="relative">
                        <Badge variant="secondary" className="pr-8">
                          {file.name}
                        </Badge>
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute right-1 top-1/2 -translate-y-1/2"
                        >
                          <IconX className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t sticky bottom-0 bg-background z-10">
          <Button variant="outline" onClick={() => setOpen(false)} size="lg">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !formData.name || !formData.address} size="lg">
            {loading ? (
              <>
                <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Property"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}