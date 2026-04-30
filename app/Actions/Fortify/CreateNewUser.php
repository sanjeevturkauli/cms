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
            'team_code' => ['required_if:user_type,member', 'string', 'size:8', 'exists:teams,team_id'],
        ];

        Validator::make($input, $rules)->validate();

        if (($input['user_type'] ?? null) === 'member') {
            $team = Team::where('team_id', $input['team_code'])->isActive()->isApproved()->first();

            if (!$team) {
                throw ValidationException::withMessages([
                    'team_code' => 'This team is not available right now. Please contact the team administrator for help.',
                ]);
            }
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
                $team = Team::where('team_id', $input['team_code'])->where('is_active', true)->where('status', 'approved')->first();

                if (!$team) {
                    throw ValidationException::withMessages([
                        'team_code' => 'This team is not available right now. Please contact the team administrator for help.',
                    ]);
                }

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
