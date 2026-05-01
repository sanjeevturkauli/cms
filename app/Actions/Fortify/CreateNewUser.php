<?php

namespace App\Actions\Fortify;

use App\Models\Team;
use App\Models\User;
use App\Models\Member;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use Illuminate\Validation\ValidationException;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    public function create(array $input): User
    {

        $rules = [
            'password' => $this->passwordRules(),
            'name' => ['required', 'string', 'max:255'],
            'user_type' => ['required', 'in:team,member'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)],
            'team_name' => ['required_if:user_type,team', 'string', 'max:255'],
            'team_code' => [
                'required_if:user_type,member',
                'string',
                'size:8',
                function ($attribute, $value, $fail) {
                    if (!$value) return; // Skip if empty (handled by required_if)
                    
                    $team = Team::where('team_id', $value)->first();
                    
                    if (!$team) {
                        $fail('Invalid team code. Please check the team code and try again.');
                        return;
                    }
                    
                    if (!$team->is_active) {
                        $fail('This team is currently inactive. Please contact the team administrator.');
                        return;
                    }
                    
                    if ($team->status !== 'approved') {
                        $statusMessage = match($team->status) {
                            'pending' => 'This team is still pending approval. Please wait for admin approval.',
                            'rejected' => 'This team has been rejected. Please contact support for more information.',
                            default => 'This team is not available for new members at this time.',
                        };
                        $fail($statusMessage);
                        return;
                    }
                },
            ],
        ];

        Validator::make($input, $rules)->validate();

        if (($input['user_type'] ?? null) === 'member') {
            // Team validation is already done in the validation rules above
            $team = Team::where('team_id', $input['team_code'])->first();
        }

        return DB::transaction(function () use ($input) {
            $user = User::create([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
                'is_active' => true,
            ]);

            if (($input['user_type'] ?? null) === 'team') {
                $team = Team::create([
                    'user_id' => $user->id,
                    'name' => $input['team_name'],
                ]);

                // Trigger notification for new team
                \App\Services\NotificationService::notifyNewTeam($team);

                $teamRole = Role::firstOrCreate(['name' => 'team']);
                $user->assignRole($teamRole);
            } else {
                // Get the validated team (validation already done above)
                $team = Team::where('team_id', $input['team_code'])->first();

                $member = Member::create([
                    'user_id' => $user->id,
                    'team_id' => $team->id,
                ]);

                // Trigger notification for new member
                \App\Services\NotificationService::notifyNewMember($member);

                $memberRole = Role::firstOrCreate(['name' => 'member']);
                $user->assignRole($memberRole);
            }

            return $user;
        });
    }
}
