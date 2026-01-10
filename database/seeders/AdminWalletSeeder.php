<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Wallet;

class AdminWalletSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        // Find admin user and create wallet if doesn't exist
        $admin = User::whereHas('roles', function($query) {
            $query->where('name', 'admin');
        })->first();

        if ($admin && !$admin->wallet) {
            Wallet::create([
                'user_id' => $admin->id,
                'balance' => 0.00
            ]);
            $this->command->info('Created wallet for admin user.');
        } else if (!$admin) {
            $this->command->info('No admin user found.');
        } else {
            $this->command->info('Admin already has a wallet.');
        }
    }
}