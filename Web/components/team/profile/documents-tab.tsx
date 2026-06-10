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
import { formatDateShort } from "@/lib/employees/format";
import type { EmployeeDocument } from "@/lib/employees/profile-queries";
import { cn } from "@/lib/utils";

function docStatusBadge(status: EmployeeDocument["status"]) {
  if (status === "completed") return <StatusBadge tone="success">Completed</StatusBadge>;
  if (status === "sent") return <StatusBadge tone="info">Sent</StatusBadge>;
  return <StatusBadge tone="warning">Not sent</StatusBadge>;
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Certificates ({certificates.length})
          </h3>
          <button
            type="button"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            onClick={() => setShowCertForm(true)}
          >
            Add a certificate
          </button>
        </CardHeader>
        <CardContent>
          {showCertForm ? (
            <div className="mb-4 flex gap-2">
              <input
                value={certName}
                onChange={(e) => setCertName(e.target.value)}
                placeholder="Certificate name"
                className="flex h-10 flex-1 rounded-lg border border-input px-3 text-sm"
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
            <p className="py-8 text-center text-sm text-slate-500">
              No certificates added yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold uppercase text-slate-500">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Uploaded date</th>
                  <th className="pb-2">File</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((doc) => (
                  <tr key={doc.id} className="border-b border-slate-50">
                    <td className="py-3 font-medium">{doc.name}</td>
                    <td className="py-3 text-slate-500">
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
                          className="font-semibold text-blue-600"
                        >
                          Download
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="font-semibold text-blue-600"
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Onboarding Documents ({onboarding.length})
          </h3>
          <span className="text-sm text-slate-400">Add a document</span>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-semibold uppercase text-slate-500">
                <th className="pb-2">Name</th>
                <th className="pb-2">Versions</th>
                <th className="pb-2">File/Status</th>
              </tr>
            </thead>
            <tbody>
              {onboarding.map((doc) => (
                <tr key={doc.id} className="border-b border-slate-50">
                  <td className="py-3 font-medium">{doc.name}</td>
                  <td className="py-3 text-slate-600">{doc.versions}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {docStatusBadge(doc.status)}
                      {doc.status !== "completed" ? (
                        <button
                          type="button"
                          className={cn(
                            "text-sm font-semibold text-blue-600 hover:text-blue-700"
                          )}
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
                          className="text-sm font-semibold text-blue-600"
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
