import React from 'react';
import { motion } from 'framer-motion';

export default function FloatingElements() {
    const circles = [
        { size: 300, color: 'from-blue-400/20 to-purple-400/20', duration: 20, delay: 0, x: '10%', y: '20%' },
        { size: 400, color: 'from-purple-400/20 to-pink-400/20', duration: 25, delay: 2, x: '80%', y: '60%' },
        { size: 250, color: 'from-pink-400/20 to-blue-400/20', duration: 22, delay: 4, x: '70%', y: '10%' },
        { size: 350, color: 'from-blue-400/20 to-cyan-400/20', duration: 28, delay: 1, x: '20%', y: '70%' },
    ];

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {circles.map((circle, index) => (
                <motion.div
                    key={index}
                    className={`absolute rounded-full bg-gradient-to-br ${circle.color} blur-3xl`}
                    style={{
                        width: circle.size,
                        height: circle.size,
                        left: circle.x,
                        top: circle.y,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        x: [0, 30, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: circle.duration,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: circle.delay,
                    }}
                />
            ))}
        </div>
    );
}
