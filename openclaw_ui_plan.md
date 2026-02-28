# OpenClaw UI Alignment Implementation Plan

## Goal
Update the GeminiClaw Dashboard to closely match the layout and features shown in the OpenClaw screenshots, while strictly preserving our existing color scheme (primary, accent, background colors).

## Proposed Changes

### 1. Unified Skills & Tools Page (`Skills.tsx`)
**Target UI:** Accordion-based vertical list instead of a grid, with search and advanced actions.
- **Layout:** Change `.skills-grid` to a vertical list of rows (`.skills-list`).
- **Features to Add:**
  - **Header:** "Skills" title with "Manage skill availability and API key injection." description.
  - **Search/Filter:** Add a search input bar and display the count of visible skills.
  - **Refresh Button:** Move the refresh button to the top right of the skills section.
  - **Accordions:** Group skills into collapsible "PROJECT SKILLS" and "NATIVE TOOLS" accordions, showing the count in the header.
  - **Skill Rows:**
    - Display icon, name, and description in a horizontal flow.
    - Add status tags (`openclaw-bundled` equivalent, `eligible`/`blocked`).
    - Show missing dependencies if applicable (e.g., `Missing: env:GEMINI_API_KEY`).
    - Add action buttons on the right: "Disable", "Enable", or "Save API Key".
- **Styling (`Skills.css`):** Write CSS for the list layout, tags, and right-aligned actions using our current variables (`var(--primary)`, `var(--bg-glass)`, etc.).

### 2. Advanced Logs Viewer (`Logs.tsx`)
**Target UI:** A structured, filterable, auto-tailing log interface.
- **Features to Add:**
  - **Header:** "Logs" title with "Live tail of the gateway file logs."
  - **Actions:** "Refresh" and "Export visible" buttons.
  - **Filters:** 
    - Search text input.
    - "Auto-follow" checkbox.
    - Log Level toggle buttons (Trace, Debug, Info, Warn, Error, Fatal).
  - **Log Table/List:**
    - Parse log lines into columns: `Time` | `Level Badge` | `Source/Context` | `Message Content`.
    - Apply specific colors to level badges (Warning = yellow, Error = red, Info = blue/primary) using our current theme colors.

### 3. New Nodes Configuration Page (`Nodes.tsx`)
**Target UI:** A setup page for execution approvals, node bindings, and security scopes.
- **Route & Sidebar:** Add a new "Nodes" page to the sidebar (`monitor` icon), placed below "Skills".
- **Features to Add:**
  - **Header:** "Nodes" title with "Paired devices, capabilities, and command exposure."
  - **Sections:**
    - **Exec Approvals:** Form to manage `Target`, `Scope` (tabs for different agents like `main`, `scipro`), `Security Mode`, `Ask Mode`, `Ask fallback`, and `Auto-allow skill CLIs`.
    - **Exec Node Binding:** Form to pin agents to specific nodes.
- **Backend Sync (if applicable):** Map these settings to the Gateway `geminiclaw.json` config (or store them as new config properties). For the UI alignment step, the forms will be built visually first.

## Verification Plan
### Manual Verification
1. Open the dashboard and navigate to **Skills**, **Logs**, and **Nodes**.
2. Visually compare the layout, padding, and elements against the provided OpenClaw screenshots.
3. Verify that interactable elements (search bars, accordions, log level toggles) function correctly in the frontend.
4. Confirm that **NO colors** have been changed from the original GeminiClaw theme.

---

## Recommandations d'un spécialiste en UI Design

Voici le plan détaillé en analysant chaque écran d'OpenClaw.

### Structure de navigation (inspirée d'OpenClaw)

OpenClaw a une sidebar plus riche que la nôtre avec des groupes clairs et des pages supplémentaires. Voici la structure cible :

```
CHAT
  └── Chat

CONTROL
  ├── Overview
  ├── Channels
  ├── Instances        ← NOUVEAU (présence beacons des clients connectés)
  ├── Sessions
  ├── Usage            ← NOUVEAU (statistiques de tokens/coûts)
  └── Cron Jobs        ← NOUVEAU (heartbeat → page dédiée complète)

AGENT
  ├── Agents
  ├── Skills
  └── Nodes            ← NOUVEAU (permissions exec par agent/scope)

SETTINGS
  ├── Config
  ├── Debug
  └── Logs

RESOURCES
  └── Docs
```

