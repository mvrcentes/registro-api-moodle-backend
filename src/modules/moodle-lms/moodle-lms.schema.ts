// src/modules/moodle-lms/moodle-lms.schema.ts
import { z } from "zod"

// ============================================================
// SCHEMAS PARA USUARIOS
// ============================================================

export const CreateUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
})

export const UpdateUserSchema = z.object({
  id: z.number().int().positive("User ID must be a positive number"),
  username: z.string().min(1).optional(),
  firstname: z.string().min(1).optional(),
  lastname: z.string().min(1).optional(),
  email: z.string().email().optional(),
})

export const DeleteUserSchema = z.object({
  userId: z.number().int().positive("User ID must be a positive number"),
})

// ============================================================
// SCHEMAS PARA MATRICULACIÓN
// ============================================================

export const EnrolUserSchema = z.object({
  userId: z.number().int().positive("User ID must be a positive number"),
  courseId: z.number().int().positive("Course ID must be a positive number"),
  roleId: z.number().int().positive().optional(),
})

export const UnenrolUserSchema = z.object({
  userId: z.number().int().positive("User ID must be a positive number"),
  courseId: z.number().int().positive("Course ID must be a positive number"),
})

// ============================================================
// SCHEMAS PARA CURSOS
// ============================================================

export const SearchCoursesSchema = z.object({
  criterianame: z.string().min(1, "Criteria name is required"),
  criteriavalue: z.string().min(1, "Criteria value is required"),
})

export const CreateCourseSchema = z.object({
  fullname: z.string().min(1, "Full name is required"),
  shortname: z.string().min(1, "Short name is required"),
  categoryid: z.number().int().positive("Category ID must be a positive number"),
  summary: z.string().optional(),
})

export const UpdateCourseSchema = z.object({
  id: z.number().int().positive("Course ID must be a positive number"),
  fullname: z.string().min(1).optional(),
  shortname: z.string().min(1).optional(),
  summary: z.string().optional(),
})

export const DeleteCourseSchema = z.object({
  courseId: z.number().int().positive("Course ID must be a positive number"),
})

// ============================================================
// TYPES
// ============================================================

export type CreateUserBody = z.infer<typeof CreateUserSchema>
export type UpdateUserBody = z.infer<typeof UpdateUserSchema>
export type DeleteUserBody = z.infer<typeof DeleteUserSchema>
export type EnrolUserBody = z.infer<typeof EnrolUserSchema>
export type UnenrolUserBody = z.infer<typeof UnenrolUserSchema>
export type SearchCoursesBody = z.infer<typeof SearchCoursesSchema>
export type CreateCourseBody = z.infer<typeof CreateCourseSchema>
export type UpdateCourseBody = z.infer<typeof UpdateCourseSchema>
export type DeleteCourseBody = z.infer<typeof DeleteCourseSchema>
