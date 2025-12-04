import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { AlertCircle, SwitchCamera } from 'lucide-react';

const Scanner = ({ onScan, isScanning, onError, scanFeedback }) => {
    const scannerRef = useRef(null);
    const [hasPermission, setHasPermission] = useState(null);
    const [cameras, setCameras] = useState([]);
    const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
    const [initialCameraSet, setInitialCameraSet] = useState(false);

    useEffect(() => {
        if (!isScanning) {
            if (scannerRef.current) {
                const state = scannerRef.current.getState();
                if (state === 2 || state === 3) { // SCANNING or PAUSED
                    scannerRef.current.stop().catch((err) => {
                        console.error("Failed to stop scanner", err);
                    }).finally(() => {
                        scannerRef.current = null;
                        // Clear the reader div to remove any leftover elements
                        const readerDiv = document.getElementById('reader');
                        if (readerDiv) {
                            readerDiv.innerHTML = '';
                        }
                    });
                } else {
                    scannerRef.current = null;
                }
            }
            return;
        }

        const startScanner = async () => {
            try {
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length) {
                    setHasPermission(true);
                    setCameras(devices);

                    // Set back camera as default on first load only
                    let cameraIndex = currentCameraIndex;
                    if (!initialCameraSet) {
                        const backCameraIndex = devices.findIndex(device =>
                            device.label.toLowerCase().includes('back') ||
                            device.label.toLowerCase().includes('rear') ||
                            device.label.toLowerCase().includes('environment')
                        );
                        if (backCameraIndex !== -1) {
                            cameraIndex = backCameraIndex;
                        }
                        setCurrentCameraIndex(cameraIndex);
                        setInitialCameraSet(true);
                    }

                    const selectedCameraId = devices[cameraIndex]?.id || devices[0].id;

                    if (!scannerRef.current) {
                        scannerRef.current = new Html5Qrcode("reader");
                    }

                    // Check if scanner is already running
                    const state = scannerRef.current.getState();
                    if (state === 2 || state === 3) { // Already SCANNING or PAUSED
                        await scannerRef.current.stop();
                    }

                    await scannerRef.current.start(
                        selectedCameraId,
                        {
                            fps: 10,
                            qrbox: 250
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
                const state = scannerRef.current.getState();
                if (state === 2 || state === 3) { // SCANNING or PAUSED
                    scannerRef.current.stop().catch(console.error).finally(() => {
                        scannerRef.current = null;
                    });
                } else {
                    scannerRef.current = null;
                }
            }
        };
    }, [isScanning, currentCameraIndex, onScan, onError, initialCameraSet]);

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
            {scanFeedback && (
                <div className={`scan-feedback scan-feedback-${scanFeedback.type}`}>
                    {scanFeedback.message}
                </div>
            )}
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
                <div className="scanner-paused-overlay">
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
