<?php

namespace App\Http\Controllers\Api;

use App\Models\Otp;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Traits\ResponseHandler;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;

class OtpController extends Controller
{

    use ResponseHandler;

    public function generateUniqueId()
    {
        return 'uid_' . Str::uuid();
    }

    public function createOtpForUser(User $user)
    {
        $code = config('app.env') === 'production'
            ? str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT)
            : '123456';

        $expiresAt = now()->addMinutes(5);

        Otp::create([
            'user_id' => $user->id,
            'code' => $code,
            'expires_at' => $expiresAt,
            'used' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'OTP created successfully',
            'data' => [
                'code' => $code,
                'expires_at' => $expiresAt->toIso8601String(),
            ],
        ]);
    }


    public function verifyOtp(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'token' => 'required|string',
                'code'  => 'required|string|size:6',
            ]);

            if ($validator->fails()) {
                return $this->response(
                    Response::HTTP_UNPROCESSABLE_ENTITY,
                    $validator->errors()->first(),
                    [],
                    false
                );
            }

            $validated = $validator->validated();

            try {
                $decryptData = decrypt_with_key(
                    $validated['token'],
                    get_key('salt_key')
                );
            } catch (\Throwable $e) {
                return $this->response(
                    Response::HTTP_BAD_REQUEST,
                    'Invalid or tampered token',
                    [],
                    false
                );
            }

            if (empty($decryptData['id']) || empty($decryptData['email'])) {
                return $this->response(
                    Response::HTTP_BAD_REQUEST,
                    'Invalid payload data',
                    [],
                    false
                );
            }

            $otp = Otp::where('user_id', $decryptData['id'])->where('code', $validated['code'])->where('used', false)->latest()->first();

            if (!$otp) {
                return $this->response(Response::HTTP_BAD_REQUEST, 'Invalid OTP', [], false);
            }

            if ($otp->isExpired()) {
                return $this->response(Response::HTTP_BAD_REQUEST, 'OTP expired', [], false);
            }

            DB::beginTransaction();

            $otp->delete();

            $user = User::where('id', $decryptData['id'])->where('email', $decryptData['email'])->first();

            if (!$user) {
                DB::rollBack();
                return $this->response(
                    Response::HTTP_NOT_FOUND,
                    'User not found',
                    [],
                    false
                );
            }

            if ($user->email_verified_at === null) {
                $user->update(['email_verified_at' => now()]);
            }

            $token = $user->createToken('API Token')->accessToken;

            DB::commit();

            return $this->response(Response::HTTP_OK, 'Login successful', [
                'user' => $this->formatUser($user),
                'token' => $token,
                'token_type' => 'Bearer',
            ]);
        } catch (\Throwable $e) {
            report($e);
            return $this->response(
                Response::HTTP_INTERNAL_SERVER_ERROR,
                'Something went wrong. Please try again.',
                [],
                false
            );
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
