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
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or tampered token',
                ], Response::HTTP_BAD_REQUEST);
            }

            if (empty($decryptData['id']) || empty($decryptData['email'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid payload data',
                ], Response::HTTP_BAD_REQUEST);
            }

            $otp = Otp::where('user_id', $decryptData['id'])->where('code', $validated['code'])->where('used', false)->latest()->first();

            if (!$otp) {
                return response()->json(['success' => false, 'message' => 'Invalid OTP',], Response::HTTP_BAD_REQUEST);
            }

            if ($otp->isExpired()) {
                return response()->json(['success' => false, 'message' => 'OTP expired',], Response::HTTP_BAD_REQUEST);
            }

            DB::beginTransaction();

            $otp->delete();

            $user = User::where('id', $decryptData['id'])->where('email', $decryptData['email'])->first();

            if (!$user) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                ], Response::HTTP_NOT_FOUND);
            }

            if (is_null($user->email_verified_at)) {
                $user->update(['email_verified_at' => now()]);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            DB::commit();

            $cookie = cookie(
                'app_auth_token',
                $token,
                60 * 24 * 7,
                '/',
                null,
                true,
                true
            );


            // return $this->response(
            //     Response::HTTP_OK,
            //     'OTP verified successfully.',
            //     [
            //         'user'              => formatUser($user),
            //         'token'             => $token,
            //         'token_type'        => 'Bearer',
            //         'needsVerification' => false,
            //     ]
            // );

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'token' => $token,
                    'token_type' => 'Bearer',
                    'user' => formatUser($user),
                ],
            ])->withCookie($cookie);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Something went wrong. Please try again.',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
