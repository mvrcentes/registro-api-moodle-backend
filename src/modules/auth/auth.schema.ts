

import { z } from "zod";

export const LoginBody = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const CreateUserBody = z.object({
  email: z.email(),
  role: z.enum(["ADMIN", "APPLICANT"]),
  password: z.string().min(10),
});

export const ResetPasswordBody = z.object({
  email: z.email(),
});

export type LoginBodyType = z.infer<typeof LoginBody>;
export type CreateUserBodyType = z.infer<typeof CreateUserBody>;