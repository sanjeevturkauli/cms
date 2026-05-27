import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

export default function Testimonials() {
    const testimonials = [
        {
            name: 'Rajesh Kumar',
            role: 'Team Lead, Tech Solutions',
            image: 'https://ui-avatars.com/api/?name=Rajesh+Kumar&background=3B82F6&color=fff',
            content: 'Community Manager has transformed how we handle our team payments. The automated reminders alone have saved us countless hours of manual follow-ups.',
            rating: 5,
        },
        {
            name: 'Priya Sharma',
            role: 'Operations Manager, StartupHub',
            image: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=8B5CF6&color=fff',
            content: 'The analytics dashboard gives us incredible insights into our community. We can now make data-driven decisions about our membership structure.',
            rating: 5,
        },
        {
            name: 'Amit Patel',
            role: 'Community Director, NGO Connect',
            image: 'https://ui-avatars.com/api/?name=Amit+Patel&background=10B981&color=fff',
            content: 'Managing 500+ members was a nightmare before. Now everything is streamlined, organized, and automated. Best investment we made this year!',
            rating: 5,
        },
        {
            name: 'Sneha Reddy',
            role: 'Founder, Women Entrepreneurs Network',
            image: 'https://ui-avatars.com/api/?name=Sneha+Reddy&background=F59E0B&color=fff',
            content: 'The subscription management feature is brilliant. We can easily track who has paid, who hasn\'t, and send reminders automatically. Game changer!',
            rating: 5,
        },
        {
            name: 'Vikram Singh',
            role: 'Admin, Sports Club Federation',
            image: 'https://ui-avatars.com/api/?name=Vikram+Singh&background=EF4444&color=fff',
            content: 'Customer support is exceptional. They helped us migrate all our data seamlessly and trained our team. Highly recommended for any community!',
            rating: 5,
        },
        {
            name: 'Ananya Iyer',
            role: 'Director, Educational Trust',
            image: 'https://ui-avatars.com/api/?name=Ananya+Iyer&background=EC4899&color=fff',
            content: 'The mobile app makes it easy for our members to track their payments on the go. The interface is intuitive and beautifully designed.',
            rating: 5,
        },
    ];

    return (
        <section id="testimonials" className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
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
                        className="inline-block px-4 py-2 bg-pink-100 dark:bg-pink-900/30 rounded-full mb-4"
                    >
                        <span className="text-sm font-semibold text-pink-600 dark:text-pink-400">
                            TESTIMONIALS
                        </span>
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Loved by
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {' '}Thousands of Teams
                        </span>
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                        See what our customers have to say about their experience
                    </p>
                </motion.div>

                {/* Testimonials Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            whileHover={{ y: -10, scale: 1.02 }}
                            className="relative group"
                        >
                            {/* Card */}
                            <div className="relative h-full p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300">
                                {/* Quote Icon */}
                                <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Quote className="w-16 h-16 text-blue-600" />
                                </div>

                                {/* Rating */}
                                <div className="flex items-center space-x-1 mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>

                                {/* Content */}
                                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed relative z-10">
                                    "{testimonial.content}"
                                </p>

                                {/* Author */}
                                <div className="flex items-center space-x-4">
                                    <motion.img
                                        whileHover={{ scale: 1.1 }}
                                        src={testimonial.image}
                                        alt={testimonial.name}
                                        className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-700"
                                    />
                                    <div>
                                        <div className="font-semibold text-gray-900 dark:text-white">
                                            {testimonial.name}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            {testimonial.role}
                                        </div>
                                    </div>
                                </div>

                                {/* Gradient Border on Hover */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                    className="text-center mt-12"
                >
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Join thousands of satisfied teams worldwide
                    </p>
                    <motion.a
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        href="/register"
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all"
                    >
                        Start Your Free Trial
                        <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </motion.a>
                </motion.div>
            </div>
        </section>
    );
}
