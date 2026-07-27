export const ODD_LIST = [
  { n: 1, titre: "Pas de pauvreté", couleur: "#E5243B" },
  { n: 2, titre: "Faim zéro", couleur: "#DDA63A" },
  { n: 3, titre: "Bonne santé et bien-être", couleur: "#4C9F38" },
  { n: 4, titre: "Éducation de qualité", couleur: "#C5192D" },
  { n: 5, titre: "Égalité entre les sexes", couleur: "#FF3A21" },
  { n: 6, titre: "Eau propre et assainissement", couleur: "#26BDE2" },
  { n: 7, titre: "Énergie propre et d'un coût abordable", couleur: "#FCC30B" },
  { n: 8, titre: "Travail décent et croissance économique", couleur: "#A21942" },
  { n: 9, titre: "Industrie, innovation et infrastructure", couleur: "#FD6925" },
  { n: 10, titre: "Inégalités réduites", couleur: "#DD1367" },
  { n: 11, titre: "Villes et communautés durables", couleur: "#FD9D24" },
  { n: 12, titre: "Consommation et production responsables", couleur: "#BF8B2E" },
  { n: 13, titre: "Mesures relatives à la lutte contre les changements climatiques", couleur: "#3F7E44" },
  { n: 14, titre: "Vie aquatique", couleur: "#0A97D9" },
  { n: 15, titre: "Vie terrestre", couleur: "#56C02B" },
  { n: 16, titre: "Paix, justice et institutions efficaces", couleur: "#00689D" },
  { n: 17, titre: "Partenariats pour la réalisation des objectifs", couleur: "#19486A" },
];

export function oddByNumber(n: number) {
  return ODD_LIST.find((o) => o.n === n);
}
