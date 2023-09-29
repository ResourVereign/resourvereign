import { PrimeReactProvider } from 'primereact/api';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import ResourVereignApp from './ResourVereignApp';
import './i18n';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <PrimeReactProvider>
        <ResourVereignApp />
      </PrimeReactProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
