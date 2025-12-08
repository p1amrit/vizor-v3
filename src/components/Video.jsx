import React, { useEffect, useRef } from 'react';

const Video = ({ peer }) => {
    const ref = useRef();

    useEffect(() => {
        peer.on("stream", stream => {
            if (ref.current) {
                ref.current.srcObject = stream;
            }
        })
    }, [peer]);

    return (
        <video
            playsInline
            autoPlay
            ref={ref}
            className="w-full h-full object-cover transform rounded-xl min-h-full"
        />
    );
};

export default Video;
