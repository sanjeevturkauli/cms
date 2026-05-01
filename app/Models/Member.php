<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Member extends Model
{
    protected $fillable = [
        'user_id',
        'team_id',
    ];

    protected static function boot()
    {
        parent::boot();

        // Update team info member count when member is created
        static::created(function ($member) {
            if ($member->team && $member->team->teamInfo) {
                $member->team->teamInfo->updateMemberCount();
            }
        });

        // Update team info member count when member is deleted
        static::deleted(function ($member) {
            if ($member->team && $member->team->teamInfo) {
                $member->team->teamInfo->updateMemberCount();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }
}
