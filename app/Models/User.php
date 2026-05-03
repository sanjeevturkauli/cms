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

    /**
     * Get user's KYC status for header display
     */
    public function getKycStatusForHeader(): array
    {
        $kyc = $this->kyc;

        // Use member routes if user ONLY has member role (not team role)
        $isMember = $this->hasRole('member') && !$this->hasRole('team');
        $kycCreateRoute = $isMember ? route('member.kyc.create') : route('team.kyc.create');
        $kycShowRoute   = $isMember ? route('member.kyc.show')   : route('team.kyc.show');

        if (!$kyc) {
            return [
                'status'    => 'pending',
                'text'      => 'KYC: Pending',
                'class'     => 'bg-gray-100 text-gray-800',
                'clickable' => true,
                'url'       => $kycCreateRoute,
            ];
        }

        $statusConfig = match ($kyc->status) {
            'pending' => [
                'text'      => 'KYC: Pending',
                'class'     => 'bg-gray-100 text-gray-800',
                'clickable' => true,
                'url'       => $kycCreateRoute,
            ],
            'submitted' => [
                'text'      => 'KYC: Submitted',
                'class'     => 'bg-blue-100 text-blue-800',
                'clickable' => true,
                'url'       => $kycShowRoute,
            ],
            'approved' => [
                'text'      => 'KYC: Approved',
                'class'     => 'bg-green-100 text-green-800',
                'clickable' => true,
                'url'       => $kycShowRoute,
            ],
            'rejected' => [
                'text'      => 'KYC: Rejected',
                'class'     => 'bg-red-100 text-red-800',
                'clickable' => true,
                'url'       => $kycCreateRoute,
            ],
            default => [
                'text'      => 'KYC: Unknown',
                'class'     => 'bg-gray-100 text-gray-800',
                'clickable' => true,
                'url'       => $kycCreateRoute,
            ]
        };

        return [
            'status' => $kyc->status,
            'reason' => $kyc->reason,
            ...$statusConfig,
        ];
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
            // Create wallet when user is created
            $user->wallet()->create([
                'balance' => 0.00
            ]);

            // Create KYC record when user is created
            $user->kyc()->create([
                'status' => 'pending',
                'identity_verified' => false,
                'pan_verified' => false,
                'address_verified' => false,
                'is_complete' => false,
            ]);
        });
    }
}
