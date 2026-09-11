import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/slices/authSlice';
import PageLoader from '../components/PageLoader';
import { consumePendingRedirect, getDefaultPostLoginPath, sanitizeRedirectPath } from '@/utils/authRedirect';
import { setStoredAuthSession } from '@/utils/authStorage';

const AuthCallback = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const ranRef = useRef(false);

    useEffect(() => {
        // React.StrictMode (dev only) double-invokes effects. This one reads
        // the #user= hash then strips it via replaceState - a second run
        // reads back an already-cleared hash and misreports missing_data,
        // even though the first run's login already succeeded. Guard so
        // only the first invocation actually runs.
        if (ranRef.current) return;
        ranRef.current = true;

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

                // Running inside a hidden iframe (a silent Hub relogin
                // attempt - see utils/hubSilentLogin.js) means the parent
                // tab is waiting to hear whether this landed. Its own
                // navigate() below only affects this iframe's own history,
                // invisible to the parent, so tell it directly instead of
                // making it guess via a timeout.
                if (window.parent !== window) {
                    window.parent.postMessage({ type: 'MWS_HUB_SILENT_LOGIN_SUCCESS' }, window.location.origin);
                }

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
