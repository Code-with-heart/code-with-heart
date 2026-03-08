"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { signIn, signOut, useSession } from "next-auth/react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
]

export default function LoginPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status, update: updateSession } = useSession()

  const [isLoadingHtwg, setIsLoadingHtwg] = React.useState(false)
  const [isLoadingTest, setIsLoadingTest] = React.useState(false)
  const [consentLoading, setConsentLoading] = React.useState(null)

  const errorParam = searchParams.get("error")
  const errorMessage = errorParam
    ? "Sign in failed. Please use your HTWG account."
    : ""

  const isConsentPending = session?.user?.consentPending === true

  // Redirect authenticated users who already gave consent to home
  React.useEffect(() => {
    if (status === "authenticated" && !isConsentPending) {
      router.replace("/")
    }
  }, [status, isConsentPending, router])

  const handleSignIn = async () => {
    setIsLoadingHtwg(true)
    await signIn("htwg-oidc", { callbackUrl: "/login" })
  }

  const handleTestSignIn = async () => {
    setIsLoadingTest(true)
    await signIn("htwg-oidc-test", { callbackUrl: "/login" })
  }

  async function handleAccept() {
    setConsentLoading("accept")
    try {
      const res = await fetch("/api/auth/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepted: true }),
      })

      if (!res.ok) throw new Error("Request failed")

      // Refresh the JWT so consentPending becomes false and userId is set
      await updateSession()
      router.push("/")
      router.refresh()
    } catch {
      setConsentLoading(null)
      alert("Something went wrong. Please try again.")
    }
  }

  async function handleDecline() {
    setConsentLoading("decline")
    try {
      await fetch("/api/auth/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepted: false }),
      })
    } finally {
      await signOut({ callbackUrl: "/login" })
    }
  }

  // Show a neutral loading state while session is resolving or redirect is in progress
  if (status === "loading" || (status === "authenticated" && !isConsentPending)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Code with Heart</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in with your HTWG account
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            className="w-full"
            disabled={isLoadingHtwg}
            onClick={handleSignIn}
          >
            {isLoadingHtwg ? "Redirecting..." : "Sign in"}
          </Button>
          <Button
            type="button"
            className="w-full"
            disabled={isLoadingTest}
            onClick={handleTestSignIn}
          >
            {isLoadingTest ? "Redirecting..." : "Sign in (test)"}
          </Button>
          {errorMessage && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-xs text-destructive text-center">
                {errorMessage}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full-screen consent dialog – shown immediately after returning from OIDC */}
      <Dialog open={isConsentPending}>
        <DialogContent
          showCloseButton={false}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="text-xl">
              Welcome to Code with Heart
            </DialogTitle>
            <DialogDescription>
              Before completing your registration we need your permission to
              process the personal data listed below. Please read this carefully.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
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
                consent (Art.&nbsp;6&nbsp;(1)(a) GDPR). You may withdraw your
                consent at any time by deleting your account in{" "}
                <Link
                  href="/settings"
                  className="underline hover:text-foreground"
                >
                  Settings
                </Link>
                . Withdrawal does not affect the lawfulness of processing
                carried out before the withdrawal.
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
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              disabled={consentLoading !== null}
              onClick={handleDecline}
            >
              {consentLoading === "decline"
                ? "Aborting…"
                : "Decline & cancel registration"}
            </Button>
            <Button
              disabled={consentLoading !== null}
              onClick={handleAccept}
            >
              {consentLoading === "accept"
                ? "Saving…"
                : "I agree – complete registration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
