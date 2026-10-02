"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRef, useState, useTransition } from "react";
import { toast } from "@/components/ui/sonner";
import {
  addEmployeeCertificate,
  uploadEmployeeDocument,
} from "@/app/(dashboard)/employees/profile-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useDashboardTheme } from "@/contexts/dashboard-theme-context";
import {
  dashboardAccentLinkSx,
  dashboardCardSx,
  dashboardPageIntroSx,
  dashboardSectionTitleSx,
  profileInputSx,
  profileTableHeadSx,
  profileTableRowSx,
  profileValueSx,
} from "@/lib/dashboard/sx";
import { formatDateShort } from "@/lib/employees/format";
import type { EmployeeDocument } from "@/lib/employees/profile-queries";

function docStatusBadge(
  status: EmployeeDocument["status"],
  theme: "light" | "dark",
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

const cardHeaderRowSx = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
} as const;

const accentLinkSx = {
  ...dashboardAccentLinkSx,
  fontSize: "0.875rem",
  border: "none",
  bgcolor: "transparent",
  cursor: "pointer",
  p: 0,
  fontFamily: "inherit",
} as const;

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
      const result = await uploadEmployeeDocument(
        employeeId,
        documentId,
        formData,
      );
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
    <Stack spacing={4}>
      <Box
        component="input"
        ref={uploadRef}
        type="file"
        sx={{ display: "none" }}
        accept=".pdf,image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadDocId) handleUpload(uploadDocId, file);
          e.target.value = "";
          setUploadDocId(null);
        }}
      />

      <Card sx={dashboardCardSx}>
        <CardHeader sx={cardHeaderRowSx}>
          <Typography component="h3" sx={dashboardSectionTitleSx}>
            Certificates ({certificates.length})
          </Typography>
          <Box
            component="button"
            type="button"
            sx={accentLinkSx}
            onClick={() => setShowCertForm(true)}
          >
            Add a certificate
          </Box>
        </CardHeader>
        <CardContent>
          {showCertForm ? (
            <Stack
              direction="row"
              useFlexGap
              sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}
            >
              <Box
                component="input"
                value={certName}
                onChange={(e) => setCertName(e.target.value)}
                placeholder="Certificate name"
                sx={{ ...profileInputSx, minWidth: 200, flex: 1 }}
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
            </Stack>
          ) : null}

          {certificates.length === 0 ? (
            <Typography
              sx={{ ...dashboardPageIntroSx, py: 4, textAlign: "center" }}
            >
              No certificates added yet.
            </Typography>
          ) : (
            <Box component="table" sx={{ width: "100%", fontSize: "0.875rem" }}>
              <Box component="thead">
                <Box component="tr" sx={profileTableHeadSx}>
                  <Box component="th" sx={{ pb: 1, textAlign: "left" }}>
                    Name
                  </Box>
                  <Box component="th" sx={{ pb: 1, textAlign: "left" }}>
                    Uploaded date
                  </Box>
                  <Box component="th" sx={{ pb: 1, textAlign: "left" }}>
                    File
                  </Box>
                </Box>
              </Box>
              <Box component="tbody">
                {certificates.map((doc) => (
                  <Box component="tr" key={doc.id} sx={profileTableRowSx}>
                    <Box
                      component="td"
                      sx={{ py: 1.5, ...(profileValueSx as object) }}
                    >
                      {doc.name}
                    </Box>
                    <Box
                      component="td"
                      sx={{ py: 1.5, ...(dashboardPageIntroSx as object) }}
                    >
                      {doc.file_url
                        ? formatDateShort(doc.created_at.slice(0, 10))
                        : "—"}
                    </Box>
                    <Box component="td" sx={{ py: 1.5 }}>
                      {doc.file_url ? (
                        <Box
                          component="a"
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          sx={accentLinkSx}
                        >
                          Download
                        </Box>
                      ) : (
                        <Box
                          component="button"
                          type="button"
                          sx={accentLinkSx}
                          disabled={pending}
                          onClick={() => {
                            setUploadDocId(doc.id);
                            uploadRef.current?.click();
                          }}
                        >
                          Upload file
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card sx={dashboardCardSx}>
        <CardHeader sx={cardHeaderRowSx}>
          <Typography component="h3" sx={dashboardSectionTitleSx}>
            Onboarding Documents ({onboarding.length})
          </Typography>
          <Typography sx={dashboardPageIntroSx}>Add a document</Typography>
        </CardHeader>
        <CardContent>
          <Box component="table" sx={{ width: "100%", fontSize: "0.875rem" }}>
            <Box component="thead">
              <Box component="tr" sx={profileTableHeadSx}>
                <Box component="th" sx={{ pb: 1, textAlign: "left" }}>
                  Name
                </Box>
                <Box component="th" sx={{ pb: 1, textAlign: "left" }}>
                  Versions
                </Box>
                <Box component="th" sx={{ pb: 1, textAlign: "left" }}>
                  File/Status
                </Box>
              </Box>
            </Box>
            <Box component="tbody">
              {onboarding.map((doc) => (
                <Box component="tr" key={doc.id} sx={profileTableRowSx}>
                  <Box component="td" sx={{ py: 1.5, ...profileValueSx }}>
                    {doc.name}
                  </Box>
                  <Box component="td" sx={{ py: 1.5, ...dashboardPageIntroSx }}>
                    {doc.versions}
                  </Box>
                  <Box component="td" sx={{ py: 1.5 }}>
                    <Stack
                      direction="row"
                      useFlexGap
                      sx={{ flexWrap: "wrap", alignItems: "center", gap: 1 }}
                    >
                      {docStatusBadge(doc.status, dashboardTheme)}
                      {doc.status !== "completed" ? (
                        <Box
                          component="button"
                          type="button"
                          sx={accentLinkSx}
                          disabled={pending}
                          onClick={() => {
                            setUploadDocId(doc.id);
                            uploadRef.current?.click();
                          }}
                        >
                          Upload file
                        </Box>
                      ) : doc.file_url ? (
                        <Box
                          component="a"
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          sx={accentLinkSx}
                        >
                          View
                        </Box>
                      ) : null}
                    </Stack>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}
