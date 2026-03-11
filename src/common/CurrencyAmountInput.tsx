"use client"

import React, { useState, useMemo } from 'react';
import { AddCurrencyModal } from './AddCurrencyModal';
import { Plus } from 'lucide-react';
import { getCurrencySymbol, currencySymbols } from '@/utils/currencies';

interface CurrencyAmountInputProps {
  currency: string;
  amount: string | number;
  onCurrencyChange: (currency: string) => void;
  onAmountChange: (amount: string) => void;
}

export function CurrencyAmountInput({
  currency,
  amount,
  onCurrencyChange,
  onAmountChange,
}: CurrencyAmountInputProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dynamicOptions, setDynamicOptions] = useState([
    { value: "INR", label: "INR (₹)", symbol: "₹" },
    { value: "USD", label: "USD ($)", symbol: "$" },
    { value: "NGN", label: "NGN (₦)", symbol: "₦" },
    { value: "CNY", label: "CNY (¥)", symbol: "¥" },
  ]);

  const allSymbols = useMemo(() => {
    const symbols = { ...currencySymbols };
    dynamicOptions.forEach(opt => {
      symbols[opt.value] = opt.symbol;
    });
    return symbols;
  }, [dynamicOptions]);

  const handleCurrencyChange = (val: string) => {
    if (val === "ADD_NEW") {
      setIsModalOpen(true);
    } else {
      onCurrencyChange(val);
    }
  };

  const handleAddNewCurrency = (newCurr: { code: string; symbol: string; name: string }) => {
    const exists = dynamicOptions.find(opt => opt.value === newCurr.code);
    if (!exists) {
      setDynamicOptions(prev => [
        ...prev,
        { value: newCurr.code, label: `${newCurr.code} (${newCurr.symbol})`, symbol: newCurr.symbol }
      ]);
    }
    onCurrencyChange(newCurr.code);
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-row items-center justify-center gap-2 w-full">
      <div className="relative w-8 h-8 flex-shrink-0 group">
        <select
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          value={currency || "INR"}
          onChange={(e) => handleCurrencyChange(e.target.value)}
          title="Select Currency"
        >
          {dynamicOptions.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-gray-800 text-white">
              {opt.label}
            </option>
          ))}
          <option value="ADD_NEW" className="bg-gray-900 text-blue-400 font-bold">
            + Add New
          </option>
        </select>
        <div className="absolute inset-0 w-full h-full rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[#BC8969] text-sm font-medium shadow-sm transition-colors group-hover:bg-white/20 group-hover:border-white/30">
          {allSymbols[currency || "INR"] || "₹"}
        </div>
      </div>
      <input
        type="number"
        value={amount}
        onChange={(e) => onAmountChange(e.target.value)}
        className="w-full px-3 py-1.5 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm transition-colors"
        style={{ minHeight: "32px", width: "calc(100% - 2rem - 0.5rem)" }}
        placeholder="0.00"
        min="0"
        step="0.01"
      />

      <AddCurrencyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddNewCurrency}
        existingCurrencies={dynamicOptions.map(o => o.value)}
      />
    </div>
  );
}

