<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubscriptionLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'team_id',
        'subscription_id',
        'action',
        'from_package',
        'to_package',
        'from_price',
        'to_price',
        'amount_charged',
        'wallet_balance_before',
        'wallet_balance_after',
        'days_used',
        'days_remaining',
        'description',
    ];

    protected $casts = [
        'from_price' => 'decimal:2',
        'to_price' => 'decimal:2',
        'amount_charged' => 'decimal:2',
        'wallet_balance_before' => 'decimal:2',
        'wallet_balance_after' => 'decimal:2',
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

    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }

    // Accessors
    public function getFormattedAmountChargedAttribute()
    {
        return '₹' . number_format((float)$this->amount_charged, 2);
    }

    public function getActionBadgeAttribute()
    {
        return match($this->action) {
            'new' => ['text' => 'New', 'color' => 'bg-green-100 text-green-800'],
            'upgrade' => ['text' => 'Upgrade', 'color' => 'bg-blue-100 text-blue-800'],
            'downgrade' => ['text' => 'Downgrade', 'color' => 'bg-orange-100 text-orange-800'],
            'cancel' => ['text' => 'Cancel', 'color' => 'bg-red-100 text-red-800'],
            default => ['text' => 'Unknown', 'color' => 'bg-gray-100 text-gray-800'],
        };
    }
}