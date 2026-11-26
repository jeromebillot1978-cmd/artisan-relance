// Tests : node --experimental-strip-types lib/stats-exclusion.test.ts
const store = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
};
const { isPrivatePath, shouldSkipStats } = await import("./stats-exclusion.ts");
let ok = 0, ko = 0;
const t = (name: string, got: unknown, exp: unknown) => {
  const pass = got === exp;
  if (pass) ok++;
  else ko++;
  console.log(`${pass ? "OK " : "KO "} ${name}${pass ? "" : `  → obtenu ${got}, attendu ${exp}`}`);
};
for (const p of ["/prospection", "/connexion", "/dashboard", "/devis/123", "/statistiques", "/mot-de-passe-oublie"]) t(`privée : ${p}`, isPrivatePath(p), true);
for (const p of ["/", "/artisans", "/inscription", "/relance-devis/peintre", "/guides", "/prospectus"]) t(`publique : ${p}`, isPrivatePath(p), false);
t("visiteur normal : /artisans compté", shouldSkipStats("/artisans"), false);
t("ouverture de /prospection : non comptée", shouldSkipStats("/prospection"), true);
t("ensuite, même navigateur : /artisans NON compté (administrateur)", shouldSkipStats("/artisans"), true);
t("ensuite, même navigateur : / NON compté", shouldSkipStats("/"), true);
console.log(`\n${ok} réussis, ${ko} échoués`);
process.exit(ko ? 1 : 0);
