import { useEffect } from 'react';
import PageLoader from '@/components/PageLoader';

const SsoRelayRedirect = () => {
    useEffect(() => {
        window.location.replace(`/auth/sso${window.location.search || ''}`);
    }, []);

    return <PageLoader />;
};

export default SsoRelayRedirect;
