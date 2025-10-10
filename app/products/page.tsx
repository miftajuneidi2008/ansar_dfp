"use client"

import { useState, useEffect } from "react"
import { AppHeader } from "@/components/layout/app-header"
import { AppNav } from "@/components/layout/app-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuthContext } from "@/components/auth/auth-provider"

interface Product {
  id: string
  name: string
  description: string | null
  product_code: string | null
  is_active: boolean
}

export default function ProductsPage() {
  const { profile } = useAuthContext()
  const supabase = getSupabaseBrowserClient()

  const [products, setProducts] = useState<Product[]>([])
  const [showForm, setShowForm] = useState(false)
  const [productName, setProductName] = useState("")
  const [productDescription, setProductDescription] = useState("")
  const [productCode, setProductCode] = useState("")

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data, error } = await supabase.from("products").select("*").order("name")

    if (!error && data) {
      setProducts(data)
    }
  }

  async function handleAddProduct() {
    if (!productName.trim()) return

    const { error } = await supabase.from("products").insert({
      name: productName,
      description: productDescription || null,
      product_code: productCode || null,
      is_active: true,
    })

    if (!error) {
      setProductName("")
      setProductDescription("")
      setProductCode("")
      setShowForm(false)
      fetchProducts()
    }
  }

  async function toggleProductStatus(id: string, currentStatus: boolean) {
    const { error } = await supabase.from("products").update({ is_active: !currentStatus }).eq("id", id)

    if (!error) fetchProducts()
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
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <AppNav />

      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Product Management</h1>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ Add New Product"}</Button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg border p-6 mb-6 space-y-4">
            <h2 className="text-lg font-semibold">Add New Product</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="product-name"
                  placeholder="e.g., Personal Loan"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-code">Product Code</Label>
                <Input
                  id="product-code"
                  placeholder="e.g., PL001"
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                placeholder="Enter product description"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                rows={3}
              />
            </div>
            <Button onClick={handleAddProduct}>Add Product</Button>
          </div>
        )}

        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">PRODUCT NAME</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">DESCRIPTION</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">STATUS</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{product.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-600 text-sm">{product.description || "-"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Active" : "Archived"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleProductStatus(product.id, product.is_active)}>
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
    </div>
  )
}
