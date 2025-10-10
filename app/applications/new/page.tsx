"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AppHeader } from "@/components/layout/app-header"
import { AppNav } from "@/components/layout/app-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuthContext } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"

interface Product {
  id: string
  name: string
  description: string | null
}

export default function NewApplicationPage() {
  const { profile } = useAuthContext()
  const supabase = getSupabaseBrowserClient()
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [applicationAmount, setApplicationAmount] = useState("")
  const [interestRate, setInterestRate] = useState("")
  const [tenureMonths, setTenureMonths] = useState("")
  const [monthlyInstallment, setMonthlyInstallment] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data } = await supabase.from("products").select("*").eq("is_active", true).order("name")

    if (data) setProducts(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || !selectedProduct) return

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from("applications")
        .insert({
          customer_name: customerName,
          customer_id: customerId || null,
          phone_number: phoneNumber,
          product_id: selectedProduct,
          branch_id: profile.branch_id,
          application_amount: Number.parseFloat(applicationAmount),
          interest_rate: interestRate ? Number.parseFloat(interestRate) : null,
          tenure_months: tenureMonths ? Number.parseInt(tenureMonths) : null,
          monthly_installment: monthlyInstallment ? Number.parseFloat(monthlyInstallment) : null,
          status: "pending",
          submitted_by: profile.id,
        })
        .select()
        .single()

      if (error) throw error

      // Create audit trail entry
      await supabase.from("application_status_history").insert({
        application_id: data.id,
        from_status: null,
        to_status: "pending",
        action_by: profile.id,
        action_by_role: profile.role,
      })

      router.push("/applications")
    } catch (error: any) {
      console.error("[v0] Error submitting application:", error)
      alert("Failed to submit application: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (profile?.role !== "branch_user") {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <AppNav />
        <div className="p-6">
          <p className="text-slate-600">Access denied. Branch Users only.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <AppNav />

      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">New Application</h1>
          <p className="text-slate-600 mt-1">Submit a new financing application for a customer.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Product Selection</CardTitle>
              <CardDescription className="text-red-500">*</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setSelectedProduct(product.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      selectedProduct === product.id
                        ? "border-teal-500 bg-teal-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedProduct === product.id ? "border-teal-500" : "border-slate-300"
                        }`}
                      >
                        {selectedProduct === product.id && <div className="w-3 h-3 rounded-full bg-teal-500" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{product.name}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer-name">
                  Customer Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customer-name"
                  placeholder="Enter customer's full name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-id">Customer ID</Label>
                <Input
                  id="customer-id"
                  placeholder="Enter customer ID (optional)"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone-number">
                  Contact Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone-number"
                  placeholder="+251 911 234 567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Application Amount (SAR) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="50000"
                    value={applicationAmount}
                    onChange={(e) => setApplicationAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interest-rate">Interest Rate (%)</Label>
                  <Input
                    id="interest-rate"
                    type="number"
                    step="0.01"
                    placeholder="5.0"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenure">Tenure (Months)</Label>
                  <Input
                    id="tenure"
                    type="number"
                    placeholder="36"
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="installment">Monthly Installment (SAR)</Label>
                  <Input
                    id="installment"
                    type="number"
                    step="0.01"
                    placeholder="1500"
                    value={monthlyInstallment}
                    onChange={(e) => setMonthlyInstallment(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedProduct}>
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
