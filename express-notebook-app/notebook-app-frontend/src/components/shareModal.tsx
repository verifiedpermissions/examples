import { useEffect, useState } from "react";
import { useNotebooks } from "../state/appState";
import Spinner from "./spinner";
import "./shareModal.css";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    notebookId: string;
}

export default function ShareModal({ isOpen, onClose, notebookId }: ShareModalProps) {
    const { shareNotebook, getNotebookAcl } = useNotebooks();
    const [email, setEmail] = useState("");
    const [isSharing, setIsSharing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sharedWith, setSharedWith] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            loadAcl();
        }
    }, [isOpen]);

    const loadAcl = async () => {
        const acl = await getNotebookAcl(notebookId);
        setSharedWith(acl);
    };

    const handleShare = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSharing(true);
        setError(null);
        
        const updatedAcl = await shareNotebook(notebookId, email);
        if (updatedAcl.length > 0) {
            setEmail("");
            setSharedWith(updatedAcl);
        }
        setIsSharing(false);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Share Notebook</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleShare} className="share-form">
                    <input
                        type="email"
                        placeholder="Enter email address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="share-input"
                        required
                    />
                    <button 
                        type="submit" 
                        className="share-button"
                        disabled={isSharing}
                    >
                        {isSharing ? (
                            <>
                                <Spinner type="dual" size={16} thickness={2} color="#fff" />
                                Sharing...
                            </>
                        ) : (
                            'Share'
                        )}
                    </button>
                </form>

                {error && <p className="error-message">{error}</p>}

                <div className="shared-list">
                    <h3>Shared with:</h3>
                    {sharedWith.length === 0 ? (
                        <p>Not shared with anyone yet</p>
                    ) : (
                        <ul>
                            {sharedWith.map((user, index) => (
                                <li key={index}>{user}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
