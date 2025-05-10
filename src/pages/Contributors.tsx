import React, { useEffect, useState } from 'react';
import { Instagram } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { useLocation } from 'react-router-dom';

const Contributors = () => {
  const location = useLocation();
  const [imageSrc, setImageSrc] = useState('https://i.imgur.com/wjLMuWQ.jpeg');
  const fallbackSrc = '/images/fallback-profile.png'; // Must exist in public/images/

  // Preload image with retry and CSP-compliant fallback
  useEffect(() => {
    let retries = 2;
    const preloadImage = () => {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        console.log('Image preloaded successfully:', imageSrc);
      };
      img.onerror = () => {
        console.error('Failed to preload image:', imageSrc);
        if (retries > 0) {
          retries--;
          setTimeout(preloadImage, 500); // Retry after 500ms
        } else {
          console.log('Switching to fallback image');
          setImageSrc(fallbackSrc);
        }
      };
    };
    if (imageSrc !== fallbackSrc) {
      preloadImage();
    }
  }, [location.pathname, imageSrc]);

  return (
    <>
      <style>
        {`
          @keyframes glow-pulse {
            0% {
              box-shadow: 0 0 10px rgba(236, 72, 153, 0.4), 0 0 20px rgba(236, 72, 153, 0.2);
            }
            50% {
              box-shadow: 0 0 20px rgba(236, 72, 153, 0.8), 0 0 30px rgba(236, 72, 153, 0.4);
            }
            100% {
              box-shadow: 0 0 10px rgba(236, 72, 153, 0.4), 0 0 20px rgba(236, 72, 153, 0.2);
            }
          }

          .profile-glow-effect {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 9999px;
            z-index: 0;
            animation: glow-pulse 2s ease-in-out infinite;
          }
        `}
      </style>

      <section className="py-12 flex justify-center">
        <GlassCard className="feature-card max-w-md w-full text-center hover-scale">
          <h2 className="text-2xl font-bold mb-8 relative inline-block">
            <span className="text-white">Contributors</span>
          </h2>

          <div className="flex flex-col items-center">
            <div className="profile-container relative w-32 h-32 mb-4 overflow-visible transform hover:scale-105 transition-all duration-300">
              <img
                src={imageSrc}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover z-10 relative"
                onLoad={() => console.log('Profile image loaded:', imageSrc)}
                onError={(e) => {
                  console.error('Failed to load profile image:', e.currentTarget.src);
                  e.currentTarget.src = fallbackSrc; // CSP-compliant fallback
                  setImageSrc(fallbackSrc);
                }}
              />
              <div className="profile-glow-effect"></div>
            </div>

            <h3 className="text-2xl font-semibold mb-2 text-white">Mo🍉</h3>
            <p className="text-gray-400 mb-4">Lead Developer</p>

            <a
              href="https://www.instagram.com/mo.icsw/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 rounded-full bg-black/30 border border-pink-300 transition-all duration-300 hover:bg-pink-300/20 hover:-translate-y-1"
            >
              <Instagram size={18} className="mr-2 text-pink-300" />
              <span className="text-white">mo.icsw</span>
            </a>
          </div>
        </GlassCard>
      </section>
    </>
  );
};

export default Contributors;