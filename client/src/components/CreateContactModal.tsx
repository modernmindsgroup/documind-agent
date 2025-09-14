import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

const createContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  source: z.string().min(1, "Source is required"),
  status: z.enum(["active", "inactive", "pending"]).default("active"),
});

type CreateContactForm = z.infer<typeof createContactSchema>;

interface CreateContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateContactModal({ open, onOpenChange }: CreateContactModalProps) {
  const { toast } = useToast();
  const [createdContactId, setCreatedContactId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const form = useForm<CreateContactForm>({
    resolver: zodResolver(createContactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      source: "manual",
      status: "active",
    },
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: CreateContactForm) => {
      const response = await apiRequest("POST", "/api/contacts", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts/stats"] });
      setCreatedContactId(data.id);
      toast({
        title: "Contact created successfully!",
        description: `${form.getValues("name")} has been added to your contacts.`,
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error creating contact",
        description: error instanceof Error ? error.message : "Failed to create contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCopyId = async () => {
    if (createdContactId) {
      try {
        await navigator.clipboard.writeText(createdContactId);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
        toast({
          title: "Copied!",
          description: "Contact ID copied to clipboard",
        });
      } catch (err) {
        toast({
          title: "Failed to copy",
          description: "Could not copy contact ID to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const onSubmit = (data: CreateContactForm) => {
    createContactMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Add New Contact
          </DialogTitle>
          <DialogDescription>
            Create a new contact entry for your database.
          </DialogDescription>
        </DialogHeader>

        {createdContactId ? (
          <div className="text-center py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mx-auto mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Contact Created!</h3>
            <p className="text-muted-foreground mb-4">
              Your contact has been successfully created.
            </p>
            <div className="flex items-center gap-2 justify-center mb-4">
              <code className="px-2 py-1 bg-muted rounded text-sm">{createdContactId}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyId}
                className="h-8 w-8 p-0"
              >
                {copiedId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setCreatedContactId(null);
                }}
              >
                Create Another
              </Button>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="manual">Manual Entry</SelectItem>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="chat">Chat Widget</SelectItem>
                          <SelectItem value="api">API</SelectItem>
                          <SelectItem value="import">Import</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createContactMutation.isPending}>
                  {createContactMutation.isPending ? "Creating..." : "Create Contact"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}