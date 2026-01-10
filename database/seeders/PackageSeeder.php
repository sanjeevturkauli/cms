<?php

namespace Database\Seeders;

use App\Models\Package;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PackageSeeder extends Seeder
{
    public function run(): void
    {
        $packages = [
            [
                'name' => 'Basic',
                'price' => 1000.00,
                'person' => 5,
                'duration' => 1,
                'features' => [
                    'Up to 5 team members',
                    'Basic project management',
                    'Email support',
                    '10GB storage',
                    'Basic reporting'
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Silver',
                'price' => 2000.00,
                'person' => 15,
                'duration' => 2,
                'features' => [
                    'Up to 15 team members',
                    'Advanced project management',
                    'Priority email support',
                    '50GB storage',
                    'Advanced reporting',
                    'Custom workflows',
                    'API access'
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Gold',
                'price' => 5000.00,
                'person' => -1, // Unlimited
                'duration' => 3,
                'features' => [
                    'Unlimited team members',
                    'Enterprise project management',
                    '24/7 phone & email support',
                    '500GB storage',
                    'Enterprise reporting',
                    'Custom integrations',
                    'Full API access',
                    'Dedicated account manager',
                    'Custom branding',
                    'Advanced security features'
                ],
                'is_active' => true,
            ],
        ];

        foreach ($packages as $packageData) {
            Package::create($packageData);
        }
    }
}