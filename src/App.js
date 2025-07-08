import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';

const API_URL = "http://localhost:8000";

const styles = {
  app: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Segoe UI, Arial, sans-serif',
  },
  card: {
    background: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.18)',
    padding: 32,
    marginTop: 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 350,
  },
  title: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 700,
    marginBottom: 24,
    letterSpacing: 2,
    textShadow: '0 2px 8px #0008',
  },
  webcam: {
    borderRadius: 16,
    boxShadow: '0 4px 16px 0 rgba(44,83,100,0.25)',
    marginBottom: 24,
    border: '3px solid #2c5364',
    position: 'relative',
    transform: 'scaleX(-1)', // Mirror the webcam
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 2,
    transform: 'scaleX(-1)', // Mirror the overlay to match webcam
  },
  box: {
    position: 'absolute',
    border: '3px solid #00e676',
    borderRadius: 8,
    boxShadow: '0 2px 8px #0008',
    zIndex: 3,
    pointerEvents: 'none',
    background: 'rgba(0,0,0,0.05)',
  },
  boxLabel: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    top: -32,
    background: 'rgba(44,83,100,0.95)',
    color: '#fff',
    padding: '4px 16px',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 18,
    boxShadow: '0 2px 8px #0008',
    zIndex: 4,
    whiteSpace: 'nowrap',
  },
  buttonGroup: {
    display: 'flex',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    background: 'linear-gradient(90deg, #1e3c72 0%, #2a5298 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 24px',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 8px #0002',
    transition: 'background 0.2s',
  },
  buttonActive: {
    background: 'linear-gradient(90deg, #2a5298 0%, #1e3c72 100%)',
  },
  input: {
    borderRadius: 8,
    border: '1px solid #2c5364',
    padding: '10px 16px',
    fontSize: 16,
    marginRight: 12,
    outline: 'none',
    background: 'rgba(255,255,255,0.15)',
    color: '#222',
    fontWeight: 500,
    boxShadow: '0 1px 4px #0001',
  },
  result: {
    marginTop: 24,
    color: '#00e676',
    fontWeight: 600,
    fontSize: 18,
    textShadow: '0 1px 4px #0004',
  },
  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#fff',
    opacity: 0.85,
    boxShadow: '0 0 6px #00e676, 0 0 2px #fff',
    zIndex: 5,
    pointerEvents: 'none',
  },
};

const VIDEO_WIDTH = 320;
const VIDEO_HEIGHT = 240;

const App = () => {
  const webcamRef = useRef(null);
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState('register');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [liveUser, setLiveUser] = useState('');
  const [liveError, setLiveError] = useState('');
  const [liveBox, setLiveBox] = useState(null);
  const [liveLandmarks, setLiveLandmarks] = useState([]);
  const [registerBox, setRegisterBox] = useState(null);
  const [registerLandmarks, setRegisterLandmarks] = useState([]);

  // Live recognition effect
  useEffect(() => {
    let interval;
    if (mode === 'live') {
      interval = setInterval(async () => {
        if (webcamRef.current) {
          const imageSrc = webcamRef.current.getScreenshot();
          if (imageSrc) {
            const image = imageSrc.split(',')[1];
            try {
              const res = await axios.post(`${API_URL}/login`, { image });
              setLiveUser(res.data.username);
              setLiveError('');
              setLiveBox(res.data.box);
              setLiveLandmarks(res.data.landmarks || []);
            } catch (err) {
              setLiveUser('Unknown');
              setLiveError(err.response?.data?.detail || '');
              setLiveBox(null);
              setLiveLandmarks([]);
            }
          }
        }
      }, 1500); // 1.5 seconds between recognitions
    }
    return () => clearInterval(interval);
  }, [mode]);

  const capture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    return imageSrc.split(',')[1]; // base64 part
  };

  const handleRegister = async () => {
    setLoading(true);
    const image = await capture();
    try {
      const res = await axios.post(`${API_URL}/register`, { username, image });
      setResult(`Registered: ${res.data.username}`);
      setRegisterBox(res.data.box || null);
      setRegisterLandmarks(res.data.landmarks || []);
    } catch (err) {
      setResult(err.response?.data?.detail || 'Registration failed');
      setRegisterBox(null);
      setRegisterLandmarks([]);
    }
    setLoading(false);
  };

  // Helper to scale box to video size
  const scaleBox = (box) => {
    if (!box) return null;
    const [x, y, w, h] = box;
    return {
      left: (x / VIDEO_WIDTH) * 100 + '%',
      top: (y / VIDEO_HEIGHT) * 100 + '%',
      width: (w / VIDEO_WIDTH) * 100 + '%',
      height: (h / VIDEO_HEIGHT) * 100 + '%',
      box: [x, y, w, h],
      px: { left: x, top: y, width: w, height: h },
    };
  };

  const scaledLive = scaleBox(liveBox);
  const scaledRegister = scaleBox(registerBox);

  return (
    <div style={styles.app}>
      <div style={styles.card}>
        <div style={styles.title}>Face ID Recognition</div>
        <div style={{ position: 'relative', width: VIDEO_WIDTH, height: VIDEO_HEIGHT }}>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={VIDEO_WIDTH}
            height={VIDEO_HEIGHT}
            style={styles.webcam}
          />
          {mode === 'live' && (
            <div style={styles.overlay}>
              {scaledLive && (
                <>
                  <div
                    style={{
                      ...styles.box,
                      left: scaledLive.px.left,
                      top: scaledLive.px.top,
                      width: scaledLive.px.width,
                      height: scaledLive.px.height,
                    }}
                  >
                    <div style={{ ...styles.boxLabel, top: -32 }}>{liveUser}</div>
                  </div>
                  {liveLandmarks.map(([lx, ly], i) => (
                    <div
                      key={i}
                      style={{
                        ...styles.dot,
                        left: lx - 3, // center dot
                        top: ly - 3,
                      }}
                    />
                  ))}
                </>
              )}
              {liveError && !scaledLive && (
                <div style={{ color: '#ff5252', fontSize: 18, position: 'absolute', top: 16, left: 0, width: '100%', textAlign: 'center' }}>{liveError}</div>
              )}
            </div>
          )}
          {mode === 'register' && scaledRegister && (
            <div style={styles.overlay}>
              <div
                style={{
                  ...styles.box,
                  left: scaledRegister.px.left,
                  top: scaledRegister.px.top,
                  width: scaledRegister.px.width,
                  height: scaledRegister.px.height,
                }}
              >
                <div style={{ ...styles.boxLabel, top: -32 }}>{username}</div>
              </div>
              {registerLandmarks.map(([lx, ly], i) => (
                <div
                  key={i}
                  style={{
                    ...styles.dot,
                    left: lx - 3,
                    top: ly - 3,
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <div style={styles.buttonGroup}>
          <button
            style={mode === 'register' ? { ...styles.button, ...styles.buttonActive } : styles.button}
            onClick={() => setMode('register')}
          >
            Register
          </button>
          <button
            style={mode === 'live' ? { ...styles.button, ...styles.buttonActive } : styles.button}
            onClick={() => setMode('live')}
          >
            Live Face ID
          </button>
        </div>
        {mode === 'register' && (
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={styles.input}
            />
            <button
              style={styles.button}
              onClick={handleRegister}
              disabled={loading || !username}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        )}
        <div style={styles.result}>{mode === 'register' ? result : ''}</div>
      </div>
    </div>
  );
};

export default App; 