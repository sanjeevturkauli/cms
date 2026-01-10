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
        'person',
        'features',
        'duration',
        'is_active',
    ];

    protected $casts = [
        'features' => 'array',
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'duration' => 'integer',
        'person' => 'integer',
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
        return $this->duration . ' year' . ($this->duration > 1 ? 's' : '');
    }

    public function getFormattedPersonAttribute()
    {
        if ($this->person === -1 || $this->person >= 999) {
            return 'Unlimited';
        }
        
        return $this->person . ' person' . ($this->person > 1 ? 's' : '');
    }
}
