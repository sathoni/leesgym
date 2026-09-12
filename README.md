# De Leesgym

Een leesapp voor Mathieu's iPhone. Tien boeken van september 2026 tot juli 2027,
een trainingsschema dat van 15 naar 60 minuten per dag klimt, een leestimer met
logboek, en een nabespreking per uitgelezen boek.

Installeren: de site openen **in Safari**, dan Deel → Zet op beginscherm.

## Hoe het in elkaar zit

Geen frameworks, geen build, geen dependencies. Zes bestanden:

| Bestand | Wat erin staat |
|---|---|
| `index.html` | het karkas, meer niet |
| `styles.css` | alle opmaak |
| `data.js` | **alle inhoud**: de boeken, het trainingsschema, de wachtlijst, de vragen |
| `app.js` | de werking: schermen, timer, opslag |
| `sw.js` | offline werken en bijwerken |
| `manifest.webmanifest` | naam en icoon op het beginscherm |

Inhoud aanpassen (een boek, een tekst, een vraag) doe je in `data.js`.
Aan `app.js` hoef je dan niet te komen.

## Waar de gegevens staan

In `localStorage` van de telefoon zelf, onder de sleutel `leesgym:v1`.
Geen server, geen account, geen synchronisatie, geen meldingen.
Dat is een bewuste keuze: één gebruiker op één toestel.

Daarom staat er onderaan het Training-tabblad een **Back-up**-knop.
Telefoon kwijt = alles kwijt, tenzij die back-up ergens geplakt staat.

**Let op bij updates:** de boeken uit `data.js` en de voortgang van Mathieu
staan los van elkaar. Voortgang hangt aan het `id` van een boek. Verander nooit
een bestaand `id` — dan is die voortgang weg.

## Bij elke publicatie: twee nummers ophogen

Anders blijft de oude versie op de telefoon staan, soms dagenlang,
omdat een geïnstalleerde app nooit echt sluit.

1. in `sw.js`: `var V = "leesgym-v1";` → `v2`, `v3`, …
2. in `index.html` en in de lijst `ASSETS` van `sw.js`: `?v=1` → `?v=2`, …

Beide, altijd, in dezelfde publicatie.

## Publiceren

GitHub Pages, rechtstreeks van de tak `main`. Pushen volstaat; een minuut later
staat de site online. De repository moet publiek zijn, anders is Pages betalend.

Het lege bestand `.nojekyll` moet blijven staan: het zegt tegen GitHub dat het
de bestanden ongemoeid moet doorgeven in plaats van ze door Jekyll te halen.

Er staat bewust **geen** GitHub Actions-workflow in. Het token van Mathieu heeft
geen `workflow`-rechten, dus een workflow-bestand kan niet gepusht worden. Wil
je dat ooit toch: `gh auth refresh -h github.com -s workflow` en dan opnieuw.

## Valkuilen die hier al ingebouwd zijn

- **Dagen optellen doe je via de kalender**, niet via milliseconden
  (`addDays`). Anders schuift eind oktober alles een dag op door het winteruur.
- **Een boek begint pas na de deadline van het vorige** (`windowStart`).
  Zonder dat rekent "pagina's per dag" van een boek uit november al vanaf
  vandaag, en komt het veel te laag uit.
- **Invoervelden tekenen het scherm niet opnieuw.** Bij elke toetsaanslag
  opnieuw tekenen sluit het toetsenbord van de iPhone.
- **Een timer die blijft lopen wordt na vier uur weggegooid**, anders staat er
  morgen een sessie van veertien uur klaar.
- **Kopiëren naar het klembord kan geweigerd worden.** Lukt het niet, dan toont
  de app de tekst zodat je die zelf kan selecteren.
