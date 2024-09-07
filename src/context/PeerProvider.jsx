import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import io from 'socket.io-client';

const PeerContext = createContext();

export const usePeer = () => useContext(PeerContext);

const PeerProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const peerConnection = useRef(null);
    const remoteStreams = useRef(new Map());

    useEffect(() => {
        const socketIo = io('http://localhost:3000');
        setSocket(socketIo);

        socketIo.on('connect', () => {
            console.log('Socket connected:', socketIo.id);
        });

        socketIo.on('error', (error) => {
            console.error('Socket error:', error);
        });

        return () => {
            socketIo.disconnect();
        };
    }, []);

    const createOffer = async (roomId) => {
        if (!socket) {
            console.error('Socket is not initialized');
            return;
        }

        peerConnection.current = new RTCPeerConnection();
        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', roomId, event.candidate);
            }
        };

        peerConnection.current.ontrack = (event) => {
            const remoteStream = new MediaStream();
            remoteStream.addTrack(event.track);
            remoteStreams.current.set(roomId, remoteStream);
            socket.emit('stream', roomId, remoteStream);
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        mediaStream.getTracks().forEach(track => peerConnection.current.addTrack(track, mediaStream));

        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        socket.emit('offer', roomId, offer);
    };

    const createAnswer = async (roomId, offer) => {
        if (!socket) {
            console.error('Socket is not initialized');
            return;
        }

        peerConnection.current = new RTCPeerConnection();
        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', roomId, event.candidate);
            }
        };

        peerConnection.current.ontrack = (event) => {
            const remoteStream = new MediaStream();
            remoteStream.addTrack(event.track);
            remoteStreams.current.set(roomId, remoteStream);
            socket.emit('stream', roomId, remoteStream);
        };

        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit('answer', roomId, answer);
    };

    const addIceCandidate = (candidate) => {
        if (peerConnection.current) {
            peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
    };

    useEffect(() => {
        if (!socket) return;

        socket.on('offer', (socketId, offer) => {
            createAnswer(socketId, offer);
        });

        socket.on('answer', (socketId, answer) => {
            peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on('ice-candidate', (socketId, candidate) => {
            addIceCandidate(candidate);
        });

        socket.on('stream', (roomId, stream) => {
            remoteStreams.current.set(roomId, stream);
        });

        return () => {
            socket.off('offer');
            socket.off('answer');
            socket.off('ice-candidate');
            socket.off('stream');
        };
    }, [socket]);

    return (
        <PeerContext.Provider value={{ socket, createOffer, remoteStreams }}>
            {children}
        </PeerContext.Provider>
    );
};

export default PeerProvider;
