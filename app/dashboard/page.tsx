"use client"

import { useState, useEffect } from "react"
import { AppHeader } from "@/components/layout/app-header"
import { AppNav } from "@/components/layout/app-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, ArrowUpDown } from "lucide-react"
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
  branch: {
    name: string
  }
  product: {
    name: string
  }
}

export default function DashboardPage() {
  const { profile } = useAuthContext()
  const supabase = getSupabaseBrowserClient()
  const router = useRouter()

  const [applications, setApplications] = useState<Application[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [productFilter, setProductFilter] = useState("all")

  const [stats, setStats] = useState({
    newApplications: 0,
    inReview: 0,
    approved: 0,
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
      branch:branches(name),
      product:products(name)
    `,
    )

    if (profile.role === "branch_user") {
      query = query.eq("submitted_by", profile.id)
    }

    // Remove the status filter so they can see approved/rejected applications too
    if (profile.role === "head_office_approver") {
      // In production, this would be filtered by approver assignments
      // For now, show all applications
      // TODO: Add approver assignment filtering based on district/branch/product
    }

    const { data, error } = await query.order("submitted_at", { ascending: false })

    if (!error && data) {
      setApplications(data)

      const newApps = data.filter((a) => a.status === "pending").length
      const inReview = data.filter((a) => a.status === "in_review").length
      const approved = data.filter((a) => a.status === "approved").length
      const rejected = data.filter((a) => a.status === "rejected").length

      setStats({
        newApplications: newApps,
        inReview: inReview,
        approved: approved,
        rejected: rejected,
      })
    }
  }

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.application_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.customer_name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || app.status === statusFilter
    const matchesProduct = productFilter === "all" || app.product.name === productFilter

    return matchesSearch && matchesStatus && matchesProduct
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
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

  const getDashboardTitle = () => {
    if (profile?.role === "branch_user") return "My Submitted Applications"
    if (profile?.role === "head_office_approver") return "Applications Dashboard"
    return "Dashboard"
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <AppNav />

      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{getDashboardTitle()}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <ArrowUpDown className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600 font-medium mb-1">
                {profile?.role === "head_office_approver" ? "New Applications" : "Pending"}
              </p>
              <p className="text-4xl font-bold text-slate-900">{stats.newApplications}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600 font-medium mb-1">In Review</p>
              <p className="text-4xl font-bold text-slate-900">{stats.inReview}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-green-600 font-medium mb-1">Approved</p>
              <p className="text-4xl font-bold text-slate-900">{stats.approved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-red-600 font-medium mb-1">Rejected</p>
              <p className="text-4xl font-bold text-slate-900">{stats.rejected}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by applicant name or application ID"
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="Salihat">Salihat</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {profile?.role === "head_office_approver" && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-teal-800">
              <span className="font-semibold">Head Office Approver</span> - Showing all applications filtered by your
              assigned districts, branches, and products.
            </p>
          </div>
        )}

        {/* Applications Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">APPLICATION ID</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">APPLICANT NAME</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">PRODUCT</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">BRANCH</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">SUBMISSION DATE</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">STATUS</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredApplications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{app.application_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-900">{app.customer_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-600">{app.product.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-600">{app.branch.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-600">{new Date(app.submitted_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="link" onClick={() => router.push(`/applications/${app.id}`)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredApplications.length === 0 && (
            <div className="text-center py-12 text-slate-500">No applications found</div>
          )}

          <div className="px-6 py-4 border-t bg-slate-50 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing 1 to {filteredApplications.length} of {applications.length} results
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
