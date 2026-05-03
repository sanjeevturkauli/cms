<?php

namespace App\Http\Controllers;

use App\Models\Kyc;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class KycController extends Controller
{
    public function create()
    {
        $user = Auth::user();
        $kyc = $user->kyc;

        return Inertia::render('kyc/create', [
            'kyc' => $kyc ? [
                'id' => $kyc->id,
                'identity_type' => $kyc->identity_type,
                'identity_number' => $kyc->identity_number,
                'identity_image' => $kyc->identity_image ? Storage::url($kyc->identity_image) : null,
                'pan_number' => $kyc->pan_number,
                'pan_card_image' => $kyc->pan_card_image ? Storage::url($kyc->pan_card_image) : null,
                'country' => $kyc->country,
                'state' => $kyc->state,
                'city' => $kyc->city,
                'area' => $kyc->area,
                'full_address' => $kyc->full_address,
                'pincode' => $kyc->pincode,
                'date_of_birth' => $kyc->date_of_birth?->format('Y-m-d'),
                'gender' => $kyc->gender,
                'father_name' => $kyc->father_name,
                'mother_name' => $kyc->mother_name,
                'occupation' => $kyc->occupation,
                'annual_income' => $kyc->annual_income,
                'status' => $kyc->status,
                'reason' => $kyc->reason,
                'completion_percentage' => $kyc->completion_percentage,
            ] : null,
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'identity_type' => 'required|in:aadhar,voter_id,passport,driving_license,other',
            'identity_number' => 'required|string|max:50',
            'identity_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'pan_number' => 'required|string|size:10|regex:/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/',
            'pan_card_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'country' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'city' => 'required|string|max:100',
            'area' => 'nullable|string|max:100',
            'full_address' => 'required|string',
            'pincode' => 'required|string|max:10',
            'date_of_birth' => 'required|date|before:today',
            'gender' => 'required|in:male,female,other',
            'father_name' => 'nullable|string|max:255',
            'mother_name' => 'nullable|string|max:255',
            'occupation' => 'nullable|string|max:255',
            'annual_income' => 'nullable|numeric|min:0',
        ]);

        // Handle file uploads
        if ($request->hasFile('identity_image')) {
            $validated['identity_image'] = $request->file('identity_image')->store('kyc/identity', 'public');
        }

        if ($request->hasFile('pan_card_image')) {
            $validated['pan_card_image'] = $request->file('pan_card_image')->store('kyc/pan', 'public');
        }

        // Create or update KYC
        $kyc = $user->kyc()->updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        // Submit the KYC
        $kyc->submit();

        // Return success response for Inertia with proper success message
        return redirect()->route('team.kyc.show')->with('message', 'KYC application submitted successfully! Your application is under review.');
    }

    public function show()
    {
        $user = Auth::user();
        $kyc = $user->kyc;

        if (!$kyc) {
            return redirect()->route('team.kyc.create');
        }

        return Inertia::render('kyc/show', [
            'kyc' => [
                'id' => $kyc->id,
                'identity_type' => $kyc->identity_type,
                'identity_number' => $kyc->identity_number,
                'identity_image' => $kyc->identity_image ? Storage::url($kyc->identity_image) : null,
                'pan_number' => $kyc->pan_number,
                'pan_card_image' => $kyc->pan_card_image ? Storage::url($kyc->pan_card_image) : null,
                'country' => $kyc->country,
                'state' => $kyc->state,
                'city' => $kyc->city,
                'area' => $kyc->area,
                'full_address' => $kyc->full_address,
                'pincode' => $kyc->pincode,
                'date_of_birth' => $kyc->date_of_birth?->format('d M, Y'),
                'gender' => $kyc->gender,
                'father_name' => $kyc->father_name,
                'mother_name' => $kyc->mother_name,
                'occupation' => $kyc->occupation,
                'annual_income' => $kyc->annual_income,
                'status' => $kyc->status,
                'status_badge' => $kyc->status_badge,
                'completion_percentage' => $kyc->completion_percentage,
                'submitted_at' => $kyc->submitted_at?->format('d M, Y H:i'),
                'approved_date' => $kyc->approved_date?->format('d M, Y H:i'),
                'reason' => $kyc->reason,
            ],
        ]);
    }
}
