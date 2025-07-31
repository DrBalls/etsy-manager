import React, { useState, useEffect } from 'react';

interface CompetitorData {
  title: string;
  price: number;
  sales: number;
  favorites: number;
  rating: number;
  url: string;
}

interface AnalysisResults {
  avgPrice: number;
  priceRange: { min: number; max: number };
  avgSales: number;
  topKeywords: string[];
  pricePositioning: string;
  recommendations: string[];
}

export const CompetitionAnalyzer: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);

  useEffect(() => {
    analyzeCurrentPage();
  }, []);

  const analyzeCurrentPage = async () => {
    setIsAnalyzing(true);
    
    try {
      // Extract competitor data from the page
      const listings = document.querySelectorAll('.v2-listing-card');
      const competitorData: CompetitorData[] = [];

      listings.forEach((listing, index) => {
        if (index >= 10) return; // Analyze top 10 listings only

        const titleEl = listing.querySelector('.v2-listing-card__title');
        const priceEl = listing.querySelector('.currency-value');
        const salesEl = listing.querySelector('.text-caption');
        const ratingEl = listing.querySelector('.stars-svg');
        
        if (titleEl && priceEl) {
          competitorData.push({
            title: titleEl.textContent || '',
            price: parseFloat(priceEl.textContent?.replace(/[^0-9.]/g, '') || '0'),
            sales: parseInt(salesEl?.textContent?.match(/\d+/)?.[0] || '0'),
            favorites: 0, // Would need additional API call
            rating: ratingEl ? 5 : 0,
            url: (listing as HTMLElement).querySelector('a')?.href || '',
          });
        }
      });

      setCompetitors(competitorData);

      // Perform analysis
      const analysis = performAnalysis(competitorData);
      setResults(analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const performAnalysis = (data: CompetitorData[]): AnalysisResults => {
    const prices = data.map(d => d.price);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    const avgSales = data.reduce((a, b) => a + b.sales, 0) / data.length;

    // Extract keywords from titles
    const allWords = data.flatMap(d => 
      d.title.toLowerCase().split(/\s+/).filter(word => word.length > 3)
    );
    const wordFreq = allWords.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topKeywords = Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    // Determine price positioning
    let pricePositioning = 'competitive';
    if (avgPrice < 20) pricePositioning = 'budget';
    else if (avgPrice > 50) pricePositioning = 'premium';

    // Generate recommendations
    const recommendations = [
      `Price your items between $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)} to stay competitive`,
      `Focus on these popular keywords: ${topKeywords.slice(0, 5).join(', ')}`,
      avgSales > 100 ? 'This is a high-demand category - consider increasing inventory' : 'Consider testing demand with limited inventory',
      'Add professional photos to match competitor presentation',
    ];

    return {
      avgPrice,
      priceRange: { min: minPrice, max: maxPrice },
      avgSales,
      topKeywords,
      pricePositioning,
      recommendations,
    };
  };

  if (isAnalyzing) {
    return (
      <div className="competition-analyzer">
        <div className="analyzer-loading">
          <div className="spinner"></div>
          <p>Analyzing competition...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  return (
    <div className="competition-analyzer">
      <div className="analyzer-header">
        <h3>Competition Analysis</h3>
        <button className="close-btn" onClick={() => setResults(null)}>×</button>
      </div>

      <div className="analyzer-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">${results.avgPrice.toFixed(2)}</div>
            <div className="stat-label">Average Price</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              ${results.priceRange.min.toFixed(2)} - ${results.priceRange.max.toFixed(2)}
            </div>
            <div className="stat-label">Price Range</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{results.avgSales.toFixed(0)}</div>
            <div className="stat-label">Avg Sales</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{results.pricePositioning}</div>
            <div className="stat-label">Market Position</div>
          </div>
        </div>

        <div className="keywords-section">
          <h4>Top Keywords</h4>
          <div className="keywords-list">
            {results.topKeywords.map((keyword, index) => (
              <span key={index} className="keyword-tag">
                {keyword}
              </span>
            ))}
          </div>
        </div>

        <div className="recommendations-section">
          <h4>Recommendations</h4>
          <ul>
            {results.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>

        <div className="competitors-section">
          <h4>Top Competitors ({competitors.length})</h4>
          <div className="competitors-list">
            {competitors.slice(0, 5).map((comp, index) => (
              <div key={index} className="competitor-item">
                <div className="competitor-rank">#{index + 1}</div>
                <div className="competitor-info">
                  <div className="competitor-title">{comp.title}</div>
                  <div className="competitor-stats">
                    ${comp.price.toFixed(2)} • {comp.sales} sales
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .competition-analyzer {
          position: fixed;
          top: 100px;
          right: 20px;
          width: 400px;
          max-height: 80vh;
          background: white;
          border: 1px solid #e1e3df;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          z-index: 10000;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .analyzer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #f5f5f5;
          border-bottom: 1px solid #e1e3df;
        }

        .analyzer-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #595959;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        .close-btn:hover {
          background: #e1e3df;
        }

        .analyzer-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .analyzer-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f5f5f5;
          border-top-color: #f1641e;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: #f5f5f5;
          padding: 16px;
          border-radius: 6px;
          text-align: center;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 600;
          color: #222;
        }

        .stat-label {
          font-size: 12px;
          color: #595959;
          margin-top: 4px;
        }

        .keywords-section,
        .recommendations-section,
        .competitors-section {
          margin-bottom: 24px;
        }

        .keywords-section h4,
        .recommendations-section h4,
        .competitors-section h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .keywords-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .keyword-tag {
          padding: 4px 12px;
          background: #e3f2fd;
          color: #1976d2;
          border-radius: 16px;
          font-size: 13px;
        }

        .recommendations-section ul {
          margin: 0;
          padding-left: 20px;
        }

        .recommendations-section li {
          margin-bottom: 8px;
          color: #595959;
          font-size: 14px;
        }

        .competitors-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .competitor-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f5f5f5;
          border-radius: 6px;
        }

        .competitor-rank {
          font-size: 18px;
          font-weight: 600;
          color: #f1641e;
        }

        .competitor-info {
          flex: 1;
          overflow: hidden;
        }

        .competitor-title {
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .competitor-stats {
          font-size: 12px;
          color: #595959;
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
};