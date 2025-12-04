import { useState, useEffect, useCallback } from 'react';
import Scanner from './components/Scanner';
import ResultList from './components/ResultList';
import Controls from './components/Controls';
import { Share2, QrCode } from 'lucide-react';

function App() {
  const [scannedCodes, setScannedCodes] = useState(() => {
    const saved = localStorage.getItem('qr-scanned-codes');
    return saved ? JSON.parse(saved) : [];
  });
  const [isScanning, setIsScanning] = useState(false);
  const [toast, setToast] = useState(null);
  const [scanFeedback, setScanFeedback] = useState(null);

  useEffect(() => {
    localStorage.setItem('qr-scanned-codes', JSON.stringify(scannedCodes));
  }, [scannedCodes]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 5000);
  };

  const showScanFeedback = (message, type = 'success') => {
    setScanFeedback({ message, type });
    setTimeout(() => setScanFeedback(null), 2000);
  };

  const playBeep = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const handleScan = useCallback((text) => {
    // Check for duplicates in the last few seconds to prevent rapid firing on same code
    // But we want to allow scanning same code again if user wants, just not instantly?
    // User requirement: "Continuous scanning... Duplicate detection... Already scanned indication"

    setScannedCodes(prev => {
      const exists = prev.find(item => item.text === text);
      if (exists) {
        // Already scanned
        // We can just show a toast "Already scanned!" and NOT add it
        // Or maybe just flash it.
        // Let's prevent adding duplicate to list, but notify user.
        // We need to throttle this notification so it doesn't spam.
        return prev;
      }

      playBeep();
      const newItem = {
        id: Date.now(),
        text,
        timestamp: new Date().toLocaleString()
      };
      return [newItem, ...prev];
    });

    // We need a way to know if it WAS a duplicate to show feedback
    // Since setScannedCodes is async/functional, we check current state
    // But we can't easily access it inside the callback without ref or dependency
    // Let's use a check against the latest state in a separate effect or just check here?
    // Actually, the functional update is best for state integrity.
    // To show "Already scanned", we can check `scannedCodes` (from closure) but it might be stale if scanning fast.
    // However, for a user holding a camera, stale by 1 render is fine.

    // Better approach: Check existence before setScannedCodes using the state from closure? 
    // No, closure state is stale.
    // Let's use a ref to track scanned codes for instant lookup?
    // Or just trust that if it didn't beep, it was duplicate.
    // Let's add a "Last Scanned" ref to avoid spamming "Already scanned" toast.
  }, []);

  // Ref for duplicate check to trigger side effects (toast)
  const lastScannedRef = useState(null); // actually use ref
  // We need to implement the duplicate check logic properly inside the callback

  const handleScanLogic = (text) => {
    const isDuplicate = scannedCodes.some(item => item.text === text);

    setScannedCodes(prev => {
      const exists = prev.find(item => item.text === text);
      if (exists) {
        return prev;
      }
      playBeep();
      return [{
        id: Date.now(),
        text,
        timestamp: new Date().toLocaleString()
      }, ...prev];
    });

    if (isDuplicate) {
      const now = Date.now();
      if (!window.lastDuplicateToast || now - window.lastDuplicateToast > 2000) {
        showScanFeedback("Already scanned!", "error");
        window.lastDuplicateToast = now;
      }
    } else {
      showScanFeedback("Scan successful!", "success");
    }
  };

  const handleDelete = (id) => {
    setScannedCodes(prev => prev.filter(item => item.id !== id));
  };

  const handleClearAll = () => {
    setScannedCodes([]);
    showToast("All items cleared!");
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleCopyAll = () => {
    const allText = scannedCodes.map(item => item.text).join('\n');
    navigator.clipboard.writeText(allText);
    showToast("All codes copied to clipboard!");
  };

  const handleDownload = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Timestamp,Content\n"
      + scannedCodes.map(e => `"${e.timestamp}","${e.text.replace(/"/g, '""')}"`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "scanned_codes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'QR Scanner App',
      text: 'Check out this QR Scanner App!',
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast("App URL copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  return (
    <>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <QrCode size={24} color="var(--primary)" />
          <h1>QR Scanner</h1>
        </div>
        <button className="btn-icon" onClick={handleShare} title="Share App">
          <Share2 size={20} />
        </button>
      </div>

      <Scanner
        isScanning={isScanning}
        onScan={handleScanLogic}
        onError={(err) => showToast(err)}
        scanFeedback={scanFeedback}
      />

      <Controls
        isScanning={isScanning}
        onToggleScan={() => setIsScanning(!isScanning)}
        onDownload={handleDownload}
        onCopyAll={handleCopyAll}
        onShare={handleShare}
        hasResults={scannedCodes.length > 0}
      />

      <ResultList
        results={scannedCodes}
        onDelete={handleDelete}
        onCopy={handleCopy}
        onClearAll={handleClearAll}
      />

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

export default App;
