import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState(0);

    const faqs = [
        {
            question: 'How does the free trial work?',
            answer: 'You get full access to all features for 14 days, no credit card required. After the trial, you can choose a plan that fits your needs or continue with our free tier with limited features.',
        },
        {
            question: 'Can I change my plan later?',
            answer: 'Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any charges or credits to your account.',
        },
        {
            question: 'What payment methods do you accept?',
            answer: 'We accept all major credit cards, debit cards, UPI, net banking, and digital wallets. For enterprise plans, we also offer invoice-based billing.',
        },
        {
            question: 'Is my data secure?',
            answer: 'Yes! We use bank-level encryption (256-bit SSL) to protect your data. All payment information is processed through PCI-compliant payment gateways. We never store sensitive payment details.',
        },
        {
            question: 'Can I import existing member data?',
            answer: 'Yes, we provide easy data import tools. You can upload CSV files or use our API for bulk imports. Our support team is available to help with data migration.',
        },
        {
            question: 'Do you offer customer support?',
            answer: 'We offer email and chat support for all plans. Professional and Enterprise plans get priority support with faster response times. Enterprise customers also get a dedicated account manager.',
        },
        {
            question: 'Can members access their payment history?',
            answer: 'Yes! Members get their own portal where they can view payment history, download receipts, track dues, and manage their profile information.',
        },
        {
            question: 'What happens if I cancel my subscription?',
            answer: 'You can cancel anytime. Your data remains accessible until the end of your billing period. After that, we keep your data for 30 days in case you want to reactivate. You can export all your data before canceling.',
        },
    ];

    return (
        <section id="faq" className="py-20 bg-white dark:bg-gray-950">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                            FAQ
                        </span>
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Frequently Asked
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {' '}Questions
                        </span>
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                        Everything you need to know about CommunityManager
                    </p>
                </motion.div>

                {/* FAQ Accordion */}
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.05 }}
                        >
                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden"
                            >
                                {/* Question */}
                                <button
                                    onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white pr-8">
                                        {faq.question}
                                    </span>
                                    <motion.div
                                        animate={{ rotate: openIndex === index ? 180 : 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="flex-shrink-0"
                                    >
                                        {openIndex === index ? (
                                            <Minus className="w-5 h-5 text-blue-600" />
                                        ) : (
                                            <Plus className="w-5 h-5 text-gray-400" />
                                        )}
                                    </motion.div>
                                </button>

                                {/* Answer */}
                                <AnimatePresence>
                                    {openIndex === index && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="px-6 pb-5 text-gray-600 dark:text-gray-400 leading-relaxed">
                                                {faq.answer}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>

                {/* Contact Support */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="mt-12 text-center p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-gray-200 dark:border-gray-700"
                >
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Still have questions?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Our support team is here to help you get started
                    </p>
                    <motion.a
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        href="mailto:support@communitymanager.com"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                        Contact Support
                        <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </motion.a>
                </motion.div>
            </div>
        </section>
    );
}
