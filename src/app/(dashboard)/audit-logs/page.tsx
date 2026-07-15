"use client";

import { ColumnDef, SortingState } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";

import { PermissionGate } from "@/components/auth/permission-gate";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { FilterPanel } from "@/components/shared/filter-panel";
import { PageHeader } from "@/components/shared/page-elements";
import { TableActions } from "@/components/shared/table-actions";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { DataTable } from "@/components/ui/data-table";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAppliedFilters } from "@/hooks/use-applied-filters";
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_ROLES } from "@/lib/constants/audit";
import { formatDate } from "@/lib/format";
import { showSuccess } from "@/lib/toast";
import { AuditLogEntry, useDeleteAuditLogMutation, useGetAuditLogsQuery } from "@/store/api/audit-api";
import { RootState } from "@/store";
import { useGetUsersQuery } from "@/store/api/users-api";

type AuditLogFilters = {
  email: string;
  role: string;
  module: string;
  action: string;
  from: string;
  to: string;
};

const INITIAL_FILTERS: AuditLogFilters = {
  email: "",
  role: "",
  module: "",
  action: "",
  from: "",
  to: "",
};

function AuditLogsContent() {
  const isSuperAdmin = useSelector((state: RootState) => state.auth.user?.role === "superadmin");
  const { draft, applied, apply, reset, patchDraft } = useAppliedFilters<AuditLogFilters>(INITIAL_FILTERS);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sorting, setSorting] = useState<SortingState>([{ id: "timestamp", desc: true }]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingLog, setDeletingLog] = useState<AuditLogEntry | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const sort = sorting[0];

  const { data: usersData } = useGetUsersQuery({ page: 1, limit: 200 });
  const [deleteAuditLog] = useDeleteAuditLogMutation();
  const { data, isLoading } = useGetAuditLogsQuery({
    email: applied.email || undefined,
    role: applied.role || undefined,
    module: applied.module || undefined,
    action: applied.action || undefined,
    from: applied.from || undefined,
    to: applied.to || undefined,
    page: pageIndex + 1,
    limit: pageSize,
    sortBy: sort?.id,
    sortOrder: sort?.desc ? "desc" : "asc",
  });

  const users = usersData?.data.users ?? [];

  async function confirmDeleteLog() {
    if (!deletingLog) return;
    setDeleteLoading(true);
    try {
      await deleteAuditLog(deletingLog.id).unwrap();
      showSuccess("Audit log deleted.");
      if (expandedId === deletingLog.id) setExpandedId(null);
      setDeletingLog(null);
    } catch {
      /* RTK error toast */
    } finally {
      setDeleteLoading(false);
    }
  }

  const columns = useMemo<ColumnDef<AuditLogEntry>[]>(
    () => [
      { accessorKey: "timestamp", header: "Timestamp", cell: ({ row }) => formatDate(row.original.timestamp) },
      { accessorKey: "userName", header: "User" },
      { accessorKey: "role", header: "Role", cell: ({ row }) => <span className="capitalize">{row.original.role.replace("superadmin", "Super Admin")}</span> },
      { accessorKey: "action", header: "Action", cell: ({ row }) => <span className="capitalize">{row.original.action}</span> },
      { accessorKey: "module", header: "Module" },
      {
        id: "entity",
        header: "Entity",
        cell: ({ row }) => `${row.original.entityType}${row.original.entityId ? ` #${row.original.entityId.slice(-6)}` : ""}`,
      },
      { accessorKey: "ipAddress", header: "IP" },
      {
        id: "changes",
        header: "Changes",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.changes ? (
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => setExpandedId(expandedId === row.original.id ? null : row.original.id)}
            >
              {expandedId === row.original.id ? "Hide" : "View"}
            </button>
          ) : (
            "—"
          ),
      },
      ...(isSuperAdmin
        ? [
            {
              id: "actions",
              header: "Actions",
              enableSorting: false,
              cell: ({ row }: { row: { original: AuditLogEntry } }) => (
                <TableActions
                  canView={false}
                  canEdit={false}
                  canDelete
                  onDelete={() => setDeletingLog(row.original)}
                  deleteLabel="Delete audit log"
                />
              ),
            } satisfies ColumnDef<AuditLogEntry>,
          ]
        : []),
    ],
    [expandedId, isSuperAdmin],
  );

  const logs = data?.data.logs ?? [];
  const expandedLog = logs.find((log) => log.id === expandedId);

  function handleApply() {
    apply();
    setPageIndex(0);
  }

  function handleReset() {
    reset();
    setPageIndex(0);
  }

  return (
    <div>
      <PageHeader title="Audit Logs" description="Immutable record of system actions and login events." />

      <FilterPanel className="mb-6" onApply={handleApply} onReset={handleReset} isApplying={isLoading}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="audit-user-email">User Email</Label>
            <Select
              id="audit-user-email"
              value={draft.email}
              onChange={(event) => patchDraft({ email: event.target.value })}
            >
              <option value="">All users</option>
              {users.map((user) => (
                <option key={user.id} value={user.email}>
                  {user.email}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-role">Role</Label>
            <Select
              id="audit-role"
              value={draft.role}
              onChange={(event) => patchDraft({ role: event.target.value })}
            >
              <option value="">All roles</option>
              {AUDIT_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-module">Module</Label>
            <Select
              id="audit-module"
              value={draft.module}
              onChange={(event) => patchDraft({ module: event.target.value })}
            >
              <option value="">All modules</option>
              {AUDIT_MODULES.map((module) => (
                <option key={module.value} value={module.value}>
                  {module.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-action">Action</Label>
            <Select
              id="audit-action"
              value={draft.action}
              onChange={(event) => patchDraft({ action: event.target.value })}
            >
              <option value="">All actions</option>
              {AUDIT_ACTIONS.map((action) => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2 xl:col-span-2">
            <Label htmlFor="audit-date-range">Date range</Label>
            <DateRangePicker
              id="audit-date-range"
              value={{ from: draft.from, to: draft.to }}
              onChange={(range) => patchDraft({ from: range.from, to: range.to })}
              placeholder="All dates"
            />
          </div>
        </div>
      </FilterPanel>

      <DataTable
        columns={columns}
        data={logs}
        pageCount={data?.data.pagination.totalPages ?? 1}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPageIndex(0);
        }}
        sorting={sorting}
        onSortingChange={setSorting}
        isLoading={isLoading}
        enableColumnVisibility
      />

      {expandedLog?.changes && (
        <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
          <h3 className="mb-2 font-semibold">Change Details</h3>
          <pre className="overflow-auto text-xs">{JSON.stringify(expandedLog.changes, null, 2)}</pre>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deletingLog)}
        onOpenChange={(open) => !open && setDeletingLog(null)}
        title="Delete audit log?"
        description="This permanently removes the audit record. Only Super Admin can perform this action."
        loading={deleteLoading}
        onConfirm={confirmDeleteLog}
      />
    </div>
  );
}

export default function AuditLogsPage() {
  return (
    <PermissionGate module="auditLogs" action="view">
      <AuditLogsContent />
    </PermissionGate>
  );
}
