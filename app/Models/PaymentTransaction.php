<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'team_id',
        'package_id',
        'subscription_id',
        'transaction_id',
        'payment_gateway',
        'gateway_transaction_id',
        'gateway_payment_id',
        'amount',
        'currency',
        'gateway_fee',
        'net_amount',
        'status',
        'payment_method',
        'refund_amount',
        'refund_transaction_id',
        'refunded_at',
        'refund_reason',
        'description',
        'gateway_response',
        'metadata',
        'failure_reason',
        'customer_email',
        'customer_phone',
        'completed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'gateway_fee' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'gateway_response' => 'array',
        'metadata' => 'array',
        'refunded_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function package()
    {
        return $this->belongsTo(Package::class);
    }

    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }

    // Scopes
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    // Accessors
    public function getFormattedAmountAttribute()
    {
        return '₹' . number_format((float)$this->amount, 2);
    }

    public function getStatusBadgeAttribute()
    {
        return match($this->status) {
            'completed' => ['text' => 'Completed', 'color' => 'bg-green-100 text-green-800'],
            'pending' => ['text' => 'Pending', 'color' => 'bg-yellow-100 text-yellow-800'],
            'processing' => ['text' => 'Processing', 'color' => 'bg-blue-100 text-blue-800'],
            'failed' => ['text' => 'Failed', 'color' => 'bg-red-100 text-red-800'],
            'refunded' => ['text' => 'Refunded', 'color' => 'bg-purple-100 text-purple-800'],
            'cancelled' => ['text' => 'Cancelled', 'color' => 'bg-gray-100 text-gray-800'],
            default => ['text' => 'Unknown', 'color' => 'bg-gray-100 text-gray-800'],
        };
    }

    // Helper Methods
    public static function generateTransactionId()
    {
        return 'TXN' . strtoupper(uniqid()) . time();
    }

    public function markAsCompleted($gatewayTransactionId = null, $gatewayPaymentId = null)
    {
        $this->update([
            'status' => 'completed',
            'gateway_transaction_id' => $gatewayTransactionId ?? $this->gateway_transaction_id,
            'gateway_payment_id' => $gatewayPaymentId ?? $this->gateway_payment_id,
            'completed_at' => now(),
        ]);
    }

    public function markAsFailed($reason = null)
    {
        $this->update([
            'status' => 'failed',
            'failure_reason' => $reason,
        ]);
    }

    public function markAsRefunded($refundAmount, $refundTransactionId, $reason = null)
    {
        $this->update([
            'status' => 'refunded',
            'refund_amount' => $refundAmount,
            'refund_transaction_id' => $refundTransactionId,
            'refunded_at' => now(),
            'refund_reason' => $reason,
        ]);
    }
}