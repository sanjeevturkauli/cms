<?php

namespace App\Actions\Fortify;

use App\Models\Member;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use Spatie\Permission\Models\Role;
use Illuminate\Validation\ValidationException;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class),
            ],
            'password' => $this->passwordRules(),
            'user_type' => ['required', 'in:team,member'],
        ];

        // Add conditional validation based on user type
        if (isset($input['user_type'])) {
            if ($input['user_type'] === 'team') {
                $rules['team_name'] = ['required', 'string', 'max:255'];
            } elseif ($input['user_type'] === 'member') {
                $rules['team_code'] = [
                    'required',
                    'string',
                    'size:8',
                    'exists:teams,team_id'
                ];
            }
        }

        Validator::make($input, $rules)->validate();

        // 👇 Extra validation for member team
        if (($input['user_type'] ?? null) === 'member') {
            $team = Team::where('team_id', $input['team_code'])->where('is_active', true)->first();

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
                Team::create([
                    'user_id' => $user->id,
                    'name' => $input['team_name'],
                ]);

                $teamRole = Role::firstOrCreate(['name' => 'team']);
                $user->assignRole($teamRole);
            } else {
                $team = Team::where('team_id', $input['team_code'])->first();

                Member::create([
                    'user_id' => $user->id,
                    'team_id' => $team->id,
                ]);

                $memberRole = Role::firstOrCreate(['name' => 'member']);
                $user->assignRole($memberRole);
            }

            return $user;
        });
    }
}
