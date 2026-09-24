import { z } from 'zod';

export const NucleoSchema = z.object({
  adulti: z.number().int().min(1),
  minori: z.number().int().min(0).default(0),
  percettori: z.number().int().min(1),
});

export const RedditoSchema = z.object({
  nettoMensile: z.number().min(0),
  mensilita: z.number().int().min(12).max(16).default(12),
  accessoriAnnui: z.number().min(0).default(0),
});

export const DebitoSchema = z.object({
  tipo: z.enum(['mutuo', 'prestito_personale', 'cessione_quinto', 'finanziamento', 'altro']),
  rata: z.number().positive(),
  rateResidue: z.number().int().positive(),
});

export const SpesaFissaSchema = z.object({
  categoria: z.enum(['casa', 'trasporti', 'alimentari', 'salute', 'abbonamenti', 'tempo_libero', 'altro']),
  importo: z.number().positive(),
  descrizione: z.string().optional(),
});

export const SpesaFuturaSchema = z.object({
  descrizione: z.string(),
  importo: z.number().positive(),
  mesiMancanti: z.number().int().min(1),
});

export const HouseholdProfileSchema = z.object({
  nucleo: NucleoSchema,
  reddito: RedditoSchema,
  debiti: z.array(DebitoSchema).default([]),
  speseFisse: z.array(SpesaFissaSchema).default([]),
  speseFuture: z.array(SpesaFuturaSchema).default([]),
  saldoAttuale: z.number(),
});

export type HouseholdProfile = z.infer<typeof HouseholdProfileSchema>;
export type Nucleo = z.infer<typeof NucleoSchema>;
export type Reddito = z.infer<typeof RedditoSchema>;
export type Debito = z.infer<typeof DebitoSchema>;
export type SpesaFissa = z.infer<typeof SpesaFissaSchema>;
export type SpesaFutura = z.infer<typeof SpesaFuturaSchema>;
