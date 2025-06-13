import React, { useEffect, useRef } from 'react';
import SideNavigation from '@cloudscape-design/components/side-navigation';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const navRef = useRef<HTMLDivElement>(null);

  // Define navigation items based on authentication status
  const homeItem = { type: 'link' as const, text: 'Home', href: '/' };
  const petsItem = { type: 'link' as const, text: 'Pets', href: '/pets' };
  const addPetItem = { type: 'link' as const, text: 'Add New Pet', href: '/pets/new' };

  const items = isAuthenticated 
    ? [homeItem, petsItem, addPetItem]
    : [homeItem];

  // Add click handlers after component mounts
  useEffect(() => {
    if (navRef.current) {
      const links = navRef.current.querySelectorAll('a');
      links.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const href = link.getAttribute('href');
          if (href) {
            navigate(href);
          }
        });
      });
    }
  }, [navigate, isAuthenticated]);

  return (
    <div ref={navRef}>
      <SideNavigation
        activeHref={location.pathname}
        header={{ text: 'Navigation', href: '/' }}
        items={items}
      />
    </div>
  );
};

export default Navigation;
