import { FeedbackForm } from "@/components/feedback-form"

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className="w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Code with Heart</h1>
          <p className="text-muted-foreground">
            Share and receive constructive feedback within the HTWG community
          </p>
        </div>
        <FeedbackForm />
      </div>
    </main>
  )
}
