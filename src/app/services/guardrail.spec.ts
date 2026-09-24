import { describe, expect, it } from 'vitest';
import { checkCategoryLeakage, checkGrounding, checkNoAdvice, checkNoMoralizing, extractNumbers, runGuardrail } from './guardrail';
import { allowedValues } from '../data/verified-facts';

/**
 * I casi sono quelli dichiarati nelle sezioni "Verifica" delle politiche.
 * Fonte: ../../../agents/policies/
 * Se una politica cambia, il suo file cambia per primo e questi test seguono.
 */

describe('no-advice — agents/policies/no-advice.md', () => {
  it('blocca gli imperativi', () => {
    expect(checkNoAdvice('Dovresti mettere da parte qualcosa ogni mese')).not.toHaveLength(0);
    expect(checkNoAdvice('Devi controllare il saldo')).not.toHaveLength(0);
  });

  it('blocca le valutazioni di soglia', () => {
    expect(checkNoAdvice('Il tuo livello di risparmio è troppo basso')).not.toHaveLength(0);
  });

  it('blocca gli allarmi', () => {
    expect(checkNoAdvice('Attenzione: rischi di non arrivare a fine mese')).not.toHaveLength(0);
  });

  it('blocca le indicazioni di prodotto', () => {
    expect(checkNoAdvice('Apri un conto deposito per i tuoi risparmi')).not.toHaveLength(0);
  });

  it('ammette una regola pratica se attribuita', () => {
    expect(
      checkNoAdvice('Una regola diffusa tra i divulgatori divide il netto in tre parti.'),
    ).toHaveLength(0);
  });

  it('ammette la constatazione di un fatto', () => {
    expect(
      checkNoAdvice("L'INPS è una trattenuta obbligatoria: finanzia la tua pensione futura."),
    ).toHaveLength(0);
  });
});

describe('no-moralizing — agents/policies/no-moralizing.md', () => {
  it('blocca il giudizio sulla persona', () => {
    expect(checkNoMoralizing('Bassa familiarità con la finanza')).not.toHaveLength(0);
    expect(checkNoMoralizing('Preparazione insufficiente sui temi di base')).not.toHaveLength(0);
  });

  it('blocca anche la lode — la neutralità vale in entrambe le direzioni', () => {
    expect(checkNoMoralizing('Bravo, sei più preparato della media')).not.toHaveLength(0);
    expect(checkNoMoralizing('Ottimo risultato!')).not.toHaveLength(0);
  });

  it('blocca la commiserazione', () => {
    expect(checkNoMoralizing('Purtroppo non riesci a mettere da parte nulla')).not.toHaveLength(0);
  });

  it("blocca l'etichetta interna esposta in interfaccia", () => {
    expect(checkNoMoralizing('Il tuo profilo è novice')).not.toHaveLength(0);
  });

  it('ammette la descrizione di cosa la persona conosce', () => {
    expect(
      checkNoMoralizing('Non ha ancora incontrato i termini della busta paga.'),
    ).toHaveLength(0);
  });
});

describe('estrazione numerica — formato italiano', () => {
  it('interpreta le migliaia col punto e i decimali con la virgola', () => {
    expect(extractNumbers('Sono 1.234,56 € in tutto')).toEqual([1234.56]);
    expect(extractNumbers('Fino a 100.000 € per banca')).toEqual([100000]);
    expect(extractNumbers('Circa il 6,91% della retribuzione')).toEqual([6.91]);
  });

  it('non trova nulla in un testo senza cifre', () => {
    expect(extractNumbers('Il TFR si riceve alla fine del rapporto')).toEqual([]);
  });
});

describe('numeric-grounding — agents/policies/numeric-grounding.md', () => {
  const allowed = allowedValues('aware');

  it('ammette una cifra presente nei fatti verificati', () => {
    expect(checkGrounding('Sono coperti fino a 100.000 € per banca', allowed)).toHaveLength(0);
  });

  it('rifiuta una cifra assente dai fatti verificati', () => {
    expect(
      checkGrounding('Il TFR corrisponde a circa il 6,91% della retribuzione', allowed),
    ).not.toHaveLength(0);
  });

  it('ammette un testo senza cifre', () => {
    expect(checkGrounding('Il lordo è quanto costa il tuo lavoro', allowed)).toHaveLength(0);
  });

  it('ammette gli ordinali di struttura', () => {
    expect(checkGrounding('Ecco 3 cose da sapere, in 2 minuti', allowed)).toHaveLength(0);
  });
});

describe('runGuardrail', () => {
  it('senza insieme ammesso non esegue il controllo numerico', () => {
    expect(runGuardrail('Il TFR è il 6,91% della retribuzione').ok).toBe(true);
  });

  it("con l'insieme ammesso lo esegue", () => {
    expect(runGuardrail('Il TFR è il 6,91%', allowedValues('aware')).ok).toBe(false);
  });

  it('riporta tutte le violazioni, non solo la prima', () => {
    const result = runGuardrail('Bravo! Dovresti aprire un conto deposito');
    expect(result.ok).toBe(false);
    expect(result.violations.length).toBeGreaterThan(1);
  });

  it('lascia passare un testo conforme', () => {
    expect(
      runGuardrail(
        "L'INPS è la quota che finanzia la tua pensione futura. Viene trattenuta ogni mese e versata a tuo nome.",
      ).ok,
    ).toBe(true);
  });
});

describe('surface:solver — agents/policies/no-advice.md § Eccezione del solver', () => {
  it('solver senza adviceRequestedAt -> bloccato', () => {
    const result = runGuardrail(
      'Con queste riduzioni l\'obiettivo arriva a marzo.',
      { surface: 'solver' },
    );
    expect(result.ok).toBe(false);
    expect(result.violations[0].detail).toContain('adviceRequestedAt');
  });

  it('solver con adviceRequestedAt -> testo calcolato ammesso', () => {
    const result = runGuardrail(
      'Con le riduzioni che hai indicato, il traguardo si sposta a ottobre.',
      { surface: 'solver', adviceRequestedAt: new Date() },
    );
    expect(result.ok).toBe(true);
  });

  it('solver: categoria non dichiarata nelle leve -> bloccato', () => {
    const leveUtente = new Set(['trasporti', 'abbonamenti']);
    const result = runGuardrail(
      'Riducendo alimentari di 50 euro al mese arriveresti prima.',
      { surface: 'solver', adviceRequestedAt: new Date(), allowedCategories: leveUtente },
    );
    expect(result.ok).toBe(false);
    expect(result.violations.some(v => v.detail.includes('alimentari'))).toBe(true);
  });

  it('solver: categoria dichiarata nelle leve -> ammessa', () => {
    const leveUtente = new Set(['trasporti', 'abbonamenti']);
    const result = runGuardrail(
      'Riducendo trasporti e abbonamenti di 80 euro si libera il margine necessario.',
      { surface: 'solver', adviceRequestedAt: new Date(), allowedCategories: leveUtente },
    );
    expect(result.ok).toBe(true);
  });

  it('solver: il moralismo resta bloccato anche in modo solver', () => {
    const result = runGuardrail(
      'Ottimo! Sei molto bravo a gestire il budget.',
      { surface: 'solver', adviceRequestedAt: new Date() },
    );
    expect(result.ok).toBe(false);
  });
});
