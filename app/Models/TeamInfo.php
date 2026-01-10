<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class TeamInfo extends Model
{
    protected $table = 'team_info';

    protected $fillable = [
        'team_id',
        'plan',
        'duration_months',
        'plan_start_date',
        'plan_end_date',
        'total_member_limit',
        'current_members',
        'monthly_amount',
        'total_amount',
        'paid_members',
        'latitude',
        'longitude',
        'location',
        'address',
        'country',
        'state',
        'city',
        'area',
        'pincode',
        'description',
        'category',
        'settings',
        'is_active',
        'last_activity',
    ];

    protected $casts = [
        'plan_start_date' => 'date',
        'plan_end_date' => 'date',
        'monthly_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'settings' => 'array',
        'is_active' => 'boolean',
        'last_activity' => 'datetime',
    ];

    protected $attributes = [
        'total_member_limit' => 10,
        'current_members' => 0,
        'paid_members' => 0,
        'is_active' => true,
    ];

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function getPlanStatusAttribute(): string
    {
        if (!$this->plan_end_date) {
            return 'no_plan';
        }

        if (Carbon::now()->gt($this->plan_end_date)) {
            return 'expired';
        }

        if (Carbon::now()->diffInDays($this->plan_end_date) <= 7) {
            return 'expiring_soon';
        }

        return 'active';
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function updateMemberCount(): void
    {
        $this->update([
            'current_members' => $this->team->members()->count()
        ]);
    }

    public function canAddMembers($count = 1): bool
    {
        return ($this->current_members + $count) <= $this->total_member_limit;
    }

    public function getIsExpiredAttribute(): bool
    {
        return $this->plan_end_date && Carbon::now()->gt($this->plan_end_date);
    }

    public function getMemberUsagePercentageAttribute(): float
    {
        if ($this->total_member_limit <= 0) {
            return 0;
        }

        return round(($this->current_members / $this->total_member_limit) * 100, 2);
    }

    public function getRemainingMemberSlotsAttribute(): int
    {
        return max(0, $this->total_member_limit - $this->current_members);
    }

    public function scopeByPlan($query, $plan)
    {
        return $query->where('plan', $plan);
    }

    public function scopeExpired($query)
    {
        return $query->where('plan_end_date', '<', Carbon::now());
    }

    public function scopeExpiringSoon($query, $days = 7)
    {
        return $query->whereBetween('plan_end_date', [
            Carbon::now(),
            Carbon::now()->addDays($days)
        ]);
    }

    public function extendPlan($months): void
    {
        $endDate = $this->plan_end_date ?: Carbon::now();

        $this->update([
            'plan_end_date' => Carbon::parse($endDate)->addMonths($months),
            'duration_months' => $this->duration_months + $months,
        ]);
    }

    public function upgradePlan($newPlan, $newLimit): void
    {
        $this->update([
            'plan' => $newPlan,
            'total_member_limit' => $newLimit,
        ]);
    }
}
