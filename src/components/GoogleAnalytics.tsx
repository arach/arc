import { useEffect } from 'react';

const GA_MEASUREMENT_ID = 'G-GSHDZPFRZG';

export function GoogleAnalytics() {
  useEffect(() => {
    // Check if gtag already exists
    if (typeof window.gtag !== 'undefined') {
      return;
    }

    // Load gtag script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize gtag
    script.onload = () => {
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(args);
      }
      (window as any).gtag = gtag;
      gtag('js', new Date());
      gtag('config', GA_MEASUREMENT_ID);
    };

    return () => {
      // Cleanup if needed
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return null;
}
