import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

const PeerContext = createContext();

export const usePeer = () => useContext(PeerContext);

const PeerProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState(new Map());

    const peerConnection = useRef(null);

    useEffect(() => {
        const socketIo = io('https://strem-live.onrender.com');
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

    const createOffer = useCallback(async (roomId) => {
        if (!socket) {
            console.error('Socket is not initialized');
            return;
        }

        peerConnection.current = new RTCPeerConnection();
        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('Sending ICE candidate:', event.candidate);
                socket.emit('ice-candidate', roomId, event.candidate);
            }
        };

        peerConnection.current.ontrack = (event) => {
            const remoteStream = new MediaStream();
            remoteStream.addTrack(event.track);
            setRemoteStreams(prev => {
                const updatedStreams = new Map(prev);
                updatedStreams.set(roomId, remoteStream);
                return updatedStreams;
            });
            console.log('Sending stream:', remoteStream);
            socket.emit('stream', roomId, remoteStream);
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        mediaStream.getTracks().forEach(track => peerConnection.current.addTrack(track, mediaStream));

        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        console.log('Emitting offer:', offer);
        socket.emit('offer', roomId, offer);
    }, [socket]);

    const createAnswer = useCallback(async (roomId, offer) => {
        if (!socket) {
            console.error('Socket is not initialized');
            return;
        }

        console.log('Creating answer for room:', roomId);

        peerConnection.current = new RTCPeerConnection();
        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('Sending ICE candidate:', event.candidate);
                socket.emit('ice-candidate', roomId, event.candidate);
            }
        };

        peerConnection.current.ontrack = (event) => {
            const remoteStream = new MediaStream();
            remoteStream.addTrack(event.track);
            setRemoteStreams(prev => {
                const updatedStreams = new Map(prev);
                updatedStreams.set(roomId, remoteStream);
                return updatedStreams;
            });
            console.log('Sending stream:', remoteStream);
            socket.emit('stream', roomId, remoteStream);
        };

        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        console.log('Offer set as remote description');
        
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        console.log('Emitting answer:', answer);
        socket.emit('answer', roomId, answer);
    }, [socket]);

    const addIceCandidate = useCallback((candidate) => {
        if (peerConnection.current) {
            peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }, []);

    const handleOffer = useCallback((socketId, offer) => {
        console.log('Received offer:', offer);
        createAnswer(socketId, offer);
    }, [createAnswer]);

    const handleAnswer = useCallback((socketId, answer) => {
        console.log('Received answer:', answer);
        peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    }, []);

    const handleIceCandidate = useCallback((socketId, candidate) => {
        console.log('Received ICE candidate:', candidate);
        addIceCandidate(candidate);
    }, [addIceCandidate]);

    const handleStream = useCallback((roomId, stream) => {
        console.log('Received stream:', stream);
        setRemoteStreams(prev => {
            const updatedStreams = new Map(prev);
            updatedStreams.set(roomId, stream);
            return updatedStreams;
        });
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);
        socket.on('stream', handleStream);

        return () => {
            socket.off('offer', handleOffer);
            socket.off('answer', handleAnswer);
            socket.off('ice-candidate', handleIceCandidate);
            socket.off('stream', handleStream);
        };
    }, [socket, handleOffer, handleAnswer, handleIceCandidate, handleStream]);

    return (
        <PeerContext.Provider value={{ socket, createOffer, remoteStreams }}>
            {children}
        </PeerContext.Provider>
    );
};

export default PeerProvider;
x`x`