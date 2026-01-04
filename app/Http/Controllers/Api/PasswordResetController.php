<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PasswordResetCustom;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    /**
     * Create password reset token for email
     */
    public function createPasswordResetForEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $email = $request->email;

        // Find user
        $user = User::where('email', $email)->first();

        // Generic response to avoid leaking whether email exists
        if (!$user) {
            return response()->json([
                'success' => true,
                'message' => 'If the email exists, a password reset link has been sent',
            ]);
        }

        // Generate token
        $token = Str::random(64);
        $tokenHash = hash('sha256', $token);
        $expiresAt = now()->addHour();

        // Create password reset record
        PasswordResetCustom::create([
            'user_id' => $user->id,
            'token_hash' => $tokenHash,
            'expires_at' => $expiresAt,
            'used' => false,
        ]);

        // TODO: Send email with reset link
        // For development, log the token
        Log::info("Password reset token for {$email}: {$token}");
        
        // In production, send email like:
        // Mail::to($email)->send(new PasswordResetMail($token));

        return response()->json([
            'success' => true,
            'message' => 'If the email exists, a password reset link has been sent',
            'token' => config('app.env') !== 'production' ? $token : null, // Only for development
        ]);
    }

    /**
     * Reset password with token
     */
    public function resetPasswordWithToken(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8',
        ]);

        $email = $request->email;
        $token = $request->token;
        $newPassword = $request->password;

        // Find user
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid token or email',
            ], 400);
        }

        // Hash token
        $tokenHash = hash('sha256', $token);

        // Find password reset record
        $passwordReset = PasswordResetCustom::where('user_id', $user->id)
            ->where('token_hash', $tokenHash)
            ->latest()
            ->first();

        if (!$passwordReset) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid token or email',
            ], 400);
        }

        if ($passwordReset->used) {
            return response()->json([
                'success' => false,
                'message' => 'Token already used',
            ], 400);
        }

        if ($passwordReset->isExpired()) {
            return response()->json([
                'success' => false,
                'message' => 'Token expired',
            ], 400);
        }

        // Update user password
        $user->update([
            'password' => Hash::make($newPassword),
        ]);

        // Mark token as used
        $passwordReset->update(['used' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully',
        ]);
    }
}
