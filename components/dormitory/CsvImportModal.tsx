'use client';

import React, { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DormerType } from '@/lib/types';
import { downloadCsvTemplate, parseDormerCsv, ParsedDormerRow } from '@/lib/csv';
import { store } from '@/lib/data-store';
import { toast } from '@/components/ui/Toast';
import { UploadCloud, FileSpreadsheet, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedType, setSelectedType] = useState<DormerType>('student');
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResults, setParsedResults] = useState<{
    rows: ParsedDormerRow[];
    totalValid: number;
    totalInvalid: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsParsing(true);

    try {
      const results = await parseDormerCsv(selectedFile, selectedType);
      setParsedResults(results);
    } catch {
      toast.error('Import Failed', 'Failed to parse CSV file. Please verify column structure.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedResults(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = () => {
    if (!parsedResults || parsedResults.totalValid === 0) return;

    const validDormers = parsedResults.rows
      .filter((r) => r.isValid)
      .map((r) => r.data);

    const count = store.bulkAddDormers(validDormers, selectedType);
    toast.success('Records Imported', `Successfully imported ${count} ${selectedType} records into DIMS.`);
    handleReset();
    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Import Dormers via CSV"
      description="Upload a CSV file containing dormers. Select the target classification and ensure columns match the template."
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Classification Selector & Template Download */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#F8F8F6] border border-[#E4E4E0]">
          <div>
            <label className="block text-xs font-semibold text-[#141414] mb-1 uppercase tracking-wider">
              1. Select Batch Type
            </label>
            <div className="flex gap-2">
              {(['student', 'employee', 'visitor'] as DormerType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setSelectedType(t);
                    handleReset();
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors',
                    selectedType === t
                      ? 'bg-[#4F46E5] text-white'
                      : 'bg-white text-[#2C2C2A] border border-[#E4E4E0] hover:bg-[#F2F2EF]'
                  )}
                >
                  {t}s
                </button>
              ))}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadCsvTemplate(selectedType)}
            className="flex items-center gap-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Download {selectedType} Template (.CSV)
          </Button>
        </div>

        {/* Drag & Drop File Zone */}
        {!parsedResults && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#E4E4E0] hover:border-[#4F46E5] bg-[#FAFAF9] rounded-xl p-8 text-center cursor-pointer transition-colors group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-12 h-12 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#141414]">
              {isParsing ? 'Parsing CSV File...' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-[#8C8C8A] mt-1">
              Supports .CSV files matching the official {selectedType} format
            </p>
          </div>
        )}

        {/* Validation Summary & Preview Table */}
        {parsedResults && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-[#E4E4E0] bg-white">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#16A34A]" />
                <div>
                  <p className="text-xs font-semibold text-[#141414]">{file?.name}</p>
                  <p className="text-[11px] text-[#8C8C8A]">
                    {parsedResults.rows.length} total rows parsed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success" size="sm" dot>
                  {parsedResults.totalValid} Valid
                </Badge>
                {parsedResults.totalInvalid > 0 && (
                  <Badge variant="danger" size="sm" dot>
                    {parsedResults.totalInvalid} Errors
                  </Badge>
                )}
                <Button size="sm" variant="ghost" onClick={handleReset}>
                  Choose Different File
                </Button>
              </div>
            </div>

            {/* Row-by-Row Table Preview */}
            <div className="border border-[#E4E4E0] rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAFAF9] border-b border-[#E4E4E0] sticky top-0">
                  <tr>
                    <th className="py-2 px-3 text-[11px] font-semibold text-[#8C8C8A]">Status</th>
                    <th className="py-2 px-3 text-[11px] font-semibold text-[#8C8C8A]">Name</th>
                    <th className="py-2 px-3 text-[11px] font-semibold text-[#8C8C8A]">Email</th>
                    <th className="py-2 px-3 text-[11px] font-semibold text-[#8C8C8A]">ID / Dept</th>
                    <th className="py-2 px-3 text-[11px] font-semibold text-[#8C8C8A]">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E0]">
                  {parsedResults.rows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={cn(row.isValid ? 'bg-white' : 'bg-[#FEF2F2]/60 hover:bg-[#FEF2F2]')}
                    >
                      <td className="py-2 px-3">
                        {row.isValid ? (
                          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-[#DC2626]" />
                        )}
                      </td>
                      <td className="py-2 px-3 font-medium text-[#141414]">
                        {row.data.firstName} {row.data.lastName}
                      </td>
                      <td className="py-2 px-3 text-[#555552]">{row.data.email}</td>
                      <td className="py-2 px-3 text-[#555552] font-mono">
                        {row.data.studentIdNo || row.data.employeeIdNo || row.data.externalId || '—'}
                      </td>
                      <td className="py-2 px-3">
                        {row.isValid ? (
                          <span className="text-[11px] text-[#16A34A]">Ready</span>
                        ) : (
                          <span className="text-[11px] text-[#DC2626] font-medium">
                            {row.errors.join('; ')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E4E4E0]">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!parsedResults || parsedResults.totalValid === 0}
            onClick={handleImport}
          >
            Commit Import ({parsedResults?.totalValid || 0} Records)
          </Button>
        </div>
      </div>
    </Modal>
  );
};
