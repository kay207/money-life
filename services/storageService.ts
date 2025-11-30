import { UserProfile, UserAssets, AssetSnapshot, AssetHistoryItem, AssetItem } from '../types';

const KEYS = {
  USER: 'ww_user',
  ASSETS: 'ww_current_assets',
  SNAPSHOTS: 'ww_snapshots',
  LAST_UPDATED: 'ww_last_updated'
};

// Default Demo Data
const DEFAULT_ASSETS: UserAssets = {
  income: [
    { id: 'inc1', name: '税后工资(年薪)', amount: 150000 },
    { id: 'inc2', name: '年终奖', amount: 30000 }
  ],
  liquid: [
    { id: '1', name: '余额宝', amount: 35000, interestRate: 1.8, principal: 35000 },
  ],
  financial: [
    { id: '3', name: '沪深300指数', amount: 18000, interestRate: 8.0, principal: 20000 },
    { id: '31', name: '三年期国债', amount: 50000, interestRate: 2.3, principal: 50000 }
  ],
  realEstate: [
    { id: '4', name: '自住房(估值)', amount: 2500000, interestRate: 1.5, principal: 2000000 }
  ],
  protection: [],
  alternative: [],
  liabilities: [
    { id: '5', name: '房贷剩余本金', amount: 800000, interestRate: 3.1 }
  ]
};

export const storageService = {
  // --- User Session ---
  getUser: (): UserProfile | null => {
    try {
      const s = localStorage.getItem(KEYS.USER);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  },

  createUser: (name: string): UserProfile => {
    const user = { name, joinedAt: Date.now() };
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
    
    // Initialize default assets if not exist
    if (!localStorage.getItem(KEYS.ASSETS)) {
      localStorage.setItem(KEYS.ASSETS, JSON.stringify(DEFAULT_ASSETS));
    }
    return user;
  },

  clearData: () => {
    localStorage.removeItem(KEYS.USER);
    localStorage.removeItem(KEYS.ASSETS);
    localStorage.removeItem(KEYS.SNAPSHOTS);
    localStorage.removeItem(KEYS.LAST_UPDATED);
  },

  // --- Current Assets ---
  getAssets: (): UserAssets => {
    try {
      const s = localStorage.getItem(KEYS.ASSETS);
      return s ? JSON.parse(s) : DEFAULT_ASSETS;
    } catch { return DEFAULT_ASSETS; }
  },

  saveAssets: (assets: UserAssets) => {
    localStorage.setItem(KEYS.ASSETS, JSON.stringify(assets));
  },

  getLastUpdated: (): Date | null => {
    const s = localStorage.getItem(KEYS.LAST_UPDATED);
    return s ? new Date(parseInt(s)) : null;
  },

  // --- History & Snapshots ---
  createSnapshot: (assets: UserAssets) => {
    // 1. Calculate Net Worth
    const totalAssets = [...assets.liquid, ...assets.financial, ...assets.realEstate, ...assets.protection, ...assets.alternative]
      .reduce((sum, item) => sum + item.amount, 0);
    const totalLiabilities = assets.liabilities.reduce((sum, item) => sum + item.amount, 0);
    const netWorth = totalAssets - totalLiabilities;

    // 2. Prepare Snapshot
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const snapshot: AssetSnapshot = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      dateStr,
      netWorth,
      totalAssets,
      totalLiabilities,
      data: assets
    };

    // 3. Save to History (Append or Update current month)
    const existingStr = localStorage.getItem(KEYS.SNAPSHOTS);
    let snapshots: AssetSnapshot[] = existingStr ? JSON.parse(existingStr) : [];
    
    // Remove existing snapshot for this month if any, to avoid duplicates for the same month
    snapshots = snapshots.filter(s => s.dateStr !== dateStr);
    snapshots.push(snapshot);
    
    // Sort by time
    snapshots.sort((a, b) => a.timestamp - b.timestamp);

    localStorage.setItem(KEYS.SNAPSHOTS, JSON.stringify(snapshots));
    localStorage.setItem(KEYS.LAST_UPDATED, Date.now().toString());
  },

  getHistory: (): AssetHistoryItem[] => {
    const s = localStorage.getItem(KEYS.SNAPSHOTS);
    const snapshots: AssetSnapshot[] = s ? JSON.parse(s) : [];
    
    // Create a map of real data
    const realDataMap = new Map<string, number>();
    snapshots.forEach(snap => {
      realDataMap.set(snap.dateStr, snap.netWorth);
    });

    // Determine the "Current" Net Worth to use as anchor for simulation
    // If we have a snapshot for this month, use it. If not, use the latest known snapshot.
    // Or if completely empty, use calculated default.
    let currentAnchorValue = 0;
    if (snapshots.length > 0) {
      currentAnchorValue = snapshots[snapshots.length - 1].netWorth;
    } else {
      // Calculate from default/current assets in storage
      const currentAssets = storageService.getAssets();
       const totalAssets = [...currentAssets.liquid, ...currentAssets.financial, ...currentAssets.realEstate, ...currentAssets.protection, ...currentAssets.alternative]
      .reduce((sum, item) => sum + item.amount, 0);
      const totalLiabilities = currentAssets.liabilities.reduce((sum, item) => sum + item.amount, 0);
      currentAnchorValue = totalAssets - totalLiabilities;
    }

    const data: AssetHistoryItem[] = [];
    const now = new Date();

    // Generate last 7 data points (current month + 6 past months)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const dateStr = `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (realDataMap.has(dateStr)) {
        // Use Real Data
        data.push({ date: dateStr, value: realDataMap.get(dateStr)! });
      } else {
        // Use Simulated Data (Backfilling)
        // If i=6 (current month) and no data, use currentAnchorValue
        // For past months, simulate a slightly lower value to show growth
        
        let value = currentAnchorValue;
        
        // If we are predicting the future relative to the anchor (which shouldn't happen in this loop), 
        // or backfilling the past.
        
        // Simple Simulation: Assume 0.8% monthly growth
        // Past Value = Current / (1.008 ^ months_back)
        const monthsAgo = 6 - i;
        
        // Add some randomness
        const noise = 1 - (Math.random() * 0.02 - 0.01); // +/- 1%
        const simulatedValue = Math.floor(currentAnchorValue / Math.pow(1.008, monthsAgo));
        
        data.push({ date: dateStr, value: simulatedValue });
      }
    }
    return data;
  }
};