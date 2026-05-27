import React from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Star, Crown } from 'lucide-react';

export default function Pricing() {
    const plans = [
        {
            name: 'Starter',
            icon: Zap,
            price: '999',
            period: 'month',
            description: 'Perfect for small teams getting started',
            features: [
                'Up to 50 members',
                'Basic payment tracking',
                'Email notifications',
                'Monthly reports',
                'Community support',
                'Mobile app access',
            ],
            popular: false,
            gradient: 'from-blue-600 to-cyan-600',
        },
        {
            name: 'Professional',
            icon: Star,
            price: '2,499',
            period: 'month',
            description: 'Best for growing teams and organizations',
            features: [
                'Up to 200 members',
                'Advanced analytics',
                'SMS & Email reminders',
                'Custom branding',
                'Priority support',
                'API access',
                'Automated workflows',
                'Advanced reporting',
            ],
            popular: true,
            gradient: 'from-purple-600 to-pink-600',
        },
        {
            name: 'Enterprise',
            icon: Crown,
            price: 'Custom',
            period: '',
            description: 'For large organizations with custom needs',
            features: [
                'Unlimited members',
                'White-label solution',
                'Dedicated account manager',
                'Custom integrations',
                '24/7 phone support',
                'Advanced security',
                'Custom training',
                'SLA guarantee',
            ],
            popular: false,
            gradient: 'from-orange-600 to-red-600',
        },
    ];

    return (
        <section id="pricing" className="py-20 bg-white dark:bg-gray-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-block px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4"
                    >
                        <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                            PRICING PLANS
                        </span>
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Choose Your
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {' '}Perfect Plan
                        </span>
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                        Flexible pricing options designed to scale with your community
                    </p>
                </motion.div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            whileHover={{ y: -10, scale: 1.02 }}
                            className="relative"
                        >
                            {/* Popular Badge */}
                            {plan.popular && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.5 }}
                                    className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
                                >
                                    <div className={`px-4 py-1 bg-gradient-to-r ${plan.gradient} text-white text-sm font-semibold rounded-full shadow-lg`}>
                                        Most Popular
                                    </div>
                                </motion.div>
                            )}

                            {/* Card */}
                            <div className={`relative h-full p-8 bg-white dark:bg-gray-800 rounded-2xl border-2 ${
                                plan.popular 
                                    ? 'border-purple-600 dark:border-purple-500 shadow-2xl' 
                                    : 'border-gray-200 dark:border-gray-700 shadow-lg'
                            } transition-all duration-300`}>
                                {/* Glow Effect on Hover */}
                                {plan.popular && (
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300" />
                                )}

                                {/* Icon */}
                                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${plan.gradient} mb-4`}>
                                    <plan.icon className="w-6 h-6 text-white" />
                                </div>

                                {/* Plan Name */}
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    {plan.name}
                                </h3>

                                {/* Description */}
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    {plan.description}
                                </p>

                                {/* Price */}
                                <div className="mb-6">
                                    {plan.price === 'Custom' ? (
                                        <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                            Custom
                                        </div>
                                    ) : (
                                        <div className="flex items-baseline">
                                            <span className="text-gray-600 dark:text-gray-400 text-xl">₹</span>
                                            <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                {plan.price}
                                            </span>
                                            <span className="text-gray-600 dark:text-gray-400 ml-2">/{plan.period}</span>
                                        </div>
                                    )}
                                </div>

                                {/* CTA Button */}
                                <motion.a
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    href="/register"
                                    className={`block w-full py-3 px-6 rounded-xl font-semibold text-center mb-6 transition-all ${
                                        plan.popular
                                            ? `bg-gradient-to-r ${plan.gradient} text-white shadow-lg hover:shadow-xl`
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                                </motion.a>

                                {/* Features List */}
                                <ul className="space-y-3">
                                    {plan.features.map((feature, i) => (
                                        <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.5 + i * 0.05 }}
                                            className="flex items-start space-x-3"
                                        >
                                            <div className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r ${plan.gradient} flex items-center justify-center mt-0.5`}>
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                            <span className="text-gray-700 dark:text-gray-300">
                                                {feature}
                                            </span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom Note */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                    className="text-center mt-12"
                >
                    <p className="text-gray-600 dark:text-gray-400">
                        All plans include 14-day free trial • No credit card required • Cancel anytime
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
