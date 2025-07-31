import React, { useState, useEffect } from 'react';
import { sendToBackground } from '@plasmohq/messaging';

interface QuickEditPanelProps {
  listingId: string;
  onClose: () => void;
}

interface ListingData {
  title: string;
  price: string;
  quantity: number;
  tags: string[];
  description: string;
}

export const QuickEditPanel: React.FC<QuickEditPanelProps> = ({ listingId, onClose }) => {
  const [listing, setListing] = useState<ListingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ListingData>({
    title: '',
    price: '',
    quantity: 0,
    tags: [],
    description: '',
  });

  useEffect(() => {
    fetchListingData();
  }, [listingId]);

  const fetchListingData = async () => {
    try {
      // TODO: Fetch listing data from API
      const mockData: ListingData = {
        title: 'Sample Product Title',
        price: '29.99',
        quantity: 10,
        tags: ['handmade', 'gift', 'vintage'],
        description: 'This is a sample product description.',
      };
      setListing(mockData);
      setFormData(mockData);
    } catch (error) {
      console.error('Failed to fetch listing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Save listing data via API
      console.log('Saving listing:', formData);
      onClose();
    } catch (error) {
      console.error('Failed to save listing:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof ListingData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleTagChange = (index: number, value: string) => {
    const newTags = [...formData.tags];
    newTags[index] = value;
    setFormData({ ...formData, tags: newTags });
  };

  const addTag = () => {
    setFormData({ ...formData, tags: [...formData.tags, ''] });
  };

  const removeTag = (index: number) => {
    const newTags = formData.tags.filter((_, i) => i !== index);
    setFormData({ ...formData, tags: newTags });
  };

  if (isLoading) {
    return (
      <div className="quick-edit-panel loading">
        <p>Loading listing data...</p>
      </div>
    );
  }

  return (
    <div className="quick-edit-panel">
      <div className="panel-header">
        <h2>Quick Edit Listing</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="panel-content">
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            maxLength={140}
          />
          <span className="char-count">{formData.title.length}/140</span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Price</label>
            <div className="input-with-prefix">
              <span className="prefix">$</span>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Quantity</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
              min="0"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Tags</label>
          <div className="tags-list">
            {formData.tags.map((tag, index) => (
              <div key={index} className="tag-input">
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => handleTagChange(index, e.target.value)}
                  placeholder="Enter tag"
                />
                <button
                  className="remove-tag-btn"
                  onClick={() => removeTag(index)}
                >
                  ×
                </button>
              </div>
            ))}
            {formData.tags.length < 13 && (
              <button className="add-tag-btn" onClick={addTag}>
                + Add Tag
              </button>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={6}
          />
        </div>
      </div>

      <div className="panel-footer">
        <button className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <style jsx>{`
        .quick-edit-panel {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 500px;
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

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #f5f5f5;
          border-bottom: 1px solid #e1e3df;
        }

        .panel-header h2 {
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

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #222;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #e1e3df;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #f1641e;
        }

        .char-count {
          display: block;
          text-align: right;
          font-size: 12px;
          color: #595959;
          margin-top: 4px;
        }

        .form-row {
          display: flex;
          gap: 20px;
        }

        .form-row .form-group {
          flex: 1;
        }

        .input-with-prefix {
          display: flex;
          align-items: center;
        }

        .prefix {
          padding: 8px 0 8px 12px;
          background: #f5f5f5;
          border: 1px solid #e1e3df;
          border-right: none;
          border-radius: 4px 0 0 4px;
          color: #595959;
        }

        .input-with-prefix input {
          border-radius: 0 4px 4px 0;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag-input {
          display: flex;
          align-items: center;
          background: #f5f5f5;
          border: 1px solid #e1e3df;
          border-radius: 4px;
          overflow: hidden;
        }

        .tag-input input {
          border: none;
          background: none;
          padding: 6px 8px;
          width: 120px;
          font-size: 13px;
        }

        .remove-tag-btn {
          background: none;
          border: none;
          padding: 0 8px;
          cursor: pointer;
          color: #595959;
          font-size: 18px;
        }

        .remove-tag-btn:hover {
          color: #d73502;
        }

        .add-tag-btn {
          padding: 6px 12px;
          background: white;
          border: 1px dashed #e1e3df;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          color: #595959;
        }

        .add-tag-btn:hover {
          border-color: #f1641e;
          color: #f1641e;
        }

        .panel-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 20px;
          background: #f5f5f5;
          border-top: 1px solid #e1e3df;
        }

        .btn-primary,
        .btn-secondary {
          padding: 8px 16px;
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

        .btn-primary:hover:not(:disabled) {
          background: #d9531a;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: white;
          color: #222;
          border: 1px solid #e1e3df;
        }

        .btn-secondary:hover {
          background: #f5f5f5;
        }

        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 300px;
        }
      `}</style>
    </div>
  );
};