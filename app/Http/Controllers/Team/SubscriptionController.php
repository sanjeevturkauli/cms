<?php

namespace App\Http\Controllers\Team;

use App\Http\Controllers\Controller;
use App\Models\Package;
use App\Models\Subscription;
use App\Models\SubscriptionLog;
use App\Models\Team;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        if (!$user->wallet) {
            $user->wallet()->create(['balance' => 0.00]);
        }
        
        $teams = Team::where('user_id', $user->id)
            ->with(['activeSubscription.package'])
            ->withCount('members')
            ->get()
            ->map(function ($team) {
                $subscription = $team->activeSubscription;
                
                return [
                    'id' => $team->id,
                    'name' => $team->name,
                    'team_id' => $team->team_id,
                    'members_count' => $team->members_count,
                    'subscription' => $subscription ? [
                        'id' => $subscription->id,
                        'package_name' => $subscription->package->name,
                        'start_date' => $subscription->start_date->format('M d, Y'),
                        'end_date' => $subscription->end_date->format('M d, Y'),
                        'duration_years' => $subscription->duration_years,
                        'amount_paid' => $subscription->formatted_amount,
                        'status' => $subscription->status,
                        'days_remaining' => $subscription->days_remaining,
                        'is_active' => $subscription->is_active,
                        'features' => $subscription->package_features ?? [],
                        'team_size_limit' => $subscription->package->person,
                        'formatted_team_size_limit' => $subscription->package->formatted_person,
                    ] : null,
                ];
            });

        $packages = Package::active()->orderBy('price', 'asc')->get()->map(function ($package) {
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
            ];
        });

        $paymentGateways = [
            'stripe' => [
                'enabled' => \App\Models\Setting::get('stripe_enabled', false),
                'name' => 'Stripe',
                'description' => 'Credit/Debit Cards',
                'public_key' => \App\Models\Setting::get('stripe_public_key', ''),
            ],
            'paypal' => [
                'enabled' => \App\Models\Setting::get('paypal_enabled', false),
                'name' => 'PayPal',
                'description' => 'PayPal Account',
            ],
            'razorpay' => [
                'enabled' => \App\Models\Setting::get('razorpay_enabled', false),
                'name' => 'Razorpay',
                'description' => 'UPI, Cards, NetBanking, Wallets',
                'key_id' => \App\Models\Setting::get('razorpay_key_id', ''),
            ],
        ];

        return Inertia::render('teams/subscriptions/index', [
            'teams' => $teams,
            'packages' => $packages,
            'wallet' => [
                'balance' => $user->wallet->formatted_balance,
                'raw_balance' => $user->wallet->balance,
            ],
            'paymentGateways' => $paymentGateways,
            'cancellationFee' => \App\Models\Setting::get('cancellation_fee', 500),
        ]);
    }

    public function subscribe(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'team_id' => ['required', 'exists:teams,id'],
            'package_id' => ['required', 'exists:packages,id'],
        ]);

        $team = Team::where('id', $request->team_id)
            ->where('user_id', $user->id)
            ->first();

        if (!$team) {
            return redirect()->back()->with('error', 'You can only subscribe for teams you own.');
        }

        if (!$user->wallet) {
            $user->wallet()->create(['balance' => 0.00]);
        }

        $newPackage = Package::findOrFail($request->package_id);
        
        $existingSubscription = Subscription::where('team_id', $team->id)
            ->where('status', 'active')
            ->first();

        $walletBalanceBefore = $user->wallet->balance;
        $message = '';
        $totalAmount = 0;
        $action = 'new';
        $daysUsed = 0;
        $remainingDays = 0;

        if ($existingSubscription) {
            $currentPackage = $existingSubscription->package;
            $daysUsed = Carbon::now()->diffInDays($existingSubscription->start_date);
            $totalDaysInYear = 365;
            $remainingDays = max(0, $totalDaysInYear - $daysUsed);
            
            $dailyRateOld = ($currentPackage->price * $existingSubscription->duration_years) / $totalDaysInYear;
            $unusedAmount = $dailyRateOld * $remainingDays;
            
            $dailyRateNew = ($newPackage->price * $newPackage->duration) / $totalDaysInYear;
            $newPackageAmount = $dailyRateNew * $remainingDays;
            
            $difference = $newPackageAmount - $unusedAmount;
            
            if ($difference > 0) {
                $totalAmount = $difference;
                $action = 'upgrade';
                $message = "Upgraded to {$newPackage->name}. Amount charged: ₹" . number_format($totalAmount, 2);
                
            } elseif ($difference < 0) {
                $refundAmount = abs($difference);
                $user->wallet->addMoney(
                    $refundAmount, 
                    "Refund for downgrade to {$newPackage->name} package (pro-rated)",
                    'subscription_downgrade',
                    $existingSubscription->id
                );
                $totalAmount = -$refundAmount; 
                $action = 'downgrade';
                $message = "Downgraded to {$newPackage->name}. Refund added to wallet: ₹" . number_format($refundAmount, 2);
                
            } else {
                $action = 'upgrade'; 
                $message = "Switched to {$newPackage->name} package. No additional charge.";
            }
            
            $existingSubscription->update([
                'package_id' => $newPackage->id,
                'start_date' => Carbon::now(),
                'end_date' => Carbon::now()->addYears($newPackage->duration),
                'duration_years' => $newPackage->duration,
                'amount_paid' => $existingSubscription->amount_paid + ($totalAmount > 0 ? $totalAmount : 0),
                'package_features' => $newPackage->features,
            ]);
            
            $team->update([
                'is_active' => true,
                'status' => 'active',
            ]);
            
            $subscriptionId = $existingSubscription->id;
            
        } else {
            $totalAmount = $newPackage->price * $newPackage->duration;
            $message = "Successfully subscribed to {$newPackage->name} package. Total: ₹" . number_format($totalAmount, 0);
            
            $startDate = Carbon::now();
            $endDate = $startDate->copy()->addYears($newPackage->duration);

            $newSubscription = Subscription::create([
                'team_id' => $team->id,
                'package_id' => $newPackage->id,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'duration_years' => $newPackage->duration,
                'amount_paid' => $totalAmount,
                'status' => 'active',
                'package_features' => $newPackage->features,
            ]);
            
            $team->update([
                'is_active' => true,
                'status' => 'active',
            ]);
            
            $subscriptionId = $newSubscription->id;
        }

        $walletBalanceAfter = $user->wallet->fresh()->balance;

        SubscriptionLog::create([
            'user_id' => $user->id,
            'team_id' => $team->id,
            'subscription_id' => $subscriptionId,
            'action' => $action,
            'from_package' => $existingSubscription ? $existingSubscription->package->name : null,
            'to_package' => $newPackage->name,
            'from_price' => $existingSubscription ? $existingSubscription->package->price : null,
            'to_price' => $newPackage->price,
            'amount_charged' => $totalAmount,
            'wallet_balance_before' => $walletBalanceBefore,
            'wallet_balance_after' => $walletBalanceAfter,
            'days_used' => $daysUsed,
            'days_remaining' => $remainingDays,
            'description' => $message,
        ]);

        return redirect()->back()->with('success', $message);
    }

    public function cancel(Request $request, Subscription $subscription)
    {
        $user = Auth::user();

        if ($subscription->team->user_id !== $user->id) {
            return redirect()->back()->with('error', 'You can only cancel subscriptions for teams you own.');
        }

        if ($subscription->status !== 'active') {
            return redirect()->back()->with('error', 'Only active subscriptions can be cancelled.');
        }

        $cancellationFee = \App\Models\Setting::get('cancellation_fee', 500);
        if (!$user->wallet || $user->wallet->balance < $cancellationFee) {
            return redirect()->back()->with('error', "Insufficient wallet balance. You need ₹{$cancellationFee} for cancellation fee. Please add money to your wallet first.");
        }

        $walletBalanceBefore = $user->wallet->balance;
        
        $user->wallet->deductMoney(
            $cancellationFee,
            "Cancellation fee for {$subscription->package->name} subscription",
            'cancellation_fee',
            $subscription->id
        );

        $admin = User::whereHas('roles', function($query) {
            $query->where('name', 'admin');
        })->first();

        if ($admin) {
            if (!$admin->wallet) {
                $admin->wallet()->create(['balance' => 0.00]);
            }

            $admin->wallet->addMoney(
                $cancellationFee,
                "Cancellation fee received from {$user->name} for subscription cancellation",
                'cancellation_fee_received',
                $subscription->id
            );
        }

        $subscription->cancel();

        SubscriptionLog::create([
            'user_id' => $user->id,
            'team_id' => $subscription->team_id,
            'subscription_id' => $subscription->id,
            'action' => 'cancel',
            'from_package' => $subscription->package->name,
            'to_package' => 'None',
            'from_price' => $subscription->package->price,
            'to_price' => 0,
            'amount_charged' => $cancellationFee, 
            'wallet_balance_before' => $walletBalanceBefore,
            'wallet_balance_after' => $user->wallet->fresh()->balance,
            'days_used' => Carbon::now()->diffInDays($subscription->start_date),
            'days_remaining' => $subscription->days_remaining,
            'description' => "Cancelled {$subscription->package->name} subscription (₹{$cancellationFee} cancellation fee charged)",
        ]);

        return redirect()->back()->with('success', "Subscription cancelled successfully. Cancellation fee of ₹{$cancellationFee} has been charged.");
    }

    public function logs(Request $request)
    {
        $user = Auth::user();
        
        $logs = SubscriptionLog::where('user_id', $user->id)
            ->with(['team', 'subscription.package'])
            ->orderBy('created_at', 'desc')
            ->limit(50) 
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'action_badge' => $log->action_badge,
                    'team_name' => $log->team->name,
                    'from_package' => $log->from_package,
                    'to_package' => $log->to_package,
                    'amount_charged' => $log->formatted_amount_charged,
                    'description' => $log->description,
                    'created_at' => $log->created_at->format('M d, Y H:i'),
                    'days_used' => $log->days_used,
                    'days_remaining' => $log->days_remaining,
                ];
            });

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'logs' => [
                    'data' => $logs
                ]
            ]);
        }

        // Return Inertia page for direct access
        return Inertia::render('teams/subscriptions/logs', [
            'logs' => [
                'data' => $logs
            ],
        ]);
    }

    public function history(Request $request)
    {
        $user = Auth::user();
        
        $query = SubscriptionLog::where('user_id', $user->id)
            ->with(['team', 'subscription.package'])
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($request->filled('action') && $request->action !== 'all') {
            $query->where('action', $request->action);
        }

        if ($request->filled('package') && $request->package !== 'all') {
            $query->where(function($q) use ($request) {
                $q->where('from_package', $request->package)
                  ->orWhere('to_package', $request->package);
            });
        }

        if ($request->filled('search')) {
            $query->where('description', 'like', '%' . $request->search . '%');
        }

        $logs = $query->paginate(20)->through(function ($log) {
            return [
                'id' => $log->id,
                'action' => $log->action,
                'action_badge' => $log->action_badge,
                'team_name' => $log->team->name,
                'from_package' => $log->from_package,
                'to_package' => $log->to_package,
                'amount_charged' => $log->formatted_amount_charged,
                'description' => $log->description,
                'created_at' => $log->created_at->format('M d, Y H:i'),
                'days_used' => $log->days_used,
                'days_remaining' => $log->days_remaining,
            ];
        });

        // Get unique packages for filter dropdown
        $packages = SubscriptionLog::where('user_id', $user->id)
            ->select('to_package')
            ->distinct()
            ->pluck('to_package')
            ->filter()
            ->values()
            ->toArray();

        return Inertia::render('teams/subscriptions/history', [
            'logs' => $logs,
            'filters' => [
                'action' => $request->action,
                'package' => $request->package,
                'search' => $request->search,
            ],
            'packages' => $packages,
        ]);
    }
}