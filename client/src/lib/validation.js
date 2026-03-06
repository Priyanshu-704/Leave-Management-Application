import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const contactAdminSchema = z.object({
  subject: z.string().trim().min(3, "Subject must be at least 3 characters"),
  message: z.string().trim().min(10, "Message must be at least 10 characters"),
  priority: z.enum(["low", "normal", "high"]),
});

export const mapZodErrors = (error) => {
  if (!error?.issues) return {};
  return error.issues.reduce((acc, issue) => {
    const key = issue.path?.[0];
    if (key && !acc[key]) acc[key] = issue.message;
    return acc;
  }, {});
};
