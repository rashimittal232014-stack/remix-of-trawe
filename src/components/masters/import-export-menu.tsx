import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, Upload, FileDown, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  kindLabel: string;
  sampleColumns: string[];
  rows: any[];
  onImport: (rows: Record<string, any>[]) => Promise<void> | void;
  exportPick?: (row: any) => Record<string, any>;
};

export function ImportExportMenu({ kindLabel, sampleColumns, rows, onImport, exportPick }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const downloadSample = () => {
    const ws = XLSX.utils.aoa_to_sheet([sampleColumns]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, kindLabel);
    XLSX.writeFile(wb, `${kindLabel.toLowerCase().replace(/\s+/g, "-")}-sample.xlsx`);
  };

  const exportRows = () => {
    if (rows.length === 0) return toast.info("Nothing to export");
    const mapped = rows.map((r) => (exportPick ? exportPick(r) : r));
    const ws = XLSX.utils.json_to_sheet(mapped);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, kindLabel);
    XLSX.writeFile(wb, `${kindLabel.toLowerCase().replace(/\s+/g, "-")}-export-${Date.now()}.xlsx`);
  };

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });
      if (json.length === 0) return toast.warning("No rows found in sheet");
      await onImport(json);
      toast.success(`Imported ${json.length} rows`);
    } catch (e: any) {
      toast.error(e.message ?? "Import failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
            Import <ChevronDown className="h-3.5 w-3.5 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={downloadSample}>
            <FileDown className="h-4 w-4 mr-2" />Download Sample File
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />Import {kindLabel}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportRows}>
            <Download className="h-4 w-4 mr-2" />Export {kindLabel}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="sr-only"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </>
  );
}