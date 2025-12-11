import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import { useParams, useNavigate } from 'react-router-dom';
import Video from '../components/Video';
import Chat from '../components/Chat';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Users, MessageSquare, Copy, UserMinus, Smile } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Room = () => {
    const [peers, setPeers] = useState([]);
    const socketRef = useRef();
    const userVideo = useRef();
    const screenTrackRef = useRef();
    const peersRef = useRef([]);
    const { roomID } = useParams();
    const navigate = useNavigate();
    const [stream, setStream] = useState();

    // Controls state
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    // User Identity
    const [username, setUsername] = useState(localStorage.getItem('vizor_username') || '');
    const [isNameSet, setIsNameSet] = useState(false);
    const [isHost, setIsHost] = useState(false);

    // Reactions
    const [showReactionMenu, setShowReactionMenu] = useState(false);
    const [reactions, setReactions] = useState([]);
    const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '👏', '🎉'];

    // Use environment variable for server URL (Production) or default to relative path (Local Proxy)
    const streamRef = useRef();

    // Use environment variable for server URL (Production) or default to relative path (Local Proxy)
    const SERVER_URL = import.meta.env.VITE_SERVER_URL || '/';
    const [connectionStatus, setConnectionStatus] = useState('Connecting...');

    useEffect(() => {
        socketRef.current = io.connect(SERVER_URL);

        socketRef.current.on('connect', () => {
            setConnectionStatus('Connected to server');
        });

        socketRef.current.on('connect_error', (err) => {
            setConnectionStatus(`Connection failed: ${err.message}`);
        });

        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            setStream(stream);
            streamRef.current = stream;
            if (userVideo.current) {
                userVideo.current.srcObject = stream;
            }

            socketRef.current.emit("join-room", { roomID, username });

            socketRef.current.on("all-users", users => {
                const peers = [];
                users.forEach(userID => {
                    const peer = createPeer(userID, socketRef.current.id, stream);
                    peersRef.current.push({
                        peerID: userID,
                        peer,
                    })
                    peers.push({
                        peerID: userID,
                        peer,
                    });
                })
                setPeers(peers);
            })

            socketRef.current.on("user-joined", payload => {
                const peer = addPeer(payload.signal, payload.callerID, stream);
                peersRef.current.push({
                    peerID: payload.callerID,
                    peer,
                })
                const peerObj = {
                    peerID: payload.callerID,
                    peer,
                };
                setPeers(users => [...users, peerObj]);
                const newUserName = payload.username || 'New user';
                toast.success(`${newUserName} joined the room 🚀`, {
                    style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                    },
                });
            });

            socketRef.current.on("receiving-returned-signal", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                if (item) {
                    item.peer.signal(payload.signal);
                }
            });

            socketRef.current.on("user-left", payload => {
                // Backend now sends { id, name } or sometimes just id if legacy
                const id = payload.id || payload;
                const name = payload.name || 'User';

                const peerObj = peersRef.current.find(p => p.peerID === id);
                if (peerObj) {
                    peerObj.peer.destroy();
                }
                const peers = peersRef.current.filter(p => p.peerID !== id);
                peersRef.current = peers;
                setPeers(peers);
                toast(`${name} left the room 👋`, {
                    style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                    },
                });
            });

            // Host Events
            socketRef.current.on("set-host", (status) => {
                setIsHost(status);
                if (status) toast.success("You are now the Host 👑");
            });

            socketRef.current.on("kicked", () => {
                toast.error("You have been kicked by the host 🚫");
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
                socketRef.current.disconnect();
                navigate('/');
            });

            socketRef.current.on("receive-reaction", (payload) => {
                setReactions(prev => [...prev, payload]);
                setTimeout(() => {
                    setReactions(prev => prev.filter(r => r.id !== payload.id));
                }, 4000);
            });

        }).catch(err => {
            console.error("Failed to get local stream", err);
            // Permissions handled by browser mostly, but good to catch
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [roomID]);

    useEffect(() => {
        if (userVideo.current && stream) {
            userVideo.current.srcObject = stream;
            userVideo.current.onloadedmetadata = () => {
                userVideo.current.play().catch((e) => console.error("Error playing video:", e));
            };
        }
    }, [stream, isNameSet]);

    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        });

        peer.on("signal", signal => {
            socketRef.current.emit("sending-signal", { userToSignal, callerID, signal, username })
        })

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        })

        peer.on("signal", signal => {
            socketRef.current.emit("returning-signal", { signal, callerID })
        })

        peer.signal(incomingSignal);

        return peer;
    }

    const toggleAudio = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setAudioEnabled(audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setVideoEnabled(videoTrack.enabled);
            }
        }
    };

    const leaveCall = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        socketRef.current.disconnect();
        navigate('/');
    };

    const kickUser = (targetID) => {
        if (confirm("Are you sure you want to kick this user?")) {
            socketRef.current.emit("kick-user", { roomID, targetID });
        }
    };

    const sendReaction = (emoji) => {
        socketRef.current.emit("send-reaction", { roomID, reaction: emoji, sender: username });
        setShowReactionMenu(false);
    };

    const toggleScreenShare = () => {
        // Mobile check
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            alert("Screen sharing is currently only supported on Desktop browsers.");
            return;
        }

        if (!isScreenSharing) {
            navigator.mediaDevices.getDisplayMedia({ cursor: true })
                .then(screenStream => {
                    const screenTrack = screenStream.getVideoTracks()[0];
                    screenTrackRef.current = screenTrack;

                    // Replace video track in local stream
                    const videoTrack = stream.getVideoTracks()[0];
                    stream.removeTrack(videoTrack);
                    stream.addTrack(screenTrack);

                    // Replace track in all peer connections
                    peersRef.current.forEach(({ peer }) => {
                        peer.replaceTrack(videoTrack, screenTrack, stream);
                    });

                    // Update local video element
                    if (userVideo.current) {
                        userVideo.current.srcObject = stream;
                    }

                    setIsScreenSharing(true);

                    // Handle screen share stop (via browser UI)
                    screenTrack.onended = () => {
                        stopScreenShare(videoTrack);
                    };
                })
                .catch(err => console.log("Screen share failed", err));
        } else {
            // Stop sharing - revert to camera
            navigator.mediaDevices.getUserMedia({ video: true }).then(camStream => {
                const camTrack = camStream.getVideoTracks()[0];
                stopScreenShare(camTrack);
            });
        }
    };

    const stopScreenShare = (newVideoTrack) => {
        const screenTrack = screenTrackRef.current;
        if (screenTrack) {

            // Replace screen track with camera track
            stream.removeTrack(screenTrack);
            stream.addTrack(newVideoTrack);

            peersRef.current.forEach(({ peer }) => {
                peer.replaceTrack(screenTrack, newVideoTrack, stream);
            });

            screenTrack.stop();
            setIsScreenSharing(false);

            if (userVideo.current) {
                userVideo.current.srcObject = stream;
            }
        }
    };

    // If username is not set, don't render the room yet (show modal)
    if (!isNameSet) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-dark-900 text-white px-4">
                <div className="bg-dark-800 p-6 md:p-8 rounded-2xl shadow-2xl border border-white/10 w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-6 text-center">Join Meeting</h2>
                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={username}
                        maxLength={15}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-dark-700 text-white rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-vizor-500"
                    />
                    <button
                        onClick={() => {
                            if (username.trim()) {
                                localStorage.setItem('vizor_username', username);
                                setIsNameSet(true);
                            }
                        }}
                        disabled={!username.trim()}
                        className="w-full bg-vizor-600 hover:bg-vizor-500 py-3 rounded-xl font-semibold transition disabled:opacity-50"
                    >
                        Join Room
                    </button>
                    <div className="mt-6 text-center text-xs text-gray-500">
                        Made With ❤️ By <span className="text-gray-300">Amrit</span>
                    </div>
                </div>
            </div>
        );
    }



    return (
        <div className="flex flex-col h-[100dvh] bg-dark-900 overflow-hidden relative">
            {/* Reaction Overlay */}
            <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
                <AnimatePresence>
                    {reactions.map((r) => (
                        <motion.div
                            key={r.id}
                            initial={{ opacity: 0, y: 100, scale: 0.5 }}
                            animate={{ opacity: 1, y: -window.innerHeight * 0.4, scale: 1.5 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            className="absolute flex flex-col items-center"
                            style={{
                                left: `${Math.random() * 80 + 10}%`,
                                bottom: '100px'
                            }}
                        >
                            <span className="text-4xl filter drop-shadow-lg">{r.reaction}</span>
                            <span className="text-xs text-white bg-black/50 px-2 py-0.5 rounded-full mt-1 backdrop-blur-sm">
                                {r.sender}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Header Info Bar (Mobile Friendly) */}
            <div className="flex items-center justify-between px-4 py-2 bg-dark-800/50 backdrop-blur-md border-b border-white/5 z-20 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-vizor-500 tracking-wider">VIZOR</span>
                    <div className="h-4 w-px bg-white/20 mx-1" />
                    <span className={`text-xs px-2 py-0.5 rounded-full ${connectionStatus.includes('failed') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                        {connectionStatus === 'Connected to server' ? 'Live' : connectionStatus}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 font-mono hidden md:block">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(roomID);
                            toast.success('Room ID copied!');
                        }}
                        className="flex items-center gap-1.5 text-xs font-mono bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition border border-white/5"
                    >
                        <span>{roomID}</span>
                        <Copy className="w-3 h-3 text-gray-400" />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Main Video Area - Grid System */}
                <div className={`flex-1 p-3 md:p-4 overflow-y-auto w-full transition-all duration-300 ${isChatOpen ? 'pr-[384px] md:pr-0' : ''}`}>
                    <div className={`grid gap-3 w-full max-w-7xl mx-auto align-content-center justify-center min-h-full ${peers.length + 1 <= 2
                        ? 'grid-cols-1 md:grid-cols-2'
                        : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-min'
                        }`}>
                        {/* My Video */}
                        <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-2xl ring-2 ring-vizor-500/20 w-full">
                            <video muted ref={userVideo} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                            <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded text-xs font-medium z-10 flex flex-col">
                                <span className="truncate max-w-[100px] md:max-w-none">{username} (You)</span>
                                {isHost && <span className="text-yellow-400">Host</span>}
                            </div>
                            {!audioEnabled && (
                                <div className="absolute top-3 right-3 bg-red-500/80 p-1.5 rounded-full backdrop-blur-sm">
                                    <MicOff className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </div>
                        {/* Remote Videos */}
                        {peers.map((peer, index) => (
                            <div key={peer.peerID} className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-2xl w-full group">
                                <Video peer={peer.peer} />
                                <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded text-xs font-medium z-10">
                                    Guest {index + 1}
                                </div>
                                {isHost && (
                                    <button
                                        onClick={() => kickUser(peer.peerID)}
                                        className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow-lg"
                                        title="Kick User"
                                    >
                                        <UserMinus className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Sidebar - Single Instance for Persistence */}
                <div className={`${isChatOpen ? '' : 'hidden'} h-full md:block z-50 md:z-auto ${isChatOpen ? 'absolute inset-0 md:static bg-dark-900 md:bg-transparent' : ''}`}>
                    <div style={{ display: isChatOpen ? 'block' : 'none' }}>
                        <Chat socket={socketRef.current} roomID={roomID} username={username} onClose={() => setIsChatOpen(false)} />
                    </div>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="h-auto py-4 md:h-20 bg-dark-800 border-t border-white/5 px-4 flex items-center justify-center z-30 backdrop-blur-lg bg-opacity-90 shrink-0 safe-area-bottom">
                <div className="flex items-center gap-3 md:gap-4 overflow-x-auto w-full justify-center md:w-auto p-1">
                    <button
                        onClick={toggleAudio}
                        className={`p-3 md:p-4 rounded-full transition-all shrink-0 ${audioEnabled ? 'bg-dark-700 hover:bg-dark-600 text-white' : 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'}`}
                    >
                        {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={toggleVideo}
                        className={`p-3 md:p-4 rounded-full transition-all shrink-0 ${videoEnabled ? 'bg-dark-700 hover:bg-dark-600 text-white' : 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'}`}
                    >
                        {videoEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={toggleScreenShare}
                        className={`hidden md:flex p-3 md:p-4 rounded-full transition-all shrink-0 ${isScreenSharing ? 'bg-vizor-600 text-white' : 'bg-dark-700 hover:bg-dark-600 text-white'}`}
                        title="Share Screen"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3" /><path d="M8 21h8" /><path d="M12 17v4" /><path d="M17 8l5-5" /><path d="M17 3h5v5" /></svg>
                    </button>
                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className={`p-3 md:p-4 rounded-full transition-all shrink-0 ${isChatOpen ? 'bg-vizor-600 text-white' : 'bg-dark-700 hover:bg-dark-600 text-white'}`}
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>

                    {/* Reaction Button */}
                    <div className="relative shrink-0">
                        <button
                            onClick={() => setShowReactionMenu(!showReactionMenu)}
                            className={`p-3 md:p-4 rounded-full transition-all ${showReactionMenu ? 'bg-vizor-600 text-white' : 'bg-dark-700 hover:bg-dark-600 text-white'}`}
                        >
                            <Smile className="w-5 h-5" />
                        </button>
                        {/* Popup Menu */}
                        <AnimatePresence>
                            {showReactionMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                    className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-dark-800 border border-white/10 rounded-xl p-2 shadow-2xl flex gap-1 md:gap-2 z-50 whitespace-nowrap"
                                >
                                    {REACTION_EMOJIS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => sendReaction(emoji)}
                                            className="text-xl md:text-2xl hover:bg-white/10 p-1.5 md:p-2 rounded-lg transition transform hover:scale-125"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={leaveCall}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition-colors flex items-center gap-2 shrink-0 ml-2 shadow-lg shadow-red-600/20"
                    >
                        <PhoneOff className="w-5 h-5" />
                        <span className="hidden md:inline">End</span>
                    </button>
                </div>
            </div>
            <Toaster position="top-center" reverseOrder={false} />
        </div>
    );
};

export default Room;
