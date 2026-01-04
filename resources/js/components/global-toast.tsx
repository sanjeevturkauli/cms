import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
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

    useEffect(() => {
        if (!flash) return;

        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
        if (flash.warning) toast(flash.warning);
        if (flash.info) toast(flash.info);
    }, [flash]);

    return null;
}
