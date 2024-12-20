import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3000'); // Replace with your server's address

function App() {
  const [isWaiting, setIsWaiting] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    socket.on('start', () => {
      setIsWaiting(false);
    });

    socket.on('buzzResult', (result) => {
      setResult(result);
    });
  }, []);

  const handleBuzz = () => {
    socket.emit('buzz', Date.now());
  };

  return (
    <div>
      {isWaiting ? (
        <p>Waiting for the host to start...</p>
      ) : (
        <button onClick={handleBuzz}>Buzz!</button>
      )}
      {result && <p>You buzzed in at {result.timestamp}</p>}
    </div>
  );
}

export default App;