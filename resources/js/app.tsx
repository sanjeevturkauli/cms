import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GlobalToast } from './components/global-toast';
import { initializeTheme } from './hooks/use-appearance';
import { Toaster } from 'react-hot-toast';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),

    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),

    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props}>
                    {({ Component, key, props: pageProps }) => (
                        <>
                            <Component key={key} {...pageProps} />
                            <Toaster position={'top-right'}/>
                            <GlobalToast />
                        </>
                    )}
                </App>
            </StrictMode>,
        );
    },

    progress: {
        color: '#4B5563',
    },
});

// Apply light / dark mode on load
initializeTheme();
