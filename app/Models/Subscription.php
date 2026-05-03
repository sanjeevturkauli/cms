<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'team_id',
        'package_id',
        'member_limit',
        'team_limit',
        'start_date',
        'end_date',
        'duration',
        'type',
        'amount_paid',
        'status',
        'package_features',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'amount_paid' => 'decimal:2',
        'duration' => 'integer',
        'member_limit' => 'integer',
        'team_limit' => 'integer',
        'package_features' => 'array',
    ];

    // Relationships
    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function package()
    {
        return $this->belongsTo(Package::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeExpired($query)
    {
        return $query->where('status', 'expired');
    }

    // Accessors
    public function getIsActiveAttribute()
    {
        return $this->status === 'active' && $this->end_date->isFuture();
    }

    public function getIsExpiredAttribute()
    {
        return $this->end_date->isPast();
    }

    public function getDaysRemainingAttribute()
    {
        if ($this->is_expired) {
            return 0;
        }
        
        $now = Carbon::now()->startOfDay();
        $endDate = $this->end_date->startOfDay();
        
        return max(0, $now->diffInDays($endDate, false));
    }

    public function getFormattedAmountAttribute()
    {
        return '₹' . number_format((float)$this->amount_paid, 0);
    }

    // Methods
    public function markAsExpired()
    {
        $this->update(['status' => 'expired']);
    }

    public function cancel()
    {
        $this->update(['status' => 'cancelled']);
    }
}
