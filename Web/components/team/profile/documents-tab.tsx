"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addEmployeeCertificate,
  uploadEmployeeDocument,
} from "@/app/(dashboard)/employees/profile-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useDashboardTheme } from "@/contexts/dashboard-theme-context";
import {
  profileCardClass,
  profileInputClass,
  profileLinkClass,
  profileMutedClass,
  profileSectionTitleClass,
  profileTableHeadClass,
  profileTableRowClass,
  profileValueClass,
} from "@/lib/dashboard/styles";
import { formatDateShort } from "@/lib/employees/format";
import type { EmployeeDocument } from "@/lib/employees/profile-queries";
import { cn } from "@/lib/utils";

function docStatusBadge(
  status: EmployeeDocument["status"],
  theme: "light" | "dark"
) {
  if (status === "completed")
    return (
      <StatusBadge tone="success" theme={theme}>
        Completed
      </StatusBadge>
    );
  if (status === "sent")
    return (
      <StatusBadge tone="info" theme={theme}>
        Sent
      </StatusBadge>
    );
  return (
    <StatusBadge tone="warning" theme={theme}>
      Not sent
    </StatusBadge>
  );
}

type DocumentsTabProps = {
  employeeId: string;
  documents: EmployeeDocument[];
  onUpdated: () => void;
};

export function DocumentsTab({
  employeeId,
  documents,
  onUpdated,
}: DocumentsTabProps) {
  const { theme: dashboardTheme } = useDashboardTheme();
  const [pending, startTransition] = useTransition();
  const [certName, setCertName] = useState("");
  const [showCertForm, setShowCertForm] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [uploadDocId, setUploadDocId] = useState<string | null>(null);

  const certificates = documents.filter((d) => d.category === "certificate");
  const onboarding = documents.filter((d) => d.category === "onboarding");

  function handleUpload(documentId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      const result = await uploadEmployeeDocument(employeeId, documentId, formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Document uploaded");
      onUpdated();
    });
  }

  function addCertificate() {
    if (!certName.trim()) return;
    startTransition(async () => {
      const result = await addEmployeeCertificate(employeeId, certName);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setCertName("");
      setShowCertForm(false);
      toast.success("Certificate added");
      onUpdated();
    });
  }

  const linkClass = cn(profileLinkClass, "text-sm font-semibold");

  return (
    <div className="space-y-8">
      <input
        ref={uploadRef}
        type="file"
        className="hidden"
        accept=".pdf,image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadDocId) handleUpload(uploadDocId, file);
          e.target.value = "";
          setUploadDocId(null);
        }}
      />

      <Card className={profileCardClass}>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className={profileSectionTitleClass}>
            Certificates ({certificates.length})
          </h3>
          <button type="button" className={linkClass} onClick={() => setShowCertForm(true)}>
            Add a certificate
          </button>
        </CardHeader>
        <CardContent>
          {showCertForm ? (
            <div className="mb-4 flex flex-wrap gap-2">
              <input
                value={certName}
                onChange={(e) => setCertName(e.target.value)}
                placeholder="Certificate name"
                className={cn(profileInputClass, "min-w-[200px] flex-1")}
              />
              <Button type="button" disabled={pending} onClick={addCertificate}>
                Add
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCertForm(false)}
              >
                Cancel
              </Button>
            </div>
          ) : null}

          {certificates.length === 0 ? (
            <p className={cn("py-8 text-center text-sm", profileMutedClass)}>
              No certificates added yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className={profileTableHeadClass}>
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Uploaded date</th>
                  <th className="pb-2">File</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((doc) => (
                  <tr key={doc.id} className={profileTableRowClass}>
                    <td className={cn("py-3", profileValueClass)}>{doc.name}</td>
                    <td className={cn("py-3", profileMutedClass)}>
                      {doc.file_url
                        ? formatDateShort(doc.created_at.slice(0, 10))
                        : "—"}
                    </td>
                    <td className="py-3">
                      {doc.file_url ? (
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className={linkClass}
                        >
                          Download
                        </a>
                      ) : (
                        <button
                          type="button"
                          className={linkClass}
                          disabled={pending}
                          onClick={() => {
                            setUploadDocId(doc.id);
                            uploadRef.current?.click();
                          }}
                        >
                          Upload file
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card className={profileCardClass}>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className={profileSectionTitleClass}>
            Onboarding Documents ({onboarding.length})
          </h3>
          <span className={cn("text-sm", profileMutedClass)}>Add a document</span>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className={profileTableHeadClass}>
                <th className="pb-2">Name</th>
                <th className="pb-2">Versions</th>
                <th className="pb-2">File/Status</th>
              </tr>
            </thead>
            <tbody>
              {onboarding.map((doc) => (
                <tr key={doc.id} className={profileTableRowClass}>
                  <td className={cn("py-3", profileValueClass)}>{doc.name}</td>
                  <td className={cn("py-3", profileMutedClass)}>{doc.versions}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {docStatusBadge(doc.status, dashboardTheme)}
                      {doc.status !== "completed" ? (
                        <button
                          type="button"
                          className={linkClass}
                          disabled={pending}
                          onClick={() => {
                            setUploadDocId(doc.id);
                            uploadRef.current?.click();
                          }}
                        >
                          Upload file
                        </button>
                      ) : doc.file_url ? (
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className={linkClass}
                        >
                          View
                        </a>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
