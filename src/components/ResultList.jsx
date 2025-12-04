import { Copy, Trash2, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';

const ResultList = ({ results, onDelete, onCopy }) => {
    const [copiedId, setCopiedId] = useState(null);

    const handleCopy = (id, text) => {
        onCopy(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const isUrl = (text) => {
        try {
            new URL(text);
            return true;
        } catch {
            return false;
        }
    };

    if (results.length === 0) {
        return (
            <div className="result-list">
                <div className="empty-state">
                    <p>No codes scanned yet.</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Start scanning to build your list.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="result-list">
            <div className="list-header">
                <span className="list-count">{results.length} Item{results.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {results.map((item) => (
                    <div key={item.id} className="scan-item">
                        <div className="scan-content">
                            <div className="scan-text" title={item.text}>{item.text}</div>
                            <div className="scan-meta">{item.timestamp}</div>
                        </div>
                        <div className="scan-actions">
                            {isUrl(item.text) && (
                                <a
                                    href={item.text}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-icon"
                                    title="Open URL"
                                >
                                    <ExternalLink size={18} />
                                </a>
                            )}
                            <button
                                className="btn-icon"
                                onClick={() => handleCopy(item.id, item.text)}
                                title="Copy text"
                            >
                                {copiedId === item.id ? <Check size={18} color="var(--success)" /> : <Copy size={18} />}
                            </button>
                            <button
                                className="btn-icon"
                                onClick={() => onDelete(item.id)}
                                title="Delete item"
                                style={{ color: 'var(--danger)' }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ResultList;
