import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, ShoppingCart, Users, CreditCard, Bell, CheckCircle } from 'lucide-react';

export default function Workflow() {
    const steps = [
        {
            icon: UserPlus,
            title: 'Team Registers',
            description: 'Create your team account in seconds with a simple registration process.',
            color: 'blue',
        },
        {
            icon: ShoppingCart,
            title: 'Purchase Package',
            description: 'Choose a subscription plan that fits your team size and requirements.',
            color: 'purple',
        },
        {
            icon: Users,
            title: 'Add Members',
            description: 'Invite and onboard team members with custom roles and permissions.',
            color: 'green',
        },
        {
            icon: CreditCard,
            title: 'Track Payments',
            description: 'Monitor all member payments, dues, and transaction history in real-time.',
            color: 'orange',
        },
        {
            icon: Bell,
            title: 'Send Reminders',
            description: 'Automated notifications keep members informed about upcoming payments.',
            color: 'pink',
        },
        {
            icon: CheckCircle,
            title: 'Stay Organized',
            description: 'Manage everything from a unified dashboard with powerful analytics.',
            color: 'indigo',
        },
    ];

    const colorMap = {
        blue: 'from-blue-500 to-cyan-500',
        purple: 'from-purple-500 to-pink-500',
        green: 'from-green-500 to-emerald-500',
        orange: 'from-orange-500 to-red-500',
        pink: 'from-pink-500 to-rose-500',
        indigo: 'from-indigo-500 to-blue-500',
    };

    return (
        <section id="workflow" className="py-20 bg-white dark:bg-gray-950 overflow-hidden">
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
                            HOW IT WORKS
                        </span>
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Get Started in
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {' '}6 Simple Steps
                        </span>
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                        From registration to full team management in minutes
                    </p>
                </motion.div>

                {/* Timeline */}
                <div className="relative">
                    {/* Connecting Line */}
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900 transform -translate-y-1/2" />

                    {/* Steps Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                whileHover={{ y: -10 }}
                                className="relative"
                            >
                                {/* Card */}
                                <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300">
                                    {/* Step Number */}
                                    {/* <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                                        {index + 1}
                                    </div> */}

                                    {/* Icon */}
                                    <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${colorMap[step.color]} mb-4`}>
                                        <step.icon className="w-8 h-8 text-white" />
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                        {step.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>

                                {/* Arrow for Desktop */}
                                {index < steps.length - 1 && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 + 0.3 }}
                                        className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10"
                                    >
                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                    className="text-center mt-16"
                >
                    <motion.a
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        href="/register"
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all"
                    >
                        Start Your Journey Today
                        <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </motion.a>
                </motion.div>
            </div>
        </section>
    );
}
