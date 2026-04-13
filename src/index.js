/**
 * @file The module's entry point. This file determines what does and does not get exported by the module.
 * @author Bart Busschots <opensource@bartificer.ie>
 */

/**
 * The package entry-point.
 * 
 * @module linkify
 * @requires linkifier
 * @requires link-data
 * @requires link-template
 * @requires page-data
 */
import { Linkifier } from "./Linkifier.class.mjs";
import { LinkData } from "./LinkData.class.mjs";
import { LinkTemplate } from "./LinkTemplate.class.mjs";
import { PageData } from "./PageData.class.mjs";

//
// === export the public API ===
//

/**
 *  The module's current SEMVER version number.
 *  @type {string}
 */
export const VERSION = process.env.VERSION; // Webpack replaces this line with the actual version string during build

/** 
 * An instantiated Linkifier object ready for use with all the defailts from `defaults.mjs` loaded.
 * @type {module:linkifier.Linkifier}
 * @see {@link module:defaults}
 */
export const linkify = new Linkifier();

export {
    /**
     * The Linkifier class that encapsulates the link generations functionality.
     * @type {module:linkifier.Linkifier}
     */
    Linkifier,

    /**
     * The PageData class used to store webpage properties like title and headings.
     * @type {module:page-data.PageData}
     */
    PageData,

    /**
     * The LinkData class use to store link properties like title and url.
     * @type {module:link-data.LinkData}
     */
    LinkData,

    /**
     * The LinkTemplate class used for defining the templates for generating links.
     * @type {module:link-template.LinkTemplate}
     */
    LinkTemplate
};

/**
 * The default export which is the `linkify` named export.
 * @name default
 * @static
 * @constant
 * @type {module:linkifier.Linkifier}
 * @see {@link module:linkify.linkify}
 */
export { linkify as default };