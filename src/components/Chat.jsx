import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, File, Download } from 'lucide-react';

const Chat = ({ socket, roomID, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (data) => {
            setMessages((prev) => [...prev, data]);
        };

        socket.on("receive-message", handleReceiveMessage);

        return () => {
            socket.off("receive-message", handleReceiveMessage);
        };
    }, [socket]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const msgData = {
            roomID,
            message: newMessage,
            sender: "Me",
        };

        socket.emit("send-message", msgData);
        setNewMessage("");
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert("File is too large. Please upload files smaller than 5MB.");
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const fileData = {
                roomID,
                fileData: reader.result,
                fileName: file.name,
                fileType: file.type,
                sender: "Me"
            };
            socket.emit("upload-file", fileData);
            // Server broadcasts back to us
        };
    };

    const downloadFile = (dataUrl, fileName) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col h-full bg-dark-800 border-l border-white/5 w-full md:w-96 shadow-2xl glass-panel fixed right-0 top-0 bottom-20 md:relative z-20">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-dark-900/50">
                <h3 className="text-white font-semibold flex items-center gap-2">
                    Chat & Files
                </h3>
                <button onClick={onClose} className="p-1 hover:bg-dark-700 rounded-full text-gray-400 hover:text-white transition">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-10">
                        <p>No messages yet.</p>
                        <p className="text-sm">Start the conversation!</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.sender === 'Me' ? 'items-end' : 'items-start'}`}>
                        <div className={`text-xs text-gray-400 mb-1 px-1`}>
                            {msg.sender === 'Me' ? 'You' : `Guest (${msg.sender.substr(0, 4)}...)`}
                        </div>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.sender === 'Me'
                            ? 'bg-vizor-600 text-white rounded-tr-sm'
                            : 'bg-dark-700 text-gray-200 rounded-tl-sm'
                            }`}>
                            {msg.type === 'text' ? (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-black/20 rounded-lg">
                                        <File className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-sm font-medium truncate w-32" title={msg.message}>{msg.message}</span>
                                        <button
                                            onClick={() => downloadFile(msg.fileData, msg.message)}
                                            className="text-xs text-blue-200 hover:text-white flex items-center gap-1 mt-1 transition"
                                        >
                                            <Download className="w-3 h-3" /> Download
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1 px-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-dark-900/50 border-t border-white/5">
                <form onSubmit={sendMessage} className="flex items-end gap-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-dark-700 rounded-xl text-gray-400 hover:text-white hover:bg-dark-600 transition"
                        title="Upload File"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,.pdf,.doc,.docx,.txt"
                    />

                    <div className="flex-1 relative">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage(e);
                                }
                            }}
                            placeholder="Type a message..."
                            className="w-full bg-dark-700 text-white placeholder-gray-500 rounded-xl py-3 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-vizor-500/50 resize-none h-[48px] max-h-32 scrollbar-hide"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-3 bg-vizor-600 rounded-xl text-white hover:bg-vizor-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;
