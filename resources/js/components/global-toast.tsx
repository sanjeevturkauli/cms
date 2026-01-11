import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

interface FlashMessages {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
}

export function GlobalToast() {
    const { props } = usePage<{ flash?: FlashMessages }>();
    const flash = props.flash;
    const lastFlashRef = useRef<string>('');

    useEffect(() => {
        if (!flash) return;

        // Create a unique key for this flash message
        const flashKey = JSON.stringify(flash);
        
        // Prevent duplicate toasts
        // if (flashKey === lastFlashRef.current) return;
        lastFlashRef.current = flashKey;

        if (flash.success) toast.success(flash.success, { id: 'settings-success' });
        if (flash.error) toast.error(flash.error, { id: 'settings-error' });
        if (flash.warning) toast(flash.warning, { id: 'settings-warning' });
        if (flash.info) toast(flash.info, { id: 'settings-info' });
    }, [flash]);

    return null;
}
