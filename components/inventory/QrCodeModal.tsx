'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { InventoryItem } from '@/lib/types';
import { generateQrDataUrl, downloadQrCode } from '@/lib/qr';
import { Download, Printer, ShieldCheck } from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

const QrCodeContent: React.FC<{
  item: InventoryItem;
}> = ({ item }) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    generateQrDataUrl(item.qrCodeData).then((url) => {
      if (isMounted) setQrUrl(url);
    });
    return () => {
      isMounted = false;
    };
  }, [item.qrCodeData]);

  const handlePrintTag = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-center">
      {/* Printable Asset Tag Box */}
      <div className="p-6 rounded-2xl border-2 border-[#141414] bg-white shadow-sm inline-block mx-auto max-w-70">
        {/* Header */}
        <div className="border-b border-[#E4E4E0] pb-2 mb-3">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-[#4F46E5] uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ASR Campus Custody</span>
          </div>
          <p className="text-[10px] text-[#8C8C8A] uppercase tracking-widest mt-0.5">
            Official Property
          </p>
        </div>

        {/* QR Code Image */}
        {qrUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={qrUrl}
            alt={`QR Code for ${item.itemCode}`}
            className="w-48 h-48 mx-auto rounded-lg"
          />
        ) : (
          <div className="w-48 h-48 mx-auto bg-[#F8F8F6] rounded-lg flex items-center justify-center text-xs text-[#8C8C8A]">
            Generating QR...
          </div>
        )}

        {/* Asset Details */}
        <div className="mt-3 pt-2 border-t border-[#E4E4E0]">
          <p className="font-mono text-sm font-bold text-[#141414] tracking-tight">
            {item.itemCode}
          </p>
          <p className="text-xs font-semibold text-[#2C2C2A] truncate mt-0.5">{item.name}</p>
          <p className="text-[10px] text-[#8C8C8A] mt-1">{item.categoryName}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => downloadQrCode(qrUrl, item.itemCode)}
          className="flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          Download PNG
        </Button>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handlePrintTag}
          className="flex items-center gap-1.5"
        >
          <Printer className="w-4 h-4" />
          Print Property Tag
        </Button>
      </div>
    </div>
  );
};

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asset Property Tag & QR Code"
      description="Printable identification label for school dormitory inventory custody."
      maxWidth="sm"
    >
      {isOpen && <QrCodeContent key={item.id} item={item} />}
    </Modal>
  );
};
