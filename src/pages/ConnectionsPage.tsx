import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, Wifi, WifiOff, ExternalLink, LayoutDashboard, RefreshCw, AlertCircle,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface ProductCardProps {
  productKey: 'log360' | 'ad360';
  name: string;
  description: string;
  color: string;
  apiDocsUrl: string;
  placeholder: string;
}

function ProductCard({
  productKey,
  name,
  description,
  color,
  apiDocsUrl,
  placeholder,
}: ProductCardProps) {
  const { connections, updateConnection, disconnectProduct } = useAppStore();
  const conn = connections[productKey];

  const [serverUrl, setServerUrl] = useState(conn.serverUrl);
  const [apiKey, setApiKey] = useState(conn.apiKey);

  const handleTest = () => {
    updateConnection(productKey, { testing: true });
    setTimeout(() => {
      updateConnection(productKey, {
        connected: true,
        testing: false,
        serverUrl,
        apiKey,
        lastSync: new Date().toLocaleString(),
      });
    }, 2000);
  };

  const handleDisconnect = () => {
    disconnectProduct(productKey);
    setServerUrl('');
    setApiKey('');
  };

  return (
    <div className="card p-6" style={{ borderTop: `4px solid ${color}` }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{name}</h3>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${
          conn.connected
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-slate-50 text-slate-500 border-slate-200'
        }`}>
          {conn.connected ? '● Connected' : '○ Not Connected'}
        </div>
      </div>

      {conn.connected ? (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">Connected Successfully</span>
            </div>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>Server:</strong> {conn.serverUrl}</p>
              <p><strong>Last sync:</strong> {conn.lastSync}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => updateConnection(productKey, { lastSync: new Date().toLocaleString() })}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Sync Now
            </button>
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
            >
              <WifiOff className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Server URL</label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="••••••••••••••••"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleTest}
            disabled={conn.testing || !serverUrl || !apiKey}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: conn.testing ? '#94a3b8' : color,
              color: 'white',
            }}
          >
            {conn.testing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4" />
                Test Connection
              </>
            )}
          </button>
          <a
            href={apiDocsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
          >
            <ExternalLink className="w-4 h-4" />
            API Documentation
          </a>
        </div>
      )}
    </div>
  );
}

export default function ConnectionsPage() {
  const { connections } = useAppStore();
  const anyConnected = connections.log360.connected || connections.ad360.connected;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Product Connections</h1>
        <p className="text-slate-500 mt-1">
          Connect your ManageEngine products to enable live compliance assessment.
        </p>
      </div>

      {/* Demo notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Demo Mode</p>
          <p className="text-sm text-blue-700 mt-0.5">
            Connections are simulated. No actual API calls are made in this MVP. The "Test Connection"
            button will always succeed after a 2-second delay to demonstrate the UI flow.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ProductCard
          productKey="log360"
          name="Log360"
          description="Unified SIEM with log management, threat detection, and compliance reporting."
          color="#e11d48"
          apiDocsUrl="https://www.manageengine.com/log-management/help/api-settings/"
          placeholder="https://log360.yourcompany.com:8085"
        />
        <ProductCard
          productKey="ad360"
          name="AD360"
          description="Integrated IAM solution with MFA, SSO, user provisioning, and access governance."
          color="#059669"
          apiDocsUrl="https://www.manageengine.com/active-directory-360/help/admin/general-settings/rest-apis.html"
          placeholder="https://ad360.yourcompany.com:8082"
        />
      </div>

      {anyConnected && (
        <div className="card p-6 bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <h3 className="font-bold text-slate-900">Ready to Run Assessment</h3>
          </div>
          <p className="text-slate-600 text-sm mb-4">
            At least one product is connected. You can now view your compliance score dashboard.
          </p>
          <Link to="/dashboard" className="btn-primary">
            <LayoutDashboard className="w-4 h-4" />
            View Compliance Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
