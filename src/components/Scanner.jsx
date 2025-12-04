import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { AlertCircle } from 'lucide-react';

const Scanner = ({ onScan, isScanning, onError }) => {
    const scannerRef = useRef(null);
    const [hasPermission, setHasPermission] = useState(null);

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
                    const cameraId = devices[0].id; // Use the first camera or prefer back camera

                    // Prefer back camera
                    const backCamera = devices.find(device => device.label.toLowerCase().includes('back'));
                    const selectedCameraId = backCamera ? backCamera.id : cameraId;

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
    }, [isScanning, onScan, onError]);

    return (
        <div className="scanner-container">
            <div id="reader"></div>
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
