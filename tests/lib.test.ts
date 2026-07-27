import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/slug";
import { canManageMembers, canValidate, canEditStructure } from "@/lib/auth";
import { oddByNumber, ODD_LIST } from "@/lib/odd";

describe("slugify", () => {
  it("retire les accents et met en minuscules", () => {
    expect(slugify("Association Éspoir Cotonou")).toBe("association-espoir-cotonou");
  });
  it("remplace les caractères spéciaux par des tirets", () => {
    expect(slugify("Eau & Assainissement !!")).toBe("eau-assainissement");
  });
  it("ne laisse pas de tiret en début ou fin", () => {
    expect(slugify("  -Test-  ")).toBe("test");
  });
});

describe("permissions de rôle", () => {
  it("seul l'admin peut gérer les membres", () => {
    expect(canManageMembers("admin")).toBe(true);
    expect(canManageMembers("superviseur")).toBe(false);
    expect(canManageMembers("agent")).toBe(false);
  });
  it("admin et superviseur peuvent valider les relevés", () => {
    expect(canValidate("admin")).toBe(true);
    expect(canValidate("superviseur")).toBe(true);
    expect(canValidate("agent")).toBe(false);
  });
  it("admin et superviseur peuvent modifier la structure", () => {
    expect(canEditStructure("admin")).toBe(true);
    expect(canEditStructure("superviseur")).toBe(true);
    expect(canEditStructure("agent")).toBe(false);
  });
});

describe("référentiel ODD", () => {
  it("contient bien 17 objectifs", () => {
    expect(ODD_LIST.length).toBe(17);
  });
  it("retrouve un ODD par son numéro", () => {
    expect(oddByNumber(6)?.titre).toMatch(/eau/i);
  });
  it("renvoie undefined pour un numéro hors plage", () => {
    expect(oddByNumber(42)).toBeUndefined();
  });
});
