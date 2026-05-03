<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\MemberPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MemberPaymentController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        // Get current team from session
        $currentTeamId = session('current_team_id');
        
        // Get all teams where user is a member
        $members = Member::where('user_id', $user->id)->with('team')->get();
        $teamIds = $members->pluck('team_id');
        
        // Validate that current team is one user belongs to
        if ($currentTeamId && !$teamIds->contains($currentTeamId)) {
            $currentTeamId = null;
        }
        
        // If no current team or invalid, set first team as current
        if (!$currentTeamId && $teamIds->isNotEmpty()) {
            $currentTeamId = $teamIds->first();
            session(['current_team_id' => $currentTeamId]);
        }
        
        // Get current team details
        $currentTeam = null;
        if ($currentTeamId) {
            $currentTeam = $members->firstWhere('team_id', $currentTeamId)?->team;
        }

        // Get payments for current team only
        $paymentsQuery = MemberPayment::where('user_id', $user->id);
        
        if ($currentTeamId) {
            $paymentsQuery->where('team_id', $currentTeamId);
        }
        
        $payments = $paymentsQuery
            ->with('team')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->paginate(20);

        return Inertia::render('member/payments/index', [
            'payments' => [
                'data' => $payments->through(fn($p) => [
                    'id'              => $p->id,
                    'team_name'       => $p->team->name,
                    'amount'          => '₹' . number_format($p->amount, 0),
                    'raw_amount'      => (float) $p->amount,
                    'month_label'     => $p->month_label,
                    'due_date'        => $p->due_date->format('d M, Y'),
                    'paid_date'       => $p->paid_date?->format('d M, Y'),
                    'status'          => $p->status,
                    'is_overdue'      => $p->is_overdue,
                    'payment_method'  => $p->payment_method,
                    'transaction_ref' => $p->transaction_ref,
                    'notes'           => $p->notes,
                ])->items(),
                'meta' => [
                    'total'        => $payments->total(),
                    'current_page' => $payments->currentPage(),
                    'last_page'    => $payments->lastPage(),
                    'from'         => $payments->firstItem(),
                    'to'           => $payments->lastItem(),
                ],
            ],
            'currentTeam' => $currentTeam ? [
                'id' => $currentTeam->id,
                'name' => $currentTeam->name,
                'team_id' => $currentTeam->team_id,
            ] : null,
            'paymentGateways' => [
                'razorpay' => [
                    'enabled' => (bool) \App\Models\Setting::get('razorpay_enabled', false),
                    'name'    => 'Razorpay',
                    'key_id'  => \App\Models\Setting::get('razorpay_key_id', ''),
                ],
                'stripe' => [
                    'enabled'    => (bool) \App\Models\Setting::get('stripe_enabled', false),
                    'name'       => 'Stripe',
                    'public_key' => \App\Models\Setting::get('stripe_public_key', ''),
                ],
            ],
        ]);
    }

    public function markPaid(Request $request, MemberPayment $payment)
    {
        $user = Auth::user();

        // Ensure this payment belongs to the current user
        if ($payment->user_id !== $user->id) {
            abort(403);
        }

        $payment->update([
            'status'    => 'paid',
            'paid_date' => now(),
            'payment_method' => $request->payment_method ?? 'manual',
            'notes'     => $request->notes,
        ]);

        return redirect()->back()->with('success', "Payment for {$payment->month_label} marked as paid.");
    }
}