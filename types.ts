import React from 'react';

export enum AppRoute {
  HOME = 'HOME',
  PLAN = 'PLAN',
  LEARN = 'LEARN'
}

export interface NavItem {
  id: AppRoute;
  label: string;
  icon: React.ReactNode;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AssetAllocation {
  name: string;
  value?: number;
  percentage: number;
  description: string;
  color: string;
}

// Single asset item details with financial metrics
export interface AssetItem {
  id: string;
  name: string;
  amount: number; // Current Market Value
  interestRate?: number; // Estimated Annual Yield
  principal?: number; // Invested Principal
  note?: string;
}

// Scientific CFP Classification
export interface UserAssets {
  liquid: AssetItem[];
  financial: AssetItem[];
  realEstate: AssetItem[];
  protection: AssetItem[];
  alternative: AssetItem[];
  liabilities: AssetItem[];
}

// --- Goal Planning Types ---

export enum GoalType {
  PURCHASE = 'PURCHASE', // Saving for a specific amount (House, Car)
  RETIREMENT = 'RETIREMENT' // Saving for passive income (FIRE)
}

export interface GoalContext {
  type: GoalType;
  currentPrincipal: number; // Total investable assets currently
  monthlySavings: number;
  expectedReturnRate: number; // %
  
  // For Purchase
  targetAmount?: number;
  yearsToGoal?: number;

  // For Retirement
  targetMonthlyExpense?: number;
  
  // Math Results
  projectedAmount: number;
  requiredAmount: number; // Target capital
  isAchievable: boolean;
}

export interface GoalAnalysisResult {
  evaluation: string; // "Excellent", "Good", "Risky", "Impossible"
  summary: string; // AI analysis of the math
  suggestions: string[]; // Actionable steps
  riskWarning: string;
}