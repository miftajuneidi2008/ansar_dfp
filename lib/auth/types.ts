export type UserRole = "branch_user" | "head_office_approver" | "system_admin"

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  branch_id: string | null
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
}

export interface Branch {
  id: string
  name: string
  code: string | null
  district_id: string
  address: string | null
  phone: string | null
  is_active: boolean
}

export interface District {
  id: string
  name: string
  code: string | null
}
