import { useAuth } from 'react-oidc-context';
import { Link, useLocation } from 'react-router-dom';

export default function Sidenav() {
    const location = useLocation();
    const auth = useAuth();
    
    return (
        <div className="sidenav">
            <h2>Notebooks</h2>
            <Link 
                to="/" 
                className={`sidenav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
                My Notebooks
            </Link>
            <Link 
                to="/shared" 
                className={`sidenav-link ${location.pathname === '/shared' ? 'active' : ''}`}
            >
                Shared with me
            </Link>
            <div className="sidenav-footer">
                {
                    auth.user?.profile.email
                        ? <p>Logged in as {auth.user?.profile.email}</p>
                        : null
                }
                <button onClick={() => auth.signoutRedirect()}>Logout</button>
            </div>
        </div>
    );
}
