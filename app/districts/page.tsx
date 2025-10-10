"use client"

import { useState, useEffect } from "react"
import { AppHeader } from "@/components/layout/app-header"
import { AppNav } from "@/components/layout/app-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Pencil, Trash2 } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuthContext } from "@/components/auth/auth-provider"

interface District {
  id: string
  name: string
  code: string | null
}

interface Branch {
  id: string
  name: string
  code: string | null
  district_id: string
  district?: District
}

export default function DistrictsPage() {
  const { profile } = useAuthContext()
  const supabase = getSupabaseBrowserClient()

  const [districts, setDistricts] = useState<District[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [districtSearch, setDistrictSearch] = useState("")
  const [branchSearch, setBranchSearch] = useState("")

  // District form
  const [newDistrictName, setNewDistrictName] = useState("")
  const [newDistrictCode, setNewDistrictCode] = useState("")

  // Branch form
  const [newBranchName, setNewBranchName] = useState("")
  const [newBranchCode, setNewBranchCode] = useState("")
  const [selectedDistrictId, setSelectedDistrictId] = useState("")

  useEffect(() => {
    fetchDistricts()
    fetchBranches()
  }, [])

  async function fetchDistricts() {
    const { data, error } = await supabase.from("districts").select("*").order("name")

    if (!error && data) {
      setDistricts(data)
    }
  }

  async function fetchBranches() {
    const { data, error } = await supabase.from("branches").select("*, district:districts(*)").order("name")

    if (!error && data) {
      setBranches(data)
    }
  }

  async function handleAddDistrict() {
    if (!newDistrictName.trim()) return

    const { error } = await supabase.from("districts").insert({
      name: newDistrictName,
      code: newDistrictCode || null,
    })

    if (!error) {
      setNewDistrictName("")
      setNewDistrictCode("")
      fetchDistricts()
    }
  }

  async function handleAddBranch() {
    if (!newBranchName.trim() || !selectedDistrictId) return

    const { error } = await supabase.from("branches").insert({
      name: newBranchName,
      code: newBranchCode || null,
      district_id: selectedDistrictId,
    })

    if (!error) {
      setNewBranchName("")
      setNewBranchCode("")
      setSelectedDistrictId("")
      fetchBranches()
    }
  }

  async function handleDeleteDistrict(id: string) {
    const { error } = await supabase.from("districts").delete().eq("id", id)
    if (!error) fetchDistricts()
  }

  async function handleDeleteBranch(id: string) {
    const { error } = await supabase.from("branches").delete().eq("id", id)
    if (!error) fetchBranches()
  }

  const filteredDistricts = districts.filter((d) => d.name.toLowerCase().includes(districtSearch.toLowerCase()))

  const filteredBranches = branches.filter((b) => b.name.toLowerCase().includes(branchSearch.toLowerCase()))

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

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Districts & Branches</h1>
          <p className="text-slate-600 mt-1">Manage organizational structure for Ansar DF.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* District Management */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>District Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="district-name">
                      District Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="district-name"
                      placeholder="Enter district name"
                      value={newDistrictName}
                      onChange={(e) => setNewDistrictName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="district-code">District Code</Label>
                    <Input
                      id="district-code"
                      placeholder="Enter district code (optional)"
                      value={newDistrictCode}
                      onChange={(e) => setNewDistrictCode(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddDistrict} className="w-full">
                    Add District
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Districts</CardTitle>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search districts..."
                    className="pl-9"
                    value={districtSearch}
                    onChange={(e) => setDistrictSearch(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredDistricts.map((district) => (
                    <div key={district.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{district.name}</p>
                        {district.code && <p className="text-sm text-slate-500">Code: {district.code}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteDistrict(district.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Branch Management */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Branch Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="branch-name">
                      Branch Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="branch-name"
                      placeholder="Enter branch name"
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="associated-district">
                      Associated District <span className="text-red-500">*</span>
                    </Label>
                    <Select value={selectedDistrictId} onValueChange={setSelectedDistrictId}>
                      <SelectTrigger id="associated-district">
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district.id} value={district.id}>
                            {district.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="branch-code">Branch Code</Label>
                    <Input
                      id="branch-code"
                      placeholder="Enter branch code (optional)"
                      value={newBranchCode}
                      onChange={(e) => setNewBranchCode(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddBranch} className="w-full">
                    Add New Branch
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Branches</CardTitle>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search branches..."
                    className="pl-9"
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredBranches.map((branch) => (
                    <div key={branch.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{branch.name}</p>
                        <div className="flex gap-3 text-sm text-slate-500">
                          <span>District: {branch.district?.name}</span>
                          {branch.code && <span>Code: {branch.code}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteBranch(branch.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
