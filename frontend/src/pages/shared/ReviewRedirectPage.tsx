import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reviewLinksApi } from '../../lib/enterpriseApi';
import { ShieldCheck, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';

export const ReviewRedirectPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError('Invalid review link invitation.');
      setLoading(false);
      return;
    }

    reviewLinksApi
      .redeem(token)
      .then((res) => {
        if (res.targetUrl) {
          // One-time token consumed successfully, redirect to external site
          window.location.href = res.targetUrl;
        }
      })
      .catch((err) => {
        setError(
          err.response?.data?.message ||
            'This single-use review link has expired or has already been used.'
        );
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
        {loading ? (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verifying Review Invitation...</h2>
            <p className="text-xs text-slate-500">
              Securing single-use platform link and redirecting you to submit feedback.
            </p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Link No Longer Available</h2>
            <p className="text-sm text-slate-500">{error}</p>
            <a
              href="/"
              className="inline-block px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold"
            >
              Return to Homepage
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ReviewRedirectPage;
