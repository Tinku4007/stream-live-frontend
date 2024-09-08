import React, { useEffect, useRef, useState } from 'react';
import { usePeer } from '../context/PeerProvider';

const Room = ({ roomId, isStreamer }) => {
    const { createOffer, remoteStreams } = usePeer();
    const [stream, setStream] = useState(null);
    const localVideoRef = useRef(null);
    const remoteVideosRef = useRef(null);

    useEffect(() => {
        const getMedia = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(mediaStream);
            } catch (error) {
                console.error('Error getting media stream:', error);
            }
        };

        if (isStreamer) {
            getMedia();
        }
    }, [isStreamer]);

    useEffect(() => {
        if (stream) {
            createOffer(roomId);
        }
    }, [stream, roomId, createOffer]);

    useEffect(() => {
        if (localVideoRef.current && stream) {
            localVideoRef.current.srcObject = stream;
        }
    }, [stream]);

    useEffect(() => {
        if (remoteVideosRef.current) {
            remoteVideosRef.current.innerHTML = ''; // Clear previous remote videos

            remoteStreams.current.forEach((remoteStream, id) => {
                let video = document.querySelector(`#video-${id}`);
                if (!video) {
                    video = document.createElement('video');
                    video.id = `video-${id}`;
                    video.autoplay = true;
                    video.playsInline = true;
                    video.style.width = '100%'; // Adjust width as needed
                    video.style.height = 'auto'; // Adjust height as needed
                    remoteVideosRef.current.appendChild(video);
                }
                video.srcObject = remoteStream;
            });
        }
    }, [remoteStreams]);

    

    console.log(remoteStreams , "remoteStreams")

    return (
        <div>
            {isStreamer && <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: 'auto' }} />}
            {!isStreamer && (
                <div>
                    <div ref={remoteVideosRef} style={{ textAlign: 'center' }}>Remote streams will appear here</div>
                </div>
            )}
        </div>
    );
};

export default Room;
