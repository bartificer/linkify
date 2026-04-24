/**
 * @file Defines the public interface for the published module.
 * @author Bart Busschots <opensource@bartificer.ie>
 * @license MIT
 */

/**
 * The main module exposed in the npm package `@bartificer/linkify`. This module exposes the public interface, but does not implement any functionality.
 * 
 * To understand the link generation functionality, the appropraite entry point into the code is the {@link module:linkifier-class.Linkifier} class.
 * @summary The main module exposed in the npm package `@bartificer/linkify`.
 * @module linkify
 * @requires linkifier
 * @requires link-data
 * @requires link-template
 * @requires page-data
 * @see {@link module:linkifier-class.Linkifier} for the entry point into the link generation functionality.
 * @example <caption>Basic Usage</caption>
 * import { linkify } from '@bartificer/linkify';
 * 
 * (async () => {
 *    console.log(await linkify.generateLink('https://github.com/bartificer'));
 *    // Output: <a href="https://github.com/bartificer" title="Bartificer Creations · GitHub">Bartificer Creations · GitHub</a>
 * })();
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
 *  @see {@link https://semver.org/}
 */
export const VERSION = process.env.VERSION; // Webpack replaces this line with the actual version string during build

/** 
 * An instantiated Linkifier object ready for use with the default settings as generated with the defauly constructor.
 * @type {module:linkifier-class.Linkifier}
 */
export const linkify = new Linkifier();

export {
    /**
     * The Linkifier class that provides the core link generation functionality.
     * @type {module:linkifier-class.Linkifier}
     */
    Linkifier,

    /**
     * The data representation class capturing the information extracted from a web page, for example the page's title and headings.
     * @type {module:page-data.PageData}
     */
    PageData,

    /**
     * The data representation class capturing the information about a link, for example its title and URL.
     * @type {module:link-data.LinkData}
     */
    LinkData,

    /**
     * The class capturing the details of a template used to render links.
     * @type {module:link-template.LinkTemplate}
     */
    LinkTemplate
};

/**
 * The default export, equivalent to the `linkify` named export.
 * @name default
 * @static
 * @constant
 * @type {module:linkifier-class.Linkifier}
 * @see {@link module:linkify.linkify}
 */
export { linkify as default };