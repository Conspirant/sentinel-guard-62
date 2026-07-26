import { Download, FileSpreadsheet, FileText, FileType2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportCSV, exportExcel, exportPDF, type ExportColumn, type ExportMeta } from "@/lib/export";
import { useAuth } from "@/lib/auth";

interface Props<T> {
  rows: T[];
  columns: ExportColumn<T>[];
  meta: ExportMeta;
  disabled?: boolean;
}

export function ExportMenu<T>({ rows, columns, meta, disabled }: Props<T>) {
  const { can } = useAuth();
  const allowed = can("export");

  if (!allowed) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || rows.length === 0}
          className="h-8 rounded-sm text-xs"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" /> Export
          <span className="ml-1.5 text-mono text-[10px] text-muted-foreground">
            {rows.length}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Export · {meta.title}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => exportCSV(rows, columns, meta)}>
          <FileText className="mr-2 h-4 w-4" /> CSV
          <span className="ml-auto text-[10px] text-muted-foreground">.csv</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => exportExcel(rows, columns, meta)}>
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
          <span className="ml-auto text-[10px] text-muted-foreground">.xls</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => exportPDF(rows, columns, meta)}>
          <FileType2 className="mr-2 h-4 w-4" /> PDF Report
          <span className="ml-auto text-[10px] text-muted-foreground">.pdf</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
