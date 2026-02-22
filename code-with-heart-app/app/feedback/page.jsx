"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { FeedbackForm } from "@/components/feedback-form"

export default function Page() {
  const { data: session } = useSession()
  const [currentUser, setCurrentUser] = React.useState(null)

  React.useEffect(() => {
    const loadUser = async () => {
      if (!session?.user?.id) {
        setCurrentUser(null)
        return
      }

      const response = await fetch("/api/users/me")
      const result = await response.json()

      if (response.ok) {
        setCurrentUser(result.data)
      }
    }

    loadUser()
  }, [session?.user?.id])

  return (
    <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Feedback</h1>
        </div>
        <FeedbackForm
          userId={currentUser?.id}
          currentUserName={currentUser?.full_name}
        />
      </div>
    </div>
  );
}


