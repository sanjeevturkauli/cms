<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = PaymentTransaction::with(['user', 'team', 'package', 'subscription'])
            ->orderBy('created_at', 'desc');

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('transaction_id', 'like', "%{$search}%")
                    ->orWhere('gateway_payment_id', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('team', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('gateway') && $request->gateway) {
            $query->where('payment_gateway', $request->gateway);
        }

        $transactions = $query->paginate(20)->through(function ($transaction) {
            return [
                'id' => $transaction->id,
                'transaction_id' => $transaction->transaction_id,
                'user' => [
                    'id' => $transaction->user->id,
                    'name' => $transaction->user->name,
                    'email' => $transaction->user->email,
                ],
                'team' => $transaction->team ? [
                    'id' => $transaction->team->id,
                    'name' => $transaction->team->name,
                ] : null,
                'package' => $transaction->package ? [
                    'name' => $transaction->package->name,
                ] : null,
                'amount' => $transaction->formatted_amount,
                'payment_gateway' => ucfirst($transaction->payment_gateway),
                'status' => $transaction->status,
                'status_badge' => $this->getStatusBadge($transaction->status),
                'created_at' => $transaction->created_at->format('M d, Y H:i'),
            ];
        });

        $stats = [
            'total' => PaymentTransaction::count(),
            'completed' => PaymentTransaction::where('status', 'completed')->count(),
            'pending' => PaymentTransaction::where('status', 'pending')->count(),
            'failed' => PaymentTransaction::where('status', 'failed')->count(),
            'revenue' => '₹' . number_format(PaymentTransaction::where('status', 'completed')->sum('amount'), 2),
        ];

        return Inertia::render('admin/transactions/index', [
            'transactions' => $transactions,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'gateway']),
        ]);
    }

    public function show($id)
    {
        $transaction = PaymentTransaction::with([
            'user.wallet',
            'team.owner',
            'package',
            'subscription'
        ])->findOrFail($id);

        return Inertia::render('admin/transactions/show', [
            'transaction' => [
                'id' => $transaction->id,
                'transaction_id' => $transaction->transaction_id,
                'gateway_transaction_id' => $transaction->gateway_transaction_id,
                'gateway_payment_id' => $transaction->gateway_payment_id,

                'user' => [
                    'id' => $transaction->user->id,
                    'name' => $transaction->user->name,
                    'email' => $transaction->user->email,
                    'mobile' => $transaction->user->mobile,
                    'wallet_balance' => $transaction->user->wallet ? $transaction->user->wallet->formatted_balance : '₹0.00',
                ],

                'team' => $transaction->team ? [
                    'id' => $transaction->team->id,
                    'name' => $transaction->team->name,
                    'team_id' => $transaction->team->team_id,
                    'owner' => [
                        'name' => $transaction->team->owner->name,
                        'email' => $transaction->team->owner->email,
                    ],
                ] : null,

                'package' => $transaction->package ? [
                    'name' => $transaction->package->name,
                    'price' => $transaction->package->formatted_price,
                    'duration' => $transaction->package->duration_range,
                    'member_limit' => $transaction->package->formatted_member_limit,
                    'team_limit' => $transaction->package->formatted_team_limit,
                    'features' => $transaction->package->features,
                ] : null,

                'subscription' => $transaction->subscription ? [
                    'id' => $transaction->subscription->id,
                    'start_date' => $transaction->subscription->start_date->format('M d, Y'),
                    'end_date' => $transaction->subscription->end_date->format('M d, Y'),
                    'status' => $transaction->subscription->status,
                    'days_remaining' => $transaction->subscription->days_remaining,
                ] : null,

                'amount' => $transaction->formatted_amount,
                'currency' => $transaction->currency,
                'payment_gateway' => ucfirst($transaction->payment_gateway),
                'status' => $transaction->status,
                'status_badge' => $this->getStatusBadge($transaction->status),
                'description' => $transaction->description,
                'customer_email' => $transaction->customer_email,
                'customer_phone' => $transaction->customer_phone,

                'created_at' => $transaction->created_at->format('M d, Y H:i:s'),
                'completed_at' => $transaction->completed_at ? $transaction->completed_at->format('M d, Y H:i:s') : null,
                'failed_at' => $transaction->failed_at ? $transaction->failed_at->format('M d, Y H:i:s') : null,
                'failure_reason' => $transaction->failure_reason,
            ],
        ]);
    }

    private function getStatusBadge($status)
    {
        return match ($status) {
            'completed' => ['text' => 'Completed', 'color' => 'green'],
            'pending' => ['text' => 'Pending', 'color' => 'yellow'],
            'failed' => ['text' => 'Failed', 'color' => 'red'],
            'cancelled' => ['text' => 'Cancelled', 'color' => 'gray'],
            default => ['text' => ucfirst($status), 'color' => 'gray'],
        };
    }
}
