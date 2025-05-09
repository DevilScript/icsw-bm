
import { createRoot } from 'react-dom/client';
import { lazy, Suspense } from 'react';
import App from './App.tsx';
import './index.css';

// Lazy load the CustomCursor component for better performance
const CustomCursor = lazy(() => import('./components/CustomCursor.tsx'));

// Add class to body for custom cursor
document.body.classList.add('custom-cursor');

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
