import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import App from '@/App';
import { initializeApp } from '@/app/bootstrap/initializeApp';
import { Toaster } from '@/components/ui/toaster';
import { store } from '@/store';
import '@/index.css';

// daily-checkin is served under /daily-checkin by the gateway. The router
// basename must match vite `base` (import.meta.env.BASE_URL = '/daily-checkin/').
// Drop the trailing slash for the React Router basename (e.g. '/daily-checkin') -
// same as MTSS's own main.jsx does for '/mtss/'. Every existing
// navigate()/<Link to> call keeps working unchanged once this is set -
// React Router applies the prefix transparently, and useLocation().pathname
// already strips it back off.
const ROUTER_BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '');

initializeApp(store);

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Provider store={store}>
            <BrowserRouter basename={ROUTER_BASENAME}>
                <App />
                <Toaster />
            </BrowserRouter>
        </Provider>
    </React.StrictMode>
);
