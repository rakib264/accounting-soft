"use client";

import { ColumnDef, SortingState } from "@tanstack/react-table";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { z } from "zod";

import { PermissionGate } from "@/components/auth/permission-gate";
import { FileUpload } from "@/components/shared/file-upload";
import { PageHeader } from "@/components/shared/page-elements";
import { TableActions } from "@/components/shared/table-actions";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Select } from "@/components/ui/select";
import { FormField, fieldError } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { mergePermissions } from "@/lib/auth/rbac";
import { validateClientFile } from "@/lib/file-validation-client";
import { showSuccess } from "@/lib/toast";
import { trimmedEmail, trimmedRequired, passwordField } from "@/lib/validation/common";
import { RootState } from "@/store";
import { useUploadFilesMutation } from "@/store/api/business-api";
import { CrudPermission, UserPermissions, UserRole } from "@/types/auth";
import {
  ManagedUser,
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetUsersQuery,
  useUpdateUserMutation,
} from "@/store/api/users-api";

const createSchema = z.object({
  name: trimmedRequired("Name"),
  email: trimmedEmail,
  password: passwordField,
  role: z.enum(["admin", "editor"]),
});

const editSchema = z.object({
  name: trimmedRequired("Name"),
  role: z.enum(["admin", "editor"]),
  isActive: z.boolean(),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;

const modules: Array<{ key: keyof UserPermissions; label: string; crud?: boolean }> = [
  { key: "manpowerSubcontract", label: "Man-power & Subcontract", crud: true },
  { key: "trade", label: "Trade", crud: true },
  { key: "settings", label: "Settings" },
  { key: "userManagement", label: "User Management" },
  { key: "auditLogs", label: "Audit Logs" },
];

function UserAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt={name} className="h-8 w-8 rounded-full object-cover ring-1 ring-border" />
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground ring-1 ring-border">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function UsersPageContent() {
  const isSuperAdmin = useSelector((state: RootState) => state.auth.user?.role === "superadmin");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const sort = sorting[0];

  const { data, isLoading } = useGetUsersQuery({
    page: pageIndex + 1,
    limit: pageSize,
    search: search || undefined,
    sortBy: sort?.id,
    sortOrder: sort?.desc ? "desc" : "asc",
  });
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation();
  const [uploadFiles] = useUploadFilesMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<{ id: string; role: UserRole; permissions: UserPermissions } | null>(null);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [createAvatar, setCreateAvatar] = useState<File[]>([]);
  const [editAvatar, setEditAvatar] = useState<File[]>([]);
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string[]>([]);
  const [avatarError, setAvatarError] = useState<string>();

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", email: "", password: "", role: "editor" },
    mode: "onBlur",
  });

  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: "", role: "editor", isActive: true },
    mode: "onBlur",
  });

  const createErrors = createForm.formState.errors;
  const editErrors = editForm.formState.errors;

  const users = data?.data.users ?? [];

  useEffect(() => {
    if (!editingUser) return;
    editForm.reset({
      name: editingUser.name,
      role: editingUser.role === "superadmin" ? "admin" : editingUser.role,
      isActive: editingUser.isActive,
    });
    setEditAvatar([]);
    setExistingAvatarUrl(editingUser.avatarUrl ? [editingUser.avatarUrl] : []);
    setAvatarError(undefined);
  }, [editingUser, editForm]);

  async function uploadAvatar(files: File[]) {
    if (files.length === 0) return undefined;
    const validation = validateClientFile(files[0], { acceptImagesOnly: true });
    if (!validation.valid) {
      throw new Error(validation.message);
    }
    const upload = await uploadFiles({ files: [files[0]], folder: "users/avatars" }).unwrap();
    return upload.data.urls[0];
  }

  const columns = useMemo<ColumnDef<ManagedUser>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <UserAvatar name={row.original.name} avatarUrl={row.original.avatarUrl} />
            <span>{row.original.name}</span>
          </div>
        ),
      },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "role", header: "Role", cell: ({ row }) => <span className="capitalize">{row.original.role}</span> },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={row.original.isActive ? "bg-accent text-accent-foreground" : "bg-destructive/10 text-destructive"}>
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) =>
          isSuperAdmin && row.original.role !== "superadmin" ? (
            <div className="flex items-center gap-1">
              <TableActions
                canView={false}
                canEdit
                canDelete
                onEdit={() => setEditingUser(row.original)}
                onDelete={() => setDeletingUser(row.original)}
                editLabel="Edit user"
                deleteLabel="Delete user"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setEditingPermissions({
                    id: row.original.id,
                    role: row.original.role,
                    permissions: mergePermissions(row.original.permissions),
                  })
                }
              >
                Permissions
              </Button>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
    ],
    [isSuperAdmin],
  );

  async function onCreate(values: CreateForm) {
    setAvatarError(undefined);
    try {
      let avatarUrl: string | undefined;
      if (createAvatar.length > 0) {
        avatarUrl = await uploadAvatar(createAvatar);
      }
      await createUser({ ...values, avatarUrl }).unwrap();
      showSuccess("User created successfully.");
      createForm.reset();
      setCreateAvatar([]);
      setDialogOpen(false);
    } catch (error) {
      if (error instanceof Error && !("status" in error)) {
        setAvatarError(error.message);
      }
    }
  }

  async function onEdit(values: EditForm) {
    if (!editingUser) return;
    setAvatarError(undefined);
    try {
      const payload: {
        id: string;
        name: string;
        role: "admin" | "editor";
        isActive: boolean;
        avatarUrl?: string | null;
      } = {
        id: editingUser.id,
        name: values.name,
        role: values.role,
        isActive: values.isActive,
      };

      if (editAvatar.length > 0) {
        payload.avatarUrl = await uploadAvatar(editAvatar);
      } else if (existingAvatarUrl.length === 0 && editingUser.avatarUrl) {
        payload.avatarUrl = null;
      }

      await updateUser(payload).unwrap();
      showSuccess("User updated successfully.");
      setEditingUser(null);
    } catch (error) {
      if (error instanceof Error && !("status" in error)) {
        setAvatarError(error.message);
      }
    }
  }

  async function confirmDeleteUser() {
    if (!deletingUser) return;
    try {
      await deleteUser(deletingUser.id).unwrap();
      showSuccess("User deleted successfully.");
      setDeletingUser(null);
    } catch {
      /* RTK error toast */
    }
  }

  async function savePermissions() {
    if (!editingPermissions) return;
    setSavingPermissions(true);
    try {
      await updateUser({ id: editingPermissions.id, permissions: editingPermissions.permissions }).unwrap();
      showSuccess("Permissions updated successfully.");
      setEditingPermissions(null);
    } catch {
      /* Keep dialog open */
    } finally {
      setSavingPermissions(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Create Admin and Editor accounts with granular permissions."
        actions={isSuperAdmin ? <Button onClick={() => setDialogOpen(true)}>Create User</Button> : undefined}
      />

      <DataTable
        columns={columns}
        data={users}
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
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search users..."
        isLoading={isLoading}
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            createForm.reset();
            setCreateAvatar([]);
            setAvatarError(undefined);
          }
        }}
      >
        <DialogContent>
          <DialogHeader><DialogTitle>Create User</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={createForm.handleSubmit(onCreate)} noValidate>
            <FormField label="Name" required error={fieldError(createErrors, "name")}>
              <Input {...createForm.register("name")} />
            </FormField>
            <FormField label="Email" required error={fieldError(createErrors, "email")}>
              <Input type="email" {...createForm.register("email")} />
            </FormField>
            <FormField label="Password" required error={fieldError(createErrors, "password")}>
              <PasswordInput {...createForm.register("password")} />
            </FormField>
            <FormField label="Role" required error={fieldError(createErrors, "role")}>
              <Select {...createForm.register("role")}>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
              </Select>
            </FormField>
            <FormField label="Profile Avatar" error={avatarError} hint="Optional. JPEG, PNG, or WebP up to 10MB.">
              <FileUpload
                variant="image"
                multiple={false}
                files={createAvatar}
                onFilesChange={(files) => {
                  setCreateAvatar(files);
                  setAvatarError(undefined);
                }}
                validateFiles={(files) => validateClientFile(files[0], { acceptImagesOnly: true })}
                onValidationError={setAvatarError}
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={creating}
              />
            </FormField>
            <SubmitButton loading={creating || createForm.formState.isSubmitting} loadingText="Creating...">
              Create
            </SubmitButton>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          {editingUser && (
            <form className="space-y-4" onSubmit={editForm.handleSubmit(onEdit)} noValidate>
              <FormField label="Email">
                <Input value={editingUser.email} disabled />
              </FormField>
              <FormField label="Name" required error={fieldError(editErrors, "name")}>
                <Input {...editForm.register("name")} />
              </FormField>
              <FormField label="Role" required error={fieldError(editErrors, "role")}>
                <Select {...editForm.register("role")}>
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                </Select>
              </FormField>
              <Controller
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <CheckboxField
                    label="Active account"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                )}
              />
              <FormField label="Profile Avatar" error={avatarError} hint="Optional. JPEG, PNG, or WebP up to 10MB.">
                <FileUpload
                  variant="image"
                  multiple={false}
                  files={editAvatar}
                  onFilesChange={(files) => {
                    setEditAvatar(files);
                    setAvatarError(undefined);
                  }}
                  existingUrls={existingAvatarUrl}
                  onExistingUrlsChange={setExistingAvatarUrl}
                  validateFiles={(files) => validateClientFile(files[0], { acceptImagesOnly: true })}
                  onValidationError={setAvatarError}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={updating}
                />
              </FormField>
              <SubmitButton loading={updating || editForm.formState.isSubmitting} loadingText="Saving...">
                Save changes
              </SubmitButton>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingPermissions)} onOpenChange={(open) => !open && setEditingPermissions(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Permissions</DialogTitle></DialogHeader>
          {editingPermissions && (
            <div className="space-y-4">
              {modules.map((module) => (
                <Card key={module.key}>
                  <CardHeader className="pb-2"><CardTitle className="text-base">{module.label}</CardTitle></CardHeader>
                  <CardContent className="flex flex-wrap gap-x-5 gap-y-2">
                    {module.crud
                      ? (["view", "create", "edit", "delete"] as const)
                          .filter((action) => editingPermissions.role !== "editor" || (action !== "edit" && action !== "delete"))
                          .map((action) => (
                            <CheckboxField
                              key={action}
                              label={action}
                              checked={Boolean((editingPermissions.permissions[module.key] as CrudPermission)[action])}
                              disabled={editingPermissions.role === "editor" && (action === "edit" || action === "delete")}
                              onCheckedChange={(checked) =>
                                setEditingPermissions((current) =>
                                  current
                                    ? {
                                        ...current,
                                        permissions: {
                                          ...current.permissions,
                                          [module.key]: {
                                            ...(current.permissions[module.key] as CrudPermission),
                                            [action]: checked === true,
                                          },
                                        },
                                      }
                                    : current,
                                )
                              }
                            />
                          ))
                      : (
                          <CheckboxField
                            label="View"
                            checked={Boolean(editingPermissions.permissions[module.key].view)}
                            onCheckedChange={(checked) =>
                              setEditingPermissions((current) =>
                                current
                                  ? {
                                      ...current,
                                      permissions: {
                                        ...current.permissions,
                                        [module.key]: { view: checked === true },
                                      },
                                    }
                                  : current,
                              )
                            }
                          />
                        )}
                  </CardContent>
                </Card>
              ))}
              <SubmitButton type="button" onClick={savePermissions} loading={savingPermissions || updating} loadingText="Saving...">
                Save Permissions
              </SubmitButton>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletingUser)}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        title="Delete user?"
        description={`This permanently removes ${deletingUser?.name ?? "this user"}. This action cannot be undone.`}
        loading={deleting}
        onConfirm={confirmDeleteUser}
      />
    </div>
  );
}

export default function UsersPage() {
  return (
    <PermissionGate module="userManagement" action="view">
      <UsersPageContent />
    </PermissionGate>
  );
}
