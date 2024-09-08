import React, { useState, useCallback } from 'react';
import Room from '../components/Room';
import { usePeer } from '../context/PeerProvider';

const JoinRoom = () => {
    const [roomId, setRoomId] = useState('');
    const [joined, setJoined] = useState(false);
    const { socket } = usePeer();

    const joinRoom = useCallback(() => {
        socket.emit('join-room', roomId);
        setJoined(true);
    }, [socket, roomId]);

    return (
        <div>
            {joined ? (
                <Room roomId={roomId} isStreamer={false} />
            ) : (
                <div>
                    <input
                        type="text"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder="Enter Room ID"
                    />
                    <button onClick={joinRoom}>Join Room</button>
                </div>
            )}
        </div>
    );
};

export default JoinRoom;
