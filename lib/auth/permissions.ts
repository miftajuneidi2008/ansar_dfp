import type { UserRole } from "./types"

export const ROLE_PERMISSIONS = {
  branch_user: {
    canSubmitApplications: true,
    canViewOwnApplications: true,
    canViewAllApplications: false,
    canApproveApplications: false,
    canManageUsers: false,
    canManageOrganization: false,
  },
  head_office_approver: {
    canSubmitApplications: false,
    canViewOwnApplications: false,
    canViewAllApplications: true, // Filtered by assignments
    canApproveApplications: true,
    canManageUsers: false,
    canManageOrganization: false,
  },
  system_admin: {
    canSubmitApplications: false,
    canViewOwnApplications: false,
    canViewAllApplications: true,
    canApproveApplications: false,
    canManageUsers: true,
    canManageOrganization: true,
  },
} as const

export function hasPermission(role: UserRole, permission: keyof typeof ROLE_PERMISSIONS.branch_user): boolean {
  return ROLE_PERMISSIONS[role][permission]
}

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  // Branch users can only access dashboard and applications
  if (role === "branch_user") {
    return pathname.startsWith("/dashboard") || pathname.startsWith("/applications")
  }

  // Approvers can access dashboard and applications
  if (role === "head_office_approver") {
    return pathname.startsWith("/dashboard") || pathname.startsWith("/applications")
  }

  // System admins can access everything
  if (role === "system_admin") {
    return true
  }

  return false
}
