import { z } from 'zod';

const baseName = z.string().min(2).max(80);
const email = z.string().email().max(160);
const password = z.string().min(6).max(120);

export const loginSchema = z.object({
  email,
  password
});

export const registerClientSchema = z.object({
  name: baseName,
  email,
  password,
  phone: z.string().min(7).max(24),
  city: z.string().min(2).max(70).optional().default(''),
  need: z.string().min(2).max(80)
});

export const registerProSchema = z.object({
  name: baseName,
  email,
  password,
  specialty: z.string().min(2).max(90),
  experience: z.coerce.number().int().min(0).max(60),
  city: z.string().min(2).max(70),
  document: z.string().min(4).max(32),
  bio: z.string().min(10).max(500)
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(280)
});

export const serviceSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  category: z.string().min(2).max(60),
  price: z.coerce.number().positive().max(100000)
});

export const insuranceSchema = z.object({
  fullName: z.string().min(2).max(100),
  documentId: z.string().min(4).max(32),
  birthDate: z.string().min(8).max(12),
  phone: z.string().min(7).max(24),
  plan: z.enum(['basic', 'standard', 'premium'])
});
