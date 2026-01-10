<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'wallet_id',
        'type',
        'amount',
        'description',
        'reference_type',
        'reference_id',
        'balance_before',
        'balance_after',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function wallet()
    {
        return $this->belongsTo(Wallet::class);
    }

    // Accessors
    public function getFormattedAmountAttribute()
    {
        return '₹' . number_format((float)$this->amount, 2);
    }

    public function getTypeColorAttribute()
    {
        return $this->type === 'credit' ? 'text-green-600' : 'text-red-600';
    }

    public function getTypeIconAttribute()
    {
        return $this->type === 'credit' ? '+' : '-';
    }
}