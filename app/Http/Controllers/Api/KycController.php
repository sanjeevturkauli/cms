<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\KycRequest;
use App\Models\Kyc;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
    public function store(KycRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['user_id'] = auth()->id();

        // Handle file uploads
        if ($request->hasFile('identity_image')) {
            $data['identity_image'] = $request->file('identity_image')->store('kyc/identity', 'public');
        }

        if ($request->hasFile('pan_card_image')) {
            $data['pan_card_image'] = $request->file('pan_card_image')->store('kyc/pan', 'public');
        }

        $kyc = Kyc::create($data);
        $kyc->submit();

        return response()->json([
            'success' => true,
            'message' => 'KYC submitted successfully.',
            'data' => $kyc->load(['user', 'approvedBy']),
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
    public function myKyc(): JsonResponse
    {
        $kyc = auth()->user()->kyc;

        if (!$kyc) {
            return response()->json([
                'success' => false,
                'message' => 'KYC not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $kyc,
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
