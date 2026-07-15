"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FileUpload } from "@/components/shared/file-upload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField, fieldError } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { validateClientFile } from "@/lib/file-validation-client";
import { showSuccess } from "@/lib/toast";
import { trimmedRequired } from "@/lib/validation/common";
import { Project, useCreateProjectMutation, useUpdateProjectMutation, useUploadFilesMutation } from "@/store/api/business-api";

const schema = z.object({
  name: trimmedRequired("Project name"),
  details: trimmedRequired("Project details"),
});

type FormValues = z.infer<typeof schema>;

type ProjectFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessType: "manpower" | "subcontract";
  project?: Project;
  onSuccess?: () => void;
};

export function ProjectFormDialog({ open, onOpenChange, businessType, project, onSuccess }: ProjectFormDialogProps) {
  const [createProject, { isLoading: creating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: updating }] = useUpdateProjectMutation();
  const [uploadFiles] = useUploadFilesMutation();
  const [fileError, setFileError] = useState<string>();
  const [pendingImage, setPendingImage] = useState<File[]>([]);
  const [existingImageUrl, setExistingImageUrl] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", details: "" },
    mode: "onBlur",
  });

  const { errors, isSubmitting } = form.formState;
  const isEdit = Boolean(project);
  const loading = creating || updating || isSubmitting;

  useEffect(() => {
    if (open) {
      form.reset({
        name: project?.name ?? "",
        details: project?.details ?? "",
      });
      setFileError(undefined);
      setPendingImage([]);
      setExistingImageUrl(project?.imageUrl ? [project.imageUrl] : []);
    }
  }, [open, project, form]);

  async function onSubmit(values: FormValues) {
    setFileError(undefined);

    const file = pendingImage[0];

    if (file) {
      const validation = validateClientFile(file, { acceptImagesOnly: true });
      if (!validation.valid) {
        setFileError(validation.message);
        return;
      }
    }

    try {
      let imageUrl: string | undefined = existingImageUrl[0];

      if (file) {
        const upload = await uploadFiles({ files: [file], folder: "projects" }).unwrap();
        imageUrl = upload.data.urls[0];
      } else if (existingImageUrl.length === 0) {
        imageUrl = undefined;
      }

      if (isEdit && project) {
        await updateProject({ id: project.id, data: { ...values, imageUrl, businessType } }).unwrap();
        showSuccess("Project updated successfully.");
      } else {
        await createProject({ ...values, imageUrl, businessType }).unwrap();
        showSuccess("Project created successfully.");
      }

      form.reset();
      setPendingImage([]);
      setExistingImageUrl([]);
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // Modal stays open; backend error toast via RTK
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Project" : "Add Project"}</DialogTitle>
          <DialogDescription>Project details for {businessType} operations.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FormField label="Name" htmlFor="project-name" required error={fieldError(errors, "name")}>
            <Input id="project-name" aria-invalid={Boolean(errors.name)} {...form.register("name")} />
          </FormField>

          <FormField label="Details" htmlFor="project-details" required error={fieldError(errors, "details")}>
            <Textarea id="project-details" aria-invalid={Boolean(errors.details)} {...form.register("details")} />
          </FormField>

          <FormField label="Image" error={fileError} hint="Optional. JPEG, PNG, or WebP up to 10MB.">
            <FileUpload
              variant="image"
              multiple={false}
              files={pendingImage}
              onFilesChange={(files) => {
                setPendingImage(files);
                setFileError(undefined);
              }}
              existingUrls={existingImageUrl}
              onExistingUrlsChange={setExistingImageUrl}
              validateFiles={(files) => validateClientFile(files[0], { acceptImagesOnly: true })}
              onValidationError={setFileError}
              error={fileError}
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={loading}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <SubmitButton loading={loading} loadingText={isEdit ? "Saving..." : "Creating..."}>
              {isEdit ? "Save changes" : "Create project"}
            </SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
