// components/dialogs/EditDistrictDialog.tsx

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

// Define the shape of the props the component will receive
interface EditDistrictDialogProps {
  district: { id: string; name: string; code: string | null } | null
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void // A function to call to refresh the district list
}

export function EditDistrictDialog({ district, isOpen, onClose, onUpdated }: EditDistrictDialogProps) {
  const supabase = getSupabaseBrowserClient()
  const [name, setName] = useState("")
  const [code, setCode] = useState("")

  // This effect runs when the 'district' prop changes.
  // It pre-fills the form fields with the district's current data.
  useEffect(() => {
    if (district) {
      setName(district.name)
      setCode(district.code || "")
    }
  }, [district])

  const handleUpdate = async () => {
    if (!district || !name.trim()) return

    const { error } = await supabase
      .from("districts")
      .update({
        name: name,
        code: code || null,
      })
      .eq("id", district.id)

    if (error) {
      alert("Error updating district: " + error.message)
    } else {
      alert("District updated successfully!")
      onUpdated() // This will call fetchDistricts() and close the modal
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit District</DialogTitle>
          <DialogDescription>
            Make changes to the district details here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">
              Code
            </Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpdate}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}