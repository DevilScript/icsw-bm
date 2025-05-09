
import { createRoot } from 'react-dom/client';
import { lazy, Suspense } from 'react';
import App from './App.tsx';
import './index.css';

// Lazy load the CustomCursor component for better performance
const CustomCursor = lazy(() => import('./components/CustomCursor.tsx'));

// Add class to body for custom cursor
document.body.classList.add('custom-cursor');

// Add custom cursor styles
const style = document.createElement('style');
style.textContent = `
  /* Hide default cursor */
  .custom-cursor, 
  .custom-cursor * {
    cursor: none !important;
  }
  
  /* Custom cursor dot */
  #custom-cursor {
    position: fixed;
    width: 12px;
    height: 12px;
    background-color: rgba(255, 192, 203, 0.8); /* Pastel pink */
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    transition: transform 0.1s, width 0.2s, height 0.2s, background-color 0.2s;
    transform: translate(-50%, -50%);
    opacity: 0;
  }
  
  /* Custom cursor ring */
  #custom-cursor-ring {
    position: fixed;
    width: 32px;
    height: 32px;
    border: 2px solid rgba(255, 150, 180, 0.5); /* Lighter pastel pink */
    border-radius: 50%;
    pointer-events: none;
    z-index: 9998;
    transition: width 0.2s, height 0.2s, border-color 0.3s, transform 0.15s;
    transform: translate(-50%, -50%);
    opacity: 0;
  }
  
  /* Hover state */
  #custom-cursor.hovering {
    transform: translate(-50%, -50%) scale(1.2);
    background-color: rgba(255, 150, 180, 0.9); /* Brighter pink on hover */
  }
  
  #custom-cursor-ring.hovering {
    width: 38px;
    height: 38px;
    border-color: rgba(255, 120, 170, 0.7); /* Even brighter pink on hover */
    transition: width 0.2s, height 0.2s, border-color 0.3s;
  }
  
  /* Click state */
  #custom-cursor.clicking {
    transform: translate(-50%, -50%) scale(0.8);
  }
  
  #custom-cursor-ring.clicking {
    transform: translate(-50%, -50%) scale(0.9);
  }
`;
document.head.appendChild(style);

// Create root element
const root = createRoot(document.getElementById("root")!);

// Render app with CustomCursor
root.render(
  <>
    <Suspense fallback={null}>
      <CustomCursor />
    </Suspense>
    <App />
  </>
);
