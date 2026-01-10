<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\SubscriptionLog;
use App\Models\User;
use App\Models\Team;
use App\Models\Subscription;

class SubscriptionLogSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        $user = User::first();
        
        if (!$user) {
            $this->command->info('No user found. Skipping log seeder.');
            return;
        }
        
        $team = Team::where('user_id', $user->id)->first();
        
        if (!$team) {
            $this->command->info('No team found. Skipping log seeder.');
            return;
        }
        
        $subscription = Subscription::where('team_id', $team->id)->first();
        
        if (!$subscription) {
            $this->command->info('No subscription found. Skipping log seeder.');
            return;
        }

        // Sample logs
        $logs = [
            [
                'user_id' => $user->id,
                'team_id' => $team->id,
                'subscription_id' => $subscription->id,
                'action' => 'new',
                'from_package' => null,
                'to_package' => 'Basic',
                'from_price' => null,
                'to_price' => 1000,
                'amount_charged' => 1000,
                'wallet_balance_before' => 0,
                'wallet_balance_after' => 0,
                'days_used' => null,
                'days_remaining' => null,
                'description' => 'New subscription to Basic package',
                'created_at' => now()->subDays(30),
                'updated_at' => now()->subDays(30),
            ],
            [
                'user_id' => $user->id,
                'team_id' => $team->id,
                'subscription_id' => $subscription->id,
                'action' => 'upgrade',
                'from_package' => 'Basic',
                'to_package' => 'Silver',
                'from_price' => 1000,
                'to_price' => 2000,
                'amount_charged' => 726,
                'wallet_balance_before' => 0,
                'wallet_balance_after' => 0,
                'days_used' => 100,
                'days_remaining' => 265,
                'description' => 'Upgraded to Silver package (pro-rated)',
                'created_at' => now()->subDays(15),
                'updated_at' => now()->subDays(15),
            ],
            [
                'user_id' => $user->id,
                'team_id' => $team->id,
                'subscription_id' => $subscription->id,
                'action' => 'downgrade',
                'from_package' => 'Silver',
                'to_package' => 'Basic',
                'from_price' => 2000,
                'to_price' => 1000,
                'amount_charged' => -500,
                'wallet_balance_before' => 0,
                'wallet_balance_after' => 500,
                'days_used' => 50,
                'days_remaining' => 315,
                'description' => 'Downgraded to Basic package. Refund added to wallet',
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(5),
            ],
        ];

        foreach ($logs as $log) {
            SubscriptionLog::create($log);
        }

        $this->command->info('Created ' . count($logs) . ' subscription logs.');
    }
}