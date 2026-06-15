# AGENT_TEST_RECIPES — patterns de tests pour agents IA

Référence rapide pour Claude Code / Cursor / Codex. Quand tu écris du code dans ce repo, **identifie la catégorie** et applique la recette correspondante. Ne jamais commiter sans test pour les catégories marquées **(obligatoire)**.

> Garde-fou : avant `git push`, lance `npm run test:agent-check` (typecheck + lint + jest --findRelatedTests sur les fichiers modifiés).

---

## Table de matières

1. [Fonction pure](#1-fonction-pure-obligatoire) — obligatoire
2. [Hook React](#2-hook-react-obligatoire-si-effet-de-bord) — obligatoire si effet
3. [Context Provider](#3-context-provider)
4. [Composant UI](#4-composant-ui)
5. [Route API Next.js](#5-route-api-nextjs-obligatoire)
6. [Action Firestore (workflow)](#6-action-firestore-workflow-obligatoire)
7. [Bridge natif Capacitor](#7-bridge-natif-capacitor)
8. [Outil chatbot](#8-outil-chatbot-obligatoire)
9. [Migration / schéma DB](#9-migration--schema-db)
10. [Régression bug fixé](#10-régression-bug-fixé-obligatoire) — obligatoire

---

## 1. Fonction pure (obligatoire)

Pas d'I/O, entrée → sortie déterministe. Coverage attendue : **100 %** (fonctions, branches).

```ts
// src/features/foo/__tests__/computeBar.test.ts
import { computeBar } from "@/features/foo/computeBar";

describe("computeBar", () => {
  it.each([
    [0, 0],
    [1, 2],
    [-1, -2],
    [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER * 2],
  ])("double(%s) === %s", (input, expected) => {
    expect(computeBar(input)).toBe(expected);
  });

  it("rejette NaN", () => {
    expect(() => computeBar(NaN)).toThrow();
  });
});
```

Règle : si la fonction a 3 branches → 3+ cas. Cas limites : 0, négatif, vide, max.

---

## 2. Hook React (obligatoire si effet de bord)

Utilise `renderHook` de `@testing-library/react`. Mock les sources externes via `jest.mock`.

```tsx
// src/features/foo/hooks/__tests__/useThing.test.ts
import { renderHook, act, waitFor } from "@testing-library/react";
import { useThing } from "@/features/foo/hooks/useThing";

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ ok: true }) })),
}));

describe("useThing", () => {
  it("ne fetch pas tant que enabled=false", () => {
    renderHook(() => useThing({ enabled: false }));
    const { fetchWithAuth } = jest.requireMock("@/core/api/fetchWithAuth");
    expect(fetchWithAuth).not.toHaveBeenCalled();
  });

  it("fetch quand enabled passe à true", async () => {
    const { result, rerender } = renderHook(({ enabled }) => useThing({ enabled }), {
      initialProps: { enabled: false },
    });
    rerender({ enabled: true });
    await waitFor(() => expect(result.current.loaded).toBe(true));
  });
});
```

Pour hooks qui dépendent de Firestore : le mock global `firebase/firestore` dans `jest.setup.ts` suffit dans 80 % des cas — push de `mockState.firestoreData[path] = [...]` avant `renderHook`.

---

## 3. Context Provider

Tester via composant minimal qui consomme le context.

```tsx
import { render, screen } from "@testing-library/react";
import { FooProvider, useFoo } from "@/context/FooContext";

function Probe() {
  const { value } = useFoo();
  return <div data-testid="probe">{value}</div>;
}

it("expose la valeur initiale", () => {
  render(
    <FooProvider initial="hello">
      <Probe />
    </FooProvider>
  );
  expect(screen.getByTestId("probe")).toHaveTextContent("hello");
});

it("throw si useFoo hors provider", () => {
  // suppress error logs
  jest.spyOn(console, "error").mockImplementation(() => {});
  expect(() => render(<Probe />)).toThrow(/FooProvider/);
});
```

---

## 4. Composant UI

Utilise `render` de `src/test-utils/render.tsx` (alias `renderWithProviders`) — pas le `render` brut.

```tsx
import { render, screen } from "@/test-utils/render";
import userEvent from "@testing-library/user-event";
import MyButton from "@/features/foo/components/MyButton";

it("appelle onClick au click", async () => {
  const user = userEvent.setup();
  const onClick = jest.fn();
  render(<MyButton onClick={onClick}>Go</MyButton>);
  await user.click(screen.getByRole("button", { name: /go/i }));
  expect(onClick).toHaveBeenCalledTimes(1);
});
```

Cibler par rôle ARIA > `data-testid` > texte. Les `data-testid` stables sont obligatoires pour les éléments référencés dans `MOBILE_SHELL_CONTRACT`.

---

## 5. Route API Next.js (obligatoire)

Tester via le **handler exporté** (pas le HTTP réel). Annoter le fichier `@jest-environment node`.

```ts
/**
 * @jest-environment node
 */
import { POST } from "@/app/api/foo/route";

jest.mock("@/core/api/routeAuth", () => ({
  requireAuthenticatedUser: jest.fn(async () => ({ uid: "u1", token: { admin: true } })),
}));

describe("POST /api/foo", () => {
  it("400 si payload invalide", async () => {
    const req = new Request("http://x/foo", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("200 + écho", async () => {
    const req = new Request("http://x/foo", {
      method: "POST",
      body: JSON.stringify({ name: "ok" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("ok");
  });
});
```

Pour les routes critiques, utiliser le **contract test** (Phase C) : `tests/contract/*.ts` valide le schéma Zod entrée/sortie partagé client/server.

---

## 6. Action Firestore (workflow) (obligatoire)

Ex : `transitionInterventionFromTechnician`, `assignInterventionToTechnician`. Mock `firebase/firestore` (global) et valider que les bons `updateDoc` / `setDoc` partent.

```ts
import { transitionInterventionFromTechnician } from "@/features/interventions/workflow/transitionInterventionFromTechnician";
import { updateDoc } from "firebase/firestore";

jest.mock("firebase/firestore", () => ({
  ...jest.requireActual("firebase/firestore"),
  updateDoc: jest.fn(async () => undefined),
}));

it("passe assigned → en_route", async () => {
  await transitionInterventionFromTechnician({
    interventionId: "i1",
    iv: { id: "i1", status: "assigned" } as never,
    toStatus: "en_route",
    note: "test",
  });
  expect(updateDoc).toHaveBeenCalledWith(
    expect.objectContaining({ _path: expect.stringContaining("interventions/i1") }),
    expect.objectContaining({ status: "en_route" })
  );
});
```

Couvre obligatoirement : statut autorisé, statut refusé (no-op ou throw), `companyId` non-matchant.

---

## 7. Bridge natif Capacitor

**Pattern injection** : chaque fonction native accepte un objet `deps` injectable. Le code de production passe les plugins réels ; les tests passent des stubs.

Voir `src/core/native/nativeDocumentSave.ts` et son test pour le pattern de référence (Phase D).

```ts
import { saveOrShareDocument } from "@/core/native/nativeDocumentSave";

it("écrit dans Filesystem puis Share en natif", async () => {
  const writeFile = jest.fn(async () => ({ uri: "/data/x.pdf" }));
  const share = jest.fn(async () => undefined);
  const result = await saveOrShareDocument(
    { filename: "x.pdf", bytes: new Uint8Array([1, 2]), mimeType: "application/pdf" },
    {
      isNative: () => true,
      loadFilesystem: async () => ({ Filesystem: { writeFile }, Directory: { Documents: "doc" } }),
      loadShare: async () => ({ Share: { share } }),
    }
  );
  expect(result).toEqual(expect.objectContaining({ ok: true, via: "capacitor", shared: true }));
  expect(writeFile).toHaveBeenCalled();
  expect(share).toHaveBeenCalled();
});
```

Pourquoi ce pattern : `jest.mock("@capacitor/foo")` charge le module ESM qui crashe en jsdom. Injecter via deps est **plus rapide et déterministe**.

---

## 8. Outil chatbot (obligatoire)

Quatre livrables (voir `docs/TESTING.md` §4) :

1. Déclaration dans `chatbot-tools.ts` (schéma JSON Schema)
2. `case` dans `chatbot-tool-executor.ts`
3. Routage dans `chatbot-tool-routing.ts` si scope dédié
4. Tests : `chatbot-tool-executor.test.ts` (executor) + intent local si détection sans LLM

Validation : `npm run test:chatbot`.

---

## 9. Migration / schéma DB

Toute bump de `DB_VERSION` (IndexedDB) ou champ Firestore ajouté :

- Test de **rétro-compatibilité** : record v1 sans le nouveau champ → l'app lit sans crash.
- Test de **forward compat** : si le nouveau champ est requis côté write, l'absence doit être détectée (Zod).

Exemple : `src/features/offline/completionQueueDb.ts` v2 ajoute `attemptCount` (optionnel) — voir `completionRetryBackoff.test.ts`.

---

## 10. Régression bug fixé (obligatoire)

Pour **tout bug fixé** :

1. Reproduire le bug dans un test **qui échoue** sur `main` (le commit avant fix).
2. Le test doit passer après ton fix.
3. Le test doit avoir un commentaire `// Régression : <courte description> — <date YYYY-MM-DD>`.

Exemple :

```ts
// Régression : useChatbot ne préfixait pas companyId quand demoTenantActive — 2026-06-13
```

C'est la **règle d'or** pour réduire les régressions sans seuils stricts.

---

## Annexes

### Commandes utiles

| Action                                            | Commande                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| Garde-fou agent (typecheck + lint + tests reliés) | `npm run test:agent-check`                                           |
| Un seul fichier                                   | `npx jest <chemin> --no-coverage`                                    |
| Coverage globale                                  | `npm run test:coverage`                                              |
| Coverage chatbot uniquement                       | `npm run test:chatbot:coverage`                                      |
| Voir les fichiers sans test                       | `node scripts/check-coverage-ratchet.mjs --list-uncovered` (Phase B) |

### Quand un test devient flaky

- 1 ré-exécution OK → annoter `// flaky: cause supposée` et ouvrir un ticket.
- 2+ ré-exécutions → `it.skip` + ticket P1, ne jamais merger un test instable.

### Quand un test couvre trop / explose en taille

- Si un test pèse > 50 lignes ou mocke > 5 modules : extraire des helpers purs depuis le code de prod, retester les helpers.
- Les hooks > 300 lignes (ex. `useChatbot`) doivent être démontables en sous-hooks testables.
