<?php

namespace App\Http\Controllers\Team;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Package;
use App\Models\PaymentTransaction;
use App\Models\Setting;
use App\Models\Subscription;
use App\Models\SubscriptionLog;
use App\Models\Team;
use App\Models\Transaction;
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

        if ($team->user_id != $user->id) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'You can only subscribe for teams you own.'], 403);
            }
            return redirect()->back()->with('error', 'You can only subscribe for teams you own.');
        }

        $gatewayEnabled = Setting::get($request->payment_gateway . '_enabled', false);
        if (!$gatewayEnabled) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Selected payment gateway is not enabled.'], 400);
            }
            return redirect()->back()->with('error', 'Selected payment gateway is not enabled. Please contact admin.');
        }

        $platformFee = (float) Setting::get('platform_fee', 0);
        $amount = ($package->price * $package->duration) + $platformFee;

        $transaction = PaymentTransaction::create([
            'user_id' => $user->id,
            'team_id' => $team->id,
            'package_id' => $package->id,
            'transaction_id' => PaymentTransaction::generateTransactionId(),
            'payment_gateway' => $request->payment_gateway,
            'amount' => $amount,
            'currency' => 'INR',
            'gateway_fee' => $platformFee,
            'net_amount' => $amount,
            'status' => 'pending',
            'description' => "Subscription to {$package->name} package for team {$team->name}" . ($platformFee > 0 ? " (includes ₹{$platformFee} platform fee)" : ''),
            'customer_email' => $user->email,
            'customer_phone' => $user->mobile ?? null,
        ]);

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
            Stripe::setApiKey($secretKey);

            $paymentIntent = PaymentIntent::create([
                'amount' => (int) ($transaction->amount * 100), // Amount in cents
                'currency' => strtolower($transaction->currency),
                'description' => $transaction->description,
                'metadata' => [
                    'transaction_id' => $transaction->transaction_id,
                    'team_id' => $team->id,
                    'package_id' => $package->id,
                    'user_id' => auth()->id(),
                ],
                'automatic_payment_methods' => [
                    'enabled' => true,
                ],
            ]);

            $transaction->update([
                'gateway_transaction_id' => $paymentIntent->id,
            ]);

            return response()->json([
                'success' => true,
                'client_secret' => $paymentIntent->client_secret,
                'transaction_id' => $transaction->transaction_id,
                'amount' => $transaction->amount,
                'publishable_key' => $publicKey,
            ]);
        } catch (\Stripe\Exception\CardException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Card Error: ' . $e->getMessage(),
            ]);
        } catch (\Stripe\Exception\RateLimitException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Too many requests. Please try again later.',
            ]);
        } catch (\Stripe\Exception\InvalidRequestException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid payment request. Please check your payment details.',
            ]);
        } catch (\Stripe\Exception\AuthenticationException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Stripe authentication failed. Please contact admin.',
            ]);
        } catch (\Stripe\Exception\ApiConnectionException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Network error. Please check your connection and try again.',
            ]);
        } catch (\Stripe\Exception\ApiErrorException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Stripe Error: ' . $e->getMessage(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to initialize payment. Please try again.',
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

        $keySecret = Setting::get('razorpay_key_secret');

        if ($request->razorpay_signature && $request->razorpay_order_id) {
            $expectedSignature = hash_hmac(
                'sha256',
                $request->razorpay_order_id . '|' . $request->razorpay_payment_id,
                $keySecret
            );

            if ($expectedSignature !== $request->razorpay_signature) {
                $transaction->update([
                    'status' => 'failed',
                    'gateway_response' => $request->all(),
                ]);

                return redirect()
                    ->route('team.subscriptions.index')
                    ->with('error', 'Payment verification failed. Please contact support.');
            }
        }

        $transaction->update([
            'status' => 'completed',
            'gateway_payment_id' => $request->razorpay_payment_id,
            'gateway_transaction_id' => $request->razorpay_order_id,
            'completed_at' => now(),
            'gateway_response' => $request->all(),
        ]);

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
            $secretKey = Setting::get('stripe_secret_key');
            \Stripe\Stripe::setApiKey($secretKey);

            $paymentIntent = \Stripe\PaymentIntent::retrieve($request->payment_intent);

            if ($paymentIntent->status === 'succeeded') {
                $transaction->update([
                    'status' => 'completed',
                    'gateway_payment_id' => $paymentIntent->id,
                    'gateway_transaction_id' => $paymentIntent->id,
                    'completed_at' => now(),
                    'gateway_response' => $paymentIntent->toArray(),
                ]);

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

        $existingSubscription = Subscription::where('team_id', $team->id)
            ->where('status', 'active')
            ->first();

        if ($existingSubscription) {
            $existingSubscription->status = 'cancelled';
            $existingSubscription->save();

            $existingSubscription->refresh();
        }

        $startDate = Carbon::now();
        $type = $package->type ?? 'month';
        $endDate = match($type) {
            'day'   => $startDate->copy()->addDays($package->duration),
            'year'  => $startDate->copy()->addYears($package->duration),
            default => $startDate->copy()->addMonths($package->duration),
        };

        $subscription = Subscription::create([
            'team_id' => $team->id,
            'package_id' => $package->id,
            'member_limit' => $package->member_limit,
            'team_limit' => $package->team_limit,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'duration' => $package->duration,
            'type' => $type,
            'amount_paid' => $transaction->amount,
            'status' => 'active',
            'package_features' => $package->features,
        ]);

        $team->update([
            'is_active' => true,
            'status' => 'approved',
        ]);

        $transaction->update(['subscription_id' => $subscription->id]);

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

        // Credit full payment amount to admin wallet with separate activity logs
        $platformFee = (float) \App\Models\Setting::get('platform_fee', 0);
        $packageAmount = $transaction->amount - $platformFee; // e.g. ₹1,000
        $totalAmount = $transaction->amount; // e.g. ₹1,200

        $adminUser = \App\Models\User::role('admin')->first();
        if ($adminUser && $adminUser->wallet) {
            $balanceBefore = (float) $adminUser->wallet->balance;
            $balanceAfterPackage = $balanceBefore + $packageAmount;
            $balanceAfterTotal = $balanceBefore + $totalAmount;

            // Credit full amount to admin wallet
            $adminUser->wallet->increment('balance', $totalAmount);

            // Activity log 1: Package amount credit
            Transaction::create([
                'user_id' => $adminUser->id,
                'wallet_id' => $adminUser->wallet->id,
                'type' => 'credit',
                'amount' => $packageAmount,
                'description' => "Package payment: {$package->name} from {$team->name} via {$transaction->payment_gateway}",
                'reference_type' => 'subscription',
                'reference_id' => $subscription->id,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfterPackage,
            ]);

            // Activity log 2: Platform fee credit (only if platform fee > 0)
            if ($platformFee > 0) {
                Transaction::create([
                    'user_id' => $adminUser->id,
                    'wallet_id' => $adminUser->wallet->id,
                    'type' => 'credit',
                    'amount' => $platformFee,
                    'description' => "Platform fee: {$package->name} subscription from {$team->name}",
                    'reference_type' => 'platform_fee',
                    'reference_id' => $subscription->id,
                    'balance_before' => $balanceAfterPackage,
                    'balance_after' => $balanceAfterTotal,
                ]);
            }

            // Activity log for subscription event
            ActivityLog::log('subscription')
                ->performedOn($subscription)
                ->causedBy($user)
                ->event('purchased')
                ->withProperties([
                    'package' => $package->name,
                    'team' => $team->name,
                    'package_amount' => $packageAmount,
                    'platform_fee' => $platformFee,
                    'total_amount' => $totalAmount,
                    'payment_gateway' => $transaction->payment_gateway,
                    'transaction_id' => $transaction->transaction_id,
                ])
                ->log("Subscription purchased: {$package->name} by {$team->name} - Total: ₹{$totalAmount} (Package: ₹{$packageAmount} + Platform Fee: ₹{$platformFee})");
        }

        return $subscription;
    }
}
