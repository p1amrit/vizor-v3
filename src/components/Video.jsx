import React, { useEffect, useRef } from 'react';

const Video = ({ peer }) => {
    const ref = useRef();

    useEffect(() => {
        // Listen for the stream event
        peer.on("stream", stream => {
            if (ref.current) {
                ref.current.srcObject = stream;
            }
        });

        // Also check if stream already exists (race condition fix)
        if (peer._remoteStreams && peer._remoteStreams.length > 0) {
            if (ref.current) {
                ref.current.srcObject = peer._remoteStreams[0];
            }
        }
    }, [peer]);

    return (
        <video
            playsInline
            autoPlay
            ref={ref}
            className="w-full h-full object-cover transform rounded-xl min-h-full bg-black"
        />
    );
};

export default Video;
