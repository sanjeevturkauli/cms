<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Package;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PackageController extends Controller
{
    public function index()
    {
        $packages = Package::orderBy('price', 'asc')->get()->map(function ($package) {
            return [
                'id' => $package->id,
                'name' => $package->name,
                'price' => $package->price,
                'formatted_price' => $package->formatted_price,
                'person' => $package->person,
                'formatted_person' => $package->formatted_person,
                'features' => $package->features ?? [],
                'duration' => $package->duration,
                'duration_range' => $package->duration_range,
                'is_active' => $package->is_active,
                'created_at' => $package->created_at->format('M d, Y'),
                'updated_at' => $package->updated_at->format('M d, Y'),
            ];
        });

        return Inertia::render('admin/packages/index', [
            'packages' => $packages,
            'permissions' => [
                'canCreatePackages' => true,
                'canEditPackages' => true,
                'canDeletePackages' => true,
                'canToggleStatus' => true,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        if (!$user->hasRole('admin')) {
            return redirect()->back()->with('error', 'Only admins can create packages.');
        }

        $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:packages,name'],
            'price' => ['required', 'numeric', 'min:0'],
            'person' => ['required', 'integer', 'min:-1'],
            'features' => ['array'],
            'features.*' => ['string', 'max:255'],
            'duration' => ['required', 'integer', 'min:1', 'max:10'],
        ]);

        $package = Package::create([
            'name' => $request->name,
            'price' => $request->price,
            'person' => $request->person,
            'features' => $request->features ?? [],
            'duration' => $request->duration,
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', "Package '{$package->name}' created successfully.");
    }

    public function update(Request $request, Package $package)
    {
        $user = Auth::user();

        if (!$user->hasRole('admin')) {
            return redirect()->back()->with('error', 'Only admins can update packages.');
        }

        $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:packages,name,' . $package->id],
            'price' => ['required', 'numeric', 'min:0'],
            'person' => ['required', 'integer', 'min:-1'],
            'features' => ['array'],
            'features.*' => ['string', 'max:255'],
            'duration' => ['required', 'integer', 'min:1', 'max:10'],
            'is_active' => ['boolean'],
        ]);

        $package->update([
            'name' => $request->name,
            'price' => $request->price,
            'person' => $request->person,
            'features' => $request->features ?? [],
            'duration' => $request->duration,
            'is_active' => $request->is_active ?? $package->is_active,
        ]);

        return redirect()->back()->with('success', "Package '{$package->name}' updated successfully.");
    }

    public function toggleActive(Request $request, Package $package)
    {
        $user = Auth::user();

        if (!$user->hasRole('admin')) {
            return redirect()->back()->with('error', 'Only admins can change package status.');
        }

        $package->update([
            'is_active' => !$package->is_active,
        ]);

        $status = $package->is_active ? 'activated' : 'deactivated';
        return redirect()->back()->with('success', "Package '{$package->name}' {$status}.");
    }

    public function destroy(Package $package)
    {
        $user = Auth::user();

        if (!$user->hasRole('admin')) {
            return redirect()->back()->with('error', 'Only admins can delete packages.');
        }

        $packageName = $package->name;
        $package->delete();

        return redirect()->back()->with('success', "Package '{$packageName}' deleted successfully.");
    }
}