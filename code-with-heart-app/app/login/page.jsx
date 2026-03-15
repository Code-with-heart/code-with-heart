"use client"

import * as React from "react"
import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { useAuth } from "@/components/auth-provider"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const ALLOWED_DOMAINS = ["htwg-konstanz.de"]

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

function isAllowedEmail(email) {
  if (!email) return false
  const domain = email.toLowerCase().split("@").pop()
  return ALLOWED_DOMAINS.includes(domain)
}

function LoginPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading: authLoading, signOut, refreshUser } = useAuth()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isSignUp, setIsSignUp] = React.useState(false)
  const [fullName, setFullName] = React.useState("")
  const [formLoading, setFormLoading] = React.useState(false)
  const [formError, setFormError] = React.useState("")
  const [formSuccess, setFormSuccess] = React.useState("")
  const [isLoadingHtwg, setIsLoadingHtwg] = React.useState(false)
  const [isLoadingTest, setIsLoadingTest] = React.useState(false)
  const [consentLoading, setConsentLoading] = React.useState(null)

  const errorParam = searchParams.get("error")
  const errorMessage = errorParam
    ? "Sign in failed. Please use your HTWG account."
    : ""

  // Determine if consent is pending (authenticated but no app-level user record or missing consent)
  const isConsentPending = user && !user.id && user.consentPending

  // Redirect authenticated users who already gave consent to home
  React.useEffect(() => {
    if (!authLoading && user?.id && !isConsentPending) {
      router.replace("/")
    }
  }, [authLoading, user, isConsentPending, router])

  const handleCredentialSubmit = async (e) => {
    e.preventDefault()
    setFormError("")
    setFormSuccess("")

    if (!isAllowedEmail(email)) {
      setFormError("Only @htwg-konstanz.de email addresses are allowed.")
      return
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.")
      return
    }

    setFormLoading(true)
    const supabase = createClient()

    if (isSignUp) {
      if (!fullName.trim()) {
        setFormError("Please enter your full name.")
        setFormLoading(false)
        return
      }

      const { error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          data: { full_name: fullName.trim() },
        },
      })

      if (error) {
        setFormError(error.message)
      } else {
        setFormSuccess("Check your email for a confirmation link, then sign in.")
        setIsSignUp(false)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      })

      if (error) {
        setFormError(error.message)
      } else {
        await refreshUser()
        router.push("/login")
        router.refresh()
      }
    }

    setFormLoading(false)
  }

  const handleOidcSignIn = async (provider) => {
    if (provider === "htwg-oidc") setIsLoadingHtwg(true)
    if (provider === "htwg-oidc-test") setIsLoadingTest(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setFormError(error.message)
      setIsLoadingHtwg(false)
      setIsLoadingTest(false)
    }
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

      await refreshUser()
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
      await signOut()
      router.push("/login")
    }
  }

  // Show a neutral loading state while auth is resolving or redirect is in progress
  if (authLoading || (user?.id && !isConsentPending)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">Loading...</p>
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
          {/* Email/Password Form */}
          <form onSubmit={handleCredentialSubmit} className="space-y-3">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Maria Muster"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@htwg-konstanz.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={formLoading}>
              {formLoading
                ? "Please wait..."
                : isSignUp
                  ? "Sign up"
                  : "Sign in"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="underline hover:text-foreground"
                    onClick={() => { setIsSignUp(false); setFormError(""); setFormSuccess(""); }}
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="underline hover:text-foreground"
                    onClick={() => { setIsSignUp(true); setFormError(""); setFormSuccess(""); }}
                  >
                    Sign up
                  </button>
                </>
              )}
            </p>
          </form>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              or
            </span>
          </div>

          {/* OIDC Provider Buttons */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isLoadingHtwg}
            onClick={() => handleOidcSignIn("htwg-oidc")}
          >
            {isLoadingHtwg ? "Redirecting..." : "Sign in with HTWG"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isLoadingTest}
            onClick={() => handleOidcSignIn("htwg-oidc-test")}
          >
            {isLoadingTest ? "Redirecting..." : "Sign in with HTWG (test)"}
          </Button>

          {/* Error / Success Messages */}
          {(formError || errorMessage) && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-xs text-destructive text-center">
                {formError || errorMessage}
              </p>
            </div>
          )}
          {formSuccess && (
            <div className="p-3 bg-green-500/10 border border-green-500 rounded-md">
              <p className="text-xs text-green-700 text-center">
                {formSuccess}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full-screen consent dialog */}
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
                ? "Aborting..."
                : "Decline & cancel registration"}
            </Button>
            <Button
              disabled={consentLoading !== null}
              onClick={handleAccept}
            >
              {consentLoading === "accept"
                ? "Saving..."
                : "I agree – complete registration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  )
}
