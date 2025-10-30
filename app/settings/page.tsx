"use client"

import { useState, useEffect } from "react"
import { AppHeader } from "@/components/layout/app-header"
import { AppNav } from "@/components/layout/app-nav"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2 } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuthContext } from "@/components/auth/auth-provider"

interface District {
  id: string
  name: string
}

interface Branch {
  id: string
  name: string
  district_id: string
}

interface Product {
  id: string
  name: string
}

interface ApproverUser {
  id: string
  full_name: string
  email: string
}

interface ApproverAssignment {
  id: string
  approver_id: string
  district_id: string | null
  branch_id: string | null
  product_id: string | null
  approver?: ApproverUser
  district?: District
  branch?: Branch
  product?: Product
}

export default function SettingsPage() {
  const { profile } = useAuthContext()
  const supabase = getSupabaseBrowserClient()

  const [approvers, setApprovers] = useState<ApproverUser[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [assignments, setAssignments] = useState<ApproverAssignment[]>([])

  // Form state
  const [selectedApprover, setSelectedApprover] = useState("")
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([])
  const [selectedBranches, setSelectedBranches] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  useEffect(() => {
    fetchApprovers()
    fetchDistricts()
    fetchBranches()
    fetchProducts()
    fetchAssignments()
  }, [])

  async function fetchApprovers() {
    const { data } = await supabase
      .from("users")
      .select("id, full_name, email")
      .eq("role", "head_office_approver")
      .eq("is_active", true)
      .order("full_name")

    if (data) setApprovers(data)
  }

  async function fetchDistricts() {
    const { data } = await supabase.from("districts").select("id, name").order("name")
    if (data) setDistricts(data)
  }

  async function fetchBranches() {
    const { data } = await supabase.from("branches").select("id, name, district_id").eq("is_active", true).order("name")
    if (data) setBranches(data)
  }

  async function fetchProducts() {
    const { data } = await supabase.from("products").select("id, name").eq("is_active", true).order("name")
    if (data) setProducts(data)
  }

  async function fetchAssignments() {
    const { data } = await supabase
      .from("approver_assignments")
      .select(
        `
        *,
        approver:users!approver_id(id, full_name, email),
        district:districts(id, name),
        branch:branches(id, name),
        product:products(id, name)
      `,
      )
      .order("created_at", { ascending: false })

    if (data) setAssignments(data)
  }

  async function handleAddAssignment() {
    if (!selectedApprover) return

    const assignmentsToCreate = []

    // Create assignments for each selected district
    for (const districtId of selectedDistricts) {
      assignmentsToCreate.push({
        approver_id: selectedApprover,
        district_id: districtId,
        branch_id: null,
        product_id: null,
      })
    }

    // Create assignments for each selected branch
    for (const branchId of selectedBranches) {
      assignmentsToCreate.push({
        approver_id: selectedApprover,
        district_id: null,
        branch_id: branchId,
        product_id: null,
      })
    }

    // Create assignments for each selected product
    for (const productId of selectedProducts) {
      assignmentsToCreate.push({
        approver_id: selectedApprover,
        district_id: null,
        branch_id: null,
        product_id: productId,
      })
    }

    if (assignmentsToCreate.length > 0) {
      console.log(assignmentsToCreate)
      const { error } = await supabase.from("approver_assignments").insert(assignmentsToCreate)

      if (!error) {
        setSelectedApprover("")
        setSelectedDistricts([])
        setSelectedBranches([])
        setSelectedProducts([])
        fetchAssignments()
      }
    }
  }

  async function handleDeleteAssignment(id: string) {
    const { error } = await supabase.from("approver_assignments").delete().eq("id", id)
    if (!error) fetchAssignments()
  }

  const groupedAssignments = assignments.reduce(
    (acc, assignment) => {
      const approverId = assignment.approver_id
      if (!acc[approverId]) {
        acc[approverId] = {
          approver: assignment.approver,
          assignments: [],
        }
      }
      acc[approverId].assignments.push(assignment)
      return acc
    },
    {} as Record<string, { approver?: ApproverUser; assignments: ApproverAssignment[] }>,
  )

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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Approver Assignment Configuration</h1>
          <p className="text-slate-600 mt-1">System Administrator Control Panel</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Assignment Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Criteria</CardTitle>
                <CardDescription>Define the rules for assigning approvers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="approver">
                    Approver <span className="text-red-500">*</span>
                  </Label>
                  <Select value={selectedApprover} onValueChange={setSelectedApprover}>
                    <SelectTrigger id="approver">
                      <SelectValue placeholder="Select Approver" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvers.map((approver) => (
                        <SelectItem key={approver.id} value={approver.id}>
                          {approver.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>District(s)</Label>
                  <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                    {districts.map((district) => (
                      <label key={district.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedDistricts.includes(district.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDistricts([...selectedDistricts, district.id])
                            } else {
                              setSelectedDistricts(selectedDistricts.filter((id) => id !== district.id))
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{district.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">Hold Ctrl/Cmd to select multiple.</p>
                </div>

                <div className="space-y-2">
                  <Label>Branch(es)</Label>
                  <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                    {branches.map((branch) => (
                      <label key={branch.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedBranches.includes(branch.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBranches([...selectedBranches, branch.id])
                            } else {
                              setSelectedBranches(selectedBranches.filter((id) => id !== branch.id))
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{branch.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">Hold Ctrl/Cmd to select multiple.</p>
                </div>

                <div className="space-y-2">
                  <Label>Product(s)</Label>
                  <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                    {products.map((product) => (
                      <label key={product.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts([...selectedProducts, product.id])
                            } else {
                              setSelectedProducts(selectedProducts.filter((id) => id !== product.id))
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{product.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">Hold Ctrl/Cmd to select multiple.</p>
                </div>

                <Button onClick={handleAddAssignment} className="w-full">
                  + Add Assignment
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Current Assignments */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Current Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Approver</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">District(s)</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Branch(es)</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Product(s)</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {Object.values(groupedAssignments).map(({ approver, assignments }) => {
                        const districtNames = assignments.filter((a) => a.district).map((a) => a.district!.name)
                        const branchNames = assignments.filter((a) => a.branch).map((a) => a.branch!.name)
                        const productNames = assignments.filter((a) => a.product).map((a) => a.product!.name)

                        return (
                          <tr key={approver?.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <p className="font-medium text-slate-900">{approver?.full_name}</p>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {districtNames.map((name, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {name}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {branchNames.map((name, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {name}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {productNames.map((name, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {name}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                                onClick={() => {
                                  assignments.forEach((a) => handleDeleteAssignment(a.id))
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
