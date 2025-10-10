"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Loader2 } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuthContext } from "@/components/auth/auth-provider"

export default function SetupPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const { user, profile, refreshProfile } = useAuthContext()

  const [loading, setLoading] = useState(false)
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([])
  const [formData, setFormData] = useState({
    full_name: "",
    role: "system_admin" as "branch_user" | "head_office_approver" | "system_admin",
    branch_id: "",
  })

  useEffect(() => {
    // If profile already exists, redirect to dashboard
    if (profile) {
      router.push("/dashboard")
      return
    }

    // Fetch branches for branch user selection
    fetchBranches()
  }, [profile])

  async function fetchBranches() {
    const { data } = await supabase.from("branches").select("id, name").order("name")
    if (data) setBranches(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setLoading(true)

    try {
      // Create user profile
      const { error } = await supabase.from("users").insert({
        id: user.id,
        email: user.email!,
        full_name: formData.full_name,
        role: formData.role,
        branch_id: formData.role === "branch_user" ? formData.branch_id : null,
        is_active: true,
      })

      if (error) throw error

      // Refresh profile
      await refreshProfile()

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Error creating profile:", error)
      alert("Failed to create profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-slate-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-teal-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>Set up your account to access the Ansar DF Applicant Tracking Portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user.email || ""} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system_admin">System Admin</SelectItem>
                  <SelectItem value="head_office_approver">Head Office Approver</SelectItem>
                  <SelectItem value="branch_user">Branch User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role === "branch_user" && (
              <div className="space-y-2">
                <Label htmlFor="branch">
                  Branch <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.branch_id}
                  onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Complete Setup
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
