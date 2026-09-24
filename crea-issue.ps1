<#
    Crea le issue del blocco B sul repository.

    Uso:
        .\crea-issue.ps1 -Token "ghp_..."

    Serve un PAT *classic* con scope `repo`: i fine-grained non possono
    scrivere su repository di proprieta' di un altro account personale.
    Si crea in Settings -> Developer settings -> Personal access tokens
    -> Tokens (classic).

    Lo script e' idempotente: salta le issue il cui titolo esiste gia'.
    Da cancellare dal repository prima del freeze.
#>
param(
    [Parameter(Mandatory = $true)][string]$Token,
    [string]$Owner = 'martiftts',
    [string]$Repo  = 'safe-to-spend'
)

$ErrorActionPreference = 'Stop'
$headers = @{
    Authorization          = "Bearer $Token"
    Accept                 = 'application/vnd.github+json'
    'X-GitHub-Api-Version' = '2022-11-28'
    'User-Agent'           = 'safe-to-spend'
}
$api = "https://api.github.com/repos/$Owner/$Repo/issues"

$issues = @(
    @{
        title = 'B1 - Schemi del profilo economico'
        body  = @'
In `agents/schemas/household.ts`, con Zod.

Tipi: nucleo (adulti, minori, percettori), redditi (netto mensile, mensilita', accessori), debiti (tipo, rata, rate residue), spese fisse, spese future (importo, mesi mancanti), saldo attuale.

**Accettazione:** importabile dall'app tramite l'alias `@schemas`, build verde.

**Dipende da:** niente. Sblocca tutto il resto.
**Owner:** A - **Stima:** 30 min
'@
    },
    @{
        title = 'B2 - Catena delle sottrazioni'
        body  = @'
`src/app/engine/chain.ts`.

`reddito - rate - spese fisse - accantonamento = margine`, poi `margine / giorni del mese = budget giornaliero`.
Ogni scalino espone importo, totale progressivo e la formula come stringa, per la sezione "come l'abbiamo calcolato".

**Accettazione:** il margine negativo e' gestito come risultato legittimo, senza eccezioni.

**Dipende da:** B1
**Owner:** A - **Stima:** 40 min
'@
    },
    @{
        title = 'B3 - Accantonamento spese future'
        body  = @'
`src/app/engine/sinking-fund.ts`.

Per ogni spesa futura: `importo / mesi mancanti`. Somma mensile complessiva.
E' il concetto di sinking fund: quei soldi sono gia' impegnati anche se sono ancora sul conto.

**Dipende da:** B1
**Owner:** A - **Stima:** 20 min
'@
    },
    @{
        title = 'B4 - Indicatori'
        body  = @'
`src/app/engine/indicators.ts`.

- Scala OCSE-modificata (1 primo adulto, 0,5 altri adulti, 0,3 minori) e reddito equivalente
- Quota impegnata (rate / reddito netto)
- Timeline di liberazione delle rate
- Saldo reale: saldo meno quanto e' gia' impegnato entro fine mese

**Dipende da:** B1
**Owner:** A - **Stima:** 40 min
'@
    },
    @{
        title = 'B5 - Quattro profili sintetici'
        body  = @'
Monoreddito con figli, giovane prima assunzione, coppia con mutuo, **margine negativo**.

Ciascuno con movimenti, mutuo e piani rateizzati. Dati verosimili ma inventati, nessun dato identificativo (no nome, no IBAN, no codice fiscale): non servono a nessun calcolo.

Il profilo a margine negativo non e' opzionale: e' il caso in cui il tono paternalistico rientra piu' facilmente.

**Dipende da:** B1
**Owner:** B - **Stima:** 45 min
'@
    },
    @{
        title = 'B6 - Test del motore'
        body  = @'
Valori attesi calcolati a mano per i quattro profili di B5.

E' l'evidenza di validazione richiesta dal risultato atteso n. 3 del brief.

**Accettazione:** `npx ng test --watch=false` verde.

**Dipende da:** B2, B3, B4, B5
**Owner:** A - **Stima:** 30 min
'@
    },
    @{
        title = 'B7 - Schermata consenso'
        body  = @'
Un interruttore per fonte dati, non un consenso unico.
Ogni voce dichiara **cosa** viene letto e **a cosa serve**. Revocabile.

Senza consenso il flusso prosegue comunque, con i soli dati del conto principale.

**Dipende da:** B1
**Owner:** B - **Stima:** 40 min
'@
    },
    @{
        title = 'B8 - Caricamento e categorizzazione'
        body  = @'
Dai profili sintetici a movimenti normalizzati.

Categorie **descrittive e neutre**: casa, trasporti, alimentari, salute, abbonamenti, tempo libero, altro.
Vietate le etichette valutative (superfluo, voluttuario, evitabile, essenziale): vedi `agents/policies/no-moralizing.md`. Da un movimento bancario non si puo' sapere se una spesa era necessaria.

Rilevamento delle ricorrenze per importo e cadenza: sono la parte del bilancio che le persone dimenticano di avere.

**Dipende da:** B5
**Owner:** A - **Stima:** 45 min
'@
    },
    @{
        title = 'B9 - Spese future: input'
        body  = @'
L'utente aggiunge le spese previste: voce, importo, quando.

Mostra l'accantonamento mensile che ne deriva, spiegato come tale.

**Dipende da:** B3, B7
**Owner:** B - **Stima:** 30 min
'@
    },
    @{
        title = 'B10 - Cruscotto'
        body  = @'
La catena a scalini, con il budget giornaliero in evidenza.

Ogni scalino apribile mostra tre cose: il numero, cosa significa, come e' stato calcolato.
Gli indicatori di B4 in seconda battuta, nella schermata di approfondimento.

**Dipende da:** B2, B4
**Owner:** B - **Stima:** 50 min
'@
    },
    @{
        title = 'B11 - Obiettivo e leve'
        body  = @'
L'utente fissa l'obiettivo: cosa, quanto costa, entro quando.

Poi marca **lui** quali categorie considera comprimibili, con uno slider ciascuna.
**Nessuna categoria e' comprimibile per default**: e' la garanzia che l'app non scelga al posto suo.

**Dipende da:** B8, B10
**Owner:** B - **Stima:** 45 min
'@
    },
    @{
        title = 'B12 - Simulatore'
        body  = @'
Ricalcolo in tempo reale della data di arrivo al variare degli slider.
Scenario a zero riduzioni come riferimento. Il divario in euro al mese se l'obiettivo non e' raggiungibile.

Nota fissa a schermo:
> Questi numeri derivano dall'obiettivo e dai limiti che hai indicato tu. Non sono una raccomandazione finanziaria.

L'app non nomina mai una categoria che l'utente non ha marcato come comprimibile.

**Dipende da:** B11
**Owner:** A - **Stima:** 50 min
'@
    }
)

Write-Host "Leggo le issue esistenti..."
$existing = @()
try {
    $existing = (Invoke-RestMethod -Uri "$api`?state=all&per_page=100" -Headers $headers).title
} catch {
    Write-Host "Impossibile leggere le issue esistenti: $($_.Exception.Message)" -ForegroundColor Yellow
}

$created = 0
$skipped = 0
foreach ($i in $issues) {
    if ($existing -contains $i.title) {
        Write-Host "  salto (esiste gia'): $($i.title)" -ForegroundColor DarkGray
        $skipped++
        continue
    }
    $payload = @{ title = $i.title; body = $i.body } | ConvertTo-Json -Depth 4
    $bytes = [Text.Encoding]::UTF8.GetBytes($payload)
    try {
        $r = Invoke-RestMethod -Method Post -Uri $api -Headers $headers -Body $bytes -ContentType 'application/json; charset=utf-8'
        Write-Host "  creata #$($r.number): $($i.title)" -ForegroundColor Green
        $created++
    } catch {
        Write-Host "  ERRORE su '$($i.title)': $($_.Exception.Message)" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 400   # cortesia verso il rate limit
}

Write-Host ""
Write-Host "Create: $created - Saltate: $skipped" -ForegroundColor Cyan
