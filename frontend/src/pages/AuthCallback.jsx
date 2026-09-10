import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/slices/authSlice';
import PageLoader from '../components/PageLoader';
import { consumePendingRedirect, getDefaultPostLoginPath, sanitizeRedirectPath } from '@/utils/authRedirect';
import { setStoredAuthSession } from '@/utils/authStorage';

const AuthCallback = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // No token here anymore - the backend already set it as an
                // httpOnly cookie before this redirect (routes/auth.js).
                // user/redirect are just UI convenience data.
                const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
                const userData = hashParams.get('user');

                if (!userData) {
                    navigate('/?error=missing_data');
                    return;
                }

                // Parse user data from hash fragment payload
                const userFromQuery = JSON.parse(decodeURIComponent(userData));

                // Use OAuth callback payload directly to avoid auth reset loops.
                let canonicalUser = userFromQuery;

                // Ensure the user has required role field
                if (!canonicalUser.role) {
                    navigate('/?error=missing_role');
                    return;
                }

                setStoredAuthSession({ user: canonicalUser });
                dispatch(loginSuccess({ user: canonicalUser }));

                const redirectParam = hashParams.get('redirect');
                const safeRedirect = sanitizeRedirectPath(redirectParam);
                const pendingRedirect = consumePendingRedirect();
                const target = pendingRedirect || safeRedirect || getDefaultPostLoginPath(canonicalUser);

                // Remove the user/redirect params from the URL before leaving callback route.
                // BASE_URL already ends with '/' (vite.config.js), so this
                // joins cleanly into '/daily-checkin/auth/callback' in
                // production or '/auth/callback' in standalone local dev -
                // this bypasses React Router, so it needs the prefix added
                // explicitly rather than getting it from a basename.
                window.history.replaceState({}, document.title, `${import.meta.env.BASE_URL}auth/callback`);
                navigate(target, { replace: true });

            } catch (error) {
                console.error('Auth callback error:', error);
                navigate('/?error=callback_failed');
            }
        };

        handleCallback();
    }, [navigate, dispatch]);

    return <PageLoader />;
};

export default AuthCallback;
