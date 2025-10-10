"use client"

import { useState, useEffect } from "react"
import { AppHeader } from "@/components/layout/app-header"
import { AppNav } from "@/components/layout/app-nav"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuthContext } from "@/components/auth/auth-provider"
import { useParams, useRouter } from "next/navigation"

interface Application {
  id: string
  application_number: string
  customer_name: string
  customer_id: string | null
  phone_number: string
  status: string
  amount_limit: number
  profit_margin: number | null
  tenure_months: number | null
  monthly_installment: number | null
  submitted_at: string
  submitted_by: string
  product: {
    name: string
  }
  branch: {
    name: string
  }
}

interface StatusHistory {
  id: string
  from_status: string | null
  to_status: string
  action_by: string
  action_by_role: string
  reason: string | null
  comments: string | null
  created_at: string
  user: {
    full_name: string
  }
}

export default function ApplicationDetailsPage() {
  const { profile } = useAuthContext()
  const supabase = getSupabaseBrowserClient()
  const router = useRouter()
  const params = useParams()
  const applicationId = params.id as string

  const [application, setApplication] = useState<Application | null>(null)
  const [history, setHistory] = useState<StatusHistory[]>([])
  const [loading, setLoading] = useState(true)

  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [returnReason, setReturnReason] = useState("")
  const [approverComments, setApproverComments] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchApplication()
    fetchHistory()
  }, [applicationId])

  async function fetchApplication() {
    const { data, error } = await supabase
      .from("applications")
      .select(
        `
        *,
        product:products(name),
        branch:branches(name)
      `,
      )
      .eq("id", applicationId)
      .single()

    if (!error && data) {
      setApplication(data)
    }
    setLoading(false)
  }

  async function fetchHistory() {
    const { data } = await supabase
      .from("application_status_history")
      .select(
        `
        *,
        user:users!action_by(full_name)
      `,
      )
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false })

    if (data) setHistory(data)
  }

  async function handleApprove() {
    if (!profile || !application) return
    setActionLoading(true)

    try {
      // Update application status
      const { error: updateError } = await supabase
        .from("applications")
        .update({ status: "approved" })
        .eq("id", applicationId)

      if (updateError) throw updateError

      // Create audit trail entry
      const { error: historyError } = await supabase.from("application_status_history").insert({
        application_id: applicationId,
        from_status: application.status,
        to_status: "approved",
        action_by: profile.id,
        action_by_role: profile.role,
        comments: approverComments || null,
      })

      if (historyError) throw historyError

      await supabase.from("notifications").insert({
        user_id: application.submitted_by,
        title: "Application Approved",
        message: `Your application ${application.application_number} for ${application.customer_name} has been approved.`,
        type: "status_changed",
        related_application_id: applicationId,
      })

      router.push("/dashboard")
    } catch (error: any) {
      console.error("[v0] Error approving application:", error)
      alert("Failed to approve application: " + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject() {
    if (!profile || !application) return

    const reason = prompt("Please provide a reason for rejection:")
    if (!reason) return

    setActionLoading(true)

    try {
      const { error: updateError } = await supabase
        .from("applications")
        .update({ status: "rejected" })
        .eq("id", applicationId)

      if (updateError) throw updateError

      const { error: historyError } = await supabase.from("application_status_history").insert({
        application_id: applicationId,
        from_status: application.status,
        to_status: "rejected",
        action_by: profile.id,
        action_by_role: profile.role,
        reason: reason,
        comments: approverComments || null,
      })

      if (historyError) throw historyError

      await supabase.from("notifications").insert({
        user_id: application.submitted_by,
        title: "Application Rejected",
        message: `Your application ${application.application_number} for ${application.customer_name} has been rejected. Reason: ${reason}`,
        type: "status_changed",
        related_application_id: applicationId,
      })

      router.push("/dashboard")
    } catch (error: any) {
      console.error("[v0] Error rejecting application:", error)
      alert("Failed to reject application: " + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReturn() {
    if (!profile || !application || !returnReason.trim()) {
      alert("Please provide a reason for returning the application.")
      return
    }

    setActionLoading(true)

    try {
      const { error: updateError } = await supabase
        .from("applications")
        .update({ status: "returned" })
        .eq("id", applicationId)

      if (updateError) throw updateError

      const { error: historyError } = await supabase.from("application_status_history").insert({
        application_id: applicationId,
        from_status: application.status,
        to_status: "returned",
        action_by: profile.id,
        action_by_role: profile.role,
        reason: returnReason,
        comments: approverComments || null,
      })

      if (historyError) throw historyError

      await supabase.from("notifications").insert({
        user_id: application.submitted_by,
        title: "Application Returned",
        message: `Your application ${application.application_number} for ${application.customer_name} has been returned. Please review and resubmit. Reason: ${returnReason}`,
        type: "returned",
        related_application_id: applicationId,
      })

      setShowReturnDialog(false)
      router.push("/dashboard")
    } catch (error: any) {
      console.error("[v0] Error returning application:", error)
      alert("Failed to return application: " + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-cyan-100 text-cyan-700">Pending Approval</Badge>
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-cyan-600" />
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "returned":
        return <AlertCircle className="w-5 h-5 text-amber-600" />
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <FileText className="w-5 h-5 text-slate-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <AppNav />
        <div className="p-6">
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <AppNav />
        <div className="p-6">
          <p className="text-slate-600">Application not found</p>
        </div>
      </div>
    )
  }

  const returnedEntry = history.find((h) => h.to_status === "returned")
  const canTakeAction = profile?.role === "head_office_approver" && application.status === "pending"

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <AppNav />

      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Application Details</h1>
              <p className="text-slate-600 mt-1">Application ID: {application.application_number}</p>
            </div>
            <div>{getStatusBadge(application.status)}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Customer Name</p>
                    <p className="font-medium text-slate-900">{application.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Customer ID</p>
                    <p className="font-medium text-slate-900">{application.customer_id || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Branch</p>
                    <p className="font-medium text-slate-900">{application.branch.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Application Date</p>
                    <p className="font-medium text-slate-900">
                      {new Date(application.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Details */}
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Product Type</p>
                    <p className="font-medium text-slate-900">{application.product.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Amount Limit</p>
                    <p className="font-medium text-slate-900">{application.amount_limit.toLocaleString()} ETB</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Profit Margin</p>
                    <p className="font-medium text-slate-900">{application.profit_margin || "-"}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Tenure</p>
                    <p className="font-medium text-slate-900">{application.tenure_months || "-"} months</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Monthly Installment</p>
                    <p className="font-medium text-slate-900">
                      {application.monthly_installment
                        ? `${application.monthly_installment.toLocaleString()} ETB`
                        : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Returned Application Alert */}
            {returnedEntry && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription>
                  <p className="font-semibold text-amber-900 mb-1">Returned Application</p>
                  <p className="text-amber-800">
                    <span className="font-medium">Reason:</span> {returnedEntry.reason || "No reason provided"}
                  </p>
                  {returnedEntry.comments && (
                    <p className="text-amber-800 mt-1">
                      <span className="font-medium">Comments:</span> {returnedEntry.comments}
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Immutable Audit Trail */}
            <Card>
              <CardHeader>
                <CardTitle>Immutable Audit Trail</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {history.map((entry, index) => (
                    <div key={entry.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                          {getStatusIcon(entry.to_status)}
                        </div>
                        {index < history.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-2" />}
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="font-semibold text-slate-900 capitalize">
                          Application {entry.to_status.replace("_", " ")}
                        </p>
                        <p className="text-sm text-slate-600">
                          {entry.user?.full_name || "Unknown User"} - {new Date(entry.created_at).toLocaleString()}
                        </p>
                        {entry.reason && (
                          <p className="text-sm text-slate-700 mt-1">
                            <span className="font-medium">Reason:</span> {entry.reason}
                          </p>
                        )}
                        {entry.comments && (
                          <p className="text-sm text-slate-700 mt-1">
                            <span className="font-medium">Comments:</span> {entry.comments}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {profile?.role === "head_office_approver" && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {canTakeAction ? (
                    <>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={handleApprove}
                        disabled={actionLoading}
                      >
                        Approve
                      </Button>
                      <Button variant="destructive" className="w-full" onClick={handleReject} disabled={actionLoading}>
                        Reject
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={() => setShowReturnDialog(true)}
                        disabled={actionLoading}
                      >
                        Return
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-slate-600 text-center py-4">
                      {application.status === "pending"
                        ? "You don't have permission to act on this application"
                        : "This application has already been processed"}
                    </p>
                  )}
                </CardContent>

                {canTakeAction && (
                  <>
                    <CardHeader className="pt-6">
                      <CardTitle>Approver Comments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Enter comments here..."
                        value={approverComments}
                        onChange={(e) => setApproverComments(e.target.value)}
                        rows={4}
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Mandatory if returning or rejecting the application.
                      </p>
                    </CardContent>
                  </>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mandatory Note for Returning Application</DialogTitle>
            <DialogDescription>
              Please provide a clear reason for returning this application to the previous stage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="return-reason">
                Reason / Note <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="return-reason"
                placeholder="Enter reason for returning application..."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                rows={5}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReturnDialog(false)
                  setReturnReason("")
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleReturn} disabled={actionLoading || !returnReason.trim()}>
                {actionLoading ? "Returning..." : "Confirm Return"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
