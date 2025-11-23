import ReactDOM from 'react-dom';
import { createRoot, hydrateRoot } from 'react-dom/client';

type MutableReactDOM = typeof ReactDOM & {
    createRoot?: typeof createRoot;
    hydrateRoot?: typeof hydrateRoot;
};

const mutableDom = ReactDOM as MutableReactDOM;

if (typeof mutableDom.createRoot !== 'function') {
    mutableDom.createRoot = createRoot;
}

if (typeof mutableDom.hydrateRoot !== 'function') {
    mutableDom.hydrateRoot = hydrateRoot;
}

export {};


