export const LEGAL_PAGES = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    description:
      "How Bare Compounds will collect, use, and protect customer and researcher account information.",
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    description:
      "The core purchasing, site usage, payment, fulfillment, and account terms for Bare Compounds.",
  },
  {
    slug: "shipping-policy",
    title: "Shipping Policy",
    description:
      "Shipping timelines, manual tracking number entry, delivery updates, and fulfillment expectations.",
  },
  {
    slug: "return-policy",
    title: "Return Policy",
    description:
      "Return eligibility, review process, refund status, and product handling requirements.",
  },
  {
    slug: "assumption-of-risk",
    title: "Assumption of Risk",
    description:
      "Research-use acknowledgment and buyer responsibility language to be finalized by counsel.",
  },
  {
    slug: "eligibility-to-purchase",
    title: "Eligibility to Purchase",
    description:
      "Age, research-use, and account eligibility requirements for purchasing from Bare Compounds.",
  },
  {
    slug: "research-use-disclaimer",
    title: "Research Use Disclaimer",
    description:
      "Clear notice that products are for research use only and not for human consumption.",
  },
  {
    slug: "no-instructions-or-usage-guidance",
    title: "No Instructions or Usage Guidance",
    description:
      "Policy language stating that Bare Compounds does not provide usage instructions, dosing, or medical guidance.",
  },
];

export function getLegalPage(slug: string) {
  return LEGAL_PAGES.find((page) => page.slug === slug);
}
