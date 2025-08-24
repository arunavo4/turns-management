"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/dashboard-layout";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  IconArrowLeft,
  IconLoader2,
  IconHome,
  IconMapPin,
  IconUser,
  IconInfoCircle,
  IconShield,
  IconUsers,
  IconPhoto,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { fetchProperty, updateProperty, propertyKeys } from "@/lib/api/properties";

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const propertyId = params.id as string;
  const [activeSection, setActiveSection] = useState("basic");
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [formData, setFormData] = useState({
    // Basic Info
    propertyId: "",
    name: "",
    propertyType: "single_family",
    owner: "",
    yearBuilt: new Date().getFullYear(),
    
    // Address
    address: "",
    city: "",
    state: "",
    zipCode: "",
    county: "",
    country: "United States",
    market: "",
    
    // Property Details
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 0,
    monthlyRent: 0,
    
    // Status & Flags
    status: "active",
    statusYardi: "",
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
    
    // Dates
    moveInDate: "",
    moveOutDate: "",
    
    // Management
    propertyManagerId: "",
    seniorPropertyManagerId: "",
    renovationTechnicianId: "",
    propertyUpdatorId: "",
    
    // Additional
    notes: "",
    images: [] as File[],
  });

  // Fetch property using React Query
  const { data: property, isLoading: fetchingProperty, error } = useQuery({
    queryKey: propertyKeys.detail(propertyId),
    queryFn: () => fetchProperty(propertyId),
    enabled: !!propertyId,
  });

  // Set form data when property is fetched
  useEffect(() => {
    if (property) {
      setFormData({
        propertyId: property.propertyId || "",
        name: property.name || "",
        propertyType: property.type || "single_family",
        owner: property.owner || "",
        yearBuilt: property.yearBuilt || new Date().getFullYear(),
        address: property.address || "",
        city: property.city || "",
        state: property.state || "",
        zipCode: property.zipCode || "",
        county: property.county || "",
        country: "United States",
        market: property.market || "",
        bedrooms: property.bedrooms || 1,
        bathrooms: parseFloat(property.bathrooms as any) || 1,
        squareFeet: property.squareFeet || 0,
        monthlyRent: parseFloat(property.monthlyRent as any) || 0,
        status: property.status || "active",
        statusYardi: property.statusYardi || "",
        isCore: property.isCore !== undefined ? property.isCore : true,
        inDisposition: property.inDisposition || false,
        section8: property.section8 || false,
        insurance: property.insurance !== undefined ? property.insurance : true,
        squatters: property.squatters || false,
        ownership: property.ownership !== undefined ? property.ownership : true,
        utilities: property.utilities || { power: false, water: false, gas: false },
        moveInDate: property.moveInDate ? new Date(property.moveInDate).toISOString().split('T')[0] : "",
        moveOutDate: property.moveOutDate ? new Date(property.moveOutDate).toISOString().split('T')[0] : "",
        propertyManagerId: property.propertyManagerId || "",
        seniorPropertyManagerId: property.seniorPropertyManagerId || "",
        renovationTechnicianId: property.renovationTechnicianId || "",
        propertyUpdatorId: property.propertyUpdatorId || "",
        notes: property.notes || "",
        images: [],
      });
    }
  }, [property]);

  // Update mutation with optimistic update
  const updateMutation = useMutation({
    mutationFn: (data: any) => updateProperty({ ...data, id: propertyId }),
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: propertyKeys.detail(propertyId) });
      
      // Snapshot previous value
      const previousProperty = queryClient.getQueryData(propertyKeys.detail(propertyId));
      
      // Optimistically update
      queryClient.setQueryData(propertyKeys.detail(propertyId), (old: any) => ({
        ...old,
        ...newData,
      }));
      
      return { previousProperty };
    },
    onSuccess: () => {
      toast.success("Property updated successfully");
      router.push(`/properties/${propertyId}`);
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousProperty) {
        queryClient.setQueryData(propertyKeys.detail(propertyId), context.previousProperty);
      }
      toast.error(error instanceof Error ? error.message : "Failed to update property");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
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

  const handleSubmit = () => {
    updateMutation.mutate({
      ...formData,
      type: formData.propertyType,
      color: formData.isCore ? 7 : 11,
      monthlyRent: formData.monthlyRent.toString(),
      bathrooms: formData.bathrooms.toString(),
    });
  };

  const sections = [
    { id: "basic", label: "Basic Information", icon: IconHome },
    { id: "address", label: "Address", icon: IconMapPin },
    { id: "details", label: "Property Details", icon: IconInfoCircle },
    { id: "status", label: "Status & Flags", icon: IconShield },
    { id: "management", label: "Management", icon: IconUsers },
    { id: "additional", label: "Additional Info", icon: IconPhoto },
  ];

  const handleNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      const nextIndex = currentSectionIndex + 1;
      setCurrentSectionIndex(nextIndex);
      setActiveSection(sections[nextIndex].id);
    }
  };

  const handlePreviousSection = () => {
    if (currentSectionIndex > 0) {
      const prevIndex = currentSectionIndex - 1;
      setCurrentSectionIndex(prevIndex);
      setActiveSection(sections[prevIndex].id);
    }
  };

  const handleSectionClick = (sectionId: string, index: number) => {
    setActiveSection(sectionId);
    setCurrentSectionIndex(index);
  };

  if (fetchingProperty) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card/50 backdrop-blur">
          <div className="px-8 py-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/properties/${params.id}`)}
                className="hover:bg-muted"
              >
                <IconArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Edit Property</h1>
                <p className="text-muted-foreground mt-1">
                  Update property details. Fields marked with * are required.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar Navigation */}
          <div className="w-72 border-r bg-card/30 min-h-[calc(100vh-88px)]">
            <nav className="p-6 space-y-2">
              {sections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionClick(section.id, index)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                      activeSection === section.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="px-8 py-8 max-w-4xl">
              {/* Basic Information */}
              {activeSection === "basic" && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-8">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <IconHome className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="propertyId" className="text-sm font-medium">
                          Property ID
                        </Label>
                        <Input
                          id="propertyId"
                          placeholder="PROP-001 (auto-generated if empty)"
                          value={formData.propertyId}
                          onChange={(e) => handleInputChange("propertyId", e.target.value)}
                          className="h-11"
                        />
                        <p className="text-xs text-muted-foreground">
                          Unique identifier for the property
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="name" className="text-sm font-medium">
                          Property Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          placeholder="e.g., Oakwood Apartments #101"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          required
                          className="h-11"
                        />
                        <p className="text-xs text-muted-foreground">
                          Display name for the property
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="propertyType" className="text-sm font-medium">
                          Property Type <span className="text-red-500">*</span>
                        </Label>
                        <Select 
                          value={formData.propertyType} 
                          onValueChange={(value) => handleInputChange("propertyType", value)}
                        >
                          <SelectTrigger className="h-11">
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

                      <div className="space-y-3">
                        <Label htmlFor="owner" className="text-sm font-medium">
                          Owner
                        </Label>
                        <Input
                          id="owner"
                          placeholder="Property owner name"
                          value={formData.owner}
                          onChange={(e) => handleInputChange("owner", e.target.value)}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="yearBuilt" className="text-sm font-medium">
                          Year Built
                        </Label>
                        <Select 
                          value={formData.yearBuilt.toString()} 
                          onValueChange={(value) => handleInputChange("yearBuilt", parseInt(value))}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: new Date().getFullYear() - 1799 }, (_, i) => 
                              new Date().getFullYear() - i
                            ).map(year => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="market" className="text-sm font-medium">
                          Market
                        </Label>
                        <Input
                          id="market"
                          placeholder="e.g., Dallas Metro"
                          value={formData.market}
                          onChange={(e) => handleInputChange("market", e.target.value)}
                          className="h-11"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Address */}
              {activeSection === "address" && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-8">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <IconMapPin className="h-5 w-5" />
                      Address Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-3">
                      <Label htmlFor="address" className="text-sm font-medium">
                        Street Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="address"
                        placeholder="123 Main Street"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="city" className="text-sm font-medium">
                          City <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="city"
                          placeholder="Dallas"
                          value={formData.city}
                          onChange={(e) => handleInputChange("city", e.target.value)}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="state" className="text-sm font-medium">
                          State <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="state"
                          placeholder="TX"
                          maxLength={2}
                          value={formData.state}
                          onChange={(e) => handleInputChange("state", e.target.value.toUpperCase())}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="zipCode" className="text-sm font-medium">
                          ZIP Code <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="zipCode"
                          placeholder="75201"
                          maxLength={10}
                          value={formData.zipCode}
                          onChange={(e) => handleInputChange("zipCode", e.target.value)}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="county" className="text-sm font-medium">
                          County
                        </Label>
                        <Input
                          id="county"
                          placeholder="Dallas County"
                          value={formData.county}
                          onChange={(e) => handleInputChange("county", e.target.value)}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="country" className="text-sm font-medium">
                          Country
                        </Label>
                        <Input
                          id="country"
                          value={formData.country}
                          onChange={(e) => handleInputChange("country", e.target.value)}
                          className="h-11"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Property Details */}
              {activeSection === "details" && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-8">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <IconInfoCircle className="h-5 w-5" />
                      Property Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="bedrooms" className="text-sm font-medium">
                          Number of Bedrooms
                        </Label>
                        <Input
                          id="bedrooms"
                          type="number"
                          min="0"
                          value={formData.bedrooms || 0}
                          onChange={(e) => handleInputChange("bedrooms", parseInt(e.target.value) || 0)}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="bathrooms" className="text-sm font-medium">
                          Number of Bathrooms
                        </Label>
                        <Input
                          id="bathrooms"
                          type="number"
                          min="0"
                          step="0.5"
                          value={formData.bathrooms || 0}
                          onChange={(e) => handleInputChange("bathrooms", parseFloat(e.target.value) || 0)}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="squareFeet" className="text-sm font-medium">
                          Area (Square Feet)
                        </Label>
                        <Input
                          id="squareFeet"
                          type="number"
                          min="0"
                          value={formData.squareFeet || 0}
                          onChange={(e) => handleInputChange("squareFeet", parseInt(e.target.value) || 0)}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="monthlyRent" className="text-sm font-medium">
                          Monthly Rent ($)
                        </Label>
                        <Input
                          id="monthlyRent"
                          type="number"
                          min="0"
                          value={formData.monthlyRent || 0}
                          onChange={(e) => handleInputChange("monthlyRent", parseFloat(e.target.value) || 0)}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="moveInDate" className="text-sm font-medium">
                          Move In Date
                        </Label>
                        <Input
                          id="moveInDate"
                          type="date"
                          value={formData.moveInDate}
                          onChange={(e) => handleInputChange("moveInDate", e.target.value)}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="moveOutDate" className="text-sm font-medium">
                          Move Out Date
                        </Label>
                        <Input
                          id="moveOutDate"
                          type="date"
                          value={formData.moveOutDate}
                          onChange={(e) => handleInputChange("moveOutDate", e.target.value)}
                          className="h-11"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-6">Utilities</h3>
                      <div className="grid grid-cols-3 gap-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <Label htmlFor="power" className="text-sm font-medium cursor-pointer">
                            Power
                          </Label>
                          <Switch
                            id="power"
                            checked={formData.utilities.power}
                            onCheckedChange={(checked) => handleUtilityChange("power", checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <Label htmlFor="water" className="text-sm font-medium cursor-pointer">
                            Water
                          </Label>
                          <Switch
                            id="water"
                            checked={formData.utilities.water}
                            onCheckedChange={(checked) => handleUtilityChange("water", checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <Label htmlFor="gas" className="text-sm font-medium cursor-pointer">
                            Gas
                          </Label>
                          <Switch
                            id="gas"
                            checked={formData.utilities.gas}
                            onCheckedChange={(checked) => handleUtilityChange("gas", checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Status & Flags */}
              {activeSection === "status" && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-8">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <IconShield className="h-5 w-5" />
                      Status & Flags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="status" className="text-sm font-medium">
                          Property Status
                        </Label>
                        <Select 
                          value={formData.status} 
                          onValueChange={(value) => handleInputChange("status", value)}
                        >
                          <SelectTrigger className="h-11">
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

                      <div className="space-y-3">
                        <Label htmlFor="statusYardi" className="text-sm font-medium">
                          Yardi Status
                        </Label>
                        <Input
                          id="statusYardi"
                          placeholder="Status in Yardi system"
                          value={formData.statusYardi}
                          onChange={(e) => handleInputChange("statusYardi", e.target.value)}
                          className="h-11"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold mb-2">Property Flags</h3>
                      
                      <div className="grid gap-4">
                        <div className="flex items-center justify-between p-5 border rounded-lg hover:bg-muted/30 transition-colors">
                          <div>
                            <Label htmlFor="isCore" className="text-sm font-medium">
                              Core Property
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Is this a core property in your portfolio?
                            </p>
                          </div>
                          <Switch
                            id="isCore"
                            checked={formData.isCore}
                            onCheckedChange={(checked) => handleInputChange("isCore", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-5 border rounded-lg hover:bg-muted/30 transition-colors">
                          <div>
                            <Label htmlFor="section8" className="text-sm font-medium">
                              Section 8
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Is this property eligible for Section 8 housing?
                            </p>
                          </div>
                          <Switch
                            id="section8"
                            checked={formData.section8}
                            onCheckedChange={(checked) => handleInputChange("section8", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-5 border rounded-lg hover:bg-muted/30 transition-colors">
                          <div>
                            <Label htmlFor="insurance" className="text-sm font-medium">
                              Insurance
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Does this property have active insurance?
                            </p>
                          </div>
                          <Switch
                            id="insurance"
                            checked={formData.insurance}
                            onCheckedChange={(checked) => handleInputChange("insurance", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-5 border rounded-lg hover:bg-muted/30 transition-colors">
                          <div>
                            <Label htmlFor="ownership" className="text-sm font-medium">
                              Ownership
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Do we own this property?
                            </p>
                          </div>
                          <Switch
                            id="ownership"
                            checked={formData.ownership}
                            onCheckedChange={(checked) => handleInputChange("ownership", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-5 border rounded-lg hover:bg-muted/30 transition-colors">
                          <div>
                            <Label htmlFor="inDisposition" className="text-sm font-medium">
                              In Disposition
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Is this property in the disposal process?
                            </p>
                          </div>
                          <Switch
                            id="inDisposition"
                            checked={formData.inDisposition}
                            onCheckedChange={(checked) => handleInputChange("inDisposition", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-5 border rounded-lg hover:bg-muted/30 transition-colors">
                          <div>
                            <Label htmlFor="squatters" className="text-sm font-medium">
                              Squatters
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Are there squatters present at this property?
                            </p>
                          </div>
                          <Switch
                            id="squatters"
                            checked={formData.squatters}
                            onCheckedChange={(checked) => handleInputChange("squatters", checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Management */}
              {activeSection === "management" && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-8">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <IconUsers className="h-5 w-5" />
                      Management & Authority
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="propertyManagerId" className="text-sm font-medium">
                          Property Manager (PM)
                        </Label>
                        <Select 
                          value={formData.propertyManagerId} 
                          onValueChange={(value) => handleInputChange("propertyManagerId", value)}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select a property manager" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pm1">John Smith</SelectItem>
                            <SelectItem value="pm2">Jane Doe</SelectItem>
                            <SelectItem value="pm3">Mike Johnson</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="seniorPropertyManagerId" className="text-sm font-medium">
                          Senior Property Manager (Sr PM)
                        </Label>
                        <Select 
                          value={formData.seniorPropertyManagerId} 
                          onValueChange={(value) => handleInputChange("seniorPropertyManagerId", value)}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select a senior property manager" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spm1">Sarah Wilson</SelectItem>
                            <SelectItem value="spm2">Robert Brown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="renovationTechnicianId" className="text-sm font-medium">
                          Assigned Renovation Technician (RT)
                        </Label>
                        <Select 
                          value={formData.renovationTechnicianId} 
                          onValueChange={(value) => handleInputChange("renovationTechnicianId", value)}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select a renovation technician" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rt1">Tom Anderson</SelectItem>
                            <SelectItem value="rt2">Lisa Martinez</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="propertyUpdatorId" className="text-sm font-medium">
                          Responsible for Updates
                        </Label>
                        <Select 
                          value={formData.propertyUpdatorId} 
                          onValueChange={(value) => handleInputChange("propertyUpdatorId", value)}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select person responsible" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="up1">Admin User</SelectItem>
                            <SelectItem value="up2">System Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Additional Info */}
              {activeSection === "additional" && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-8">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <IconPhoto className="h-5 w-5" />
                      Additional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-3">
                      <Label htmlFor="notes" className="text-sm font-medium">
                        Notes
                      </Label>
                      <Textarea
                        id="notes"
                        placeholder="Add any additional notes or special instructions..."
                        value={formData.notes}
                        onChange={(e) => handleInputChange("notes", e.target.value)}
                        rows={6}
                        className="resize-none"
                      />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label htmlFor="images" className="text-sm font-medium">
                        Property Images
                      </Label>
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
                          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
                        >
                          <IconUpload className="h-10 w-10 text-muted-foreground mb-3" />
                          <p className="text-sm font-medium">Click to upload images</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG, GIF up to 10MB
                          </p>
                        </Label>
                      </div>

                      {formData.images.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium mb-3">Uploaded Images</h4>
                          <div className="flex flex-wrap gap-3">
                            {formData.images.map((file, index) => (
                              <div key={index} className="relative group">
                                <Badge variant="secondary" className="pr-10 py-2">
                                  {file.name}
                                </Badge>
                                <button
                                  onClick={() => removeImage(index)}
                                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                >
                                  <IconX className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="sticky bottom-0 bg-background border-t">
              <div className="px-8 py-6">
                <div className="flex justify-between items-center max-w-4xl">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => router.push(`/properties/${params.id}`)}
                      className="min-w-[120px]"
                    >
                      Cancel
                    </Button>
                    {currentSectionIndex > 0 && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handlePreviousSection}
                        className="min-w-[120px]"
                      >
                        Previous
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {currentSectionIndex < sections.length - 1 ? (
                      <Button
                        size="lg"
                        onClick={handleNextSection}
                        className="min-w-[120px]"
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        onClick={handleSubmit}
                        disabled={updateMutation.isPending || !formData.name || !formData.address || !formData.city || !formData.state || !formData.zipCode}
                        className="min-w-[160px]"
                      >
                        {updateMutation.isPending ? (
                          <>
                            <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Property"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}