<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\MemberPayment;
use App\Models\PaymentTransaction;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class MemberPaymentController extends Controller
{
    /**
     * Get all transactions for the member user
     */
    public function getTransactions(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Please login first.',
                'data' => null,
            ], 401);
        }

        if (!$user->hasRole('member')) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Member role required.',
                'data' => null,
            ], 403);
        }

        // Get pagination parameters
        $perPage = $request->input('per_page', 15);
        $status = $request->input('status'); // completed, pending, failed, paid
        $teamId = $request->input('team_id'); // filter by team

        // Get member payments (user's own payments)
        $memberPaymentsQuery = MemberPayment::where('user_id', $user->id)
            ->with(['team:id,name', 'member:id,user_id,team_id']);

        if ($teamId) {
            $memberPaymentsQuery->where('team_id', $teamId);
        }

        if ($status) {
            $memberPaymentsQuery->where('status', $status);
        }

        $memberPayments = $memberPaymentsQuery->orderBy('created_at', 'desc')->paginate($perPage);

        // Format member payments
        $transactions = $memberPayments->map(function ($payment) {
            return [
                'id' => $payment->id,
                'type' => 'member_payment',
                'transaction_ref' => $payment->transaction_ref ?? 'N/A',
                'amount' => '₹' . number_format($payment->amount, 2),
                'raw_amount' => (float) $payment->amount,
                'status' => $payment->status,
                'payment_method' => $payment->payment_method ?? 'N/A',
                'description' => "Monthly payment for {$payment->month_label}",
                'month_label' => $payment->month_label,
                'team_id' => $payment->team_id,
                'team_name' => $payment->team->name ?? 'N/A',
                'due_date' => $payment->due_date?->format('d M, Y'),
                'paid_date' => $payment->paid_date?->format('d M, Y'),
                'created_at' => $payment->created_at->format('d M, Y H:i:s'),
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Transactions fetched successfully.',
            'data' => $memberPayments->toArray(),
        ]);
    }

    /**
     * Get payment banner status for member
     */
    public function getPaymentBanner(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Please login first.',
                'data' => null,
            ], 401);
        }

        if (!$user->hasRole('member')) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Member role required.',
                'data' => null,
            ], 403);
        }

        $members = Member::where('user_id', $user->id)->with('team.teamInfo')->get();
        $paymentBanners = [];

        foreach ($members as $member) {
            $teamInfo = $member->team?->teamInfo;
            if (!$teamInfo || !$teamInfo->monthly_amount || $teamInfo->monthly_amount <= 0) {
                continue;
            }

            $monthlyAmount = (float) $teamInfo->monthly_amount;

            // Generate payment records if not exist
            MemberPayment::generateForMember($member, $monthlyAmount);

            $now = Carbon::now();
            $currentPayment = MemberPayment::getCurrentMonthStatus($member->id);
            $nextDue = MemberPayment::getNextDue($member->id);

            if ($currentPayment && $currentPayment->status === 'paid') {
                // Current month is PAID — check if next payment is upcoming
                $nextMonthDue = Carbon::createFromDate($now->year, $now->month, 1)->addMonth();
                $daysUntilNext = $now->diffInDays($nextMonthDue, false);

                // Show upcoming banner if next payment is within 10 days
                if ($daysUntilNext <= 10 && $daysUntilNext >= 6) {
                    $paymentBanners[] = [
                        'type'        => 'upcoming',
                        'member_id'   => $member->id,
                        'team_id'     => $member->team_id,
                        'team_name'   => $member->team->name,
                        'amount'      => '₹' . number_format($monthlyAmount, 2),
                        'raw_amount'  => $monthlyAmount,
                        'month_label' => $nextMonthDue->format('F Y'),
                        'due_date'    => $nextMonthDue->format('d M, Y'),
                        'days_left'   => $daysUntilNext,
                        'payment_id'  => null,
                        'status'      => 'upcoming',
                        'is_overdue'  => false,
                        'message'     => "Your {$nextMonthDue->format('F Y')} payment of ₹{$monthlyAmount} for \"{$member->team->name}\" is due in {$daysUntilNext} days.",
                        'action_text' => 'View Details',
                    ];
                }
            } elseif ($currentPayment && $currentPayment->status !== 'paid') {
                // Current month NOT paid
                $daysUntilDue = $now->diffInDays($currentPayment->due_date, false);
                $isOverdue = $currentPayment->due_date->isPast();

                if ($isOverdue) {
                    // Overdue: due date has passed
                    $daysOverdue = abs((int)$daysUntilDue);
                    $paymentBanners[] = [
                        'type'        => 'overdue',
                        'member_id'   => $member->id,
                        'team_id'     => $member->team_id,
                        'team_name'   => $member->team->name,
                        'amount'      => '₹' . number_format($monthlyAmount, 2),
                        'raw_amount'  => $monthlyAmount,
                        'month_label' => $currentPayment->month_label,
                        'due_date'    => $currentPayment->due_date->format('d M, Y'),
                        'days_left'   => $daysOverdue,
                        'payment_id'  => $currentPayment->id,
                        'status'      => 'overdue',
                        'is_overdue'  => true,
                        'message'     => "Payment Overdue — {$member->team->name}. Your {$currentPayment->month_label} payment of ₹{$monthlyAmount} for \"{$member->team->name}\" was due on {$currentPayment->due_date->format('d M, Y')} and is now overdue. Please pay immediately to avoid any issues.",
                        'action_text' => 'Pay Now',
                    ];
                } elseif ($daysUntilDue <= 5) {
                    // Due: within 5 days of due date
                    $paymentBanners[] = [
                        'type'        => 'due',
                        'member_id'   => $member->id,
                        'team_id'     => $member->team_id,
                        'team_name'   => $member->team->name,
                        'amount'      => '₹' . number_format($monthlyAmount, 2),
                        'raw_amount'  => $monthlyAmount,
                        'month_label' => $currentPayment->month_label,
                        'due_date'    => $currentPayment->due_date->format('d M, Y'),
                        'days_left'   => (int)$daysUntilDue,
                        'payment_id'  => $currentPayment->id,
                        'status'      => 'pending',
                        'is_overdue'  => false,
                        'message'     => "Payment Due — {$member->team->name}. Your {$currentPayment->month_label} payment of ₹{$monthlyAmount} for \"{$member->team->name}\" is due on {$currentPayment->due_date->format('d M, Y')}. Please pay within {$daysUntilDue} days.",
                        'action_text' => 'Pay Now',
                    ];
                } elseif ($daysUntilDue <= 10) {
                    // Upcoming: 6-10 days before due date
                    $paymentBanners[] = [
                        'type'        => 'upcoming',
                        'member_id'   => $member->id,
                        'team_id'     => $member->team_id,
                        'team_name'   => $member->team->name,
                        'amount'      => '₹' . number_format($monthlyAmount, 2),
                        'raw_amount'  => $monthlyAmount,
                        'month_label' => $currentPayment->month_label,
                        'due_date'    => $currentPayment->due_date->format('d M, Y'),
                        'days_left'   => (int)$daysUntilDue,
                        'payment_id'  => $currentPayment->id,
                        'status'      => 'upcoming',
                        'is_overdue'  => false,
                        'message'     => "Upcoming Payment — {$member->team->name}. Your {$currentPayment->month_label} payment of ₹{$monthlyAmount} for \"{$member->team->name}\" is due on {$currentPayment->due_date->format('d M, Y')}.",
                        'action_text' => 'View Details',
                    ];
                }
            } elseif ($nextDue) {
                // No current month record but next due exists
                $daysUntilNext = $now->diffInDays($nextDue->due_date, false);
                $isOverdue = $nextDue->due_date->isPast();

                if ($isOverdue) {
                    $daysOverdue = abs((int)$daysUntilNext);
                    $paymentBanners[] = [
                        'type'        => 'overdue',
                        'member_id'   => $member->id,
                        'team_id'     => $member->team_id,
                        'team_name'   => $member->team->name,
                        'amount'      => '₹' . number_format($monthlyAmount, 2),
                        'raw_amount'  => $monthlyAmount,
                        'month_label' => $nextDue->month_label,
                        'due_date'    => $nextDue->due_date->format('d M, Y'),
                        'days_left'   => $daysOverdue,
                        'payment_id'  => $nextDue->id,
                        'status'      => 'overdue',
                        'is_overdue'  => true,
                        'message'     => "Payment Overdue — {$member->team->name}. Your {$nextDue->month_label} payment of ₹{$monthlyAmount} for \"{$member->team->name}\" was due on {$nextDue->due_date->format('d M, Y')} and is now overdue. Please pay immediately to avoid any issues.",
                        'action_text' => 'Pay Now',
                    ];
                } elseif ($daysUntilNext <= 5) {
                    $paymentBanners[] = [
                        'type'        => 'due',
                        'member_id'   => $member->id,
                        'team_id'     => $member->team_id,
                        'team_name'   => $member->team->name,
                        'amount'      => '₹' . number_format($monthlyAmount, 2),
                        'raw_amount'  => $monthlyAmount,
                        'month_label' => $nextDue->month_label,
                        'due_date'    => $nextDue->due_date->format('d M, Y'),
                        'days_left'   => (int)$daysUntilNext,
                        'payment_id'  => $nextDue->id,
                        'status'      => 'pending',
                        'is_overdue'  => false,
                        'message'     => "Payment Due — {$member->team->name}. Your {$nextDue->month_label} payment of ₹{$monthlyAmount} for \"{$member->team->name}\" is due on {$nextDue->due_date->format('d M, Y')}. Please pay within {$daysUntilNext} days.",
                        'action_text' => 'Pay Now',
                    ];
                } elseif ($daysUntilNext <= 10) {
                    $paymentBanners[] = [
                        'type'        => 'upcoming',
                        'member_id'   => $member->id,
                        'team_id'     => $member->team_id,
                        'team_name'   => $member->team->name,
                        'amount'      => '₹' . number_format($monthlyAmount, 2),
                        'raw_amount'  => $monthlyAmount,
                        'month_label' => $nextDue->month_label,
                        'due_date'    => $nextDue->due_date->format('d M, Y'),
                        'days_left'   => (int)$daysUntilNext,
                        'payment_id'  => $nextDue->id,
                        'status'      => 'upcoming',
                        'is_overdue'  => false,
                        'message'     => "Upcoming Payment — {$member->team->name}. Your {$nextDue->month_label} payment of ₹{$monthlyAmount} for \"{$member->team->name}\" is due on {$nextDue->due_date->format('d M, Y')}.",
                        'action_text' => 'View Details',
                    ];
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment banners fetched successfully.',
            'data' => [
                'banners' => $paymentBanners,
                'total_banners' => count($paymentBanners),
                'has_overdue' => collect($paymentBanners)->where('type', 'overdue')->isNotEmpty(),
                'has_due' => collect($paymentBanners)->where('type', 'due')->isNotEmpty(),
                'has_upcoming' => collect($paymentBanners)->where('type', 'upcoming')->isNotEmpty(),
            ],
        ]);
    }
    
    /**
     * Get available payment methods/gateways
     */
    public function getPaymentMethods(Request $request): JsonResponse
    {
        $user = $request->user();
    
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Please login first.',
                'data' => null,
            ], 401);
        }
    
        if (!$user->hasRole('member')) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Member role required.',
                'data' => null,
            ], 403);
        }
    
        // Get payment gateway settings from database
        $razorpayEnabled = (bool) \App\Models\Setting::get('razorpay_enabled', false);
        $stripeEnabled = (bool) \App\Models\Setting::get('stripe_enabled', false);
        $paypalEnabled = (bool) \App\Models\Setting::get('paypal_enabled', false);
    
        $paymentMethods = [];
    
        // Razorpay
        if ($razorpayEnabled) {
            $paymentMethods[] = [
                'id' => 'razorpay',
                'name' => 'Razorpay',
                'description' => 'UPI, Cards, NetBanking, Wallets',
                'enabled' => true,
                'logo' => asset('images/razorpay-logo.png'),
                'supported_methods' => ['upi', 'card', 'netbanking', 'wallet'],
                'key_id' => \App\Models\Setting::get('razorpay_key_id', ''),
            ];
        }
    
        // Stripe
        if ($stripeEnabled) {
            $paymentMethods[] = [
                'id' => 'stripe',
                'name' => 'Stripe',
                'description' => 'Credit/Debit Cards',
                'enabled' => true,
                'logo' => asset('images/stripe-logo.png'),
                'supported_methods' => ['card'],
                'public_key' => \App\Models\Setting::get('stripe_public_key', ''),
            ];
        }
    
        // PayPal
        if ($paypalEnabled) {
            $paymentMethods[] = [
                'id' => 'paypal',
                'name' => 'PayPal',
                'description' => 'Coming Soon',
                'enabled' => false,
                'logo' => asset('images/paypal-logo.png'),
                'supported_methods' => ['paypal'],
                'client_id' => \App\Models\Setting::get('paypal_client_id', ''),
            ];
        }
    
        // If no payment methods are enabled
        if (empty($paymentMethods)) {
            return response()->json([
                'success' => true,
                'message' => 'No payment methods available at the moment.',
                'data' => [
                    'payment_methods' => [],
                    'total_methods' => 0,
                    'has_enabled_methods' => false,
                ],
            ]);
        }
    
        return response()->json([
            'success' => true,
            'message' => 'Payment methods fetched successfully.',
            'data' => [
                'payment_methods' => $paymentMethods,
                'total_methods' => count($paymentMethods),
                'has_enabled_methods' => collect($paymentMethods)->where('enabled', true)->isNotEmpty(),
                'default_method' => $paymentMethods[0]['id'] ?? null,
            ],
        ]);
    }

    /**
     * Initiate payment for a member installment
     * Creates payment transaction and returns gateway-specific data for mobile app
     */
    public function initiatePayment(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Please login first.',
                'data' => null,
            ], 401);
        }

        if (!$user->hasRole('member')) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Member role required.',
                'data' => null,
            ], 403);
        }

        // Validate request
        $validator = \Validator::make($request->all(), [
            'member_payment_id' => 'required|exists:member_payments,id',
            'payment_gateway' => 'required|in:razorpay,stripe',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'data' => null,
            ], 422);
        }

        $payment = MemberPayment::find($request->member_payment_id);

        // Verify ownership
        if ($payment->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. This payment does not belong to you.',
                'data' => null,
            ], 403);
        }

        // Check if already paid
        if ($payment->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'This payment is already completed.',
                'data' => null,
            ], 400);
        }

        // Check if gateway is enabled
        $gatewayEnabled = \App\Models\Setting::get($request->payment_gateway . '_enabled', false);
        if (!$gatewayEnabled) {
            return response()->json([
                'success' => false,
                'message' => 'Selected payment gateway is not enabled.',
                'data' => null,
            ], 400);
        }

        // Create a PaymentTransaction record
        $transaction = \App\Models\PaymentTransaction::create([
            'user_id' => $user->id,
            'team_id' => $payment->team_id,
            'package_id' => null,
            'transaction_id' => \App\Models\PaymentTransaction::generateTransactionId(),
            'payment_gateway' => $request->payment_gateway,
            'amount' => $payment->amount,
            'currency' => 'INR',
            'net_amount' => $payment->amount,
            'status' => 'pending',
            'description' => "Monthly installment for {$payment->month_label} - Team: {$payment->team->name}",
            'customer_email' => $user->email,
            'customer_phone' => $user->mobile ?? null,
            'metadata' => ['member_payment_id' => $payment->id],
        ]);

        // Initiate payment based on gateway
        if ($request->payment_gateway === 'razorpay') {
            return $this->initiateRazorpayPayment($transaction, $payment);
        } else {
            return $this->initiateStripePayment($transaction, $payment);
        }
    }

    /**
     * Initiate Razorpay payment - create order and return details
     */
    private function initiateRazorpayPayment(\App\Models\PaymentTransaction $transaction, MemberPayment $payment): JsonResponse
    {
        $keyId = \App\Models\Setting::get('razorpay_key_id');
        $keySecret = \App\Models\Setting::get('razorpay_key_secret');

        if (!$keyId || !$keySecret) {
            return response()->json([
                'success' => false,
                'message' => 'Razorpay not configured properly. Please contact support.',
                'data' => null,
            ], 500);
        }

        try {
            $orderData = [
                'amount' => (int) ($transaction->amount * 100), // Amount in paise
                'currency' => 'INR',
                'receipt' => $transaction->transaction_id,
                'notes' => [
                    'member_payment_id' => $payment->id,
                    'transaction_id' => $transaction->transaction_id,
                    'team_id' => $payment->team_id,
                ],
            ];

            $response = Http::withBasicAuth($keyId, $keySecret)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post('https://api.razorpay.com/v1/orders', $orderData);

            $orderResponse = $response->json();

            if (isset($orderResponse['id'])) {
                return response()->json([
                    'success' => true,
                    'message' => 'Razorpay order created successfully.',
                    'data' => [
                        'gateway' => 'razorpay',
                        'order_id' => $orderResponse['id'],
                        'amount' => $orderResponse['amount'],
                        'currency' => $orderResponse['currency'],
                        'key_id' => $keyId,
                        'transaction_id' => $transaction->id,
                        'transaction_ref' => $transaction->transaction_id,
                        'description' => $transaction->description,
                        'payment_details' => [
                            'member_payment_id' => $payment->id,
                            'month_label' => $payment->month_label,
                            'team_name' => $payment->team->name,
                            'amount_formatted' => '₹' . number_format($payment->amount, 2),
                        ],
                    ],
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to create Razorpay order. Please try again.',
                'data' => null,
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Payment initiation failed: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    /**
     * Initiate Stripe payment - create payment intent and return client secret
     */
    private function initiateStripePayment(\App\Models\PaymentTransaction $transaction, MemberPayment $payment): JsonResponse
    {
        $secretKey = \App\Models\Setting::get('stripe_secret_key');
        $publicKey = \App\Models\Setting::get('stripe_public_key');

        if (!$secretKey || !$publicKey) {
            return response()->json([
                'success' => false,
                'message' => 'Stripe not configured properly. Please contact support.',
                'data' => null,
            ], 500);
        }

        try {
            \Stripe\Stripe::setApiKey($secretKey);

            // Create Payment Intent
            $intent = \Stripe\PaymentIntent::create([
                'amount' => (int) ($transaction->amount * 100), // Amount in cents
                'currency' => 'inr',
                'payment_method_types' => ['card'],
                'metadata' => [
                    'transaction_id' => $transaction->transaction_id,
                    'member_payment_id' => $payment->id,
                    'team_id' => $payment->team_id,
                ],
                'description' => "Monthly Installment - {$payment->month_label} - Team: {$payment->team->name}",
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Stripe payment intent created successfully.',
                'data' => [
                    'gateway' => 'stripe',
                    'client_secret' => $intent->client_secret,
                    'payment_intent_id' => $intent->id,
                    'public_key' => $publicKey,
                    'transaction_id' => $transaction->id,
                    'transaction_ref' => $transaction->transaction_id,
                    'amount' => $intent->amount,
                    'currency' => $intent->currency,
                    'payment_details' => [
                        'member_payment_id' => $payment->id,
                        'month_label' => $payment->month_label,
                        'team_name' => $payment->team->name,
                        'amount_formatted' => '₹' . number_format($payment->amount, 2),
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Payment initiation failed: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    /**
     * Verify payment after successful transaction
     */
    public function verifyPayment(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Please login first.',
                'data' => null,
            ], 401);
        }

        if (!$user->hasRole('member')) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Member role required.',
                'data' => null,
            ], 403);
        }

        // Validate request
        $validator = \Validator::make($request->all(), [
            'payment_gateway' => 'required|in:razorpay,stripe',
            'transaction_id' => 'required|exists:payment_transactions,id',
            'member_payment_id' => 'required|exists:member_payments,id',
            // Razorpay specific
            'razorpay_payment_id' => 'required_if:payment_gateway,razorpay',
            'razorpay_order_id' => 'required_if:payment_gateway,razorpay',
            'razorpay_signature' => 'required_if:payment_gateway,razorpay',
            // Stripe specific
            'payment_intent' => 'required_if:payment_gateway,stripe',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'data' => null,
            ], 422);
        }

        // Get transaction and member payment
        $transaction = \App\Models\PaymentTransaction::find($request->transaction_id);
        $memberPayment = MemberPayment::find($request->member_payment_id);

        // Verify ownership
        if ($transaction->user_id !== $user->id || $memberPayment->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. This payment does not belong to you.',
                'data' => null,
            ], 403);
        }

        // Check if already paid
        if ($memberPayment->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'This payment has already been completed.',
                'data' => [
                    'payment' => [
                        'id' => $memberPayment->id,
                        'status' => 'paid',
                        'amount' => '₹' . number_format($memberPayment->amount, 2),
                        'month_label' => $memberPayment->month_label,
                        'paid_date' => $memberPayment->paid_date?->format('d M, Y'),
                    ],
                ],
            ], 400);
        }

        // Verify based on payment gateway
        if ($request->payment_gateway === 'razorpay') {
            $verified = $this->verifyRazorpayPayment($request, $transaction);
        } else {
            $verified = $this->verifyStripePayment($request, $transaction);
        }

        if (!$verified['success']) {
            return response()->json([
                'success' => false,
                'message' => $verified['message'],
                'data' => null,
            ], 400);
        }

        // Mark transaction as completed
        $transaction->markAsCompleted(
            $verified['gateway_transaction_id'] ?? null,
            $verified['gateway_payment_id'] ?? null
        );

        // Complete member payment
        $this->completeMemberPayment($transaction, $memberPayment);

        return response()->json([
            'success' => true,
            'message' => 'Payment verified and completed successfully!',
            'data' => [
                'payment' => [
                    'id' => $memberPayment->id,
                    'status' => 'paid',
                    'amount' => '₹' . number_format($memberPayment->amount, 2),
                    'raw_amount' => (float) $memberPayment->amount,
                    'month_label' => $memberPayment->month_label,
                    'paid_date' => now()->format('d M, Y'),
                    'payment_method' => $request->payment_gateway,
                    'transaction_ref' => $transaction->transaction_id,
                ],
                'transaction' => [
                    'id' => $transaction->id,
                    'transaction_id' => $transaction->transaction_id,
                    'gateway' => $transaction->payment_gateway,
                    'status' => 'completed',
                    'completed_at' => now()->format('d M, Y H:i:s'),
                ],
            ],
        ]);
    }

    /**
     * Verify Razorpay payment signature
     */
    private function verifyRazorpayPayment(Request $request, \App\Models\PaymentTransaction $transaction): array
    {
        $keySecret = \App\Models\Setting::get('razorpay_key_secret');

        if (!$keySecret) {
            return [
                'success' => false,
                'message' => 'Razorpay configuration error. Please contact support.',
            ];
        }

        // Verify signature
        $generated = hash_hmac(
            'sha256',
            $request->razorpay_order_id . '|' . $request->razorpay_payment_id,
            $keySecret
        );

        if ($generated !== $request->razorpay_signature) {
            return [
                'success' => false,
                'message' => 'Payment verification failed. Invalid signature.',
            ];
        }

        return [
            'success' => true,
            'gateway_transaction_id' => $request->razorpay_order_id,
            'gateway_payment_id' => $request->razorpay_payment_id,
        ];
    }

    /**
     * Verify Stripe payment intent
     */
    private function verifyStripePayment(Request $request, \App\Models\PaymentTransaction $transaction): array
    {
        $secretKey = \App\Models\Setting::get('stripe_secret_key');

        if (!$secretKey) {
            return [
                'success' => false,
                'message' => 'Stripe configuration error. Please contact support.',
            ];
        }

        try {
            \Stripe\Stripe::setApiKey($secretKey);
            
            // Retrieve payment intent
            $intent = \Stripe\PaymentIntent::retrieve($request->payment_intent);

            // Check if payment was successful
            if ($intent->status !== 'succeeded') {
                return [
                    'success' => false,
                    'message' => 'Payment not completed. Status: ' . $intent->status,
                ];
            }

            // Verify amount matches
            $expectedAmount = (int) ($transaction->amount * 100);
            if ($intent->amount !== $expectedAmount) {
                return [
                    'success' => false,
                    'message' => 'Payment amount mismatch.',
                ];
            }

            return [
                'success' => true,
                'gateway_transaction_id' => $request->payment_intent,
                'gateway_payment_id' => $intent->id,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Payment verification failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Complete the member payment - update status and credit team owner wallet
     */
    private function completeMemberPayment(\App\Models\PaymentTransaction $transaction, MemberPayment $memberPayment): void
    {
        // Mark installment as paid
        $memberPayment->update([
            'status' => 'paid',
            'paid_date' => now(),
            'payment_method' => $transaction->payment_gateway,
            'transaction_ref' => $transaction->transaction_id,
        ]);

        // Credit team owner's wallet
        $team = $memberPayment->team;
        $teamOwner = $team->user;
        $user = $memberPayment->user;

        if ($teamOwner?->wallet) {
            $balanceBefore = (float) $teamOwner->wallet->balance;
            $balanceAfter = $balanceBefore + $memberPayment->amount;

            $teamOwner->wallet->increment('balance', $memberPayment->amount);

            // Wallet transaction record
            \App\Models\Transaction::create([
                'user_id' => $teamOwner->id,
                'wallet_id' => $teamOwner->wallet->id,
                'type' => 'credit',
                'amount' => $memberPayment->amount,
                'description' => "Monthly installment from {$user->name} for {$memberPayment->month_label} - Team: {$team->name}",
                'reference_type' => 'member_payment',
                'reference_id' => $memberPayment->id,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
            ]);

            // Activity log
            \App\Models\ActivityLog::log('payment')
                ->performedOn($memberPayment)
                ->causedBy($user)
                ->event('member_payment')
                ->withProperties([
                    'member' => $user->name,
                    'team' => $team->name,
                    'month' => $memberPayment->month_label,
                    'amount' => $memberPayment->amount,
                    'payment_gateway' => $transaction->payment_gateway,
                    'transaction_id' => $transaction->transaction_id,
                    'credited_to' => $teamOwner->name,
                ])
                ->log("Monthly installment paid: ₹{$memberPayment->amount} by {$user->name} for {$memberPayment->month_label} → credited to {$teamOwner->name}");
        }
    }
}

