"use client"

import { useState, useEffect } from "react"
import { AppHeader } from "@/components/layout/app-header"
import { AppNav } from "@/components/layout/app-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuthContext } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"

interface Application {
  id: string
  application_number: string
  customer_name: string
  phone_number: string
  status: string
  submitted_at: string
  product: {
    name: string
  }
}

export default function ApplicationsPage() {
  const { profile } = useAuthContext()
  const supabase = getSupabaseBrowserClient()
  const router = useRouter()

  const [applications, setApplications] = useState<Application[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [customerFilter, setCustomerFilter] = useState("")
  const [productFilter, setProductFilter] = useState("all")

  const [stats, setStats] = useState({
    draft: 0,
    pending: 0,
    approved: 0,
    returned: 0,
    rejected: 0,
  })

  useEffect(() => {
    fetchApplications()
  }, [profile])

  async function fetchApplications() {
    if (!profile) return

    let query = supabase.from("applications").select(
      `
      *,
      product:products(name)
    `,
    )

    // Branch users only see their own applications
    if (profile.role === "branch_user") {
      query = query.eq("submitted_by", profile.id)
    }

    const { data, error } = await query.order("submitted_at", { ascending: false })

    if (!error && data) {
      setApplications(data)

      const draft = data.filter((a) => a.status === "draft").length
      const pending = data.filter((a) => a.status === "pending").length
      const approved = data.filter((a) => a.status === "approved").length
      const returned = data.filter((a) => a.status === "returned").length
      const rejected = data.filter((a) => a.status === "rejected").length

      setStats({ draft, pending, approved, returned, rejected })
    }
  }

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.application_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.phone_number.includes(searchQuery)

    const matchesCustomer =
      customerFilter === "" || app.customer_name.toLowerCase().includes(customerFilter.toLowerCase())

    const matchesProduct = productFilter === "all" || app.product.name === productFilter

    return matchesSearch && matchesCustomer && matchesProduct
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-slate-100 text-slate-700">Draft</Badge>
      case "pending":
        return <Badge className="bg-cyan-100 text-cyan-700">Pending</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-700">Approved</Badge>
      case "returned":
        return <Badge className="bg-amber-100 text-amber-700">Returned</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-700">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <AppNav />

      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {profile?.role === "branch_user" ? "My Submitted Applications" : "Applications"}
            </h1>
          </div>
          {profile?.role === "branch_user" && (
            <Button onClick={() => router.push("/applications/new")}>+ New Application</Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600 font-medium mb-1">Draft</p>
              <p className="text-3xl font-bold text-slate-900">{stats.draft}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-cyan-600 font-medium mb-1">Pending</p>
              <p className="text-3xl font-bold text-slate-900">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-green-600 font-medium mb-1">Approved</p>
              <p className="text-3xl font-bold text-slate-900">{stats.approved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-amber-600 font-medium mb-1">Returned</p>
              <p className="text-3xl font-bold text-slate-900">{stats.returned}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-red-600 font-medium mb-1">Rejected</p>
              <p className="text-3xl font-bold text-slate-900">{stats.rejected}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, phone, etc..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Customer Name" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
              </SelectContent>
            </Select>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="Salihat">Salihat</SelectItem>
                <SelectItem value="Small Enterprise Working Capital">Small Enterprise Working Capital</SelectItem>
                <SelectItem value="Medium Enterprise Capital Expenditure">
                  Medium Enterprise Capital Expenditure
                </SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">APPLICATION ID</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">CUSTOMER NAME</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">PHONE NUMBER</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">PRODUCT</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">SUBMISSION DATE</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredApplications.map((app) => (
                <tr
                  key={app.id}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => {
                    if (app.status === "draft") {
                      router.push(`/applications/new?edit=${app.id}`)
                    } else {
                      router.push(`/applications/${app.id}`)
                    }
                  }}
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{app.application_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-900">{app.customer_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-600">{app.phone_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-600">{app.product.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-600">{new Date(app.submitted_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredApplications.length === 0 && (
            <div className="text-center py-12 text-slate-500">No applications found</div>
          )}
        </div>
      </div>
    </div>
  )
}
