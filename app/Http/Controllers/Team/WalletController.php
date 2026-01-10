<?php

namespace App\Http\Controllers\Team;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WalletController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        // Ensure user has a wallet
        if (!$user->wallet) {
            $user->wallet()->create(['balance' => 0.00]);
        }

        $transactions = $user->transactions()
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->through(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'type' => $transaction->type,
                    'amount' => $transaction->formatted_amount,
                    'description' => $transaction->description,
                    'balance_after' => '₹' . number_format((float)$transaction->balance_after, 2),
                    'created_at' => $transaction->created_at->format('M d, Y H:i'),
                    'type_color' => $transaction->type_color,
                    'type_icon' => $transaction->type_icon,
                ];
            });

        return Inertia::render('teams/wallet/index', [
            'wallet' => [
                'balance' => $user->wallet->formatted_balance,
                'raw_balance' => $user->wallet->balance,
            ],
            'transactions' => $transactions,
        ]);
    }

    public function addMoney(Request $request)
    {
        $user = Auth::user();
        
        $request->validate([
            'amount' => ['required', 'numeric', 'min:1', 'max:50000'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $description = $request->description ?: 'Money added to wallet';
        
        $user->wallet->addMoney(
            $request->amount,
            $description,
            'manual_add'
        );

        return redirect()->back()->with('success', 'Money added to wallet successfully!');
    }
}