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
    const peersRef = useRef([]);
    const { roomID } = useParams();
    const navigate = useNavigate();
    const [stream, setStream] = useState();

    // Controls state
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);

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

    return (
        <div className="flex flex-col h-screen bg-dark-900 overflow-hidden relative">
            <div className="flex flex-1 overflow-hidden">
                {/* Main Video Area - Grid System */}
                <div className={`flex-1 p-4 overflow-y-auto w-full transition-all duration-300 ${isChatOpen ? 'pr-[384px] md:pr-0' : ''}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full w-full max-w-7xl mx-auto align-content-center justify-center auto-rows-fr">
                        {/* My Video */}
                        <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-2xl ring-2 ring-vizor-500/20 w-full mb-4 md:mb-0">
                            <video muted ref={userVideo} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-medium z-10">
                                You {audioEnabled ? '' : '(Muted)'}
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
