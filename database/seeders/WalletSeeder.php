<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Wallet;

class WalletSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        // Create wallets for existing users who don't have one
        $usersWithoutWallet = User::whereDoesntHave('wallet')->get();
        
        foreach ($usersWithoutWallet as $user) {
            Wallet::create([
                'user_id' => $user->id,
                'balance' => 0.00
            ]);
        }
        
        $this->command->info('Created wallets for ' . $usersWithoutWallet->count() . ' users.');
    }
}