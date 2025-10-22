
// components/dialogs/EditBranchDialog.tsx

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

// Define the shape of the data this component needs
interface Branch {
  id: string
  name: string
  code: string | null
  district_id: string
}

interface District {
  id: string
  name: string
}

interface EditBranchDialogProps {
  branch: Branch | null
  districts: District[] // We need the list of all districts for the dropdown
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
}

export function EditBranchDialog({ branch, districts, isOpen, onClose, onUpdated }: EditBranchDialogProps) {
  const supabase = getSupabaseBrowserClient()
  
  // Internal state for the form fields
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [selectedDistrictId, setSelectedDistrictId] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Pre-fill the form when a branch is passed in
  useEffect(() => {
    if (branch) {
      setName(branch.name)
      setCode(branch.code || "")
      setSelectedDistrictId(branch.district_id)
    }
  }, [branch])

  const handleUpdate = async () => {
    if (!branch || !name.trim() || !selectedDistrictId) return
    setIsLoading(true)

    const { error } = await supabase
      .from("branches")
      .update({
        name: name,
        code: code || null,
        district_id: selectedDistrictId,
      })
      .eq("id", branch.id)
    
    setIsLoading(false)

    if (error) {
      alert("Error updating branch: " + error.message)
    } else {
      alert("Branch updated successfully!")
      onUpdated() // This closes the modal and refreshes the list
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Branch</DialogTitle>
          <DialogDescription>
            Make changes to the branch details here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="branch-name">Branch Name</Label>
            <Input id="branch-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch-district">Associated District</Label>
            <Select value={selectedDistrictId} onValueChange={setSelectedDistrictId}>
              <SelectTrigger id="branch-district">
                <SelectValue placeholder="Select a district" />
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
          <div className="space-y-2">
            <Label htmlFor="branch-code">Branch Code</Label>
            <Input id="branch-code" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}