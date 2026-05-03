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
        'current_members',
        'monthly_amount',
        'duration',
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
        'monthly_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'duration' => 'integer',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'settings' => 'array',
        'is_active' => 'boolean',
        'last_activity' => 'datetime',
    ];

    protected $attributes = [
        'current_members' => 0,
        'paid_members' => 0,
        'is_active' => true,
    ];

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
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
}
