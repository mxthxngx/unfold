import './App.css';

import { useEffect, useState } from 'react';
import { RouterProvider } from '@tanstack/react-router';

import { BOOT_SPLASH_MIN_DURATION_MS, BootSplash } from '@/components/common/boot-splash';
import { GlobalSelectionHighlighter } from '@/components/common/global-selection-highlighter';
import { EditorProvider } from '@/contexts/EditorContext';
import { FileSystemProvider } from '@/contexts/FileSystemContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { router } from '@/router';

const SPLASH_EXIT_DURATION_MS = 200;

function isDocumentReady() {
  return document.readyState !== 'loading';
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isSplashExiting, setIsSplashExiting] = useState(false);
  const [isMinimumElapsed, setIsMinimumElapsed] = useState(false);
  const [isAppReady, setIsAppReady] = useState(() => isDocumentReady());

  useEffect(() => {
    const minimumTimerId = window.setTimeout(() => {
      setIsMinimumElapsed(true);
    }, BOOT_SPLASH_MIN_DURATION_MS);

    return () => {
      window.clearTimeout(minimumTimerId);
    };
  }, []);

  useEffect(() => {
    if (isAppReady) {
      return;
    }

    const handleReady = () => setIsAppReady(true);
    window.addEventListener('DOMContentLoaded', handleReady);
    window.addEventListener('load', handleReady);

    return () => {
      window.removeEventListener('DOMContentLoaded', handleReady);
      window.removeEventListener('load', handleReady);
    };
  }, [isAppReady]);

  useEffect(() => {
    if (!showSplash || isSplashExiting || !isMinimumElapsed || !isAppReady) {
      return;
    }

    setIsSplashExiting(true);
    const removeTimerId = window.setTimeout(() => {
      setShowSplash(false);
    }, SPLASH_EXIT_DURATION_MS);

    return () => {
      window.clearTimeout(removeTimerId);
    };
  }, [isAppReady, isMinimumElapsed, isSplashExiting, showSplash]);

  return (
    <>
      <ThemeProvider>
        <FileSystemProvider>
          <GlobalSelectionHighlighter />
          <EditorProvider>
            <RouterProvider router={router} />
          </EditorProvider>
        </FileSystemProvider>
      </ThemeProvider>
      {showSplash && <BootSplash exiting={isSplashExiting} />}
    </>
  );
}

export default App;