---

### Page par page

#### 1. Overview (refonte majeure)
**Ce qu'OpenClaw a que nous n'avons pas :**
- **Gateway Access** — connexion WebSocket configurable directement (WS URL, Token, Password, etc.).
- **Snapshot** — statut rapide du gateway : STATUS, UPTIME, TICK INTERVAL, LAST CHANNELS REFRESH.
- **Blocs de compteurs** — INSTANCES, SESSIONS, CRON.
- **Section "Notes"** — reminders fixes pour les opérateurs.

#### 2. Agents (refonte majeure)
**Ce qu'OpenClaw a :** layout split en deux colonnes — liste d'agents à gauche, détail à droite avec onglets.
- **Onglets par agent :** Overview, Files (browser), Tools (MCP), Skills (assignés), Channels, Cron Jobs.

#### 3. Sessions (refonte majeure)
- **Filtres en haut :** Active within, Limit, Include global, Include unknown.
- **Tableau enrichi avec colonnes :** Key, Label, Kind, Updated, Tokens (avec barre de progression), Thinking, Verbose, Reasoning, Actions.

#### 4. Instances (PAGE NOUVELLE)
- Liste des présences connectées au gateway (clients WebSocket actifs).
- Affiche le nom, la description courte, l'IP, les tags (type, rôle, scopes, OS, env), l'heure relative, le last input et la raison.

#### 5. Usage (PAGE NOUVELLE)
- Statistiques de consommation — tokens utilisés par agent, par canal, par période.
- Graphiques de consommation et coûts estimés par modèle.

#### 6. Cron Jobs (PAGE NOUVELLE)
- Bande de status en haut (ENABLED, JOBS, NEXT WAKE).
- **Colonne gauche :** liste des jobs (nom, status, cron, prompt, delivery, agent assigné, actions).
- **Colonne droite :** formulaire "New Job".
- **Onglet History :** liste des exécutions passées de chaque job.

#### 7. Skills (refonte)
- Sections distinctes avec collapsibles (**WORKSPACE SKILLS** et **BUILT-IN SKILLS**).
- Affichage des skills avec statut bloqué (manque dépendance) ou actif, formulaire inline pour clé API, et boutons d'activation.

#### 8. Nodes (PAGE NOUVELLE)
- Gestion des permissions d'exécution par scope/agent.
- **Exec approvals :** Target, Scope, Security mode, Ask mode, Ask fallback, Auto-allow skill CLIs.
- **Exec node binding :** Pin des agents à un node spécifique.

#### 9. Chat (amélioration)
- En-tête avec session selector, avatars spécifiques par rôle ("A" pour assistant, "U" pour user), timestamps visibles.

#### 10. Logs (amélioration)
- Checkboxes de filtre par niveau colorées, affichage du fichier actuel, champ de recherche, auto-follow.

#### 11. Topbar (amélioration)
- Version, badge Health, icône de notification, et banner système (pour les mises à jour).

### Résumé des priorités d'implémentation

| Priorité | Page | Effort |
|---|---|---|
| 🔴 P1 | Cron Jobs — page complète avec history | 6-8h |
| 🔴 P1 | Agents — split panel + 6 onglets | 5-6h |
| 🔴 P1 | Sessions — filtres + colonnes riches | 3-4h |
| 🟠 P2 | Overview — Gateway Access + Snapshot + compteurs | 2-3h |
| 🟠 P2 | Instances — nouvelle page | 2h |
| 🟠 P2 | Skills — sections collapsibles + API key inline | 2-3h |
| 🟡 P3 | Nodes — permissions granulaires par scope | 4-5h |
| 🟡 P3 | Usage — stats tokens/coûts | 3h |
| 🟡 P3 | Chat — avatar + session selector | 1h |
| 🟡 P3 | Logs — checkboxes + export + auto-follow | 1-2h |
| 🟡 P3 | Topbar — version + health + banner update | 1h |
