<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberPayment extends Model
{
    protected $fillable = [
        'member_id',
        'team_id',
        'user_id',
        'amount',
        'month',
        'year',
        'due_date',
        'paid_date',
        'status',
        'payment_method',
        'transaction_ref',
        'notes',
    ];

    protected $casts = [
        'amount'    => 'decimal:2',
        'due_date'  => 'date',
        'paid_date' => 'date',
        'month'     => 'integer',
        'year'      => 'integer',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getMonthLabelAttribute(): string
    {
        return Carbon::createFromDate($this->year, $this->month, 1)->format('F Y');
    }

    public function getIsOverdueAttribute(): bool
    {
        return $this->status === 'pending' && $this->due_date->isPast();
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'overdue')
            ->orWhere(function ($q) {
                $q->where('status', 'pending')
                  ->where('due_date', '<', now());
            });
    }

    /**
     * Generate monthly payment records for a member from join date
     */
    public static function generateForMember(Member $member, float $monthlyAmount): void
    {
        $joinDate = $member->created_at;
        $now = Carbon::now();

        // Generate from join month to current month
        $current = $joinDate->copy()->startOfMonth();

        while ($current->lte($now->copy()->startOfMonth())) {
            $dueDate = $current->copy()->day(1); // 1st of each month

            self::firstOrCreate(
                [
                    'member_id' => $member->id,
                    'month'     => $current->month,
                    'year'      => $current->year,
                ],
                [
                    'team_id'   => $member->team_id,
                    'user_id'   => $member->user_id,
                    'amount'    => $monthlyAmount,
                    'due_date'  => $dueDate,
                    'status'    => $dueDate->isPast() ? 'overdue' : 'pending',
                ]
            );

            $current->addMonth();
        }
    }

    /**
     * Get current month payment status for a member
     */
    public static function getCurrentMonthStatus(int $memberId): ?self
    {
        return self::where('member_id', $memberId)
            ->where('month', now()->month)
            ->where('year', now()->year)
            ->first();
    }

    /**
     * Get next due payment for a member
     */
    public static function getNextDue(int $memberId): ?self
    {
        return self::where('member_id', $memberId)
            ->where('status', '!=', 'paid')
            ->orderBy('year')
            ->orderBy('month')
            ->first();
    }
}