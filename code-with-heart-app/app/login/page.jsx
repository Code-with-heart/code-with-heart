"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { signIn } from "next-auth/react"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [isLoadingHtwg, setIsLoadingHtwg] = React.useState(false)
  const [isLoadingTest, setIsLoadingTest] = React.useState(false)
  const errorParam = searchParams.get("error")
  const errorMessage = errorParam
    ? "Sign in failed. Please use your HTWG account."
    : ""

  const handleSignIn = async () => {
    setIsLoadingHtwg(true)
    await signIn("htwg-oidc", { callbackUrl: "http://localhost:3000" })
  }

  const handleTestSignIn = async () => {
    setIsLoadingTest(true)
    await signIn("htwg-oidc-test", { callbackUrl: "http://localhost:3000" })
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
    </div>
  )
}
