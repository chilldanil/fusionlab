import './shared/polyfills/reactDomClient';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { onCLS, onFID, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';
import './index.css';
import { App } from './app/App';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);

const reportWebVitals = (metric: Metric) => {
    console.log(metric);
};

onCLS(reportWebVitals);
onFID(reportWebVitals);
onFCP(reportWebVitals);
onLCP(reportWebVitals);
onTTFB(reportWebVitals);
