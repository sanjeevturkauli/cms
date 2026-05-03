<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class Kyc extends Model
{
    protected $table = 'kyc';

    protected $fillable = [
        'user_id',
        'identity_type',
        'identity_number',
        'identity_image',
        'pan_card_image',
        'pan_number',
        'status',
        'reason',
        'approved_date',
        'approved_by',
        'country',
        'state',
        'city',
        'area',
        'full_address',
        'pincode',
        'date_of_birth',
        'gender',
        'father_name',
        'mother_name',
        'occupation',
        'annual_income',
        'identity_verified',
        'pan_verified',
        'address_verified',
        'is_complete',
        'submitted_at',
        'verified_at',
    ];

    protected $casts = [
        'approved_date' => 'datetime',
        'date_of_birth' => 'date',
        'annual_income' => 'decimal:2',
        'identity_verified' => 'boolean',
        'pan_verified' => 'boolean',
        'address_verified' => 'boolean',
        'is_complete' => 'boolean',
        'submitted_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    protected $attributes = [
        'status' => 'pending',
        'identity_verified' => false,
        'pan_verified' => false,
        'address_verified' => false,
        'is_complete' => false,
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function approve($adminId, $reason = null): bool
    {
        $oldStatus = $this->status;
        $result = $this->update([
            'status' => 'approved',
            'approved_by' => $adminId,
            'approved_date' => Carbon::now(),
            'verified_at' => Carbon::now(),
            'reason' => $reason,
            'identity_verified' => true,
            'pan_verified' => true,
            'address_verified' => true,
        ]);

        if ($result) {
            ActivityLog::log('kyc')
                ->performedOn($this)
                ->causedBy(\App\Models\User::find($adminId))
                ->event('approved')
                ->withProperties([
                    'old_status' => $oldStatus,
                    'new_status' => 'approved',
                    'reason' => $reason,
                    'admin_id' => $adminId,
                ])
                ->log("KYC application approved by admin");
        }

        return $result;
    }

    public function reject($adminId, $reason): bool
    {
        $oldStatus = $this->status;
        $result = $this->update([
            'status' => 'rejected',
            'approved_by' => $adminId,
            'approved_date' => Carbon::now(),
            'reason' => $reason,
        ]);

        if ($result) {
            ActivityLog::log('kyc')
                ->performedOn($this)
                ->causedBy(\App\Models\User::find($adminId))
                ->event('rejected')
                ->withProperties([
                    'old_status' => $oldStatus,
                    'new_status' => 'rejected',
                    'reason' => $reason,
                    'admin_id' => $adminId,
                ])
                ->log("KYC application rejected by admin: {$reason}");
        }

        return $result;
    }

    public function getStatusBadgeAttribute(): array
    {
        return match ($this->status) {
            'pending' => ['class' => 'bg-gray-100 text-gray-800', 'text' => 'Pending'],
            'submitted' => ['class' => 'bg-blue-100 text-blue-800', 'text' => 'Submitted'],
            'approved' => ['class' => 'bg-green-100 text-green-800', 'text' => 'Approved'],
            'rejected' => ['class' => 'bg-red-100 text-red-800', 'text' => 'Rejected'],
            default => ['class' => 'bg-gray-100 text-gray-800', 'text' => 'Unknown'],
        };
    }

    public function getCompletionPercentageAttribute(): int
    {
        $fields = [
            'identity_type',
            'identity_number',
            'identity_image',
            'pan_number',
            'pan_card_image',
            'country',
            'state',
            'city',
            'full_address',
            'date_of_birth',
            'gender',
        ];

        $completed = 0;
        foreach ($fields as $field) {
            if (!empty($this->$field)) {
                $completed++;
            }
        }

        return round(($completed / count($fields)) * 100);
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeComplete($query)
    {
        return $query->where('is_complete', true);
    }

    public function scopeVerified($query)
    {
        return $query
            ->where('identity_verified', true)
            ->where('pan_verified', true)
            ->where('address_verified', true);
    }

    public function submit(): bool
    {
        $oldStatus = $this->status;
        $result = $this->update([
            'status' => 'submitted',
            'submitted_at' => Carbon::now(),
            'is_complete' => $this->checkCompleteness(),
        ]);

        if ($result) {
            ActivityLog::log('kyc')
                ->performedOn($this)
                ->causedBy($this->user)
                ->event('submitted')
                ->withProperties([
                    'old_status' => $oldStatus,
                    'new_status' => 'submitted',
                    'completion_percentage' => $this->completion_percentage,
                ])
                ->log("KYC application submitted by user");
        }

        return $result;
    }

    private function checkCompleteness(): bool
    {
        $required = [
            'identity_type',
            'identity_number',
            'identity_image',
            'pan_number',
            'pan_card_image',
            'country',
            'state',
            'city',
            'full_address',
        ];

        foreach ($required as $field) {
            if (empty($this->$field)) {
                return false;
            }
        }

        return true;
    }
}
