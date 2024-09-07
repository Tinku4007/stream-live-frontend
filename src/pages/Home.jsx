import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div>
            <h1>WebRTC Live Stream App</h1>
            <Link to="/create-room">Create Room</Link>
            <Link to="/join-room">Join Room</Link>
        </div>
    );
};

export default Home;
