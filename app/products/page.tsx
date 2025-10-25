"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppNav } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MoreVertical } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/components/auth/auth-provider";
import { EditProductDialog } from "./EditProductDialog";
import { ProductSchema, ProductSchematype } from "@/schema/ProductSchema";

interface Product {
  id: string;
  name: string;
  description: string | null;
  product_code: string | null;
  is_active: boolean;
}

export default function ProductsPage() {
  const { profile } = useAuthContext();
  const supabase = getSupabaseBrowserClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productCode, setProductCode] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductSchematype>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      product_name: "",
      product_code: "",
      product_description: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");

    if (!error && data) {
      setProducts(data);
    }
  }

  // async function handleAddProduct() {
  //   if (!productName.trim()) return;

  //   const { error } = await supabase.from("products").insert({
  //     name: productName,
  //     description: productDescription || null,
  //     product_code: productCode || null,
  //     is_active: true,
  //   });

  //   if (!error) {
  //     setProductName("");
  //     setProductDescription("");
  //     setProductCode("");
  //     setShowForm(false);
  //     fetchProducts();
  //   }
  // }

  const onSubmit: SubmitHandler<ProductSchematype> = async(data) => {
   
    const { product_name, product_code, product_description } = data;

        const { error } = await supabase.from("products").insert({
      name: product_name,
      description: product_description || null,
      product_code: product_code || null,
      is_active: true,
    });

    if(!error){
      fetchProducts();
    }
    
  }

  async function toggleProductStatus(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from("products")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (!error) fetchProducts();
  }

  if (profile?.role !== "system_admin") {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <AppNav />
        <div className="p-6">
          <p className="text-slate-600">Access denied. System Admin only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <AppNav />

      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Product Management
            </h1>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ Add New Product"}
          </Button>
        </div>

        {showForm && (
          <form  onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white rounded-lg border p-6 mb-6 space-y-4">
              <h2 className="text-lg font-semibold">Add New Product</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product-name">
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("product_name")}
                    id="product-name"
                    placeholder="e.g., Personal Loan"
                  />
                  {errors.product_name && <p className="text-red-500">{errors.product_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-code">Product Code</Label>
                  <Input
                    {...register("product_code")}
                    id="product-code"
                    placeholder="e.g., PL001"
                  />
                  {errors.product_code && <p className="text-red-500">{errors.product_code.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-description">Description</Label>
                <Textarea
                  {...register("product_description")}
                  id="product-description"
                  placeholder="Enter product description"
                  rows={3}
                />
                {errors.product_description && <p className="text-red-500">{errors.product_description.message}</p>}
              </div>
              <Button type="submit">Add Product</Button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  PRODUCT NAME
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  DESCRIPTION
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  STATUS
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{product.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-600 text-sm">
                      {product.description || "-"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={product.is_active ? "default" : "secondary"}
                    >
                      {product.is_active ? "Active" : "Archived"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu
                      open={openDropdownId === product.id}
                      onOpenChange={(isOpen) => {
                        setOpenDropdownId(isOpen ? product.id : null);
                      }}
                    >
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className=" cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onSelect={() => {
                            setEditingProduct(product);
                            setOpenDropdownId(null);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() =>
                            toggleProductStatus(product.id, product.is_active)
                          }
                        >
                          {product.is_active ? "Archive" : "Activate"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <EditProductDialog
        isOpen={!!editingProduct}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onUpdated={async () => {
          await fetchProducts();

          setEditingProduct(null);
        }}
      />
    </div>
  );
}
