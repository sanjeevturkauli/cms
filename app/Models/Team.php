<?php

namespace App\Models;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Team extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'team_id',
        'status',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $attributes = [
        'status' => 'pending',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($team) {
            if (empty($team->team_id)) {
                $team->team_id = strtoupper(Str::random(8));
            }
        });

        static::deleting(function ($team) {
            $team->members()->delete();
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function owner(): BelongsTo
    {
        return $this->user();
    }

    public function members(): HasMany
    {
        return $this->hasMany(Member::class);
    }

    public function teamInfo(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(TeamInfo::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function activeSubscription()
    {
        return $this->hasOne(Subscription::class)->where('status', 'active');
    }

    public function scopeIsActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeIsApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeIsPending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->where('status', 'approved');
    }

    /**
     * Get the member limit for this team based on team info or subscription
     */
    public function getMemberLimit(): int
    {
        // First check team info
        if ($this->teamInfo && $this->teamInfo->total_member_limit > 0) {
            return $this->teamInfo->total_member_limit;
        }
        
        // Fallback to subscription package limit
        $subscription = $this->activeSubscription;
        
        if ($subscription && $subscription->package && $subscription->package->member_limit > 0) {
            return $subscription->package->member_limit;
        }
        
        // Default fallback - allow at least 1 member for basic functionality
        return 1;
    }

    /**
     * Get current member count (excluding owner)
     */
    public function getCurrentMemberCount(): int
    {
        return $this->members()->count();
    }

    /**
     * Check if team can accept new members
     */
    public function canAcceptNewMembers()
    {
        $memberLimit = $this->getMemberLimit();
        $currentCount = $this->getCurrentMemberCount();
        return $memberLimit;
        
        // Debug logging
        \Log::info("Team {$this->name} - Limit: {$memberLimit}, Current: {$currentCount}");
        
        return $currentCount < $memberLimit;
    }

    /**
     * Get remaining member slots
     */
    public function getRemainingMemberSlots(): int
    {
        $memberLimit = $this->getMemberLimit();
        $currentCount = $this->getCurrentMemberCount();
        
        return max(0, $memberLimit - $currentCount);
    }

    /**
     * Check if adding N members would exceed limit
     */
    public function wouldExceedLimit(int $additionalMembers = 1): bool
    {
        $memberLimit = $this->getMemberLimit();
        $currentCount = $this->getCurrentMemberCount();
        
        return ($currentCount + $additionalMembers) > $memberLimit;
    }

    /**
     * Get team owner's KYC status
     */
    public function getOwnerKycStatus(): ?string
    {
        return $this->user->kyc?->status;
    }

    /**
     * Check if team owner's KYC is approved
     */
    public function isOwnerKycApproved(): bool
    {
        return $this->getOwnerKycStatus() === 'approved';
    }

    /**
     * Get team owner's KYC completion percentage
     */
    public function getOwnerKycCompletionPercentage(): int
    {
        return $this->user->kyc?->completion_percentage ?? 0;
    }

    /**
     * Check if team info is complete
     */
    public function isTeamInfoComplete(): bool
    {
        if (!$this->teamInfo) {
            return false;
        }

        $requiredFields = [
            'location',
            'address', 
            'city',
            'state',
            'country'
        ];

        foreach ($requiredFields as $field) {
            if (empty($this->teamInfo->$field)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get team completion status message
     */
    public function getCompletionStatusMessage(): ?string
    {
        $kycStatus = $this->getOwnerKycStatus();
        $teamInfoComplete = $this->isTeamInfoComplete();

        if (!$kycStatus) {
            return 'Complete your KYC verification to unlock all features';
        }

        if ($kycStatus === 'pending') {
            return 'KYC verification is pending approval';
        }

        if ($kycStatus === 'rejected') {
            return 'KYC verification was rejected. Please resubmit';
        }

        if (!$teamInfoComplete) {
            return 'Complete team location details to finish setup';
        }

        return null; // All complete
    }
}
