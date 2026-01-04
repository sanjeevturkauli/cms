// Role pivot table
export interface RolePivot {
    model_type: string;
    model_id: number;
    role_id: number;
}

// Role
export interface Role {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
    pivot: RolePivot;
}

// Permission (future-proof)
export interface Permission {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
}

// User
export interface User {
    id: number;
    name: string;
    email: string;
    is_active: number;
    email_verified_at: string | null;
    two_factor_confirmed_at: string | null;
    created_at: string;
    updated_at: string;
    roles: Role[];
    permissions: Permission[];
}
