<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;
use Laravel\Passport\HasApiTokens;


class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable , HasRoles , HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'mobile',
        'email_verified_at',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function team()
    {
        return $this->hasOne(Team::class);
    }

    public function member()
    {
        return $this->hasOne(Member::class);
    }

     public function members()
    {
        return $this->hasMany(Member::class, 'user_id');
    }

    public function teams()
    {
        return $this->hasMany(Team::class, 'user_id');
    }

    public function hasMember(): bool
    {
        return $this->members()->exists();
    }

    public function hasTeam(): bool
    {
        return $this->teams()->exists();
    }

    public function mpin()
    {
        return $this->hasOne(Mpin::class);
    }

    public function kyc()
    {
        return $this->hasOne(Kyc::class);
    }

    public function wallet()
    {
        return $this->hasOne(Wallet::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    // Create wallet when user is created
    protected static function boot()
    {
        parent::boot();

        static::created(function ($user) {
            $user->wallet()->create([
                'balance' => 0.00
            ]);
        });
    }
}
