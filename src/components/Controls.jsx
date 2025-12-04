import { Download, Copy, Play, Square, Share2 } from 'lucide-react';

const Controls = ({ isScanning, onToggleScan, onDownload, onCopyAll, onShare, hasResults }) => {
    return (
        <div className="controls">
            <button
                className={`btn ${isScanning ? 'btn-danger' : 'btn-primary'}`}
                onClick={onToggleScan}
                style={{ gridColumn: 'span 2' }}
            >
                {isScanning ? (
                    <>
                        <Square size={20} fill="currentColor" /> Stop Scanning
                    </>
                ) : (
                    <>
                        <Play size={20} fill="currentColor" /> Start Scanning
                    </>
                )}
            </button>

            <button
                className="btn btn-secondary"
                onClick={onDownload}
                disabled={!hasResults}
                style={{ opacity: !hasResults ? 0.5 : 1 }}
            >
                <Download size={18} /> CSV
            </button>

            <button
                className="btn btn-secondary"
                onClick={onCopyAll}
                disabled={!hasResults}
                style={{ opacity: !hasResults ? 0.5 : 1 }}
            >
                <Copy size={18} /> Copy List
            </button>
        </div>
    );
};

export default Controls;
