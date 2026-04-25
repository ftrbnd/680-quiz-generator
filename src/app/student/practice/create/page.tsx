import { CreateQuizWizard } from "@/components/quiz/create_quiz_wizard";

export default function StudentPracticeCreatePage() {
  return (
    <CreateQuizWizard
      heading="Practice from your notes"
      subheading="Upload your own material. Only you will see this quiz in Available Quizzes."
      afterCreateRedirect="student-take"
    />
  );
}
