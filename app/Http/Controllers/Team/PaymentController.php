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
use Stripe\PaymentIntent;
use Stripe\Stripe;

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
            if ($request->expectsJson()) {
                return response()->json(['error' => 'You can only subscribe for teams you own.'], 403);
            }
            return redirect()->back()->with('error', 'You can only subscribe for teams you own.');
        }

        // Check if selected gateway is enabled
        $gatewayEnabled = Setting::get($request->payment_gateway . '_enabled', false);
        if (!$gatewayEnabled) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Selected payment gateway is not enabled.'], 400);
            }
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
        return match ($request->payment_gateway) {
            'razorpay' => $this->initiateRazorpay($transaction, $package, $team),
            'stripe' => $this->initiateStripe($transaction, $package, $team, $request->expectsJson()),
            'paypal' => $this->initiatePayPal($transaction, $package, $team),
            default => redirect()->back()->with('error', 'Invalid payment gateway'),
        };
    }

    private function initiateRazorpay($transaction, $package, $team)
    {
        $keyId = Setting::get('razorpay_key_id');
        $keySecret = Setting::get('razorpay_key_secret');

        if (!$keyId || !$keySecret) {
            return response()->json([
                'success' => false,
                'error' => 'Razorpay is not configured properly. Please contact admin.',
            ]);
        }

        try {
            // Create Razorpay order using cURL (since we don't have SDK)
            $orderData = [
                'amount' => $transaction->amount * 100, // Amount in paise
                'currency' => $transaction->currency,
                'receipt' => $transaction->transaction_id,
                'notes' => [
                    'team_id' => $team->id,
                    'package_id' => $package->id,
                    'transaction_id' => $transaction->transaction_id,
                ]
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://api.razorpay.com/v1/orders');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderData));
            curl_setopt($ch, CURLOPT_USERPWD, $keyId . ':' . $keySecret);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json'
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200) {
                \Log::error('Razorpay API Error', [
                    'http_code' => $httpCode,
                    'response' => $response,
                    'transaction_id' => $transaction->transaction_id,
                ]);
                
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to create Razorpay order. Please check your API credentials.',
                ]);
            }

            $orderResponse = json_decode($response, true);
            
            if (!$orderResponse || !isset($orderResponse['id'])) {
                return response()->json([
                    'success' => false,
                    'error' => 'Invalid response from Razorpay API.',
                ]);
            }

            // Update transaction with Razorpay order ID
            $transaction->update([
                'gateway_transaction_id' => $orderResponse['id'],
            ]);

            return response()->json([
                'success' => true,
                'order_id' => $orderResponse['id'],
                'amount' => $orderResponse['amount'],
                'currency' => $orderResponse['currency'],
                'transaction_id' => $transaction->transaction_id,
                'package_name' => $package->name,
            ]);
        } catch (\Exception $e) {
            \Log::error('Razorpay payment initiation failed', [
                'error' => $e->getMessage(),
                'transaction_id' => $transaction->transaction_id,
                'team_id' => $team->id,
                'package_id' => $package->id,
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to create Razorpay order: ' . $e->getMessage(),
            ]);
        }
    }

    private function initiateStripe($transaction, $package, $team, $isJsonRequest = false)
    {
        $publicKey = Setting::get('stripe_public_key');
        $secretKey = Setting::get('stripe_secret_key');

        if (!$publicKey || !$secretKey) {
            return response()->json([
                'success' => false,
                'error' => 'Stripe is not configured properly. Please contact admin.',
            ]);
        }

        try {
            // Initialize Stripe
            Stripe::setApiKey($secretKey);

            // Create a Payment Intent
            $paymentIntent = PaymentIntent::create([
                'amount' => (int) ($transaction->amount * 100),
                'currency' => strtolower($transaction->currency),
                'description' => $transaction->description,
                'metadata' => [
                    'transaction_id' => $transaction->transaction_id,
                    'team_id' => $team->id,
                    'package_id' => $package->id,
                    'user_id' => auth()->id(),
                ],
                // Only specify payment_method_types, not payment_method_data
                // Client will provide payment method via Stripe Elements
                'payment_method_types' => ['card'],
            ]);

            $transaction->update([
                'gateway_transaction_id' => $paymentIntent->id,
            ]);

            return response()->json([
                'success' => true,
                'client_secret' => $paymentIntent->client_secret,
                'transaction_id' => $transaction->transaction_id,
                'amount' => $transaction->amount,
            ]);
        } catch (\Stripe\Exception\ApiErrorException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Stripe Error: ' . $e->getMessage(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to initialize payment: ' . $e->getMessage(),
            ]);
        }
    }

    private function initiatePayPal($transaction, $package, $team)
    {
        $clientId = Setting::get('paypal_client_id');
        $secret = Setting::get('paypal_secret');

        if (!$clientId || !$secret) {
            return redirect()->back()->with('error', 'PayPal is not configured properly. Please contact admin.');
        }

        // PayPal integration - Coming soon
        // For now, redirect back with info message
        return redirect()->back()->with('error', 'PayPal payment integration is under development. Please use Razorpay for now.');
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

        // Verify payment with Razorpay signature
        $keySecret = Setting::get('razorpay_key_secret');
        
        if ($request->razorpay_signature && $request->razorpay_order_id) {
            // Verify signature
            $expectedSignature = hash_hmac('sha256', 
                $request->razorpay_order_id . '|' . $request->razorpay_payment_id, 
                $keySecret
            );
            
            if ($expectedSignature !== $request->razorpay_signature) {
                \Log::error('Razorpay signature verification failed', [
                    'transaction_id' => $request->transaction_id,
                    'expected' => $expectedSignature,
                    'received' => $request->razorpay_signature,
                ]);
                
                $transaction->update([
                    'status' => 'failed',
                    'gateway_response' => $request->all(),
                ]);
                
                return redirect()
                    ->route('team.subscriptions.index')
                    ->with('error', 'Payment verification failed. Please contact support.');
            }
        }

        // Mark transaction as completed
        $transaction->update([
            'status' => 'completed',
            'gateway_payment_id' => $request->razorpay_payment_id,
            'gateway_transaction_id' => $request->razorpay_order_id,
            'completed_at' => now(),
            'gateway_response' => $request->all(),
        ]);

        // Create or update subscription
        $this->createSubscription($transaction);

        return redirect()
            ->route('team.subscriptions.index')
            ->with('success', 'Payment successful! Your subscription is now active.');
    }

    public function stripeCallback(Request $request)
    {
        $request->validate([
            'payment_intent' => 'required',
            'transaction_id' => 'required',
        ]);

        $transaction = PaymentTransaction::where('transaction_id', $request->transaction_id)->firstOrFail();

        try {
            // Initialize Stripe
            $secretKey = Setting::get('stripe_secret_key');
            \Stripe\Stripe::setApiKey($secretKey);

            // Retrieve the payment intent to verify
            $paymentIntent = \Stripe\PaymentIntent::retrieve($request->payment_intent);

            if ($paymentIntent->status === 'succeeded') {
                // Mark transaction as completed
                $transaction->update([
                    'status' => 'completed',
                    'gateway_payment_id' => $paymentIntent->id,
                    'gateway_transaction_id' => $paymentIntent->id,
                    'completed_at' => now(),
                    'gateway_response' => $paymentIntent->toArray(),
                ]);

                // Create or update subscription
                $this->createSubscription($transaction);

                return redirect()
                    ->route('team.subscriptions.index')
                    ->with('success', 'Payment successful! Your subscription is now active.');
            } else {
                $transaction->update([
                    'status' => 'failed',
                    'gateway_response' => $paymentIntent->toArray(),
                ]);

                return redirect()
                    ->route('team.subscriptions.index')
                    ->with('error', 'Payment was not successful. Please try again.');
            }
        } catch (\Exception $e) {
            \Log::error('Stripe Callback Error: ' . $e->getMessage());

            return redirect()
                ->route('team.subscriptions.index')
                ->with('error', 'Payment verification failed. Please contact support.');
        }
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
            // Cancel existing subscription and save immediately
            $existingSubscription->status = 'cancelled';
            $existingSubscription->save();

            // Refresh to ensure the change is committed
            $existingSubscription->refresh();
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
