// components/dialogs/EditUserDialog.tsx

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/auth/types";

// Define the shape of the data this component needs
interface User {
  id: string;
  full_name: string;
  role: UserRole;
  branch_id: string | null;
}

interface Branch {
  id: string;
  name: string;
}

interface EditUserDialogProps {
  user: User | null;
  branches: Branch[];
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditUserDialog({ user, branches, isOpen, onClose, onUpdated }: EditUserDialogProps) {
  const supabase = getSupabaseBrowserClient();

  // Internal state for the form fields
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("branch_user");
  const [branchId, setBranchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Pre-fill the form with the user's data when the modal opens
  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setRole(user.role);
      setBranchId(user.branch_id);
    }
  }, [user]);

  const handleUpdate = async () => {
    if (!user || !fullName.trim()) return;
    setIsLoading(true);

    const { error } = await supabase
      .from("users")
      .update({
        full_name: fullName,
        role: role,
        // Only set branch_id if the role is 'branch_user', otherwise set it to null
        branch_id: role === "branch_user" ? branchId : null,
      })
      .eq("id", user.id);

    setIsLoading(false);

    if (error) {
      alert("Error updating user: " + error.message);
    } else {
      alert("User updated successfully!");
      onUpdated(); // This will close the modal and refresh the user list
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Modify the user's details and permissions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-full-name">Full Name</Label>
            <Input
              id="edit-full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-user-role">User Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger id="edit-user-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="branch_user">Branch User</SelectItem>
                <SelectItem value="head_office_approver">Head Office Approver</SelectItem>
                <SelectItem value="system_admin">System Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Conditionally render the Branch selector */}
          {role === "branch_user" && (
            <div className="space-y-2">
              <Label htmlFor="edit-user-branch">Branch</Label>
              <Select value={branchId || ""} onValueChange={(value) => setBranchId(value)}>
                <SelectTrigger id="edit-user-branch">
                  <SelectValue placeholder="Select a branch" />
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
  );
}