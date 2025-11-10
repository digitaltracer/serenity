import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
// Package and bundle Inter (Google Font) locally via @fontsource to remain CSP-compliant
import '@fontsource/inter/index.css';

const container = document.getElementById('root')!;
const root = createRoot(container);

root.render(<App />);
