import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import ShareModal from "./shareModal";
import { useAuth } from "react-oidc-context";

interface CardProps {
    name: string;
    content: string;
    href: string;
    owner: string;
    public: boolean;
}

export default function Card(props: CardProps) {
    const navigate = useNavigate();
    const { notebookId } = useParams();
    const auth = useAuth();
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const headerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
    };

    const shareButtonStyle = {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        color: '#666',
    };

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't navigate if clicking the share button
        if ((e.target as HTMLElement).closest('button')) {
            e.stopPropagation();
            return;
        }
        navigate(props.href);
    };
    const cardStyle = {
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        margin: '16px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#fff',
        width: '400px',
    };

    const nameStyle = {
        fontSize: '1.2rem',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: '#333',
    };

    const contentStyle = {
        fontSize: '1rem',
        color: '#666',
        lineHeight: '1.5',
    };
    const shouldShowShareButton = notebookId && !props.public && auth.user?.profile.sub === props.owner;

    return (
        <>
            <div
                style={cardStyle}
                onClick={handleCardClick}
            >
                <div style={headerStyle}>
                    <h3 style={{...nameStyle, margin: 0}}>{props.name}</h3>
                    { shouldShowShareButton && (
                        <button 
                            style={shareButtonStyle}
                            onClick={() => setIsShareModalOpen(true)}
                            title="Share notebook"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                                <polyline points="16 6 12 2 8 6"/>
                                <line x1="12" y1="2" x2="12" y2="15"/>
                            </svg>
                        </button>
                    )}
                </div>
                <p style={contentStyle}>{props.content}</p>
            </div>
            {isShareModalOpen && shouldShowShareButton && (
                <ShareModal
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    notebookId={notebookId}
                />
            )}
        </>
    );
}
