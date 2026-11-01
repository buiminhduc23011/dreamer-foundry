import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Đảm bảo icon tab trình duyệt luôn là logo DBI, phá vỡ cache cũ của Chrome
(() => {
  try {
    const head = document.head;
    const oldIcons = head.querySelectorAll("link[rel*='icon']");
    oldIcons.forEach((el) => el.remove());

    const linkSvg = document.createElement('link');
    linkSvg.rel = 'icon';
    linkSvg.type = 'image/svg+xml';
    linkSvg.href = '/dbi-logo.svg?v=2';
    head.appendChild(linkSvg);

    const linkPng = document.createElement('link');
    linkPng.rel = 'alternate icon';
    linkPng.type = 'image/png';
    linkPng.href = '/favicon-32x32.png?v=2';
    head.appendChild(linkPng);
  } catch {
    // ignore
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
