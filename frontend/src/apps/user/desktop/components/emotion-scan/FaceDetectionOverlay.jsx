import React, { memo, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const FaceDetectionOverlay = memo(({ isActive }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!isActive || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Mock face detection animation
        const animate = () => {
            if (!isActive) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw face detection frame
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const faceSize = 180;

            // Animated face outline
            const time = Date.now() * 0.005;
            const pulse = Math.sin(time) * 0.1 + 0.9;

            ctx.strokeStyle = `rgba(59, 130, 246, ${pulse})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 5]);
            ctx.lineDashOffset = -time * 20;

            ctx.beginPath();
            ctx.ellipse(centerX, centerY, faceSize * pulse, faceSize * 1.2 * pulse, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Draw corner brackets
            const bracketSize = 20;
            const bracketOffset = faceSize + 10;

            ctx.setLineDash([]);
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
            ctx.lineWidth = 2;

            // Top-left
            ctx.beginPath();
            ctx.moveTo(centerX - bracketOffset, centerY - bracketOffset + bracketSize);
            ctx.lineTo(centerX - bracketOffset, centerY - bracketOffset);
            ctx.lineTo(centerX - bracketOffset + bracketSize, centerY - bracketOffset);
            ctx.stroke();

            // Top-right
            ctx.beginPath();
            ctx.moveTo(centerX + bracketOffset - bracketSize, centerY - bracketOffset);
            ctx.lineTo(centerX + bracketOffset, centerY - bracketOffset);
            ctx.lineTo(centerX + bracketOffset, centerY - bracketOffset + bracketSize);
            ctx.stroke();

            // Bottom-left
            ctx.beginPath();
            ctx.moveTo(centerX - bracketOffset, centerY + bracketOffset - bracketSize);
            ctx.lineTo(centerX - bracketOffset, centerY + bracketOffset);
            ctx.lineTo(centerX - bracketOffset + bracketSize, centerY + bracketOffset);
            ctx.stroke();

            // Bottom-right
            ctx.beginPath();
            ctx.moveTo(centerX + bracketOffset - bracketSize, centerY + bracketOffset);
            ctx.lineTo(centerX + bracketOffset, centerY + bracketOffset);
            ctx.lineTo(centerX + bracketOffset, centerY + bracketOffset - bracketSize);
            ctx.stroke();

            requestAnimationFrame(animate);
        };

        animate();
    }, [isActive]);

    return (
        <div className="absolute inset-0 pointer-events-none">
            <canvas
                ref={canvasRef}
                width={320}
                height={240}
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Status indicators */}
            <div className="absolute top-4 left-4 right-4 flex justify-between">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.8 }}
                    className="glass glass-card px-3 py-2 rounded-lg"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-emerald-600">Face Detected</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.8 }}
                    className="glass glass-card px-3 py-2 rounded-lg"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-blue-600">Analyzing</span>
                    </div>
                </motion.div>
            </div>

            {/* Center guidance text */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 10 }}
                    className="glass glass-card px-4 py-2 rounded-lg"
                >
                    <p className="text-sm font-medium text-foreground">
                        Keep your face centered and maintain a neutral expression
                    </p>
                </motion.div>
            </div>

            {/* Quality indicators */}
            <div className="absolute bottom-4 left-4 right-4">
                <div className="flex justify-center gap-2">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.8 }}
                        className="flex items-center gap-1 glass glass-card px-2 py-1 rounded-full"
                    >
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        <span className="text-xs text-emerald-600">Good Lighting</span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.8 }}
                        className="flex items-center gap-1 glass glass-card px-2 py-1 rounded-full"
                    >
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        <span className="text-xs text-emerald-600">Clear View</span>
                    </motion.div>
                </div>
            </div>
        </div>
    );
});

FaceDetectionOverlay.displayName = 'FaceDetectionOverlay';

export default FaceDetectionOverlay;