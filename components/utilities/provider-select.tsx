"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { IconPlus } from "@tabler/icons-react";
import { useForm } from "react-hook-form";
import { UtilityProvider, CreateUtilityProviderData } from "@/types/utility";

interface ProviderSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  utilityType?: string;
  placeholder?: string;
  disabled?: boolean;
}

// Fetch function for providers
const fetchProviders = async (): Promise<{ providers: UtilityProvider[] }> => {
  const response = await fetch('/api/utilities/providers');
  if (!response.ok) throw new Error('Failed to fetch providers');
  return response.json();
};

// Create provider function
const createProvider = async (data: CreateUtilityProviderData): Promise<UtilityProvider> => {
  const response = await fetch('/api/utilities/providers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create provider');
  return response.json();
};

export function ProviderSelect({
  value,
  onValueChange,
  utilityType,
  placeholder = "Select provider",
  disabled = false,
}: ProviderSelectProps) {
  const [isAddingProvider, setIsAddingProvider] = useState(false);

  // Fetch providers
  const { data: providersData, isLoading, refetch } = useQuery({
    queryKey: ['utility-providers'],
    queryFn: fetchProviders,
  });

  const providers = providersData?.providers || [];

  // Filter providers by utility type if specified
  const filteredProviders = utilityType 
    ? providers.filter(provider => provider.type === utilityType)
    : providers;

  // Form for adding new provider
  const form = useForm<CreateUtilityProviderData>({
    defaultValues: {
      name: "",
      type: utilityType || "",
      contactPhone: "",
      contactEmail: "",
      website: "",
      isActive: true,
    },
  });

  const handleAddProvider = async (data: CreateUtilityProviderData) => {
    try {
      const newProvider = await createProvider(data);
      await refetch(); // Refresh the providers list
      if (onValueChange) {
        onValueChange(newProvider.id);
      }
      setIsAddingProvider(false);
      form.reset();
    } catch (error) {
      console.error('Error creating provider:', error);
    }
  };

  const utilityTypes = [
    { value: 'power', label: 'Electricity' },
    { value: 'gas', label: 'Gas' },
    { value: 'water', label: 'Water' },
    { value: 'sewer', label: 'Sewer' },
    { value: 'trash', label: 'Trash' },
    { value: 'internet', label: 'Internet' },
    { value: 'cable', label: 'Cable TV' },
  ];

  return (
    <div className="flex gap-2">
      <Select 
        value={value} 
        onValueChange={onValueChange} 
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder={isLoading ? "Loading..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {filteredProviders.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              No providers available. Click + to add one.
            </div>
          ) : (
            filteredProviders.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.name} ({provider.type})
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      <Dialog open={isAddingProvider} onOpenChange={setIsAddingProvider}>
        <DialogTrigger asChild>
          <Button type="button" size="icon" variant="outline">
            <IconPlus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Provider</DialogTitle>
            <DialogDescription>
              Create a new utility provider to use in your bills.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddProvider)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter provider name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {utilityTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@provider.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://provider.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddingProvider(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Add Provider
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}