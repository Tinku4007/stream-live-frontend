import React, { useState, useCallback, useEffect } from 'react';
import Room from '../components/Room';
import { usePeer } from '../context/PeerProvider';

const CreateRoom = () => {
    const [roomId, setRoomId] = useState(null);
    const { socket } = usePeer();

    useEffect(() => {
        if (!socket) {
            console.error('Socket is not initialized');
        }
    }, [socket]);

    const createRoom = useCallback(() => {
        if (!socket) {
            console.error('Socket is not initialized');
            return;
        }

        const newRoomId = Math.random().toString(36).substr(2, 9);
        setRoomId(newRoomId);
        console.log(newRoomId, 'room id');
        socket.emit('create-room', newRoomId);
    }, [socket]);

    return (
        <div>
            {roomId ? (
                <Room roomId={roomId} isStreamer={true} />
            ) : (
                <button onClick={createRoom}>Create Room</button>
            )}
        </div>
    );
};

export default CreateRoom;
