"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Linkedin, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [connected, setConnected] = React.useState(false);
  const [account, setAccount] = React.useState(null);
  const [error, setError] = React.useState("");
  const [disconnecting, setDisconnecting] = React.useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/linkedin/status");
      if (!res.ok) throw new Error("Failed to fetch status");
      const json = await res.json();
      setConnected(json.connected === true);
      setAccount(json.account || null);
    } catch (e) {
      console.error("Failed to fetch LinkedIn status:", e);
      setError("Failed to fetch LinkedIn status");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = () => {
    // Redirect to connect route which starts LinkedIn OAuth
    window.location.href = "/api/linkedin/connect";
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect your LinkedIn account?")) {
      return;
    }
    
    setDisconnecting(true);
    setError("");
    try {
      const res = await fetch("/api/linkedin/disconnect", { method: "POST" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to disconnect");
      }
      await fetchStatus();
    } catch (e) {
      console.error("Disconnect failed:", e);
      setError(e.message || "Disconnect failed");
    } finally {
      setDisconnecting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-1 flex-col p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and integrations
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Linkedin className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  LinkedIn Integration
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : connected ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-200 text-xs font-medium">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-50 text-gray-600 border border-gray-300 text-xs font-medium">
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Connected
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Connect your LinkedIn account to share feedback posts directly to your LinkedIn profile
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2 text-muted-foreground">Loading...</span>
              </div>
            ) : connected ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Email:</span>
                    <p className="mt-1">{account?.email || "Unknown"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Connected on:</span>
                    <p className="mt-1">{formatDate(account?.created_at)}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                  >
                    {disconnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      "Disconnect LinkedIn"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Connect your LinkedIn account to enable sharing feedback posts
                </p>
                <Button onClick={handleConnect} className="bg-blue-600 hover:bg-blue-700">
                  <Linkedin className="h-4 w-4 mr-2" />
                  Connect LinkedIn
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
