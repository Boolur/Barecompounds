type LegalSection = { heading: string; paragraphs: string[] };

export type LegalPage = {
  slug: string;
  title: string;
  description: string;
  sections: LegalSection[];
};

const RESEARCH_NOTICE =
  "Bare Compounds products are sold solely for lawful laboratory and research purposes. They are not drugs, foods, cosmetics, or medical devices and are not for human or veterinary consumption.";

export const LEGAL_PAGES: LegalPage[] = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    description: "How Bare Compounds collects, uses, and safeguards customer and researcher account information.",
    sections: [
      { heading: "Information we collect", paragraphs: ["We collect information you submit when creating an account, placing or tracking an order, requesting support, or joining the affiliate program. This may include contact, delivery, payment-reference, and order information."] },
      { heading: "How information is used", paragraphs: ["We use information to provide accounts, process and fulfill orders, communicate status and support updates, prevent misuse, maintain business records, and improve the storefront. We do not sell personal information."] },
      { heading: "Service providers and retention", paragraphs: ["Information may be processed by hosting, database, payment-communication, shipping, and analytics providers acting for us. We retain records only as reasonably needed for operations, legal obligations, dispute resolution, and security."] },
      { heading: "Your choices", paragraphs: ["You may request access, correction, or deletion of eligible personal information through the support contact listed in the footer. Some transaction records may need to be retained."] },
    ],
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    description: "Core purchasing, site usage, payment, fulfillment, and account terms.",
    sections: [
      { heading: "Agreement and permitted use", paragraphs: ["By using this site or placing an order, you agree to these terms and represent that the information you provide is accurate. You may use the site only for lawful purposes.", RESEARCH_NOTICE] },
      { heading: "Orders and payment", paragraphs: ["Submitting checkout is an offer to purchase. Orders may be accepted, limited, or cancelled based on inventory, eligibility, payment verification, suspected misuse, or operational constraints. Zelle and Venmo payments are not complete until manually verified; cash orders remain due under the instructions shown at checkout."] },
      { heading: "Accounts and content", paragraphs: ["You are responsible for account credentials and activity. Site text, branding, photography, and design remain the property of Bare Compounds or its licensors and may not be copied for commercial use without permission."] },
      { heading: "Disclaimers and liability", paragraphs: ["Product and research information is provided for general informational purposes without medical advice or warranties of fitness for a particular purpose. To the extent permitted by law, liability is limited to the amount paid for the affected order."] },
    ],
  },
  {
    slug: "shipping-policy",
    title: "Shipping Policy",
    description: "Shipping timelines, tracking, delivery updates, and fulfillment expectations.",
    sections: [
      { heading: "Processing", paragraphs: ["Orders are prepared after acceptance and any required payment verification. Processing estimates are not guarantees and may change because of inventory, verification, weather, holidays, or carrier conditions."] },
      { heading: "Shipment and tracking", paragraphs: ["When shipping is available, the address submitted at checkout must be complete and accurate. Tracking details appear in the customer account or tracking page after staff records them. Carrier scans may take time to update."] },
      { heading: "Delivery issues", paragraphs: ["Risk of loss transfers as allowed by applicable law. Contact support promptly about a damaged package, incorrect item, or carrier issue and retain the packaging and label for review. We cannot guarantee recovery of orders sent to an incorrect customer-provided address."] },
      { heading: "Local pickup", paragraphs: ["Pickup is by appointment at an active location. Government-issued identification may be required. Orders not collected within the stated payment or pickup window may be cancelled and inventory released."] },
    ],
  },
  {
    slug: "return-policy",
    title: "Return Policy",
    description: "Return eligibility, review process, refunds, and product handling requirements.",
    sections: [
      { heading: "Eligibility", paragraphs: ["Because product integrity and chain of custody matter, opened, used, altered, improperly stored, or temperature-exposed products are not eligible for return. Do not send any item back without support authorization."] },
      { heading: "Problems with an order", paragraphs: ["Report damaged, incorrect, or missing items promptly after delivery and include the order number, package label, and clear photographs when applicable. We may request that products and packaging be retained during review."] },
      { heading: "Approved resolutions", paragraphs: ["After review, an eligible claim may result in replacement, store credit, or refund to the extent operationally available and legally required. Shipping charges and third-party transfer fees may be non-refundable unless the error was ours."] },
      { heading: "Cancellations", paragraphs: ["Contact support immediately to request cancellation. An order cannot be cancelled after fulfillment or shipment has begun."] },
    ],
  },
  {
    slug: "assumption-of-risk",
    title: "Assumption of Risk",
    description: "Research-use acknowledgment and buyer responsibility.",
    sections: [
      { heading: "Known restrictions", paragraphs: [RESEARCH_NOTICE, "The purchaser is responsible for determining whether acquisition, possession, storage, transfer, and intended research are lawful in the relevant jurisdiction and institution."] },
      { heading: "Research hazards", paragraphs: ["Laboratory materials may present known and unknown hazards. The purchaser assumes responsibility for qualified personnel, facilities, protective equipment, storage, handling, disposal, and incident procedures appropriate to the material and research."] },
      { heading: "Independent evaluation", paragraphs: ["Certificates and catalog information do not replace an independent risk assessment. The purchaser accepts the risks arising from use outside the product label, published documentation, law, or accepted laboratory controls."] },
    ],
  },
  {
    slug: "eligibility-to-purchase",
    title: "Eligibility to Purchase",
    description: "Age, research-use, and account eligibility requirements.",
    sections: [
      { heading: "Minimum eligibility", paragraphs: ["Purchasers must be at least 18 years old, legally capable of entering a contract, and authorized to acquire the products for a legitimate research organization, laboratory, or lawful independent research activity."] },
      { heading: "Required representations", paragraphs: [RESEARCH_NOTICE, "By purchasing, you represent that you will not use, resell, market, or provide products for human or veterinary consumption and will comply with applicable law and institutional rules."] },
      { heading: "Verification and refusal", paragraphs: ["We may request identity, age, account, destination, or research-purpose information. We may refuse, limit, hold, or cancel an order if eligibility cannot be established or misuse is suspected."] },
    ],
  },
  {
    slug: "research-use-disclaimer",
    title: "Research Use Disclaimer",
    description: "Notice that products are for research use only and not for human consumption.",
    sections: [
      { heading: "Research use only", paragraphs: [RESEARCH_NOTICE] },
      { heading: "No clinical claims", paragraphs: ["Catalog descriptions summarize areas of scientific interest and do not state that a product is safe, effective, approved, or suitable to diagnose, treat, cure, mitigate, or prevent any disease or condition."] },
      { heading: "Qualified handling", paragraphs: ["Products should be received, documented, stored, handled, and disposed of by qualified personnel using controls appropriate to the material. The purchaser is responsible for its research design and compliance."] },
    ],
  },
  {
    slug: "no-instructions-or-usage-guidance",
    title: "No Instructions or Usage Guidance",
    description: "Why Bare Compounds does not provide usage instructions, dosing, or medical guidance.",
    sections: [
      { heading: "No administration guidance", paragraphs: ["Bare Compounds does not provide dosing, cycling, reconstitution for administration, route-of-administration, self-experimentation, or human or veterinary usage guidance."] },
      { heading: "No medical advice", paragraphs: ["Customer support and catalog content are not medical advice and cannot evaluate symptoms, interactions, contraindications, or individual circumstances. Questions seeking such guidance will not be answered."] },
      { heading: "Permitted support", paragraphs: ["Support may assist with orders, labels, storage documentation, published COAs, account access, and other non-clinical operational questions. For a medical concern, contact an appropriately licensed clinician or emergency service."] },
    ],
  },
];

export function getLegalPage(slug: string) {
  return LEGAL_PAGES.find((page) => page.slug === slug);
}
