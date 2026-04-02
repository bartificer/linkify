//import { Linkifier } from "./Linkifier.class.mjs";
import { LinkData } from "./LinkData.class.mjs";
import { LinkTemplate } from "./LinkTemplate.class.mjs";
import { PageData } from "./PageData.class.mjs";

// Webpack replaces this line with the actual version string during build
const VERSION = process.env.VERSION;

export function linkify(){
    return `PLACEHOLDER — Linkify v${VERSION})`;
}
export {linkify as default};

export { PageData, LinkData, LinkTemplate, VERSION};
//export { Linkifier, PageData, LinkData, LinkTemplate, VERSION};
//export { Linkifier as default };