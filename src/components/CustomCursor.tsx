
import React, { useEffect, useState } from 'react';

const CustomCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [clicking, setClicking] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(false);

  useEffect(() => {
    // Create cursor elements
    const cursor = document.createElement('div');
    cursor.id = 'custom-cursor';
    document.body.appendChild(cursor);

    const cursorRing = document.createElement('div');
    cursorRing.id = 'custom-cursor-ring';
    document.body.appendChild(cursorRing);

    // Wait a moment before showing cursor (prevents initial jump)
    setTimeout(() => {
      setCursorVisible(true);
      cursor.style.opacity = "1";
      cursorRing.style.opacity = "1";
    }, 500);

    // Mouse move handler
    const onMouseMove = (e: MouseEvent) => {
      // Set cursor position
      setPosition({ x: e.clientX, y: e.clientY });

      // Check if cursor is over a clickable element
      const target = e.target as HTMLElement;
      
      // Detect hoverable elements
      const isHoverable = 
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.tagName === 'INPUT' || 
        target.closest('button') || 
        target.closest('a') ||
        target.closest('input') ||
        target.classList.contains('hoverable');
      
      setHovering(isHoverable ? true : false);
    };

    // Mouse down/up handlers
    const onMouseDown = () => setClicking(true);
    const onMouseUp = () => setClicking(false);

    // Mouse leave/enter handlers
    const onMouseLeave = () => setHidden(true);
    const onMouseEnter = () => setHidden(false);

    // Add event listeners
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    // Remove event listeners on cleanup
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      
      // Clean up cursor elements
      document.body.removeChild(cursor);
      document.body.removeChild(cursorRing);
    };
  }, []);

  // Update cursor styling on state changes
  useEffect(() => {
    const cursor = document.getElementById('custom-cursor');
    const cursorRing = document.getElementById('custom-cursor-ring');

    if (!cursor || !cursorRing) return;
    
    // Position cursors
    cursor.style.transform = `translate(${position.x}px, ${position.y}px)`;
    cursorRing.style.transform = `translate(${position.x}px, ${position.y}px)`;

    // Opacity for visibility
    cursor.style.opacity = cursorVisible ? (hidden ? '0' : '1') : '0';
    cursorRing.style.opacity = cursorVisible ? (hidden ? '0' : '1') : '0';
    
    // Apply clicking class
    if (clicking) {
      cursor.classList.add('clicking');
      cursorRing.classList.add('clicking');
    } else {
      cursor.classList.remove('clicking');
      cursorRing.classList.remove('clicking');
    }
    
    // Apply hovering class
    if (hovering) {
      cursor.classList.add('hovering');
      cursorRing.classList.add('hovering');
    } else {
      cursor.classList.remove('hovering');
      cursorRing.classList.remove('hovering');
    }

    // Add pastel pink color to cursor
    cursor.style.backgroundColor = 'rgba(255, 192, 203, 0.8)'; // Pastel pink with opacity
    cursorRing.style.borderColor = 'rgba(255, 150, 180, 0.5)'; // Lighter pastel pink for ring
    
    // Make cursor slightly larger
    cursor.style.width = '12px'; // Original was probably smaller
    cursor.style.height = '12px'; // Original was probably smaller
    cursorRing.style.width = '32px'; // Original was probably smaller
    cursorRing.style.height = '32px'; // Original was probably smaller
  }, [position, clicking, hovering, hidden, cursorVisible]);

  return null; // Cursor is created in useEffect with DOM API for better performance
};

export default CustomCursor;
