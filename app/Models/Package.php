<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Package extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'price',
        'member_limit',
        'team_limit',
        'features',
        'duration',
        'type',
        'is_active',
    ];

    protected $casts = [
        'features' => 'array',
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'duration' => 'integer',
        'member_limit' => 'integer',
        'team_limit' => 'integer',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function getFormattedPriceAttribute()
    {
        return '₹' . number_format((float)$this->price, 0);
    }

    public function getDurationRangeAttribute()
    {
        $type = $this->type ?? 'month';
        return $this->duration . ' ' . $type . ($this->duration > 1 ? 's' : '');
    }

    public function getFormattedMemberLimitAttribute()
    {
        if ($this->member_limit === -1 || $this->member_limit >= 999) {
            return 'Unlimited';
        }
        return $this->member_limit . ' member' . ($this->member_limit > 1 ? 's' : '');
    }

    public function getFormattedTeamLimitAttribute()
    {
        if ($this->team_limit === -1 || $this->team_limit >= 999) {
            return 'Unlimited';
        }
        return $this->team_limit . ' team' . ($this->team_limit > 1 ? 's' : '');
    }

    // Keep backward compatibility
    public function getFormattedPersonAttribute()
    {
        return $this->formatted_member_limit;
    }
}
