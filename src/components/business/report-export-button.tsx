"use client";

import { Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage, showError } from "@/lib/toast";

type ReportExportButtonProps = {
  businessType?: "manpower" | "subcontract" | "trade" | "";
  projectId?: string;
  from?: string;
  to?: string;
  label?: string;
  className?: string;
};

export function ReportExportButton({
  businessType,
  projectId,
  from,
  to,
  label = "Download Excel",
  className,
}: ReportExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (businessType) params.set("businessType", businessType);
      if (projectId) params.set("projectId", projectId);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const response = await fetch(`/api/reports/export?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? "Failed to export report.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename =
        filenameMatch?.[1] ??
        `${businessType || "collective"}-report-${new Date().toISOString().slice(0, 10)}.xlsx`;

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showError(getApiErrorMessage(error, "Failed to export report."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" className={className} onClick={handleExport} disabled={loading}>
      <Download className="mr-2 h-4 w-4" />
      {loading ? "Preparing..." : label}
    </Button>
  );
}
