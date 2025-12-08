import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import { useParams, useNavigate } from 'react-router-dom';
import Video from '../components/Video';
import Chat from '../components/Chat';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Users, MessageSquare } from 'lucide-react';

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
            if (userVideo.current) {
                userVideo.current.srcObject = stream;
            }

            socketRef.current.emit("join-room", roomID);

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
            });

            socketRef.current.on("receiving-returned-signal", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                if (item) {
                    item.peer.signal(payload.signal);
                }
            });

            socketRef.current.on("user-left", id => {
                const peerObj = peersRef.current.find(p => p.peerID === id);
                if (peerObj) {
                    peerObj.peer.destroy();
                }
                const peers = peersRef.current.filter(p => p.peerID !== id);
                peersRef.current = peers;
                setPeers(peers);
            });
        }).catch(err => {
            console.error("Failed to get local stream", err);
            // Permissions handled by browser mostly, but good to catch
        });

        return () => {
            // Cleanup handled on disconnect by server mainly
            // socketRef.current.disconnect(); 
        };
    }, [roomID]);

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
            socketRef.current.emit("sending-signal", { userToSignal, callerID, signal })
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

    const toggleScreenShare = () => {
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
    if (!isNameSet && !username) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-dark-900 text-white">
                <div className="bg-dark-800 p-8 rounded-2xl shadow-2xl border border-white/10 w-96">
                    <h2 className="text-2xl font-bold mb-6 text-center">Join Meeting</h2>
                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={username}
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
                </div>
            </div>
        );
    }

    // Just in case username exists but flag wasn't set (e.g. from localstorage)
    if (!isNameSet && username) {
        setIsNameSet(true);
    }

    return (
        <div className="flex flex-col h-screen bg-dark-900 overflow-hidden relative">
            <div className="flex flex-1 overflow-hidden">
                {/* Main Video Area - Grid System */}
                <div className={`flex-1 p-4 overflow-y-auto w-full transition-all duration-300 ${isChatOpen ? 'pr-[384px] md:pr-0' : ''}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full w-full max-w-7xl mx-auto align-content-center justify-center auto-rows-fr">
                        {/* My Video */}
                        <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-2xl ring-2 ring-vizor-500/20 w-full mb-4 md:mb-0">
                            <video muted ref={userVideo} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-medium z-10 flex flex-col">
                                <span>{username} (You)</span>
                                <span className="text-xs text-gray-400">{audioEnabled ? '' : '(Muted)'}</span>
                            </div>
                        </div>
                        {/* Remote Videos */}
                        {peers.map((peer, index) => (
                            <div key={peer.peerID} className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-2xl w-full">
                                <Video peer={peer.peer} />
                                <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-medium z-10">
                                    Guest {index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Sidebar for Desktop (Relative) & Mobile (Fixed in Component) */}
                {isChatOpen && (
                    <div className="w-96 hidden md:block h-full border-l border-white/10 bg-dark-800 z-10">
                        <Chat socket={socketRef.current} roomID={roomID} onClose={() => setIsChatOpen(false)} />
                    </div>
                )}
                {isChatOpen && (
                    <div className="md:hidden">
                        <Chat socket={socketRef.current} roomID={roomID} onClose={() => setIsChatOpen(false)} />
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="h-20 bg-dark-800 border-t border-white/5 px-6 flex items-center justify-between z-30 backdrop-blur-lg bg-opacity-90 shrink-0">
                <div className="flex items-center gap-4 text-white font-medium">
                    <span className="text-gray-400 text-sm hidden sm:inline-block">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded bg-dark-700 ${connectionStatus.includes('failed') ? 'text-red-400' : 'text-green-400'}`}>
                        {connectionStatus}
                    </span>
                    <span className="text-gray-200 text-sm font-mono opacity-50 hidden md:block">
                        {roomID}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleAudio}
                        className={`p-4 rounded-full transition-all ${audioEnabled ? 'bg-dark-700 hover:bg-dark-600 text-white' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                    >
                        {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={toggleVideo}
                        className={`p-4 rounded-full transition-all ${videoEnabled ? 'bg-dark-700 hover:bg-dark-600 text-white' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                    >
                        {videoEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={toggleScreenShare}
                        className={`p-4 rounded-full transition-all ${isScreenSharing ? 'bg-vizor-600 text-white' : 'bg-dark-700 hover:bg-dark-600 text-white'}`}
                        title="Share Screen"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3" /><path d="M8 21h8" /><path d="M12 17v4" /><path d="M17 8l5-5" /><path d="M17 3h5v5" /></svg>
                    </button>
                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className={`p-4 rounded-full transition-all ${isChatOpen ? 'bg-vizor-600 text-white' : 'bg-dark-700 hover:bg-dark-600 text-white'}`}
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>
                    <button
                        onClick={leaveCall}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition-colors flex items-center gap-2"
                    >
                        <PhoneOff className="w-5 h-5" />
                        <span className="hidden sm:inline">End Call</span>
                    </button>
                </div>

                <div className="w-[100px] hidden sm:block"></div>
            </div>
        </div>
    );
};

export default Room;
