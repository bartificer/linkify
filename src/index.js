/**
 * The package entry-point.
 * 
 * @module linkify
 * @requires Linkifier
 * @requires LinkData
 * @requires LinkTemplate
 * @requires PageData
 */
import { Linkifier } from "./Linkifier.class.mjs";
import { LinkData } from "./LinkData.class.mjs";
import { LinkTemplate } from "./LinkTemplate.class.mjs";
import { PageData } from "./PageData.class.mjs";

//
// === export the public API ===
//

/**
 * The module's current SEMVER version number.
 * @type {string}
 */
export const VERSION = process.env.VERSION; // Webpack replaces this line with the actual version string during build

/**
 * An instantiated Linkifier object ready for use.
 * @type {module:Linkifier~Linkifier}
 */
export const linkify = new Linkifier();
export { linkify as default };

export { Linkifier, PageData, LinkData, LinkTemplate};
