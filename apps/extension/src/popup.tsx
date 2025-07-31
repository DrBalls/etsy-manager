import { useState, useEffect } from 'react';
import { useStorage } from '@plasmohq/storage/hook';
import { sendToBackground } from '@plasmohq/messaging';
import './popup.css';

function IndexPopup() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settings, setSettings] = useStorage('settings', {
    autoSync: true,
    notifications: true,
    syncInterval: 30,
  });
  const [activeTab, setActiveTab] = useState<'home' | 'settings'>('home');
  const [authToken] = useStorage('authToken');

  useEffect(() => {
    setIsAuthenticated(!!authToken);
  }, [authToken]);

  const handleLogin = async () => {
    // Open auth page
    chrome.tabs.create({ url: 'http://localhost:3000/auth/signin?extension=true' });
  };

  const handleLogout = async () => {
    await sendToBackground({
      name: 'save-auth-token',
      body: { token: null },
    });
    setIsAuthenticated(false);
  };

  const updateSettings = async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await sendToBackground({
      name: 'update-settings',
      body: { settings: newSettings },
    });
  };

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>Etsy Store Manager</h1>
        <p className="subtitle">Enhance your Etsy selling experience</p>
      </header>

      <nav className="popup-nav">
        <button
          className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          Home
        </button>
        <button
          className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </nav>

      <main className="popup-content">
        {activeTab === 'home' ? (
          <div className="home-tab">
            {isAuthenticated ? (
              <>
                <div className="status-card authenticated">
                  <div className="status-icon">✓</div>
                  <p>Connected to Store Manager</p>
                </div>

                <div className="quick-actions">
                  <h3>Quick Actions</h3>
                  <button
                    className="action-btn primary"
                    onClick={() => chrome.tabs.create({ url: 'http://localhost:3000/dashboard' })}
                  >
                    Open Dashboard
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => chrome.tabs.create({ url: 'http://localhost:3000/dashboard/listings' })}
                  >
                    Manage Listings
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => chrome.tabs.create({ url: 'http://localhost:3000/dashboard/orders' })}
                  >
                    View Orders
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => chrome.tabs.create({ url: 'http://localhost:3000/dashboard/analytics' })}
                  >
                    Analytics
                  </button>
                </div>

                <div className="tips-section">
                  <h3>Tips</h3>
                  <ul>
                    <li>Right-click on any Etsy listing to access quick actions</li>
                    <li>Use the toolbar on listing pages for instant sync</li>
                    <li>Enable auto-sync to keep your data up to date</li>
                  </ul>
                </div>

                <button className="logout-btn" onClick={handleLogout}>
                  Disconnect
                </button>
              </>
            ) : (
              <div className="auth-section">
                <div className="status-card">
                  <div className="status-icon">🔒</div>
                  <p>Not connected</p>
                </div>
                <p className="auth-message">
                  Connect your Etsy Store Manager account to unlock all features
                </p>
                <button className="action-btn primary" onClick={handleLogin}>
                  Connect Account
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="settings-tab">
            <h3>Extension Settings</h3>
            
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.autoSync}
                  onChange={(e) => updateSettings('autoSync', e.target.checked)}
                />
                <span>Auto-sync data</span>
              </label>
              <p className="setting-description">
                Automatically sync your Etsy data with Store Manager
              </p>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => updateSettings('notifications', e.target.checked)}
                />
                <span>Enable notifications</span>
              </label>
              <p className="setting-description">
                Get notified about new orders and important updates
              </p>
            </div>

            <div className="setting-item">
              <label>
                <span>Sync interval (minutes)</span>
                <select
                  value={settings.syncInterval}
                  onChange={(e) => updateSettings('syncInterval', parseInt(e.target.value))}
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                </select>
              </label>
              <p className="setting-description">
                How often to sync data when auto-sync is enabled
              </p>
            </div>

            <div className="about-section">
              <h4>About</h4>
              <p>Etsy Store Manager Extension v0.1.0</p>
              <p className="links">
                <a href="#" onClick={() => chrome.tabs.create({ url: 'http://localhost:3000/help' })}>
                  Help & Support
                </a>
                {' • '}
                <a href="#" onClick={() => chrome.tabs.create({ url: 'http://localhost:3000/privacy' })}>
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default IndexPopup;