<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Models\Team;
use App\Models\Member;
use App\Services\NotificationService;
use Illuminate\Support\Arr;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Traits\ResponseHandler;
use Illuminate\Http\JsonResponse;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Passport\Token;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public $OtpController;

    use ResponseHandler;

    public function __construct(OtpController $OtpController)
    {
        $this->OtpController = $OtpController;
    }

    // public function register(Request $request): JsonResponse
    // {
    //     $validator = Validator::make($request->all(), [
    //         'name' => ['required', 'string', 'max:255'],
    //         'type' => ['required', 'string', 'max:255'],
    //         'google_id' => ['nullable', 'string', 'max:255'],
    //         'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
    //         'password' => ['nullable', 'string'],
    //     ]);

    //     $validator->sometimes('password', ['required'], function ($input) {
    //         return $input->type === 'email';
    //     });

    //     $validator->sometimes('google_id', ['required'], function ($input) {
    //         return $input->type === 'google';
    //     });

    //     if ($validator->fails()) {
    //         return $this->response(422, $validator->errors()->first(), [], false);
    //     }

    //     $validatedData = $validator->validated();
    //     $data = array_map('trim', $validatedData);

    //     $user = User::create([
    //         'name' => $data['name'],
    //         'email' => $data['email'],
    //         'password' => isset($data['password']) ? Hash::make($data['password']) : null,
    //         'google_id' => $data['google_id'] ?? null,
    //     ]);

    //     $memberRole = Role::firstOrCreate(['name' => 'member']);
    //     $user->assignRole($memberRole);

    //     $token = $user->createToken('auth_token')->plainTextToken;

    //     return $this->response(Response::HTTP_CREATED, 'User registered successfully.', [
    //         'user' => $this->formatUser($user),
    //         'token' => $token,
    //         'token_type' => 'Bearer',
    //     ]);
    // }



    public function register(Request $request)
    {

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
            ],
            'type' => ['required', 'in:team,member'],
            'register_type' => ['required', 'in:email,google'],
            'password' => ['nullable', 'string'],
            'google_id' => ['nullable', 'string'],
        ];

        if ($request->register_type === 'email') {
            $rules['password'] = ['required', 'string', 'min:6'];
        }

        if ($request->register_type === 'google') {
            $rules['google_id'] = ['required', 'string'];
        }

        if ($request->type === 'team') {
            $rules['team_name'] = ['required', 'string', 'max:255'];
        }

        if ($request->type === 'member') {
            $rules['team_code'] = [
                'required',
                'string',
                'size:8',
                function ($attribute, $value, $fail) {
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
            ];
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return $this->response(
                Response::HTTP_UNPROCESSABLE_ENTITY,
                $validator->errors()->first(),
                [],
                false
            );
        }

        $data = array_map('trim', $validator->validated());

        try {

            $user = DB::transaction(function () use ($data) {
                $user = User::create([
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'password' => $data['register_type'] === 'email' ? Hash::make($data['password']) : null,
                    'google_id' => $data['register_type'] === 'google' ? $data['google_id'] : null,
                    'is_active' => true,
                ]);

                if ($data['type'] === 'team') {
                    $team = Team::create([
                        'user_id' => $user->id,
                        'name' => $data['team_name'],
                    ]);

                    NotificationService::notifyNewTeam($team);
                    
                    $teamRole = Role::firstOrCreate(['name' => 'team']);
                    $user->assignRole($teamRole);
                    
                } elseif ($data['type'] === 'member') {
                    $team = Team::where('team_id', $data['team_code'])->first();
                    
                    $member = Member::create([
                        'user_id' => $user->id,
                        'team_id' => $team->id,
                    ]);
                    
                    NotificationService::notifyNewMember($member);

                    $memberRole = Role::firstOrCreate(['name' => 'member']);
                    $user->assignRole($memberRole);
                }

                return $user;
            });

            $token = $user->createToken('API Token')->accessToken;


            if (is_null($user->email_verified_at)) {
                $this->OtpController->createOtpForUser($user);
                $payload = ['email' => $user->email, 'id' => $user->id];

                $otpToken = encrypt_with_key($payload,  get_key('salt_key'));
                return $this->response(Response::HTTP_OK, 'Please verify your email to continue.', [
                    'needsVerification' => true,
                    'otp_token' => $otpToken,
                ], true);
            }

            $successMessage = $data['type'] === 'team' 
                ? 'Team registered successfully.' 
                : 'Member registered successfully.';

            $responseData = [
                'user' => $this->formatUser($user),
                'token' => $token,
                'token_type' => 'Bearer',
            ];

            if ($data['type'] === 'team') {
                $team = Team::where('user_id', $user->id)->latest()->first();
                $responseData['team'] = [
                    'id' => $team->id,
                    'name' => $team->name,
                    'team_id' => $team->team_id,
                    'status' => $team->status,
                ];
            }

            return $this->response(
                Response::HTTP_CREATED,
                $successMessage,
                $responseData
            );
        } catch (ValidationException $e) {

            return $this->response(
                Response::HTTP_UNPROCESSABLE_ENTITY,
                $e->getMessage(),
                [],
                false
            );
        }
    }


    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'nullable|string',
            'type' => 'required|string|in:email,google',
            'google_id' => 'nullable|string',
        ]);

        $validator->sometimes('google_id', 'required', function ($input) {
            return $input->type === 'google';
        });

        $validator->sometimes('password', 'required', function ($input) {
            return $input->type === 'email';
        });

        if ($validator->fails()) {
            return $this->response(422, $validator->errors()->first(), [], false);
        }

        $credentials = $validator->validated();

        if ($request->type === 'email') {
            $emailCreds = Arr::only($credentials, ['email', 'password']);
            if (!Auth::attempt($emailCreds)) {
                return $this->response(
                    Response::HTTP_UNAUTHORIZED,
                    'Invalid email or password.',
                    [],
                    false
                );
            }
            $user = Auth::user();
        } elseif ($request->type === 'google') {
            $user = User::where('email', $credentials['email'])->first();

            if (!$user) {
                return $this->response(
                    Response::HTTP_UNAUTHORIZED,
                    'User not found. Please register first.',
                    [],
                    false
                );
            }

            if (!$user->google_id) {
                return $this->response(
                    Response::HTTP_UNAUTHORIZED,
                    'This account is not linked with Google login.',
                    [],
                    false
                );
            }

            if ($user->google_id !== $credentials['google_id']) {
                return $this->response(
                    Response::HTTP_UNAUTHORIZED,
                    'Invalid Google login credentials.',
                    [],
                    false
                );
            }

            Auth::login($user);
        }

        if (!$user->hasRole('member')) {
            Auth::logout();
            return $this->response(
                Response::HTTP_FORBIDDEN,
                'Access denied. Only members are allowed to login.',
                [],
                false
            );
        }

        if (!$user->hasRole('admin') && !$user->is_active) {
            Auth::logout();
            return $this->response(
                Response::HTTP_FORBIDDEN,
                'Your account is inactive. Please contact administrator.',
                [],
                false
            );
        }


        $token = $user->createToken('API Token')->accessToken;

        if (is_null($user->email_verified_at)) {
            $this->OtpController->createOtpForUser($user);
            $payload = ['email' => $user->email, 'id' => $user->id];

            $otpToken = encrypt_with_key($payload,  get_key('salt_key'));
            return $this->response(Response::HTTP_OK, 'Please verify your email to continue.', [
                'needsVerification' => true,
                'otp_token' => $otpToken,
            ], true);
        }

        return $this->response(Response::HTTP_OK, 'User logged in successfully.', [
            'user' => $this->formatUser($user),
            'token' => $token,
            'needsVerification' => false,
            'token_type' => 'Bearer',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        try {
            $user = Auth::guard('api')->user();
            
            if (!$user) {
                return $this->response(401, 'User not authenticated.', [], false);
            }

            // Get the current access token and revoke it
            $tokenId = $user->token()->id;
            
            // Revoke the current token
            $user->tokens()->where('id', $tokenId)->update(['revoked' => true]);

            return $this->response(200, 'Logged out successfully.', [], true);
        } catch (\Exception $e) {
            return $this->response(500, 'Logout unsuccessful: ' . $e->getMessage(), [], false);
        }
    }

    public function profile(Request $request): JsonResponse
    {
        try {
            $user = Auth::guard('api')->user();

            if (!$user) {
                return $this->response(401, 'User not authenticated.', [], false);
            }

            if ($request->isMethod('post')) {
                if ($request->has('name') && $request->filled('name')) {
                    $user->name = $request->name;
                }
                if ($request->has('phone_number') && $request->filled('phone_number')) {
                    $user->mobile = $request->phone_number;
                }

                if ($request->hasFile('profile')) {
                    try {
                        $filePath = uploadFile(
                            $request->file('profile'),
                            'profile-images',
                            'profile',
                            $user->profile_photo_path
                        );

                        $user->profile_photo_path = $filePath;
                    } catch (\Exception $e) {
                        Log::error('Profile photo upload failed: ' . $e->getMessage());
                    }
                }

                $user->save();
            }

            $msg = $request->isMethod('post') ? 'Profile update successfully' : 'Profile fetched successfully';

            return $this->response(200, $msg, $this->formatUser($user), true);
        } catch (\Throwable $th) {
            return $this->response(500, $th->getMessage(), [], false);
        }
    }

    protected function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_active' => $user->is_active,
            'phone_number' => $user->mobile,
            'is_mpin' => $user->mpin ? true : false,
            'role' => $user->getRoleNames()->first(),
            'created_at' => $user->created_at?->toIso8601String(),
            'updated_at' => $user->updated_at?->toIso8601String(),
            'profile_photo' => $user->profile_photo_path ? asset($user->profile_photo_path) : null,
        ];
    }
}
