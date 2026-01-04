<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionController extends Controller
{
    // Users Management
    public function users()
    {
        $users = User::with('roles', 'permissions')
            ->whereDoesntHave('roles', function ($q) {
                $q->where('name', 'admin');
            })
            ->get()->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'mobile' => $user->mobile,
                    'is_active' => $user->is_active ?? true,
                    'roles' => $user->roles->pluck('name')->toArray(),
                    'permissions' => $user->permissions->pluck('name')->toArray(),
                    'created_at' => $user->created_at->format('M d, Y'),
                    'roles_count' => $user->roles->count(),
                ];
            });

        $roles = Role::where('name', '!=', 'admin')->get();
        $permissions = Permission::all();

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function assignRole(Request $request, User $user)
    {
        $request->validate([
            'role' => 'required|exists:roles,name',
        ]);

        $user->assignRole($request->role);

        return redirect()->back()->with('success', "Role '{$request->role}' assigned to {$user->name}");
    }

    public function toggleUserStatus(Request $request, User $user)
    {
        $user->update([
            'is_active' => !($user->is_active ?? true),
        ]);

        $status = $user->is_active ? 'activated' : 'deactivated';
        return redirect()->back()->with('success', "User '{$user->name}' has been {$status}");
    }

    public function updateUser(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'mobile' => 'nullable|string|max:20',
            'is_active' => 'required|boolean',
        ]);

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'mobile' => $request->mobile,
            'is_active' => $request->is_active,
        ]);

        return redirect()->back()->with('success', "User '{$user->name}' has been updated successfully.");
    }

    public function deleteUser(User $user)
    {
        // Prevent deleting the current user
        if ($user->id === Auth::id()) {
            return redirect()->back()->with('error', 'You cannot delete yourself.');
        }

        $userName = $user->name;
        $user->delete();

        return redirect()->back()->with('success', "User '{$userName}' has been deleted successfully.");
    }

    public function removeRole(Request $request, User $user)
    {
        $request->validate([
            'role' => 'required|exists:roles,name',
        ]);

        // Check if user has at least 2 roles before removing one
        if ($user->roles()->count() <= 1) {
            return redirect()->back()->with('error', 'User must have at least one role. Cannot remove the last role.');
        }

        $user->removeRole($request->role);

        return redirect()->back()->with('success', "Role '{$request->role}' removed from {$user->name}");
    }

    public function assignPermission(Request $request, User $user)
    {
        $request->validate([
            'permission' => 'required|exists:permissions,name',
        ]);

        $user->givePermissionTo($request->permission);

        return redirect()->back()->with('success', "Permission '{$request->permission}' assigned to {$user->name}");
    }

    public function removePermission(Request $request, User $user)
    {
        $request->validate([
            'permission' => 'required|exists:permissions,name',
        ]);

        $user->revokePermissionTo($request->permission);

        return redirect()->back()->with('success', "Permission '{$request->permission}' removed from {$user->name}");
    }

    // Roles Management
    public function roles()
    {
        $roles = Role::with('permissions')->get()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name')->toArray(),
                'users_count' => $role->users()->count(),
                'created_at' => $role->created_at->format('M d, Y'),
            ];
        });

        $permissions = Permission::all();

        return Inertia::render('admin/roles/index', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function storeRole(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:roles,name|max:255',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $role = Role::create(['name' => $request->name]);

        if ($request->permissions) {
            $role->givePermissionTo($request->permissions);
        }

        return redirect()->back()->with('success', "Role '{$request->name}' created successfully");
    }

    public function updateRole(Request $request, Role $role)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $role->update(['name' => $request->name]);
        $role->syncPermissions($request->permissions ?? []);

        return redirect()->back()->with('success', "Role '{$request->name}' updated successfully");
    }

    public function deleteRole(Role $role)
    {
        if ($role->name === 'admin') {
            return redirect()->back()->with('error', 'Cannot delete admin role');
        }

        $role->delete();

        return redirect()->back()->with('success', "Role '{$role->name}' deleted successfully");
    }

    // Permissions Management
    public function permissions()
    {
        $permissions = Permission::with('roles')->get()->map(function ($permission) {
            return [
                'id' => $permission->id,
                'name' => $permission->name,
                'roles' => $permission->roles->pluck('name')->toArray(),
                'users_count' => $permission->users()->count(),
                'created_at' => $permission->created_at->format('M d, Y'),
            ];
        });

        return Inertia::render('admin/permissions/index', [
            'permissions' => $permissions,
        ]);
    }

    public function storePermission(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:permissions,name|max:255',
        ]);

        Permission::create(['name' => $request->name]);

        return redirect()->back()->with('success', "Permission '{$request->name}' created successfully");
    }

    public function updatePermission(Request $request, Permission $permission)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:permissions,name,' . $permission->id,
        ]);

        $permission->update(['name' => $request->name]);

        return redirect()->back()->with('success', "Permission '{$request->name}' updated successfully");
    }

    public function deletePermission(Permission $permission)
    {
        $permission->delete();

        return redirect()->back()->with('success', "Permission '{$permission->name}' deleted successfully");
    }
}
