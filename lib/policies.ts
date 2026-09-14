export const POLICIES = {
  lastUpdated: "September 2026",
  exchangePolicy: {
    intro:
      "We do not accept returns or exchanges due to change of mind.",
    items: [
      "An exchange is only available within 7 days from the date of delivery if the product is found to have a genuine product defect or functional problem.",
      "The product must be returned in its original condition, together with all included accessories and packaging where applicable.",
      "The product will be inspected and tested by Happy Camera Trading to determine whether the reported issue is a genuine product defect.",
      "If the issue is confirmed to be a product defect, an exchange may be provided for the same or an equivalent item, subject to availability.",
      "Return shipping costs are borne by the buyer.",
      "No cash refund is available.",
    ],
  },
  warranty: {
    coverageHeading: "Our shop warranty covers:",
    tiers: [
      "Preloved Display Units: 3-month shop warranty",
      "Preloved Non-Display Units: 1-month shop warranty",
      "Brand New Items: Covered by the manufacturer's warranty, subject to the manufacturer's terms and conditions.",
    ],
    coverage:
      "Our shop warranty covers internal defects and problems with buttons or controls under normal use.",
    notCoveredHeading: "The warranty does not cover:",
    notCovered: [
      "Accidental drops or physical damage",
      "Water or liquid damage",
      "Scratches, dents, or cosmetic damage",
      "General wear and tear",
      "Damage caused by misuse or improper handling",
    ],
    careNote:
      "As we specialize in preloved camera equipment, customers are advised to handle all equipment with proper care.",
  },
  exclusions: [
    "Film and consumable items",
    'Items marked as "Final Sale"',
    "Products with damage caused by accidents, drops, water, misuse, or improper handling",
    "Cosmetic defects or normal signs of use on preloved items",
    "Change-of-mind requests",
    "Shipping and delivery charges",
  ],
  howToRequest: {
    email: "happycamerabusiness@gmail.com",
    items: [
      "All exchange requests are subject to inspection and approval by Happy Camera Trading.",
      "All sales are final. Exchange is only available for confirmed product defects or functional problems within 7 days from the date of delivery.",
    ],
  },
} as const;