import { Linkifier } from "./Linkifier.class.mjs";
import { LinkData } from "./LinkData.class.mjs";
import { LinkTemplate } from "./LinkTemplate.class.mjs";
import { PageData } from "./PageData.class.mjs";

// TO DO — more intelligently handle default transformers, ATM they're hard-coded in the Linkifier constructor!!!

// export the public API
const VERSION = process.env.VERSION; // Webpack replaces this line with the actual version string during build
const linkify = new Linkifier();
export { linkify, Linkifier, PageData, LinkData, LinkTemplate, VERSION};
export { linkify as default };