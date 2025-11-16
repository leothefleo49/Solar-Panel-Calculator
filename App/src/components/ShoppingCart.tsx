/**
 * Shopping Cart Tab Component
 * Manage solar equipment purchases with compatibility checks and NEC compliance
 */

import { useState } from 'react';
import clsx from 'clsx';
import { useCartStore, syncCartToConfigurator } from '../state/cartStore';
import { searchProducts, extractProductSpecs } from '../utils/shoppingApi';
import type { ProductCategory, CartItem } from '../types/shopping';
import { formatCurrency } from '../utils/calculations';
import InfoTooltip from './InfoTooltip';

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'solar-panel', label: 'Solar Panel' },
  { value: 'inverter', label: 'Inverter' },
  { value: 'battery', label: 'Battery' },
  { value: 'charge-controller', label: 'Charge Controller' },
  { value: 'mounting', label: 'Mounting Hardware' },
  { value: 'wiring', label: 'Wiring/Cables' },
  { value: 'disconnect', label: 'Disconnect Switch' },
  { value: 'meter', label: 'Meter' },
  { value: 'other', label: 'Other' },
];

export default function ShoppingCart() {
  const { items, addItem, removeItem, clearCart, checkCompatibility, getMissingComponents } = useCartStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);

  // Manual entry form state
  const [manualEntry, setManualEntry] = useState<Partial<CartItem>>({
    category: 'solar-panel',
    quantity: 1,
    specs: {},
  });

  const compatibility = checkCompatibility();
  const missingComponents = getMissingComponents();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const results = await searchProducts(searchQuery, { maxResults: 10 });
      setSearchResults(results);
    } catch (error: any) {
      setSearchError(error.message);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFromSearch = async (product: any) => {
    const specs = await extractProductSpecs(product);
    
    addItem({
      name: product.title || 'Unknown Product',
      category: (specs.category || 'other') as ProductCategory,
      specs: specs,
      price: product.product?.price ? parseFloat(product.product.price.replace(/[^0-9.]/g, '')) : undefined,
      currency: 'USD',
      quantity: 1,
      url: product.link,
      imageUrl: product.image?.thumbnailLink,
      notes: product.snippet,
    });

    setSearchResults([]);
    setSearchQuery('');
  };

  const handleManualAdd = () => {
    if (!manualEntry.name || !manualEntry.category) {
      alert('Please enter at least a product name and category');
      return;
    }

    addItem({
      name: manualEntry.name,
      category: manualEntry.category,
      specs: manualEntry.specs || {},
      price: manualEntry.price,
      currency: manualEntry.currency || 'USD',
      quantity: manualEntry.quantity || 1,
      url: manualEntry.url,
      notes: manualEntry.notes,
    });

    // Reset form
    setManualEntry({
      category: 'solar-panel',
      quantity: 1,
      specs: {},
    });
    setShowManualForm(false);
  };

  const handleSyncToConfigurator = () => {
    syncCartToConfigurator();
    alert('Cart synced to configurator! Check the Configurator tab to see updated values.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-white">Shopping Cart</h3>
          <p className="mt-1 text-sm text-slate-300">
            Search for solar equipment, add products, and validate system compatibility.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSyncToConfigurator}
            disabled={items.length === 0}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
          >
            Sync to Configurator
          </button>
          <button
            onClick={clearCart}
            disabled={items.length === 0}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50"
          >
            Clear Cart
          </button>
        </div>
      </div>

      {/* Compatibility Status */}
      {items.length > 0 && (
        <div className={clsx(
          'rounded-lg border p-4',
          compatibility.passed ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'
        )}>
          <div className="flex items-start gap-3">
            <div className={clsx(
              'mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold',
              compatibility.passed ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            )}>
              {compatibility.passed ? '✓' : '!'}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white">
                {compatibility.passed ? 'System Compatible' : 'Compatibility Issues Detected'}
              </h4>
              {compatibility.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-300">Errors (must fix):</p>
                  <ul className="mt-1 space-y-1 text-sm text-red-200">
                    {compatibility.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
              {compatibility.warnings.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-yellow-300">Warnings:</p>
                  <ul className="mt-1 space-y-1 text-sm text-yellow-200">
                    {compatibility.warnings.map((warn, i) => (
                      <li key={i}>• {warn}</li>
                    ))}
                  </ul>
                </div>
              )}
              {compatibility.suggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-blue-300">Suggestions:</p>
                  <ul className="mt-1 space-y-1 text-sm text-blue-200">
                    {compatibility.suggestions.map((sug, i) => (
                      <li key={i}>• {sug}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Missing Components */}
      {missingComponents.length > 0 && (
        <div className="rounded-lg border border-orange-500/50 bg-orange-500/10 p-4">
          <h4 className="font-semibold text-orange-300">Missing Essential Components</h4>
          <ul className="mt-2 space-y-1 text-sm text-orange-200">
            {missingComponents.map((comp, i) => (
              <li key={i}>• {comp}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Search Bar */}
      <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
              Search Products (Google Shopping API)
              <InfoTooltip content="Enter product name, model number, or description. Uses Google Shopping API to find compatible equipment." />
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g., 'Renogy 400W solar panel' or 'SMA inverter 5kW'"
                className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-white/40 focus:border-accent focus:outline-none"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="rounded-lg bg-accent px-6 py-2 font-medium text-white hover:bg-accent/90 disabled:opacity-50"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
            {searchError && (
              <p className="mt-2 text-sm text-red-400">{searchError}</p>
            )}
          </div>
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="mt-7 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            {showManualForm ? 'Hide' : 'Manual Entry'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-white">{searchResults.length} Results</p>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {searchResults.map((product, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                  {product.image?.thumbnailLink && (
                    <img src={product.image.thumbnailLink} alt="" className="h-16 w-16 rounded object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white line-clamp-2">{product.title}</p>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">{product.snippet}</p>
                    {product.product?.price && (
                      <p className="mt-1 text-sm font-semibold text-accent">{product.product.price}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddFromSearch(product)}
                    className="rounded-lg bg-accent px-3 py-1 text-sm font-medium text-white hover:bg-accent/90"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Entry Form */}
        {showManualForm && (
          <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-4">
            <h4 className="font-semibold text-white">Manual Product Entry</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-white">Product Name *</label>
                <input
                  type="text"
                  value={manualEntry.name || ''}
                  onChange={(e) => setManualEntry({ ...manualEntry, name: e.target.value })}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
                  placeholder="e.g., Renogy 400W Monocrystalline"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-white">Category *</label>
                <select
                  value={manualEntry.category}
                  onChange={(e) => setManualEntry({ ...manualEntry, category: e.target.value as ProductCategory })}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-white">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={manualEntry.quantity || 1}
                  onChange={(e) => setManualEntry({ ...manualEntry, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-white">Price (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={manualEntry.price || ''}
                  onChange={(e) => setManualEntry({ ...manualEntry, price: parseFloat(e.target.value) || undefined })}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
                  placeholder="0.00"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-white">Product URL</label>
                <input
                  type="url"
                  value={manualEntry.url || ''}
                  onChange={(e) => setManualEntry({ ...manualEntry, url: e.target.value })}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
                  placeholder="https://..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-white">Notes</label>
                <textarea
                  value={manualEntry.notes || ''}
                  onChange={(e) => setManualEntry({ ...manualEntry, notes: e.target.value })}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
                  rows={2}
                  placeholder="Additional specs, notes, or compatibility info..."
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleManualAdd}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
              >
                Add to Cart
              </button>
              <button
                onClick={() => setShowManualForm(false)}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cart Items */}
      <div className="space-y-2">
        <h4 className="font-semibold text-white">Cart ({items.length} items)</h4>
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">No items in cart. Search or manually add products to get started.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-white">{item.name}</h5>
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
                        {CATEGORIES.find(c => c.value === item.category)?.label}
                      </span>
                    </div>
                    {item.specs.manufacturer && (
                      <p className="mt-1 text-sm text-slate-400">
                        {item.specs.manufacturer} {item.specs.model}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                      {item.specs.power && <span>Power: {item.specs.power}W</span>}
                      {item.specs.voltage && <span>Voltage: {item.specs.voltage}V</span>}
                      {item.specs.current && <span>Current: {item.specs.current}A</span>}
                      {item.specs.efficiency && <span>Efficiency: {(item.specs.efficiency * 100).toFixed(1)}%</span>}
                      <span>Qty: {item.quantity}</span>
                      {item.price && <span className="font-semibold text-white">{formatCurrency(item.price * item.quantity)}</span>}
                    </div>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs text-accent hover:underline"
                      >
                        View Product →
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="rounded-lg border border-red-500/50 px-3 py-1 text-sm font-medium text-red-400 hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total */}
      {items.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Estimated Total:</span>
            <span className="text-2xl font-bold text-accent">
              {formatCurrency(items.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0))}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Prices are estimates. Verify with vendors before purchasing. Does not include shipping, tax, or installation costs.
          </p>
        </div>
      )}
    </div>
  );
}
