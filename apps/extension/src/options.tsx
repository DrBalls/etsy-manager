import React, { useState, useEffect } from 'react';
import { Storage } from '@plasmohq/storage';

const storage = new Storage();

export default function Options() {
  const [apiUrl, setApiUrl] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [settings, setSettings] = useState({
    autoSync: true,
    notifications: true,
    syncInterval: 30,
    competitionAnalysis: true,
    bulkActions: true,
    quickEdit: true,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const [savedApiUrl, savedToken, savedSettings] = await Promise.all([
      storage.get('apiUrl'),
      storage.get('authToken'),
      storage.get('settings'),
    ]);

    if (savedApiUrl) setApiUrl(savedApiUrl);
    if (savedToken) setAuthToken(savedToken);
    if (savedSettings) setSettings({ ...settings, ...savedSettings });
  };

  const saveSettings = async () => {
    await Promise.all([
      storage.set('apiUrl', apiUrl),
      storage.set('authToken', authToken),
      storage.set('settings', settings),
    ]);

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <div className="options-container">
      <header className="options-header">
        <h1>Etsy Store Manager Extension Settings</h1>
      </header>

      <main className="options-content">
        <section className="section">
          <h2>Connection Settings</h2>
          
          <div className="form-group">
            <label htmlFor="apiUrl">API URL</label>
            <input
              id="apiUrl"
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.etsymanager.com"
            />
            <p className="help-text">
              The URL of your Etsy Store Manager instance
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="authToken">Authentication Token</label>
            <input
              id="authToken"
              type="password"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              placeholder="Enter your auth token"
            />
            <p className="help-text">
              Get this from your Etsy Store Manager dashboard
            </p>
          </div>
        </section>

        <section className="section">
          <h2>Feature Settings</h2>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.autoSync}
                onChange={(e) => handleSettingChange('autoSync', e.target.checked)}
              />
              <span>Automatic Sync</span>
            </label>
            <p className="help-text">
              Automatically sync changes between Etsy and your dashboard
            </p>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => handleSettingChange('notifications', e.target.checked)}
              />
              <span>Desktop Notifications</span>
            </label>
            <p className="help-text">
              Receive notifications for new orders and messages
            </p>
          </div>

          <div className="setting-item">
            <label>
              <span>Sync Interval</span>
              <select
                value={settings.syncInterval}
                onChange={(e) => handleSettingChange('syncInterval', parseInt(e.target.value))}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
              </select>
            </label>
            <p className="help-text">
              How often to check for updates
            </p>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.competitionAnalysis}
                onChange={(e) => handleSettingChange('competitionAnalysis', e.target.checked)}
              />
              <span>Competition Analysis</span>
            </label>
            <p className="help-text">
              Show competition analysis on search pages
            </p>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.bulkActions}
                onChange={(e) => handleSettingChange('bulkActions', e.target.checked)}
              />
              <span>Bulk Actions</span>
            </label>
            <p className="help-text">
              Enable bulk operations on listings page
            </p>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.quickEdit}
                onChange={(e) => handleSettingChange('quickEdit', e.target.checked)}
              />
              <span>Quick Edit</span>
            </label>
            <p className="help-text">
              Add quick edit buttons to listing pages
            </p>
          </div>
        </section>

        <div className="actions">
          <button className="btn btn-primary" onClick={saveSettings}>
            Save Settings
          </button>
          {saved && <span className="success-message">Settings saved!</span>}
        </div>
      </main>

      <style jsx>{`
        .options-container {
          width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #222;
        }

        .options-header {
          margin-bottom: 40px;
        }

        .options-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }

        .section {
          margin-bottom: 40px;
          padding: 24px;
          background: white;
          border: 1px solid #e1e3df;
          border-radius: 8px;
        }

        .section h2 {
          margin: 0 0 24px 0;
          font-size: 20px;
          font-weight: 600;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .form-group input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e1e3df;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-group input:focus {
          outline: none;
          border-color: #f1641e;
        }

        .help-text {
          margin: 4px 0 0;
          font-size: 13px;
          color: #595959;
        }

        .setting-item {
          margin-bottom: 20px;
        }

        .setting-item label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-weight: 500;
        }

        .setting-item input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .setting-item select {
          margin-left: 10px;
          padding: 6px 10px;
          border: 1px solid #e1e3df;
          border-radius: 4px;
          font-size: 14px;
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #f1641e;
          color: white;
        }

        .btn-primary:hover {
          background: #d9531a;
        }

        .success-message {
          color: #4caf50;
          font-size: 14px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}