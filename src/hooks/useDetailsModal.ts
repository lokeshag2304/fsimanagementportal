// src/hooks/useDetailsModal.ts
"use client";

import { useState } from "react";

export function useDetailsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    recordType: number;
    recordId: number;
    title?: string;
  } | null>(null);

  const openDetails = (recordType: number, recordId: number, title?: string) => {
    setModalData({ recordType, recordId, title });
    setIsOpen(true);
  };

  const closeDetails = () => {
    setIsOpen(false);
    setModalData(null);
  };

  return {
    isOpen,
    modalData,
    openDetails,
    closeDetails,
  };
}