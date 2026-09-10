import { useEffect } from 'react';

/**
 * Custom hook to set document title dynamically per route
 * @param {string} title - The page title (will be appended to "PawTrack OS")
 * @param {boolean} [keepOnUnmount=false] - Whether to keep the title when component unmounts
 * 
 * @example
 * useDocumentTitle('Dashboard'); // Sets title to "Dashboard | PawTrack OS"
 */
export function useDocumentTitle(title, keepOnUnmount = false) {
  useEffect(() => {
    const prevTitle = document.title;
    
    if (title) {
      document.title = `${title} | PawTrack OS`;
    }

    // Reset to default title on unmount (unless keepOnUnmount is true)
    return () => {
      if (!keepOnUnmount) {
        document.title = prevTitle;
      }
    };
  }, [title, keepOnUnmount]);
}

export default useDocumentTitle;
