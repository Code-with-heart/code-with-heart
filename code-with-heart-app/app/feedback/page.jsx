import { FeedbackForm } from "@/components/feedback-form"

export default function Page() {
  return (
    <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Feedback</h1>
        </div>
        <FeedbackForm />
      </div>
    </div>
  );
}


