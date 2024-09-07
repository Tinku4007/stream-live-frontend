import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import JoinRoom from './pages/JoinRoom';
import PeerProvider from './context/PeerProvider';
import CreateRoom from './pages/CreateRoom';
import Home from './pages/Home';

const App = () => {
    return (
        <PeerProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/create-room" element={<CreateRoom />} />
                    <Route path="/join-room" element={<JoinRoom />} />
                </Routes>
            </Router>
        </PeerProvider>
    );
};

export default App;
