<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // User Management
            'view users',
            'create users',
            'edit users',
            'delete users',
            
            // Role Management
            'view roles',
            'create roles',
            'edit roles',
            'delete roles',
            'assign roles',
            
            // Permission Management
            'view permissions',
            'create permissions',
            'edit permissions',
            'delete permissions',
            'assign permissions',
            
            // Team Management
            'view teams',
            'create teams',
            'edit teams',
            'delete teams',
            'join teams',
            'switch teams',
            'manage team members',
            'toggle team status',
            
            // Member Management
            'view members',
            'edit members',
            'remove members',
            'toggle member status',
            
            // System Settings
            'view settings',
            'edit settings',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create roles
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $teamRole = Role::firstOrCreate(['name' => 'team']);
        $memberRole = Role::firstOrCreate(['name' => 'member']);

        // Assign all permissions to admin
        $adminRole->givePermissionTo(Permission::all());

        // Assign specific permissions to team role
        $teamRole->givePermissionTo([
            'view teams',
            'create teams',
            'edit teams',
            'delete teams',
            'join teams',
            'switch teams',
            'manage team members',
            'toggle team status',
            'view members',
            'edit members',
            'remove members',
            'toggle member status',
        ]);

        // Assign basic permissions to member role
        $memberRole->givePermissionTo([
            'view teams',
            'view members',
        ]);
    }
}