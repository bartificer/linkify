/**
 * @file The module's entry point. This file determines what does and does not get exported by the module.
 * @author Bart Busschots <opensource@bartificer.ie>
 */

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

/** The module's current SEMVER version number. */
export const VERSION = process.env.VERSION; // Webpack replaces this line with the actual version string during build

/** An instantiated Linkifier object ready for use. */
export const linkify = new Linkifier();

export {
    /** The Linkifier class that encapsulates the link generations functionality. */
    Linkifier,

    /** The PageData class used to store webpage properties like title and headings. */
    PageData,

    /**
     * The LinkData class use to store link properties like title and url. */
    LinkData,

    /**
     * The LinkTempalte class used for defining the templates for generating links. */
    LinkTemplate
};

/** The default export. */
export { linkify as default };