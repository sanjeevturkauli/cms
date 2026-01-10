<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Setting;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        $settings = [
            // General Settings
            [
                'key' => 'site_name',
                'value' => 'CMS Application',
                'group' => 'general',
                'type' => 'text',
                'description' => 'Website name',
            ],
            [
                'key' => 'site_description',
                'value' => 'Content Management System',
                'group' => 'general',
                'type' => 'textarea',
                'description' => 'Website description',
            ],
            [
                'key' => 'maintenance_mode',
                'value' => '0',
                'group' => 'general',
                'type' => 'boolean',
                'description' => 'Enable maintenance mode',
            ],
            [
                'key' => 'cancellation_fee',
                'value' => '500',
                'group' => 'general',
                'type' => 'integer',
                'description' => 'Subscription cancellation fee (₹)',
            ],

            // Payment Settings - Stripe
            [
                'key' => 'stripe_enabled',
                'value' => '0',
                'group' => 'payment',
                'type' => 'boolean',
                'description' => 'Enable Stripe payment gateway',
            ],
            [
                'key' => 'stripe_public_key',
                'value' => '',
                'group' => 'payment',
                'type' => 'text',
                'description' => 'Stripe publishable key',
            ],
            [
                'key' => 'stripe_secret_key',
                'value' => '',
                'group' => 'payment',
                'type' => 'password',
                'description' => 'Stripe secret key',
            ],

            // Payment Settings - PayPal
            [
                'key' => 'paypal_enabled',
                'value' => '0',
                'group' => 'payment',
                'type' => 'boolean',
                'description' => 'Enable PayPal payment gateway',
            ],
            [
                'key' => 'paypal_client_id',
                'value' => '',
                'group' => 'payment',
                'type' => 'text',
                'description' => 'PayPal client ID',
            ],
            [
                'key' => 'paypal_secret',
                'value' => '',
                'group' => 'payment',
                'type' => 'password',
                'description' => 'PayPal secret key',
            ],
            [
                'key' => 'paypal_mode',
                'value' => 'sandbox',
                'group' => 'payment',
                'type' => 'select',
                'description' => 'PayPal mode (sandbox/live)',
            ],

            // Payment Settings - Razorpay
            [
                'key' => 'razorpay_enabled',
                'value' => '0',
                'group' => 'payment',
                'type' => 'boolean',
                'description' => 'Enable Razorpay payment gateway',
            ],
            [
                'key' => 'razorpay_key_id',
                'value' => '',
                'group' => 'payment',
                'type' => 'text',
                'description' => 'Razorpay key ID',
            ],
            [
                'key' => 'razorpay_key_secret',
                'value' => '',
                'group' => 'payment',
                'type' => 'password',
                'description' => 'Razorpay key secret',
            ],

            // Email Settings
            [
                'key' => 'mail_driver',
                'value' => 'smtp',
                'group' => 'email',
                'type' => 'select',
                'description' => 'Mail driver (smtp/sendmail/mailgun)',
            ],
            [
                'key' => 'mail_host',
                'value' => 'smtp.gmail.com',
                'group' => 'email',
                'type' => 'text',
                'description' => 'SMTP host',
            ],
            [
                'key' => 'mail_port',
                'value' => '587',
                'group' => 'email',
                'type' => 'integer',
                'description' => 'SMTP port',
            ],
            [
                'key' => 'mail_username',
                'value' => '',
                'group' => 'email',
                'type' => 'text',
                'description' => 'SMTP username',
            ],
            [
                'key' => 'mail_password',
                'value' => '',
                'group' => 'email',
                'type' => 'password',
                'description' => 'SMTP password',
            ],
            [
                'key' => 'mail_encryption',
                'value' => 'tls',
                'group' => 'email',
                'type' => 'select',
                'description' => 'Mail encryption (tls/ssl)',
            ],
            [
                'key' => 'mail_from_address',
                'value' => 'noreply@example.com',
                'group' => 'email',
                'type' => 'text',
                'description' => 'From email address',
            ],
            [
                'key' => 'mail_from_name',
                'value' => 'CMS Application',
                'group' => 'email',
                'type' => 'text',
                'description' => 'From name',
            ],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }

        $this->command->info('Created ' . count($settings) . ' settings.');
    }
}