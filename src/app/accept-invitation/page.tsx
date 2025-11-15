"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams?.get("id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function acceptInvitation() {
      if (!invitationId) {
        setStatus("error");
        setErrorMessage("Missing invitation ID");
        return;
      }

      try {
        // Accept invitation using Better Auth client
        const result = await authClient.organization.acceptInvitation({
          invitationId,
        });

        if (result.error) {
          setStatus("error");
          setErrorMessage(result.error.message || "Failed to accept invitation");
          return;
        }

        // Get the user's email from the result if available
        const userEmail = result.data?.email || "";
        setEmail(userEmail);
        setStatus("success");

        // Redirect to sign-in after 2 seconds
        setTimeout(() => {
          router.push(`/sign-in${userEmail ? `?email=${encodeURIComponent(userEmail)}` : ""}`);
        }, 2000);
      } catch (error) {
        console.error("Accept invitation error:", error);
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "An error occurred");
      }
    }

    acceptInvitation();
  }, [invitationId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {status === "loading" && "Accepting Invitation..."}
            {status === "success" && "Invitation Accepted!"}
            {status === "error" && "Error"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "loading" && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {status === "success" && (
            <div>
              <p className="text-gray-600 mb-4">
                You've been successfully added to the organization!
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to sign-in...
              </p>
            </div>
          )}

          {status === "error" && (
            <div>
              <p className="text-red-600 mb-4">{errorMessage}</p>
              <button
                onClick={() => router.push("/sign-in")}
                className="text-blue-600 hover:underline"
              >
                Go to sign-in
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
