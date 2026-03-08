"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const DATA_ITEMS = [
  {
    label: "Full name",
    value: "Provided by HTWG (e.g. Maria Muster)",
    reason:
      "Displayed as your identity when you send or receive feedback so recipients know who it is from.",
  },
  {
    label: "E-mail address",
    value: "Your institutional HTWG e-mail",
    reason:
      "Used to sign you in and to deliver notification e-mails about feedback you have received.",
  },
  {
    label: "Institutional account identifier",
    value: "An internal, non-readable ID from the HTWG identity provider",
    reason:
      "Securely links your HTWG login to your Code with Heart account so you can sign in reliably.",
  },
];

export default function ConsentPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [loading, setLoading] = React.useState(null);

  async function handleAccept() {
    setLoading("accept");
    try {
      const res = await fetch("/api/auth/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepted: true }),
      });

      if (!res.ok) throw new Error("Request failed");

      // Refresh the JWT so consentPending becomes false
      await updateSession();
      router.push("/");
      router.refresh();
    } catch {
      setLoading(null);
      alert("Something went wrong. Please try again.");
    }
  }

  async function handleDecline() {
    setLoading("decline");
    try {
      await fetch("/api/auth/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepted: false }),
      });
    } finally {
      // Sign out regardless of API result and return to home page
      await signOut({ callbackUrl: "/" });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Welcome to Code with Heart</CardTitle>
          <p className="text-sm text-muted-foreground">
            Before completing your registration we need your permission to
            process the personal data listed below. Please read this carefully.
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Data items */}
          <div className="rounded-lg border divide-y text-sm">
            {DATA_ITEMS.map((item) => (
              <div key={item.label} className="px-4 py-3 space-y-0.5">
                <p className="font-medium">{item.label}</p>
                <p className="text-muted-foreground text-xs">{item.value}</p>
                <p className="text-xs pt-1">{item.reason}</p>
              </div>
            ))}
          </div>

          <Separator />

          {/* Legal basis */}
          <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
            <p>
              Processing is carried out on the basis of your freely given
              consent (Art. 6 (1)(a) GDPR). You may withdraw your consent at
              any time by deleting your account in{" "}
              <Link href="/settings" className="underline hover:text-foreground">
                Settings
              </Link>
              . Withdrawal does not affect the lawfulness of processing carried
              out before the withdrawal.
            </p>
            <p>
              By registering you also confirm that you have read and agree to
              our{" "}
              <Link
                href="/tos"
                target="_blank"
                className="underline hover:text-foreground"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="underline hover:text-foreground"
              >
                Privacy Notice
              </Link>
              .
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            disabled={loading !== null}
            onClick={handleDecline}
          >
            {loading === "decline" ? "Aborting…" : "Decline & cancel registration"}
          </Button>
          <Button
            className="w-full sm:w-auto"
            disabled={loading !== null}
            onClick={handleAccept}
          >
            {loading === "accept" ? "Saving…" : "I agree – complete registration"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
