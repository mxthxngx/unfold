import './App.css';

import { useEffect } from 'react';
import { RouterProvider } from '@tanstack/react-router';

import { GlobalSelectionHighlighter } from '@/components/common/global-selection-highlighter';
import { EditorProvider } from '@/contexts/EditorContext';
import { FileSystemProvider } from '@/contexts/FileSystemContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { router } from '@/router';

function App() {
  useEffect(() => {
    const splash = document.getElementById('boot-splash');
    if (!splash) {
      return;
    }

    let rafA = 0;
    let rafB = 0;
    let timeoutId = 0;

    rafA = window.requestAnimationFrame(() => {
      rafB = window.requestAnimationFrame(() => {
        splash.classList.add('is-hidden');
        timeoutId = window.setTimeout(() => splash.remove(), 940);
      });
    });

    return () => {
      window.cancelAnimationFrame(rafA);
      window.cancelAnimationFrame(rafB);
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <ThemeProvider>
      <FileSystemProvider>
        <GlobalSelectionHighlighter />
        <EditorProvider>
          <RouterProvider router={router} />
        </EditorProvider>
      </FileSystemProvider>
    </ThemeProvider>
  );
}

export default App;
