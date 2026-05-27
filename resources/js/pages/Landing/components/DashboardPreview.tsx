import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, AlertCircle, Calendar, Activity } from 'lucide-react';

export default function DashboardPreview() {
    return (
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
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
                        className="inline-block px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full mb-4"
                    >
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                            POWERFUL DASHBOARD
                        </span>
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Complete Visibility at
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {' '}Your Fingertips
                        </span>
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                        Real-time insights, analytics, and monitoring tools to keep your community thriving
                    </p>
                </motion.div>

                {/* Dashboard Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="relative"
                >
                    {/* Main Dashboard Container */}
                    <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* Dashboard Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-1">Dashboard Overview</h3>
                                    <p className="text-blue-100">Welcome back, Team Admin</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-10 h-10 bg-white/20 rounded-lg backdrop-blur-sm" />
                                    <div className="w-10 h-10 bg-white/20 rounded-lg backdrop-blur-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Dashboard Content */}
                        <div className="p-6">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                {[
                                    { icon: DollarSign, label: 'Total Revenue', value: '₹2,45,000', change: '+12.5%', color: 'green' },
                                    { icon: Users, label: 'Active Members', value: '1,234', change: '+8.2%', color: 'blue' },
                                    { icon: AlertCircle, label: 'Pending Payments', value: '23', change: '-5.1%', color: 'orange' },
                                    { icon: TrendingUp, label: 'Growth Rate', value: '18.5%', change: '+3.2%', color: 'purple' },
                                ].map((stat, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{ y: -5 }}
                                        className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                                            <span className={`text-xs font-semibold text-${stat.color}-600`}>
                                                {stat.change}
                                            </span>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                            {stat.value}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                            {stat.label}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Charts Row */}
                            <div className="grid lg:grid-cols-2 gap-6 mb-6">
                                {/* Revenue Chart */}
                                <motion.div
                                    initial={{ opacity: 0, x: -50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">Revenue Analytics</h4>
                                        <Activity className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="h-48 flex items-end justify-between space-x-2">
                                        {[65, 45, 75, 55, 85, 70, 90, 60, 80, 70, 95, 85].map((height, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ height: 0 }}
                                                whileInView={{ height: `${height}%` }}
                                                viewport={{ once: true }}
                                                transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
                                                className="flex-1 bg-gradient-to-t from-blue-600 to-purple-600 rounded-t-lg min-w-0"
                                            />
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Member Activity */}
                                <motion.div
                                    initial={{ opacity: 0, x: 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">Member Activity</h4>
                                        <Users className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { name: 'New Members', value: 85, color: 'green' },
                                            { name: 'Active Members', value: 92, color: 'blue' },
                                            { name: 'Pending Approvals', value: 45, color: 'orange' },
                                            { name: 'Inactive Members', value: 12, color: 'red' },
                                        ].map((item, i) => (
                                            <div key={i}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}%</span>
                                                </div>
                                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: `${item.value}%` }}
                                                        viewport={{ once: true }}
                                                        transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                                                        className={`h-full bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 rounded-full`}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>

                            {/* Recent Activity */}
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">Recent Payments</h4>
                                    <Calendar className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { user: 'John Doe', amount: '₹5,000', status: 'Completed', time: '2 mins ago' },
                                        { user: 'Jane Smith', amount: '₹3,500', status: 'Pending', time: '15 mins ago' },
                                        { user: 'Mike Johnson', amount: '₹7,200', status: 'Completed', time: '1 hour ago' },
                                    ].map((payment, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.6 + i * 0.1 }}
                                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full" />
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">{payment.user}</div>
                                                    <div className="text-xs text-gray-500">{payment.time}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-gray-900 dark:text-white">{payment.amount}</div>
                                                <div className={`text-xs ${payment.status === 'Completed' ? 'text-green-600' : 'text-orange-600'}`}>
                                                    {payment.status}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Floating Notification Cards */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-6 -right-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 border border-gray-200 dark:border-gray-700 hidden lg:block"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">Payment Received</div>
                                <div className="text-xs text-gray-500">₹5,000 from John Doe</div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 border border-gray-200 dark:border-gray-700 hidden lg:block"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">New Member</div>
                                <div className="text-xs text-gray-500">Sarah joined your team</div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
