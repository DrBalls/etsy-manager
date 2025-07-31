function IndexPopup() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: 16,
        width: 300,
        fontFamily: 'system-ui',
      }}
    >
      <h2>Etsy Store Manager</h2>
      <p>Manage your Etsy store with ease</p>
      <button
        onClick={() => {
          void chrome.tabs.create({ url: 'https://app.etsymanager.com' });
        }}
        style={{
          padding: '8px 16px',
          backgroundColor: '#f1641e',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          marginTop: 12,
        }}
      >
        Open Dashboard
      </button>
    </div>
  );
}

export default IndexPopup;
