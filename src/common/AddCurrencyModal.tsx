"use client"

import React, { useState, useMemo } from 'react';
import { GlassModal, GlassInput, GlassButton } from '@/components/glass';
import { Search, Globe, Plus } from 'lucide-react';
import { worldCurrencies } from '@/utils/currencies';

interface AddCurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (currency: { code: string; symbol: string; name: string }) => void;
  existingCurrencies: string[];
}

export function AddCurrencyModal({
  isOpen,
  onClose,
  onAdd,
  existingCurrencies
}: AddCurrencyModalProps) {
  const [search, setSearch] = useState("");

  const filteredCurrencies = useMemo(() => {
    return worldCurrencies.filter(curr => {
      const isNew = !existingCurrencies.includes(curr.code);
      const matchesSearch = 
        curr.code.toLowerCase().includes(search.toLowerCase()) ||
        curr.name.toLowerCase().includes(search.toLowerCase());
      return isNew && matchesSearch;
    });
  }, [search, existingCurrencies]);

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Currency"
      size="md"
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <GlassInput
            placeholder="Search currency code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredCurrencies.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {filteredCurrencies.map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => onAdd(curr)}
                  className="w-full flex items-center justify-between p-3 rounded-xl glass hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#BC8969] font-bold">
                      {curr.symbol}
                    </div>
                    <div className="text-left">
                      <div className="text-white font-medium group-hover:text-theme transition-colors">
                        {curr.code}
                      </div>
                      <div className="text-white/40 text-xs">
                        {curr.name}
                      </div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-white/40 group-hover:text-theme transition-colors" />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-white/40">
              <Globe className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>No new currencies found</p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <GlassButton
            variant="ghost"
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            Cancel
          </GlassButton>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </GlassModal>
  );
}
