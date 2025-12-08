import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';
import { Video, Users, Zap, Hash, Copy, Check } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();
    const [joinRoomId, setJoinRoomId] = useState('');
    const [copied, setCopied] = useState(false);

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
                    {/* Auth removed as per request */}
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

                        <div className="relative flex items-center gap-2 w-full md:w-auto bg-dark-800 border-2 border-vizor-500/50 p-2 pl-4 rounded-2xl shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all group">
                            <Hash className="w-5 h-5 text-vizor-500" />
                            <input
                                type="text"
                                placeholder="Enter code"
                                className="bg-transparent border-none outline-none text-white placeholder-gray-500 w-full md:w-48 font-mono tracking-wider"
                                value={joinRoomId}
                                onChange={(e) => setJoinRoomId(e.target.value)}
                            />
                            {joinRoomId && (
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(joinRoomId);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className="p-2 text-gray-400 hover:text-white transition-colors"
                                    title="Copy Code"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                            )}
                            <button
                                onClick={joinMeeting}
                                disabled={!joinRoomId}
                                className="px-6 py-3 bg-vizor-600 text-white rounded-xl font-bold hover:bg-vizor-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-vizor-500/50"
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
                {/* Team & Guidance Section */}
                <div className="mt-24 w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 text-left mb-20 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-dark-800/50 backdrop-blur-sm p-8 rounded-3xl border border-white/5"
                    >
                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                            <Users className="w-6 h-6 text-vizor-500" />
                            Our Team
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { name: 'Amrit Kumar Gupta', role: 'Leader', username: 'p1amrit', url: 'https://www.instagram.com/p1amrit/' },
                                { name: 'Sunny Yadav', username: 'sunnyyadav__03', url: 'https://www.instagram.com/sunnyyadav__03/' },
                                { name: 'Abhinav Singh', username: 'abhinav_9293', url: 'https://www.instagram.com/abhinav_9293/' },
                                { name: 'Talib Shiddique', username: 'mr.siddiqui_003', url: 'https://www.instagram.com/mr.siddiqui_003/' }
                            ].map((member, idx) => (
                                <a
                                    key={idx}
                                    href={member.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-xl bg-dark-700/50 hover:bg-dark-700 hover:scale-105 transition-all group cursor-pointer border border-transparent hover:border-vizor-500/30"
                                >
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-dark-600 ring-2 ring-transparent group-hover:ring-vizor-500 transition-all">
                                            <img
                                                src={`/team/${member.username}.jpg`}
                                                alt={member.name}
                                                onError={(e) => {
                                                    const target = e.target;
                                                    // Strategy: Local -> Unavatar (Insta) -> DiceBear (Cartoon)
                                                    if (target.src.includes('/team/')) {
                                                        // Try Insta API
                                                        target.src = `https://unavatar.io/instagram/${member.username}`;
                                                    } else if (target.src.includes('unavatar.io')) {
                                                        // Fallback to DiceBear
                                                        target.onerror = null;
                                                        target.src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${member.username}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
                                                    }
                                                }}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        {member.role === 'Leader' && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-dark-800 flex items-center justify-center" title="Leader">
                                                <svg className="w-2.5 h-2.5 text-black fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-200 font-medium text-sm group-hover:text-white transition-colors">
                                            {member.name}
                                        </span>
                                        {member.role === 'Leader' && (
                                            <span className="text-[10px] uppercase font-bold text-vizor-400 tracking-wider">
                                                Team Leader
                                            </span>
                                        )}
                                        {!member.role && (
                                            <span className="text-[10px] text-gray-500 group-hover:text-vizor-400/70 transition-colors">
                                                @ {member.username}
                                            </span>
                                        )}
                                    </div>
                                </a>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-dark-800/50 backdrop-blur-sm p-8 rounded-3xl border border-white/5"
                    >
                        <h3 className="text-2xl font-bold text-white mb-6">
                            Under Guidance Of
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-gradient-to-r from-vizor-900/50 to-transparent border-l-4 border-vizor-500">
                                <p className="text-lg font-semibold text-white">Mr. Vidhu Sharma</p>
                                <p className="text-sm text-vizor-400">Mentor</p>
                            </div>
                            <div className="p-4 rounded-xl bg-gradient-to-r from-vizor-900/50 to-transparent border-l-4 border-vizor-500">
                                <p className="text-lg font-semibold text-white">Mr. Rahul Gupta</p>
                                <p className="text-sm text-vizor-400">Mentor</p>
                            </div>
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Institution</p>
                                <p className="text-xl font-bold text-white">SRGI Lucknow</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>

            <footer className="w-full p-6 text-center z-10 text-gray-500 text-sm font-medium border-t border-white/5 bg-dark-900/50 backdrop-blur-md">
                Made With ❤️ By <span className="text-white hover:text-vizor-400 transition cursor-pointer">Amrit Kumar Gupta</span> & Team
            </footer>
        </div>
    );
};

export default Home;
