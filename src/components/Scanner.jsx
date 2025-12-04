import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { AlertCircle, SwitchCamera } from 'lucide-react';

const Scanner = ({ onScan, isScanning, onError }) => {
    const scannerRef = useRef(null);
    const [hasPermission, setHasPermission] = useState(null);
    const [cameras, setCameras] = useState([]);
    const [currentCameraIndex, setCurrentCameraIndex] = useState(0);

    useEffect(() => {
        if (!isScanning) {
            if (scannerRef.current) {
                scannerRef.current.stop().catch((err) => {
                    console.error("Failed to stop scanner", err);
                });
                scannerRef.current = null;
            }
            return;
        }

        const startScanner = async () => {
            try {
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length) {
                    setHasPermission(true);
                    setCameras(devices);

                    // Prefer back camera on first load
                    let initialIndex = 0;
                    const backCameraIndex = devices.findIndex(device =>
                        device.label.toLowerCase().includes('back')
                    );
                    if (backCameraIndex !== -1) {
                        initialIndex = backCameraIndex;
                        setCurrentCameraIndex(initialIndex);
                    }

                    const selectedCameraId = devices[currentCameraIndex]?.id || devices[0].id;

                    if (!scannerRef.current) {
                        scannerRef.current = new Html5Qrcode("reader");
                    }

                    await scannerRef.current.start(
                        selectedCameraId,
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                            aspectRatio: 1.0
                        },
                        (decodedText, decodedResult) => {
                            onScan(decodedText);
                        },
                        (errorMessage) => {
                            // parse error, ignore it.
                        }
                    );
                } else {
                    setHasPermission(false);
                    onError("No cameras found.");
                }
            } catch (err) {
                setHasPermission(false);
                onError("Camera permission denied or error accessing camera.");
                console.error(err);
            }
        };

        startScanner();

        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(console.error);
                scannerRef.current = null;
            }
        };
    }, [isScanning, currentCameraIndex, onScan, onError]);

    const handleSwitchCamera = async () => {
        if (cameras.length <= 1) return;

        // Stop current scanner
        if (scannerRef.current) {
            await scannerRef.current.stop();
            scannerRef.current = null;
        }

        // Switch to next camera
        const nextIndex = (currentCameraIndex + 1) % cameras.length;
        setCurrentCameraIndex(nextIndex);
    };

    return (
        <div className="scanner-container">
            <div id="reader"></div>
            {isScanning && cameras.length > 1 && (
                <button
                    className="camera-switch-btn"
                    onClick={handleSwitchCamera}
                    title="Switch Camera"
                >
                    <SwitchCamera size={24} />
                </button>
            )}
            {!isScanning && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', backgroundColor: 'rgba(0,0,0,0.7)'
                }}>
                    <p>Scanner Paused</p>
                </div>
            )}
            {hasPermission === false && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    color: '#ef4444', backgroundColor: '#000', padding: '1rem', textAlign: 'center'
                }}>
                    <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
                    <p>Camera access required.</p>
                </div>
            )}
        </div>
    );
};

export default Scanner;
