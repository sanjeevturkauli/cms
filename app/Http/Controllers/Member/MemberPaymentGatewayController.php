<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Member;
use App\Models\MemberPayment;
use App\Models\PaymentTransaction;
use App\Models\Setting;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MemberPaymentGatewayController extends Controller
{
    /**
     * Initiate payment for a member installment
     */
    public function initiate(Request $request, MemberPayment $payment)
    {
        $user = Auth::user();

        if ($payment->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($payment->status === 'paid') {
            return response()->json(['error' => 'This payment is already paid.'], 400);
        }

        $request->validate([
            'payment_gateway' => 'required|in:razorpay,stripe',
        ]);

        $gatewayEnabled = Setting::get($request->payment_gateway . '_enabled', false);
        if (!$gatewayEnabled) {
            return response()->json(['error' => 'Selected payment gateway is not enabled.'], 400);
        }

        // Create a PaymentTransaction record
        $transaction = PaymentTransaction::create([
            'user_id'          => $user->id,
            'team_id'          => $payment->team_id,
            'package_id'       => null,
            'transaction_id'   => PaymentTransaction::generateTransactionId(),
            'payment_gateway'  => $request->payment_gateway,
            'amount'           => $payment->amount,
            'currency'         => 'INR',
            'net_amount'       => $payment->amount,
            'status'           => 'pending',
            'description'      => "Monthly installment for {$payment->month_label} - Team: {$payment->team->name}",
            'customer_email'   => $user->email,
            'customer_phone'   => $user->mobile ?? null,
            'metadata'         => ['member_payment_id' => $payment->id],
        ]);

        return match ($request->payment_gateway) {
            'razorpay' => $this->initiateRazorpay($transaction, $payment),
            'stripe'   => $this->initiateStripe($transaction, $payment),
            default    => response()->json(['error' => 'Invalid gateway'], 400),
        };
    }

    private function initiateRazorpay(PaymentTransaction $transaction, MemberPayment $payment)
    {
        $keyId     = Setting::get('razorpay_key_id');
        $keySecret = Setting::get('razorpay_key_secret');

        if (!$keyId || !$keySecret) {
            return response()->json(['success' => false, 'error' => 'Razorpay not configured.']);
        }

        try {
            $orderData = [
                'amount'   => (int) ($transaction->amount * 100),
                'currency' => 'INR',
                'receipt'  => $transaction->transaction_id,
                'notes'    => [
                    'member_payment_id' => $payment->id,
                    'transaction_id'    => $transaction->transaction_id,
                ],
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://api.razorpay.com/v1/orders');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderData));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_USERPWD, "{$keyId}:{$keySecret}");
            $response = curl_exec($ch);
            curl_close($ch);

            $orderResponse = json_decode($response, true);

            if (isset($orderResponse['id'])) {
                return response()->json([
                    'success'        => true,
                    'order_id'       => $orderResponse['id'],
                    'amount'         => $orderResponse['amount'],
                    'currency'       => $orderResponse['currency'],
                    'key_id'         => $keyId,
                    'transaction_id' => $transaction->id,
                    'description'    => $transaction->description,
                    'package_name'   => $payment->month_label,
                ]);
            }

            return response()->json(['success' => false, 'error' => 'Failed to create Razorpay order.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    private function initiateStripe(PaymentTransaction $transaction, MemberPayment $payment)
    {
        $secretKey = Setting::get('stripe_secret_key');
        if (!$secretKey) {
            return response()->json(['success' => false, 'error' => 'Stripe not configured.']);
        }

        try {
            \Stripe\Stripe::setApiKey($secretKey);
            
            // Create Payment Intent for in-page payment (like subscription)
            $intent = \Stripe\PaymentIntent::create([
                'amount' => (int) ($transaction->amount * 100),
                'currency' => 'inr',
                'payment_method_types' => ['card'],
                'metadata' => [
                    'transaction_id' => $transaction->transaction_id,
                    'member_payment_id' => $payment->id,
                ],
                'description' => "Monthly Installment - {$payment->month_label} - Team: {$payment->team->name}",
            ]);

            return response()->json([
                'success' => true,
                'client_secret' => $intent->client_secret,
                'transaction_id' => $transaction->id,
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    /**
     * Handle Razorpay callback for member payment
     */
    public function razorpayCallback(Request $request)
    {
        $request->validate([
            'razorpay_payment_id' => 'required',
            'razorpay_order_id'   => 'required',
            'razorpay_signature'  => 'required',
            'transaction_id'      => 'required',
        ]);

        $user        = Auth::user();
        $transaction = PaymentTransaction::findOrFail($request->transaction_id);

        // Verify signature
        $keySecret   = Setting::get('razorpay_key_secret');
        $generated   = hash_hmac('sha256', $request->razorpay_order_id . '|' . $request->razorpay_payment_id, $keySecret);

        if ($generated !== $request->razorpay_signature) {
            return redirect()->back()->with('error', 'Payment verification failed.');
        }

        $transaction->markAsCompleted($request->razorpay_order_id, $request->razorpay_payment_id);

        // Get member payment from metadata
        $memberPaymentId = $transaction->metadata['member_payment_id'] ?? null;
        if ($memberPaymentId) {
            $this->completeMemberPayment($transaction, MemberPayment::find($memberPaymentId));
        }

        return redirect()->route('member.payments.index')->with('success', 'Payment successful!');
    }

    /**
     * Handle Stripe callback for member payment
     */
    public function stripeCallback(Request $request)
    {
        $request->validate([
            'payment_intent' => 'required',
            'transaction_id' => 'required',
        ]);

        $transaction = PaymentTransaction::findOrFail($request->transaction_id);
        $transaction->markAsCompleted($request->payment_intent);

        $memberPaymentId = $transaction->metadata['member_payment_id'] ?? null;
        if ($memberPaymentId) {
            $this->completeMemberPayment($transaction, MemberPayment::find($memberPaymentId));
        }

        return response()->json(['success' => true, 'message' => 'Payment successful!']);
    }

    /**
     * Complete the member payment - update status and credit team owner wallet
     */
    private function completeMemberPayment(PaymentTransaction $transaction, ?MemberPayment $memberPayment): void
    {
        if (!$memberPayment) return;

        $user = Auth::user();

        // Mark installment as paid
        $memberPayment->update([
            'status'          => 'paid',
            'paid_date'       => now(),
            'payment_method'  => $transaction->payment_gateway,
            'transaction_ref' => $transaction->transaction_id,
        ]);

        // Credit team owner's wallet
        $team      = $memberPayment->team;
        $teamOwner = $team->user;

        if ($teamOwner && $teamOwner->wallet) {
            $balanceBefore = (float) $teamOwner->wallet->balance;
            $balanceAfter  = $balanceBefore + $memberPayment->amount;

            $teamOwner->wallet->increment('balance', $memberPayment->amount);

            // Wallet transaction record
            Transaction::create([
                'user_id'        => $teamOwner->id,
                'wallet_id'      => $teamOwner->wallet->id,
                'type'           => 'credit',
                'amount'         => $memberPayment->amount,
                'description'    => "Monthly installment from {$user->name} for {$memberPayment->month_label} - Team: {$team->name}",
                'reference_type' => 'member_payment',
                'reference_id'   => $memberPayment->id,
                'balance_before' => $balanceBefore,
                'balance_after'  => $balanceAfter,
            ]);

            // Activity log
            ActivityLog::log('payment')
                ->performedOn($memberPayment)
                ->causedBy($user)
                ->event('member_payment')
                ->withProperties([
                    'member'          => $user->name,
                    'team'            => $team->name,
                    'month'           => $memberPayment->month_label,
                    'amount'          => $memberPayment->amount,
                    'payment_gateway' => $transaction->payment_gateway,
                    'transaction_id'  => $transaction->transaction_id,
                    'credited_to'     => $teamOwner->name,
                ])
                ->log("Monthly installment paid: ₹{$memberPayment->amount} by {$user->name} for {$memberPayment->month_label} → credited to {$teamOwner->name}");
        }
    }
}