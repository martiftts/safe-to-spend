/**
 * Contratti di output dei tre step.
 *
 * Fonte unica di verità: importati sia dai servizi Angular sia usati come
 * `output_config.format` nelle chiamate all'API. Non esistono altre
 * definizioni di questi output nel repository.
 *
 * Sostituiscono il parsing via espressione regolare (`text.match(/\{[\s\S]*\}/)`):
 * quel metodo accetta qualunque JSON sintatticamente valido, anche con campi
 * mancanti o di tipo sbagliato, e fallisce a valle invece che al confine.
 *
 * Istruzioni dei singoli step: ../prompts/
 */
import { z } from "zod";

// ─── Step 1 · Analyze ──────────────────────────────────────────────────────

export const Step1Schema = z.object({
  painPoint: z
    .string()
    .min(10)
    .max(160)
    .describe("una frase: cosa la persona non ha ancora capito, o dove si blocca"),
  summary: z
    .string()
    .min(20)
    .max(320)
    .describe("due frasi: profilo sintetico, descrittivo e non valutativo"),
});

export type Step1Output = z.infer<typeof Step1Schema>;

// ─── Step 2 · Classify ─────────────────────────────────────────────────────

export const ArchetypeSchema = z.enum(["novice", "aware", "practitioner"]);
export type Archetype = z.infer<typeof ArchetypeSchema>;

export const Step2Schema = z.object({
  archetype: ArchetypeSchema.describe("etichetta interna, mai mostrata all'utente"),
  score: z.number().int().min(0).max(20),
  rationale: z
    .string()
    .max(200)
    .describe("una frase su cosa la persona già conosce; mai un giudizio su di lei"),
});

export type Step2Output = z.infer<typeof Step2Schema>;

/**
 * Soglie dell'archetipo. Sono la stessa scala usata dal fallback
 * deterministico, non una seconda logica: è ciò che rende il fallback
 * verificabile contro l'LLM invece che soltanto sostitutivo.
 * Vedi ../policies/escalation.md § I tre fallback deterministici.
 */
export const ARCHETYPE_THRESHOLDS = { novice: [0, 8], aware: [9, 14], practitioner: [15, 20] } as const;

export function archetypeFromScore(score: number): Archetype {
  if (score >= 15) return "practitioner";
  if (score >= 9) return "aware";
  return "novice";
}

// ─── Step 3 · Educate ──────────────────────────────────────────────────────

export const LessonSchema = z.object({
  title: z.string().min(3).max(60),
  body: z
    .string()
    .min(20)
    .max(280)
    .describe("massimo 40 parole; cifre ammesse solo se presenti nei fatti verificati"),
  emoji: z.string().min(1).max(4),
});

export const Step3Schema = z.object({
  lessons: z.array(LessonSchema).length(3),
  nextStep: z
    .string()
    .max(200)
    .describe("una frase su cosa la persona può esplorare dopo; mai un imperativo"),
});

export type Step3Output = z.infer<typeof Step3Schema>;

// ─── Stato esternalizzato ──────────────────────────────────────────────────

/** Perché uno step è degradato. `null` se è andato a buon fine. */
export type Degradation = "timeout" | "network" | "invalid-output" | "policy" | null;

export interface StepTrace {
  step: 1 | 2 | 3;
  model: string | null;
  degraded: Degradation;
  attempts: number;
  ms: number;
}

/**
 * Il tracciato del workflow. Alimenta l'avviso di degradazione parziale
 * (../policies/escalation.md § 1) ed è ciò che rende il comportamento del
 * sistema dimostrabile in demo invece che soltanto dichiarato.
 */
export interface WorkflowTrace {
  steps: StepTrace[];
  degradedCount: number;
}
