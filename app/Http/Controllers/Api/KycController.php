<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\KycRequest;
use App\Models\Kyc;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class KycController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $kycs = Kyc::with(['user', 'approvedBy'])
            ->when(request('status'), function ($query, $status) {
                return $query->where('status', $status);
            })
            ->when(request('identity_type'), function ($query, $type) {
                return $query->where('identity_type', $type);
            })
            ->when(request('search'), function ($query, $search) {
                return $query->whereHas('user', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $kycs,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
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

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'data' => [],
            ], 422);
        }

        $validated = $validator->validated();
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Please login first.',
                'data' => [],
            ], 401);
        }

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

        return response()->json([
            'success' => true,
            'message' => 'KYC application submitted successfully! Your application is under review.',
            'data' => [
                'id' => $kyc->id,
                'identity_type' => $kyc->identity_type,
                'identity_number' => $kyc->identity_number,
                'identity_image' => $kyc->identity_image ? asset('storage/' . $kyc->identity_image) : null,
                'pan_number' => $kyc->pan_number,
                'pan_card_image' => $kyc->pan_card_image ? asset('storage/' . $kyc->pan_card_image) : null,
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
                'completion_percentage' => $kyc->completion_percentage,
                'submitted_at' => $kyc->submitted_at?->format('Y-m-d H:i:s'),
            ],
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Kyc $kyc): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $kyc->load(['user', 'approvedBy']),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(KycRequest $request, Kyc $kyc): JsonResponse
    {
        // Only allow updates if KYC is pending or rejected
        if ($kyc->status === 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot update approved KYC.',
            ], 422);
        }

        $data = $request->validated();

        // Handle file uploads
        if ($request->hasFile('identity_image')) {
            // Delete old file
            if ($kyc->identity_image) {
                Storage::disk('public')->delete($kyc->identity_image);
            }
            $data['identity_image'] = $request->file('identity_image')->store('kyc/identity', 'public');
        }

        if ($request->hasFile('pan_card_image')) {
            // Delete old file
            if ($kyc->pan_card_image) {
                Storage::disk('public')->delete($kyc->pan_card_image);
            }
            $data['pan_card_image'] = $request->file('pan_card_image')->store('kyc/pan', 'public');
        }

        $kyc->update($data);
        $kyc->submit();

        return response()->json([
            'success' => true,
            'message' => 'KYC updated successfully.',
            'data' => $kyc->load(['user', 'approvedBy']),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Kyc $kyc): JsonResponse
    {
        // Delete associated files
        if ($kyc->identity_image) {
            Storage::disk('public')->delete($kyc->identity_image);
        }
        if ($kyc->pan_card_image) {
            Storage::disk('public')->delete($kyc->pan_card_image);
        }

        $kyc->delete();

        return response()->json([
            'success' => true,
            'message' => 'KYC deleted successfully.',
        ]);
    }

    /**
     * Get current user's KYC
     */
    public function myKyc(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Please login first.',
            ], 401);
        }
        
        $kyc = $user->kyc;

        if (!$kyc) {
            return response()->json([
                'success' => true,
                'message' => 'KYC not found. Please submit your KYC.',
                'data' => null,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'KYC fetched successfully.',
            'data' => [
                'id' => $kyc->id,
                'identity_type' => $kyc->identity_type,
                'identity_number' => $kyc->identity_number,
                'identity_image' => $kyc->identity_image ? asset('storage/' . $kyc->identity_image) : null,
                'pan_number' => $kyc->pan_number,
                'pan_card_image' => $kyc->pan_card_image ? asset('storage/' . $kyc->pan_card_image) : null,
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
                'submitted_at' => $kyc->submitted_at?->format('Y-m-d H:i:s'),
                'approved_date' => $kyc->approved_date?->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    /**
     * Approve KYC
     */
    public function approve(Kyc $kyc, Request $request): JsonResponse
    {
        $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        if ($kyc->status === 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'KYC is already approved.',
            ], 422);
        }

        $kyc->approve(auth()->id(), $request->reason);

        return response()->json([
            'success' => true,
            'message' => 'KYC approved successfully.',
            'data' => $kyc->load(['user', 'approvedBy']),
        ]);
    }

    /**
     * Reject KYC
     */
    public function reject(Kyc $kyc, Request $request): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        if ($kyc->status === 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot reject approved KYC.',
            ], 422);
        }

        $kyc->reject(auth()->id(), $request->reason);

        return response()->json([
            'success' => true,
            'message' => 'KYC rejected successfully.',
            'data' => $kyc->load(['user', 'approvedBy']),
        ]);
    }
}
