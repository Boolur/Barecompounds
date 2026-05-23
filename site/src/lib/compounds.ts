import type { Compound } from "@/components/ui/ProductIndexRow";

export const COMPOUNDS: Compound[] = [
  {
    slug: "klow-80",
    index: "01",
    name: "KLOW80",
    subtitle:
      "A proprietary skin-directed blend studied for dermal renewal and elasticity.",
    category: "Dermal",
    molecularWeight: "C₁₀₄H₁₆₈N₃₀O₂₉",
    mg: "10 MG",
    tint: "var(--tint-klow)",
  },
  {
    slug: "glow-70",
    index: "02",
    name: "GLOW70",
    subtitle:
      "A luminosity-focused blend studied in pigment and tone research contexts.",
    category: "Dermal",
    molecularWeight: "C₉₂H₁₄₈N₂₈O₂₅",
    mg: "10 MG",
    tint: "var(--tint-glow)",
  },
  {
    slug: "bpc-157",
    index: "03",
    name: "BPC-157",
    subtitle:
      "Body Protection Compound. Widely studied pentadecapeptide derived from gastric juice.",
    category: "Recovery",
    molecularWeight: "C₆₂H₉₈N₁₆O₂₂",
    mg: "10 MG",
    tint: "var(--tint-bpc)",
  },
  {
    slug: "tb-500",
    index: "04",
    name: "TB-500",
    subtitle:
      "Thymosin Beta-4 fragment, studied in connective-tissue and recovery research.",
    category: "Recovery",
    molecularWeight: "C₂₁₂H₃₅₀N₅₆O₇₈S",
    mg: "10 MG",
    tint: "var(--tint-tb500)",
  },
  {
    slug: "tirzepatide",
    index: "05",
    name: "Tirzepatide",
    subtitle:
      "Dual GIP and GLP-1 receptor agonist, extensively studied in metabolic research.",
    category: "Metabolic",
    molecularWeight: "C₂₂₅H₃₄₈N₄₈O₆₈",
    mg: "10 MG",
    tint: "var(--tint-tirze)",
  },
  {
    slug: "retatrutide",
    index: "06",
    name: "Retatrutide",
    subtitle:
      "Triple-agonist peptide under active investigation in metabolic literature.",
    category: "Metabolic",
    molecularWeight: "C₂₂₁H₃₄₃N₄₇O₆₈",
    mg: "10 MG",
    tint: "var(--tint-reta)",
  },
];

export function getCompound(slug: string): Compound | undefined {
  return COMPOUNDS.find((c) => c.slug === slug);
}
