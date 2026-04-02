import { Linkifier } from "./Linkifier.class.mjs";
import { LinkData } from "./LinkData.class.mjs";
import { LinkTemplate } from "./LinkTemplate.class.mjs";
import { PageData } from "./PageData.class.mjs";

// Webpack replaces this line with the actual version string during build
const VERSION = process.env.VERSION;

// TO DO — more intelligently handle default transformers, ATM they're hard-coded in the Linkifier constructor!!!

// export the public API
export { Linkifier, PageData, LinkData, LinkTemplate, VERSION};
export { Linkifier as default };