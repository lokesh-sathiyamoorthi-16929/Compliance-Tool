import { useEffect, useState } from 'react';
import { FlaskConical, X } from 'lucide-react';
import ConnectionIndicator from './ConnectionIndicator';

const STORAGE_KEY = 'complianceiq-beta-banner-dismissed-at';
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

interface Props {
  onVisibilityChange: (visible: boolean) => void;
}

export default function BetaBanner({ onVisibilityChange }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const dismissedAtRaw = window.localStorage.getItem(STORAGE_KEY);
    const dismissedAt = dismissedAtRaw ? Number(dismissedAtRaw) : 0;
    const isDismissed = Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISS_MS;
    setVisible(!isDismissed);
    onVisibilityChange(!isDismissed);
  }, [onVisibilityChange]);

  const dismissBanner = () => {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setVisible(false);
    onVisibilityChange(false);
  };

  if (!visible) return null;

  return (
    <div className="h-8 bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-full flex items-center justify-between gap-2">
        <div className="flex-1" />
        <p className="text-xs font-medium text-amber-900 inline-flex items-center gap-1.5 text-center">
          <FlaskConical className="w-4 h-4 text-amber-600" />
          BETA — ComplianceIQ is in evaluation preview. Data is interpretive and not SME-validated.
          See evidence &amp; disclaimer for details.
        </p>
        <ConnectionIndicator />
        <button
          type="button"
          onClick={dismissBanner}
          aria-label="Dismiss beta banner"
          className="text-amber-700 hover:text-amber-900 p-0.5 rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
