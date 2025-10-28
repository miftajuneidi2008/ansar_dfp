"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppNav } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Pencil,
  LinkIcon,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/components/auth/auth-provider";
import type { UserRole } from "@/lib/auth/types";
import { EditUserDialog } from "./EditUserDialog";
import { SubmitHandler, useForm, Controller } from "react-hook-form";
import { UserSchema, UserSchemaType } from "@/schema/UserSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/notifications/toast-provider";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  branch_id: string | null;
  is_active: boolean;
  last_login: string | null;
  branch?: {
    name: string;
  };
}

interface Branch {
  id: string;
  name: string;
}

export default function UsersPage() {
  const { profile } = useAuthContext();
  const supabase = getSupabaseBrowserClient();

  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
 const {showToast}  = useToast()
  // Add user form
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("branch_user");
  const [newUserBranch, setNewUserBranch] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  async function fetchUsers() {
    const { data, error } = await supabase
      .from("users")
      .select("*, branch:branches(name)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
  }

  async function fetchBranches() {
    const { data, error } = await supabase
      .from("branches")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    if (!error && data) {
      setBranches(data);
    }
  }
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<UserSchemaType>({
    resolver: zodResolver(UserSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      user_role: "branch_user",
      user_branch: "",
    },
  });

    const watchedUserRole = watch("user_role");
  // async function handleAddUser() {
  //   if (!newUserEmail || !newUserName || !newUserPassword) return;
  //   const {
  //     data: { session: adminSession },
  //   } = await supabase.auth.getSession();

  //   try {
  //     // Create auth user
  //     const { data: authData, error: authError } = await supabase.auth.signUp({
  //       email: newUserEmail,
  //       password: newUserPassword,
  //     });

  //     if (authError) throw authError;

  //     if (authData.user) {
  //       // Create user profile
  //       const { error: profileError } = await supabase.from("users").insert({
  //         id: authData.user.id,
  //         email: newUserEmail,
  //         full_name: newUserName,
  //         role: newUserRole,
  //         branch_id: newUserRole === "branch_user" ? newUserBranch : null,
  //         is_active: true,
  //       });

  //       if (profileError) throw profileError;

  //       // Reset form
  //       setNewUserEmail("");
  //       setNewUserName("");
  //       setNewUserRole("branch_user");
  //       setNewUserBranch("");
  //       setNewUserPassword("");
  //       setShowAddDialog(false);
  //       fetchUsers();
  //     }
  //   } catch (error: any) {
  //     console.error("[v0] Error creating user:", error);
  //     alert(error.message);
  //   } finally {
  //     // 4. CRITICAL STEP: Restore the admin's session.
  //     // This `finally` block ensures that the admin's session is restored
  //     // whether the creation succeeded or failed.
  //     await supabase.auth.setSession({
  //       access_token: adminSession.access_token,
  //       refresh_token: adminSession.refresh_token,
  //     });
  //   }
  // }

  const onSubmit: SubmitHandler<UserSchemaType> = async (data) => {
    const { full_name, email, password, user_role, user_branch } = data;
    console.log(data);
    if (!email || !full_name || !password) return;
    const {
      data: { session: adminSession },
    } = await supabase.auth.getSession();

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase.from("users").insert({
          id: authData.user.id,
          email: email,
          full_name: full_name,
          role: user_role,
          branch_id: user_role === "branch_user" ? user_branch : null,
          is_active: true,
        });

        if (profileError) throw profileError;
        fetchUsers();
        reset();
          showToast({
          title: "User Saved",
          message: "User Successfuly Created",
          type: "success",
        })
        setShowAddDialog(false);
      }
    } catch (error: any) {
      console.error(" Error creating user:", error);
         showToast({
          title: "Save User",
          message: error || "Failed to create user",
          type: "error",
        })
      alert(error.message);
    } finally {
      await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      });
    }
  };

  async function toggleUserStatus(userId: string, currentStatus: boolean) {
    const { error } = await supabase
      .from("users")
      .update({ is_active: !currentStatus })
      .eq("id", userId);

    if (!error) fetchUsers();
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "system_admin":
        return "bg-purple-100 text-purple-700";
      case "head_office_approver":
        return "bg-blue-100 text-blue-700";
      case "branch_user":
        return "bg-teal-100 text-teal-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const formatRole = (role: UserRole) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (profile?.role !== "system_admin") {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <AppNav />
        <div className="p-6">
          <p className="text-slate-600">Access denied. System Admin only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <AppNav />

      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              User Management
            </h1>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="cursor-pointer">+ Add New User</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account for the Ansar DF portal.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-name">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("full_name")}
                      id="user-name"
                      placeholder="Enter full name"
                    />
                    {errors.full_name && (
                      <p className="text-red-500">{errors.full_name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-email">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("email")}
                      id="user-email"
                      type="email"
                      placeholder="user@zamzambank.ae"
                    />
                    {errors.email && (
                      <p className="text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-password">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("password")}
                      id="user-password"
                      type="password"
                      placeholder="Enter password"
                    />
                    {errors.password && (
                      <p className="text-red-500">{errors.password.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-role">
                      User Role <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="user_role"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger id="user-role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="branch_user">
                              Branch User
                            </SelectItem>
                            <SelectItem value="head_office_approver">
                              Head Office Approver
                            </SelectItem>
                            <SelectItem value="system_admin">
                              System Admin
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.user_role && (
                      <p className="text-red-500">{errors.user_role.message}</p>
                    )}
                  </div>
                  {watchedUserRole === "branch_user" && (
                    <div className="space-y-2">
                      <Label htmlFor="user-branch">
                        Branch <span className="text-red-500">*</span>
                      </Label>
                      <Controller
                        name="user_branch"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger id="user_branch">
                              <SelectValue placeholder="Select branch" />
                            </SelectTrigger>
                            <SelectContent>
                              {branches.map((branch) => (
                                <SelectItem key={branch.id} value={branch.id}>
                                  {branch.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.user_branch && (
                        <p className="text-red-500">
                          {errors.user_branch.message}
                        </p>
                      )}
                    </div>
                  )}
                  <Button type="submit" className="w-full">
                    Create User
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by User Name or Email"
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="User Role: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">User Role: All</SelectItem>
                <SelectItem value="branch_user">Branch User</SelectItem>
                <SelectItem value="head_office_approver">
                  Head Office Approver
                </SelectItem>
                <SelectItem value="system_admin">System Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Account Status: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Account Status: All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  USER NAME
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  EMAIL
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  ROLE
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  STATUS
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  LAST LOGIN
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">
                      {user.full_name}
                    </p>
                    {user.branch && (
                      <p className="text-sm text-slate-500">
                        {user.branch.name}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-600">{user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {formatRole(user.role)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-600 text-sm">
                      {user.last_login
                        ? new Date(user.last_login).toLocaleDateString()
                        : "Never"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit user"
                        className="cursor-pointer"
                        onClick={() => setEditingUser(user)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Reset password"
                        className="cursor-pointer"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={user.is_active ? "Deactivate" : "Activate"}
                        className="cursor-pointer"
                        onClick={() =>
                          toggleUserStatus(user.id, user.is_active)
                        }
                      >
                        {user.is_active ? (
                          <ToggleRight className="w-4 h-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-slate-400" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-6 py-4 border-t bg-slate-50 text-sm text-slate-600">
            Showing 1 to {filteredUsers.length} of {users.length} results
          </div>
        </div>
      </div>
      <EditUserDialog
        isOpen={!!editingUser}
        user={editingUser}
        branches={branches}
        onClose={() => setEditingUser(null)}
        onUpdated={async () => {
          await fetchUsers();

          setEditingUser(null);
        }}
      />
    </div>
  );
}
