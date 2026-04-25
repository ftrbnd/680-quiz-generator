import { pgTable, text, timestamp, integer, boolean, jsonb, real, pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["TEACHER", "STUDENT"]);
export const quizTypeEnum = pgEnum("quiz_type", [
  "MULTIPLE_CHOICE",
  "SHORT_ANSWER",
  "FILL_IN_THE_BLANK",
  "READING_COMPREHENSION",
]);
export const difficultyEnum = pgEnum("difficulty", ["EASY", "MEDIUM", "HARD"]);
export const quizVisibilityEnum = pgEnum("quiz_visibility", ["SHARED", "PRIVATE"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: roleEnum("role").notNull().default("STUDENT"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const quizzes = pgTable("quizzes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  quizType: quizTypeEnum("quiz_type").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  timeLimitMinutes: integer("time_limit_minutes"),
  visibility: quizVisibilityEnum("visibility").notNull().default("SHARED"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const questions = pgTable("questions", {
  id: text("id").primaryKey(),
  quizId: text("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  options: jsonb("options"),
  correctAnswer: text("correct_answer").notNull(),
  hasLatex: boolean("has_latex").notNull().default(false),
  orderIndex: integer("order_index").notNull(),
});

export const attempts = pgTable("attempts", {
  id: text("id").primaryKey(),
  quizId: text("quiz_id").notNull().references(() => quizzes.id),
  studentId: text("student_id").notNull().references(() => users.id),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  submittedAt: timestamp("submitted_at"),
  score: real("score"),
});

export const answers = pgTable("answers", {
  id: text("id").primaryKey(),
  attemptId: text("attempt_id").notNull().references(() => attempts.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull().references(() => questions.id),
  studentResponse: text("student_response").notNull(),
  isCorrect: boolean("is_correct").notNull(),
});

export const uploadedFiles = pgTable("uploaded_files", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  originalName: text("original_name").notNull(),
  fileType: text("file_type").notNull(),
  storagePath: text("storage_path").notNull(),
  extractedText: text("extracted_text"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type Answer = typeof answers.$inferSelect;
export type UploadedFile = typeof uploadedFiles.$inferSelect;
