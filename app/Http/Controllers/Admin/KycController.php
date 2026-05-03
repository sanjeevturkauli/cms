<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Kyc;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class KycController extends Controller
{
    public function index(Request $request)
    {
        $query = Kyc::with('user')
            ->orderBy('created_at', 'desc');

        // Filter by status if provided
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Search by user name or email
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $kycs = $query->paginate(10)->withQueryString();

        return Inertia::render('admin/kyc/index', [
            'kycs' => [
                'data' => $kycs->through(function ($kyc) {
                    return [
                        'id' => $kyc->id,
                        'user' => [
                            'id' => $kyc->user->id,
                            'name' => $kyc->user->name,
                            'email' => $kyc->user->email,
                        ],
                        'status' => $kyc->status,
                        'status_badge' => $kyc->status_badge,
                        'submitted_at' => $kyc->submitted_at?->format('d M, Y H:i'),
                        'created_at' => $kyc->created_at->format('d M, Y H:i'),
                    ];
                })->items(),
                'links' => $kycs->linkCollection()->toArray(),
                'meta' => [
                    'current_page' => $kycs->currentPage(),
                    'from' => $kycs->firstItem(),
                    'last_page' => $kycs->lastPage(),
                    'per_page' => $kycs->perPage(),
                    'to' => $kycs->lastItem(),
                    'total' => $kycs->total(),
                ],
            ],
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    public function show(Kyc $kyc)
    {
        $kyc->load('user', 'approvedBy');

        return Inertia::render('admin/kyc/show', [
            'kyc' => [
                'id' => $kyc->id,
                'user' => [
                    'id' => $kyc->user->id,
                    'name' => $kyc->user->name,
                    'email' => $kyc->user->email,
                ],
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
                'approved_by' => $kyc->approvedBy ? [
                    'name' => $kyc->approvedBy->name,
                    'email' => $kyc->approvedBy->email,
                ] : null,
                'reason' => $kyc->reason,
                'created_at' => $kyc->created_at->format('d M, Y H:i'),
            ],
        ]);
    }

    public function approve(Request $request, Kyc $kyc)
    {
        $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $kyc->approve(Auth::id(), $request->reason);

        return redirect()->back();
    }

    public function reject(Request $request, Kyc $kyc)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $kyc->reject(Auth::id(), $request->reason);

        return redirect()->back();
    }
}