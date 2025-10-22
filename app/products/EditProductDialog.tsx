// components/dialogs/EditProductDialog.tsx

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// Define the shape of a Product to be used as a prop
interface Product {
  id: string;
  name: string;
  description: string | null;
  product_code: string | null;
}

interface EditProductDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditProductDialog({
  product,
  isOpen,
  onClose,
  onUpdated,
}: EditProductDialogProps) {
  const supabase = getSupabaseBrowserClient();

  // Internal state for the form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Pre-fill the form when a product is passed in
  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || "");
      setCode(product.product_code || "");
    }
  }, [product]);

  const handleUpdate = async () => {
    if (!product || !name.trim()) return;
    setIsLoading(true);
    const { error } = await supabase
      .from("products")
      .update({
        name: name,
        description: description || null,
        product_code: code || null,
      })
      .eq("id", product.id);
    setIsLoading(false);
    if (error) {
      alert("Error updating product: " + error.message);
    } else {
      alert("Product updated successfully!");
      onUpdated(); // This closes the modal and refreshes the list
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Make changes to the product details below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-product-name">Product Name</Label>
              <Input
                id="edit-product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-product-code">Product Code</Label>
              <Input
                id="edit-product-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-product-description">Description</Label>
            <Textarea
              id="edit-product-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpdate}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
