import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkles } from 'lucide-react';

export default function Hero() {
    return (
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20" />
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center lg:text-left"
                    >
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6"
                        >
                            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                Trusted by 10,000+ Teams
                            </span>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
                        >
                            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Smart Community
                            </span>
                            <br />
                            <span className="text-gray-900 dark:text-white">
                                & Payment Management
                            </span>
                        </motion.h1>

                        {/* Subheadline */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto lg:mx-0"
                        >
                            Manage teams, members, subscriptions, and payments effortlessly with a powerful all-in-one community management solution.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                        >
                            <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href="/register"
                                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all flex items-center justify-center space-x-2"
                            >
                                <span>Get Started Free</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </motion.a>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 border border-gray-200 dark:border-gray-700"
                            >
                                <Play className="w-5 h-5" />
                                <span>View Demo</span>
                            </motion.button>
                        </motion.div>

                        {/* Trust Indicators */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="mt-8 flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-600 dark:text-gray-400"
                        >
                            <div className="flex items-center space-x-1">
                                <span className="text-yellow-500">★★★★★</span>
                                <span className="ml-2">4.9/5 Rating</span>
                            </div>
                            <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
                            <span>No credit card required</span>
                        </motion.div>
                    </motion.div>

                    {/* Right - Dashboard Mockup */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="relative"
                    >
                        <motion.div
                            animate={{ y: [0, -20, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="relative"
                        >
                            {/* Main Dashboard Card */}
                            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg" />
                                        <div>
                                            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                                            <div className="h-2 w-16 bg-gray-100 dark:bg-gray-800 rounded mt-2" />
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
                                            <div className="h-2 w-16 bg-gray-300 dark:bg-gray-600 rounded mb-3" />
                                            <div className="h-6 w-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded" />
                                        </div>
                                    ))}
                                </div>

                                {/* Chart */}
                                <div className="h-40 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 flex items-end justify-between">
                                    {[40, 70, 45, 80, 60, 90, 75].map((height, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ height: 0 }}
                                            animate={{ height: `${height}%` }}
                                            transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
                                            className="w-8 bg-gradient-to-t from-blue-600 to-purple-600 rounded-t-lg"
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Floating Cards */}
                            <motion.div
                                animate={{ y: [0, -10, 0], rotate: [0, 2, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -top-6 -right-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 border border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
                                        ✓
                                    </div>
                                    <div>
                                        <div className="h-2 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                                        <div className="h-3 w-16 bg-green-500 rounded" />
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, 10, 0], rotate: [0, -2, 0] }}
                                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 border border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-500 rounded-lg" />
                                    <div>
                                        <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                                        <div className="h-3 w-20 bg-blue-500 rounded" />
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
