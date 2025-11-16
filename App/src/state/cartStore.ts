/**
 * Shopping Cart Store
 * Manages solar equipment cart, compatibility checks, and NEC compliance
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, CompatibilityCheck, ShoppingCartState } from '../types/shopping';
import { useSolarStore } from './solarStore';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check NEC compliance and system compatibility
 */
function validateCompatibility(items: CartItem[]): CompatibilityCheck {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  const panels = items.filter(i => i.category === 'solar-panel');
  const inverters = items.filter(i => i.category === 'inverter');
  const batteries = items.filter(i => i.category === 'battery');
  const chargeControllers = items.filter(i => i.category === 'charge-controller');
  const wiring = items.filter(i => i.category === 'wiring');

  // Critical checks (errors)
  if (panels.length > 0 && inverters.length === 0 && chargeControllers.length === 0) {
    errors.push('System requires an inverter or charge controller for panels');
  }

  // Voltage compatibility
  const panelVoltages = panels.map(p => p.specs.voltage).filter(Boolean) as number[];
  const inverterRanges = inverters.map(i => i.specs.voltageRange).filter(Boolean);
  if (panelVoltages.length && inverterRanges.length) {
    const totalPanelVoltage = Math.max(...panelVoltages) * panels.reduce((sum, p) => sum + p.quantity, 0);
    for (const range of inverterRanges) {
      if (range && totalPanelVoltage > range.max) {
        errors.push(`Total panel voltage (${totalPanelVoltage}V) exceeds inverter max (${range.max}V)`);
      }
      if (range && totalPanelVoltage < range.min) {
        warnings.push(`Total panel voltage (${totalPanelVoltage}V) below inverter minimum (${range.min}V)`);
      }
    }
  }

  // Current/ampacity checks (NEC 690.8)
  const totalPanelCurrent = panels.reduce((sum, p) => {
    const current = p.specs.current || 0;
    return sum + (current * p.quantity);
  }, 0);
  
  const wireAmps = wiring.map(w => w.specs.ampacity).filter(Boolean) as number[];
  if (totalPanelCurrent > 0 && wireAmps.length > 0) {
    const minWireAmp = Math.min(...wireAmps);
    const requiredAmpacity = totalPanelCurrent * 1.25; // NEC 690.8(B)(1) - 125% rule
    if (minWireAmp < requiredAmpacity) {
      errors.push(`Wire ampacity (${minWireAmp}A) insufficient for panel current (${requiredAmpacity.toFixed(1)}A required per NEC 690.8)`);
    }
  }

  // Grid-tie certification (NEC 705)
  const gridTieInverters = inverters.filter(i => i.specs.gridTieCapable);
  if (gridTieInverters.length > 0) {
    const uncertified = gridTieInverters.filter(i => !i.specs.ul1741);
    if (uncertified.length > 0) {
      errors.push('Grid-tie inverters must be UL1741 certified (NEC 705.12)');
    }
  }

  // Battery safety (NEC 706)
  if (batteries.length > 0) {
    const uncertified = batteries.filter(b => !b.specs.ul9540);
    if (uncertified.length > 0) {
      warnings.push('Battery systems should be UL9540 certified (NEC 706.30)');
    }
  }

  // Suggestions
  if (panels.length > 0 && !items.some(i => i.category === 'disconnect')) {
    suggestions.push('Add DC disconnect switch for panel array (NEC 690.13 requirement)');
  }

  if (gridTieInverters.length > 0 && !items.some(i => i.category === 'meter')) {
    suggestions.push('Consider adding bi-directional meter for net metering tracking');
  }

  if (batteries.length > 0 && chargeControllers.length === 0 && !inverters.some(i => i.specs.inverterType === 'hybrid')) {
    suggestions.push('Battery systems typically require charge controller or hybrid inverter');
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}

/**
 * Identify missing essential components
 */
function getMissingComponents(items: CartItem[]): string[] {
  const missing: string[] = [];
  const categories = new Set(items.map(i => i.category));

  if (!categories.has('solar-panel')) {
    missing.push('Solar panels (primary power source)');
  }

  if (!categories.has('inverter') && !categories.has('charge-controller')) {
    missing.push('Inverter or charge controller (required for power conversion)');
  }

  if (!categories.has('mounting')) {
    missing.push('Mounting hardware (roof/ground mounts, rails, clamps)');
  }

  if (!categories.has('wiring')) {
    missing.push('Wiring/cables (PV wire, conduit, connectors)');
  }

  if (!categories.has('disconnect')) {
    missing.push('DC disconnect switch (NEC 690.13 requirement)');
  }

  return missing;
}

export const useCartStore = create<ShoppingCartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (itemData) => {
        const newItem: CartItem = {
          ...itemData,
          id: generateId(),
          addedAt: Date.now(),
          compatible: true,
          warnings: [],
          suggestions: [],
        };

        set((state) => {
          const updatedItems = [...state.items, newItem];
          const check = validateCompatibility(updatedItems);
          
          // Mark item compatibility
          newItem.compatible = check.passed;
          newItem.warnings = check.warnings;
          newItem.suggestions = check.suggestions;

          return { items: updatedItems };
        });
      },

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      updateItem: (id, updates) =>
        set((state) => {
          const updatedItems = state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          );
          const check = validateCompatibility(updatedItems);
          
          // Re-validate all items
          return {
            items: updatedItems.map(item => ({
              ...item,
              compatible: check.passed,
              warnings: check.warnings,
              suggestions: check.suggestions,
            })),
          };
        }),

      clearCart: () => set({ items: [] }),

      checkCompatibility: () => {
        const items = get().items;
        return validateCompatibility(items);
      },

      getMissingComponents: () => {
        const items = get().items;
        return getMissingComponents(items);
      },
    }),
    {
      name: 'shopping-cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

/**
 * Hook to sync cart with solar configurator
 */
export function syncCartToConfigurator() {
  const { items } = useCartStore.getState();
  const { bulkUpdate } = useSolarStore.getState();

  const panels = items.filter(i => i.category === 'solar-panel');
  const batteries = items.filter(i => i.category === 'battery');
  const inverters = items.filter(i => i.category === 'inverter');

  const updates: Record<string, any> = {};

  // Calculate total panel capacity
  const totalPanelWatts = panels.reduce((sum, p) => {
    const power = p.specs.power || 0;
    return sum + (power * p.quantity);
  }, 0);

  if (totalPanelWatts > 0) {
    updates.arraySize = totalPanelWatts / 1000; // Convert to kW
  }

  // Calculate battery capacity
  const totalBatteryWh = batteries.reduce((sum, b) => {
    const capacity = b.specs.capacityWh || (b.specs.capacity && b.specs.voltage ? b.specs.capacity * b.specs.voltage : 0);
    return sum + (capacity * b.quantity);
  }, 0);

  if (totalBatteryWh > 0) {
    updates.batteryCapacity = totalBatteryWh / 1000; // Convert to kWh
  }

  // Set inverter efficiency
  if (inverters.length > 0) {
    const avgEfficiency = inverters.reduce((sum, inv) => sum + (inv.specs.efficiency || 0.96), 0) / inverters.length;
    updates.inverterEfficiency = avgEfficiency;
  }

  if (Object.keys(updates).length > 0) {
    bulkUpdate(updates);
  }
}
