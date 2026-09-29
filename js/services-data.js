/* Shared service catalogue — edit here to update names, options or descriptions
   anywhere on the site (home, services page, and the booking form all read this file). */

const SERVICES = [
  {
    id: "installation",
    label: "Wig Installation",
    tagline: "Fitted, melted and finished to last the whole occasion.",
    description:
      "Every install starts with your hairline mapped and your wig cut to suit your face shape, then melted so the lace disappears into your skin. Let us know which occasion it's for when you book, so Promise can plan the right amount of time and finish for the day.",
    options: [
      { name: "Bridal Installation", note: "For the aisle and the dance floor after" },
      { name: "Farewell Installation", note: "Camera-ready styling for matric farewells" },
      { name: "Basic Installation", note: "Everyday, natural-looking install" },
      { name: "Ponytail Installation", note: "Sleek, lifted ponytail finish" }
    ]
  },
  {
    id: "customisation",
    label: "Wig Customisation",
    tagline: "The detail work that makes a wig look like your own hair.",
    description:
      "From plucking a soft, undetectable hairline to bleaching knots so they vanish against your skin tone, customisation is what separates an off-the-shelf wig from one that looks grown from your scalp.",
    options: [
      { name: "Plucking", note: "Natural, irregular hairline" },
      { name: "Bleaching of Knots", note: "Undetectable, scalp-matched knots" },
      { name: "Basic Customisation", note: "From R300" }
    ]
  },
  {
    id: "treatment",
    label: "Hair Treatment",
    tagline: "Restoring softness, shine and strength.",
    description:
      "Wigs pick up product build-up, dryness and tangles just like natural hair. Choose a full wash and treatment, a treatment only, or a quick wash — whichever your wig needs right now.",
    options: [
      { name: "Wash & Treatment", note: "Full deep-condition service" },
      { name: "Treatment Only", note: "Restorative, no wash" },
      { name: "Wash Only", note: "Cleanse and rinse" }
    ]
  },
  {
    id: "revamp",
    label: "Wig Revamp",
    tagline: "Old wig, new life.",
    description:
      "Bring in a wig that's lost its shine, its shape, or its bounce, and leave with something that looks freshly bought. Revamps cover cutting, styling, treatment and any customisation the wig needs.",
    options: [{ name: "Full Revamp", note: "Assessed on arrival" }]
  },
  {
    id: "custom",
    label: "Custom Wig Making",
    tagline: "Built from scratch, to your spec.",
    description:
      "A wig made entirely around you — your density, your parting, your length. Bring your own bundles, or choose from the premium bundles Promise sources in-salon.",
    options: [
      { name: "Bring Your Own Bundles", note: "You supply the hair" },
      { name: "Bundles Purchased In-Salon", note: "Sourced by Promise" }
    ]
  }
];

const SERVICE_IMAGES = {
  installation: [
    "assets/images/bridal-1.png",
    "assets/images/bridal-2.png",
    "assets/images/basic-4.png",
    "assets/images/basic-1.png"
  ],
  customisation: [
    "assets/images/customisation-1.png",
    "assets/images/customisation-2.png",
    "assets/images/bleached-knots.png",
    "assets/images/plucking-1.png"
  ],
  treatment: ["assets/images/treatment-1.png", "assets/images/treatment-2.png"],
  revamp: ["assets/images/customisation-3.png"],
  custom: []
};
