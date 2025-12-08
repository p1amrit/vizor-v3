import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';
import { Video, Users, Zap, Hash } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();
    const [joinRoomId, setJoinRoomId] = useState('');

    const startMeeting = () => {
        const id = Math.random().toString(36).substring(2, 7);
        navigate(`/room/${id}`);
    };

    const joinMeeting = (e) => {
        e.preventDefault();
        if (joinRoomId) navigate(`/room/${joinRoomId}`);
    };

    return (
        <div className="flex flex-col min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-dark-800 via-dark-900 to-black overflow-hidden relative">
            {/* Background blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-vizor-500/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-vizor-accent/10 rounded-full blur-[100px] pointer-events-none" />

            <nav className="p-6 flex justify-between items-center z-10">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-vizor-500 rounded-lg">
                        <Video className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">VIZOR</span>
                </div>
                <div className="hidden md:flex gap-6 text-gray-400">
                    <button className="hover:text-white transition-colors">Product</button>
                    <button className="hover:text-white transition-colors">Solutions</button>
                    <button className="hover:text-white transition-colors">Resources</button>
                    <button className="hover:text-white transition-colors">Pricing</button>
                </div>
                <div className="flex gap-4">
                    <button className="text-gray-300 hover:text-white font-medium">Log In</button>
                    <button className="px-5 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-transform active:scale-95">
                        Sign Up Free
                    </button>
                </div>
            </nav>

            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-4xl"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vizor-500/10 text-vizor-accent border border-vizor-500/20 mb-8 font-medium text-sm">
                        <Zap className="w-4 h-4" />
                        <span>The Fastest Video Conferencing</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tight">
                        Video calls simply for <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-vizor-500 to-vizor-accent">everyone.</span>
                    </h1>

                    <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
                        Connect, collaborate, and celebrate from anywhere with VIZOR.
                        No account needed for guests. Crystal clear video and audio.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-lg mx-auto">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startMeeting}
                            className="w-full md:w-auto px-8 py-4 bg-vizor-600 hover:bg-vizor-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-vizor-500/25 flex items-center justify-center gap-2 transition-all"
                        >
                            <Video className="w-5 h-5" />
                            New Meeting
                        </motion.button>

                        <div className="flex items-center gap-2 w-full md:w-auto bg-dark-800 border border-dark-700/50 p-2 pl-4 rounded-2xl focus-within:ring-2 focus-within:ring-vizor-500/50 transition-all">
                            <Hash className="w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Enter a code or link"
                                className="bg-transparent border-none outline-none text-white placeholder-gray-500 w-full"
                                value={joinRoomId}
                                onChange={(e) => setJoinRoomId(e.target.value)}
                            />
                            <button
                                onClick={joinMeeting}
                                disabled={!joinRoomId}
                                className="px-4 py-2 bg-dark-700 text-gray-300 rounded-xl font-medium hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Join
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Decorative floating elements */}
                <motion.div
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-20 left-10 md:left-20 bg-dark-800/80 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-2xl hidden lg:block"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-500" />
                        <div>
                            <div className="h-2 w-24 bg-gray-700 rounded mb-2" />
                            <div className="h-2 w-16 bg-gray-800 rounded" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    animate={{ y: [0, 20, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute top-40 right-10 md:right-20 bg-dark-800/80 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-2xl hidden lg:block"
                >
                    <div className="flex -space-x-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`w-10 h-10 rounded-full border-2 border-dark-900 bg-gray-700 flex items-center justify-center text-xs font-bold bg-gradient-to-br ${i === 1 ? 'from-blue-500 to-cyan-500' : i === 2 ? 'from-purple-500 to-indigo-500' : i === 3 ? 'from-orange-500 to-amber-500' : 'from-emerald-500 to-teal-500'}`}>
                                {String.fromCharCode(64 + i)}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </main>

            <footer className="w-full p-6 text-center z-10 text-gray-500 text-sm font-medium">
                Made With ❤️ By <span className="text-white hover:text-vizor-400 transition cursor-pointer">Amrit</span>
            </footer>
        </div>
    );
};

export default Home;
