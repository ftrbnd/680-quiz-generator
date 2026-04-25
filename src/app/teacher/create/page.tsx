import { CreateQuizWizard } from "@/components/quiz/create_quiz_wizard";

export default function CreateQuizPage() {
  return (
    <CreateQuizWizard
      heading="Create a Quiz"
      subheading="Upload study material and configure your quiz."
      afterCreateRedirect="teacher-quizzes"
    />
  );
}
