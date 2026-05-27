import React from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, CreditCard, Bell, BarChart3, Package } from 'lucide-react';

export default function Features() {
    const features = [
        {
            icon: Users,
            title: 'Team Management',
            description: 'Create and manage multiple teams with custom roles, permissions, and hierarchies.',
            gradient: 'from-blue-500 to-cyan-500',
        },
        {
            icon: UserCheck,
            title: 'Member Management',
            description: 'Add, track, and organize members with detailed profiles and activity monitoring.',
            gradient: 'from-purple-500 to-pink-500',
        },
        {
            icon: CreditCard,
            title: 'Payment Tracking',
            description: 'Monitor all payments, dues, and transactions in real-time with detailed history.',
            gradient: 'from-green-500 to-emerald-500',
        },
        {
            icon: Bell,
            title: 'Smart Reminders',
            description: 'Automated payment reminders and notifications to keep everyone on track.',
            gradient: 'from-orange-500 to-red-500',
        },
        {
            icon: BarChart3,
            title: 'Analytics Dashboard',
            description: 'Comprehensive insights with charts, reports, and performance metrics.',
            gradient: 'from-indigo-500 to-blue-500',
        },
        {
            icon: Package,
            title: 'Subscription Management',
            description: 'Flexible packages with custom limits, features, and billing cycles.',
            gradient: 'from-pink-500 to-rose-500',
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6 },
        },
    };

    return (
        <section id="features" className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
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
                        className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4"
                    >
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            POWERFUL FEATURES
                        </span>
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Everything You Need to
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {' '}Manage Communities
                        </span>
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                        Comprehensive tools designed to streamline your community and payment management workflow
                    </p>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            whileHover={{ y: -10, scale: 1.02 }}
                            className="group relative"
                        >
                            <div className="relative h-full p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300">
                                {/* Gradient Border on Hover */}
                                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                                
                                {/* Icon */}
                                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.gradient} mb-6`}>
                                    <feature.icon className="w-6 h-6 text-white" />
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {feature.description}
                                </p>

                                {/* Hover Arrow */}
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    whileHover={{ opacity: 1, x: 0 }}
                                    className="mt-4 flex items-center text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                                >
                                    Learn more →
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
