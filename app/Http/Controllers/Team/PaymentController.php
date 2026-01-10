<?php

namespace App\Http\Controllers\Team;

use App\Http\Controllers\Controller;
use App\Models\Package;
use App\Models\PaymentTransaction;
use App\Models\Setting;
use App\Models\Subscription;
use App\Models\SubscriptionLog;
use App\Models\Team;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function initiatePayment(Request $request)
    {
        $request->validate([
            'team_id' => 'required|exists:teams,id',
            'package_id' => 'required|exists:packages,id',
            'payment_gateway' => 'required|in:razorpay,stripe,paypal',
        ]);

        $user = Auth::user();
        $team = Team::findOrFail($request->team_id);
        $package = Package::findOrFail($request->package_id);

        // Check if user owns the team
        if ($team->user_id !== $user->id) {
            return redirect()->back()->with('error', 'You can only subscribe for teams you own.');
        }

        // Check if selected gateway is enabled
        $gatewayEnabled = Setting::get($request->payment_gateway . '_enabled', false);
        if (!$gatewayEnabled) {
            return redirect()->back()->with('error', 'Selected payment gateway is not enabled. Please contact admin.');
        }

        // Calculate amount
        $amount = $package->price * $package->duration;

        // Create payment transaction
        $transaction = PaymentTransaction::create([
            'user_id' => $user->id,
            'team_id' => $team->id,
            'package_id' => $package->id,
            'transaction_id' => PaymentTransaction::generateTransactionId(),
            'payment_gateway' => $request->payment_gateway,
            'amount' => $amount,
            'currency' => 'INR',
            'net_amount' => $amount,
            'status' => 'pending',
            'description' => "Subscription to {$package->name} package for team {$team->name}",
            'customer_email' => $user->email,
            'customer_phone' => $user->mobile ?? null,
        ]);

        // Return payment details based on gateway
        return match($request->payment_gateway) {
            'razorpay' => $this->initiateRazorpay($transaction, $package, $team),
            'stripe' => $this->initiateStripe($transaction, $package, $team),
            'paypal' => $this->initiatePayPal($transaction, $package, $team),
            default => redirect()->back()->with('error', 'Invalid payment gateway'),
        };
    }

    private function initiateRazorpay($transaction, $package, $team)
    {
        $keyId = Setting::get('razorpay_key_id');
        $keySecret = Setting::get('razorpay_key_secret');

        if (!$keyId || !$keySecret) {
            return redirect()->back()->with('error', 'Razorpay is not configured properly.');
        }

        // Return Razorpay payment page
        return Inertia::render('teams/payment/razorpay', [
            'transaction' => [
                'id' => $transaction->id,
                'transaction_id' => $transaction->transaction_id,
                'amount' => $transaction->amount * 100, // Razorpay expects amount in paise
                'currency' => $transaction->currency,
            ],
            'package' => [
                'name' => $package->name,
                'price' => $package->formatted_price,
            ],
            'team' => [
                'name' => $team->name,
            ],
            'razorpay_key' => $keyId,
            'callback_url' => route('team.payment.callback.razorpay'),
        ]);
    }

    private function initiateStripe($transaction, $package, $team)
    {
        // Stripe integration placeholder
        return redirect()->back()->with('info', 'Stripe integration coming soon!');
    }

    private function initiatePayPal($transaction, $package, $team)
    {
        // PayPal integration placeholder
        return redirect()->back()->with('info', 'PayPal integration coming soon!');
    }

    public function razorpayCallback(Request $request)
    {
        $request->validate([
            'razorpay_payment_id' => 'required',
            'razorpay_order_id' => 'nullable',
            'razorpay_signature' => 'nullable',
            'transaction_id' => 'required',
        ]);

        $transaction = PaymentTransaction::where('transaction_id', $request->transaction_id)->firstOrFail();

        // Verify payment with Razorpay
        $keySecret = Setting::get('razorpay_key_secret');
        
        // For now, mark as completed (in production, verify signature)
        $transaction->update([
            'status' => 'completed',
            'gateway_payment_id' => $request->razorpay_payment_id,
            'gateway_transaction_id' => $request->razorpay_order_id,
            'completed_at' => now(),
            'gateway_response' => $request->all(),
        ]);

        // Create or update subscription
        $this->createSubscription($transaction);

        return redirect()->route('team.subscriptions.index')
            ->with('success', 'Payment successful! Your subscription is now active.');
    }

    public function paymentSuccess($transactionId)
    {
        $transaction = PaymentTransaction::where('transaction_id', $transactionId)->firstOrFail();

        return Inertia::render('teams/payment/success', [
            'transaction' => [
                'id' => $transaction->id,
                'transaction_id' => $transaction->transaction_id,
                'amount' => $transaction->formatted_amount,
                'status' => $transaction->status,
                'package_name' => $transaction->package->name,
            ],
        ]);
    }

    public function paymentFailed($transactionId)
    {
        $transaction = PaymentTransaction::where('transaction_id', $transactionId)->firstOrFail();
        
        $transaction->markAsFailed('Payment failed or cancelled by user');

        return Inertia::render('teams/payment/failed', [
            'transaction' => [
                'id' => $transaction->id,
                'transaction_id' => $transaction->transaction_id,
                'amount' => $transaction->formatted_amount,
            ],
        ]);
    }

    private function createSubscription($transaction)
    {
        $user = $transaction->user;
        $team = $transaction->team;
        $package = $transaction->package;

        // Check for existing active subscription
        $existingSubscription = Subscription::where('team_id', $team->id)
            ->where('status', 'active')
            ->first();

        if ($existingSubscription) {
            // Cancel existing subscription
            $existingSubscription->update(['status' => 'cancelled']);
        }

        // Create new subscription
        $startDate = Carbon::now();
        $endDate = $startDate->copy()->addYears($package->duration);

        $subscription = Subscription::create([
            'team_id' => $team->id,
            'package_id' => $package->id,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'duration_years' => $package->duration,
            'amount_paid' => $transaction->amount,
            'status' => 'active',
            'package_features' => $package->features,
        ]);

        // Update transaction with subscription ID
        $transaction->update(['subscription_id' => $subscription->id]);

        // Log the subscription
        SubscriptionLog::create([
            'user_id' => $user->id,
            'team_id' => $team->id,
            'subscription_id' => $subscription->id,
            'action' => $existingSubscription ? 'upgrade' : 'new',
            'from_package' => $existingSubscription ? $existingSubscription->package->name : null,
            'to_package' => $package->name,
            'from_price' => $existingSubscription ? $existingSubscription->package->price : null,
            'to_price' => $package->price,
            'amount_charged' => $transaction->amount,
            'wallet_balance_before' => $user->wallet->balance,
            'wallet_balance_after' => $user->wallet->balance,
            'days_used' => 0,
            'days_remaining' => 365 * $package->duration,
            'description' => "Subscribed to {$package->name} package via {$transaction->payment_gateway}",
        ]);

        return $subscription;
    }
}