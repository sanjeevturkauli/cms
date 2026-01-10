<?php

use Illuminate\Support\Facades\Storage;


if (!function_exists('render_file')) {
    function render_file($path, $folder = 'public', $type = 'public')
    {
        if ($type == 'public') {
            return asset($path);
        }
        return Storage::disk($folder)->url($path);
    }
}


if (!function_exists('uploadFile')) {
    function uploadFile($file, $folderName, $prefix = 'file', $oldFilePath = null)
    {
        if (!$file || !$file->isValid()) {
            throw new \InvalidArgumentException('Invalid file provided');
        }

        $destination = public_path($folderName);
        if (!file_exists($destination)) {
            mkdir($destination, 0777, true);
        }

        $filename = $prefix . "_" . time() . "_" . uniqid() . "." . $file->getClientOriginalExtension();

        $file->move($destination, $filename);

        if ($oldFilePath && file_exists(public_path($oldFilePath))) {
            @unlink(public_path($oldFilePath));
        }

        return $folderName . '/' . $filename;
    }
}

if (!function_exists('deleteFile')) {

    function deleteFile($filePath)
    {
        if (!$filePath) {
            return false;
        }

        $fullPath = public_path($filePath);

        if (file_exists($fullPath)) {
            return @unlink($fullPath);
        }

        return false;
    }
}

if (!function_exists('uploadMultipleFiles')) {

    function uploadMultipleFiles($files, $folderName, $prefix = 'file', $oldFilePaths = [])
    {
        if (!is_array($files)) {
            throw new \InvalidArgumentException('Files must be an array');
        }

        $uploadedPaths = [];

        if (!empty($oldFilePaths)) {
            foreach ($oldFilePaths as $oldPath) {
                deleteFile($oldPath);
            }
        }

        foreach ($files as $file) {
            if ($file && $file->isValid()) {
                $uploadedPaths[] = uploadFile($file, $folderName, $prefix);
            }
        }

        return $uploadedPaths;
    }
}

if (!function_exists('encrypt_with_key')) {
    function encrypt_with_key($data, string $key): string
    {
        $payload = json_encode($data);

        $cipher = "AES-256-CBC";
        $iv = random_bytes(openssl_cipher_iv_length($cipher));

        $encrypted = openssl_encrypt(
            $payload,
            $cipher,
            hash('sha256', $key, true),
            0,
            $iv
        );

        return base64_encode($iv . $encrypted);
    }
}

if (!function_exists('decrypt_with_key')) {
    function decrypt_with_key(string $encryptedData, string $key)
    {
        $cipher = "AES-256-CBC";
        $data = base64_decode($encryptedData);

        $ivLength = openssl_cipher_iv_length($cipher);
        $iv = substr($data, 0, $ivLength);
        $encrypted = substr($data, $ivLength);

        $decrypted = openssl_decrypt(
            $encrypted,
            $cipher,
            hash('sha256', $key, true),
            0,
            $iv
        );

        return json_decode($decrypted, true);
    }
}

if (!function_exists('generate_salt_key')) {
    function generate_salt_key(int $length = 32): string
    {
        return bin2hex(random_bytes($length / 2));
    }
}

if (!function_exists('get_key')) {
    function get_key($name = 'salt_key'): string
    {
        return config('app.' . $name);
    }
}

if (!function_exists('formatUser')) {
    function formatUser($user = null): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_active' => $user->is_active,
            'phone_number' => $user->phone_number,
            'is_mpin' => $user->mpin ? true : false,
            'role' => $user->getRoleNames()->first(),
            'created_at' => $user->created_at?->toIso8601String(),
            'updated_at' => $user->updated_at?->toIso8601String(),
            'profile_photo' => $user->profile_photo_path ? asset($user->profile_photo_path) : null,
        ];
    }
}
