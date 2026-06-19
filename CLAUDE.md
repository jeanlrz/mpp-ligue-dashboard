# Dashboard MPP — Ligue Com d'Artisans

Dashboard statique de pronostics foot (Coupe du Monde 2026) pour la ligue **Com d'Artisans** (16 joueurs) de l'app **MPP (Mon Petit Prono)**. En ligne : https://mpp-cda.jeanlarroze-production.fr/

> **Note multi-machines** : ce repo (`jeanlrz/mpp-ligue-dashboard`) est la version déployée. Sur la machine principale (Mac de Jean), il existe un `dashboard.html` source à la racine d'un dossier `MPP/` qui est copié vers `index.html` ; ici, dans le repo cloné, **on édite directement `index.html`** (c'est le site, l'historique git fait office de sauvegarde).

## Stack
Un seul fichier HTML autonome (`index.html`), toutes les données inline en objets JS, aucun build. Police Barlow Condensed, graphiques SVG faits main, onglets, tooltips CSS `::after`.

## Workflow de déploiement
Éditer `index.html` → `git add index.html` (et `gazette/` si nouvelle image) → `git commit` → `git push`. Vercel auto-déploie. Finir les messages de commit par : `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## Preview locale (optionnel)
`npx http-server . -p 8123 -c-1` puis ouvrir `http://localhost:8123/index.html?v=<timestamp>` (le query param force le rechargement, le cache est tenace).

## Fichiers
- `index.html` — le site complet (données + UI + logique).
- `gazette/` — images des Gazettes (`gazette-JJMM.jpg`).
- `avatars/` — 16 photos de profil (prénom en minuscule), fallback initiales.
- `favicon.jpg` — logo MPP.
- `api/live-match.js` — fonction serverless Vercel (score live, clé API cachée via `process.env.API_FOOTBALL_KEY`).

## Modèle de données (dans `index.html`)
- `LEAGUE_DATA` : `updatedLabel`, `dates: [...]`, `players: [...]`. Chaque joueur = `{ name, pseudo, br, se, history: [...], joker? }`.
  - `br` = nb cumulé de **bons résultats** (points > 0), `se` = nb cumulé de **scores exacts**.
  - `history` = totaux cumulés, **un snapshot par jour/mise à jour** (même longueur que `dates`).
  - `joker` (optionnel) = `{ match: "Label", won: true|false }`. Badge accueil : `×2` vert = dispo, `×2 ✓` vert = utilisé+réussi, `×2 ✗` rouge = utilisé+raté. Un seul ×2 par joueur dans tout le tournoi.
- `MATCHES_PLAYED` : `{ date, label, score, points: [16], exacts: [indices] }`, ordre chronologique de coup d'envoi (l'onglet Matchs l'affiche inversé, plus récent en haut).
  - `exacts` = indices des joueurs ayant le **score exact** (à déterminer d'après les pronos, PAS d'après les points : MPP ne donne pas toujours de bonus de rareté).
- `UPCOMING_MATCHES` : `{ datetime, label, group }` ; retirer les matchs joués au fur et à mesure.
- `GAZETTES` : tableau `[{ date, label, file }]`, plus récent en 1er ; `GAZETTE = GAZETTES[0]` = gazette du jour (bouton header). Onglet « Gazettes » = galerie classée par jour.

## Ordre fixe des 16 joueurs dans `players` (et mapping pseudo → prénom)
1. Maxime — `GOAT#UE2LBTD9`
2. Gabriel — `Gaby-scz`
3. Jean — `Trisomie21`
4. Paul — `Chikago_Boule`
5. Alban — `Alban#3JA93`
6. Cassandra — `CASSCDA`
7. Lola — `Lola-om`
8. Dorian — `Dodoskante`
9. Candice — `candicefcn`
10. Auriane — `Auriane_chd`
11. Romane — `romane_gblld`
12. Clara — `Claribo`
13. David — `Alon-Snow`
14. Marine — `marinedrd`
15. Justine — `Juvy`
16. Morgane — `Morgane-sco`

## Convention de dates
Le champ `date` d'un match = date calendaire à l'heure de Paris du **coup d'envoi**. Un match de nuit (coup d'envoi après minuit, ex. 00h/03h/06h) compte pour le **LENDEMAIN**. Les matchs en soirée (18h–22h) restent sur leur jour.

## Crédit des points MPP
**MPP crédite les points au classement vers 10h du matin.** Avant ça, un match de la nuit peut être joué (score + points affichés à l'écran Résultats) mais pas encore crédité au classement officiel. Toujours recouper les totaux calculés avec le classement officiel : si un écart = pile la valeur d'un match pour chaque joueur concerné, c'est ce match qui n'est pas encore crédité (attendre ~10h ou le retirer temporairement).

## Routine matinale (3 livrables à chaque fournée de résultats)
Quand Jean fournit les **screenshots de résultats** de la nuit (app MPP), produire :
1. **Mise à jour du site** : `history` + `br`/`se` des joueurs, nouveaux matchs dans `MATCHES_PLAYED` (avec `exacts` + dates Paris), retirer les matchs joués de `UPCOMING_MATCHES`, tout nouveau joker. Les ×2 se repèrent dans les screenshots (points doublés / indicateur), pas besoin que Jean les annonce. Commit + push.
2. **Tableau de stats Com d'Artisans** : bilan global (nb pronos = 16 × nb matchs / bons résultats % / mauvais % / scores exacts %) + détail par match (Score | 🎯 Exact % (x/16) | ✅ Bons résultats % (x/16)). **Matchs ordonnés par heure de coup d'envoi, PAS par groupe.**
3. **La Gazzetta** : récap au format Slack, ton chambreur, emojis. Sections : 🌙 La nuit en chiffres / 🔥 Les héros de la nuit (🥇🥈🥉) / 🎢 Le grand huit / 📉 La plus grosse glissade / 🚀 Le bond de la nuit / 🏆 Au sommet de la montagne (top 3 totaux). Calculer : classement nuit = points cumulés du jour ; glissade/bond = comparer rangs des 2 derniers snapshots `history`.

## Image Gazette (workflow en 2 temps)
Jean fabrique l'image « Ma Petite Gazette » À PARTIR du tableau de stats + de la Gazzetta (depuis un PSD qu'il garde de son côté), puis la fournit dans un 2e message. Intégration = mon job : copier le `.jpg` dans `gazette/`, ajouter une entrée EN TÊTE de `GAZETTES` (`{ date: "AAAA-MM-JJ", label: "Bilan de la nuit du JJ mois", file: "gazette/gazette-JJMM.jpg" }`), commit/push. Astuce cache : si on remplace une image existante, ajouter `?v=2` au `file` pour forcer le rafraîchissement (le nom de téléchargement strippe déjà la query).
