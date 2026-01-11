<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->groupBy('group')->map(function ($groupSettings) {
            return $groupSettings->map(function ($setting) {
                return [
                    'id' => $setting->id,
                    'key' => $setting->key,
                    'value' => $setting->value,
                    'type' => $setting->type,
                    'description' => $setting->description,
                ];
            });
        });

        return Inertia::render('admin/settings/index', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        try {
            $request->validate([
                'settings' => 'required|array',
            ]);

            $updated = 0;
            $notFound = [];
            
            foreach ($request->settings as $key => $value) {
                $setting = Setting::where('key', $key)->first();
                
                if ($setting) {
                    // Convert value based on type
                    $storedValue = match($setting->type) {
                        'boolean' => ($value === '1' || $value === 1 || $value === true || $value === 'true') ? '1' : '0',
                        'json' => json_encode($value),
                        default => (string) $value,
                    };

                    $setting->update(['value' => $storedValue]);
                    $updated++;
                    
                    \Log::info("Updated setting: {$key} = {$storedValue}");
                } else {
                    $notFound[] = $key;
                    \Log::warning("Setting not found: {$key}");
                }
            }

            if (!empty($notFound)) {
                return redirect()->back()->with('warning', "Settings updated! But some settings were not found: " . implode(', ', $notFound));
            }

            return redirect()->back()->with('success', "Settings updated successfully!");
        } catch (\Exception $e) {
            \Log::error("Settings update failed: " . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to update settings: ' . $e->getMessage());
        }
    }
}