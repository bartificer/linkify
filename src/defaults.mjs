/**
 * @file Central location for the default values used throughout the codebase.
 * @author Bart Busschots <opensource@bartificer.ie>
 * @license MIT
 */

/**
 * Default values used by the various functions and classes.
 * 
 * The defaults are collected here for clarity, helping module users both understand the defaults, and, make informed decisions about which defaults to augment or override completely.
 * @module defaults
 * @requires link-template
 * @requires utilities
 */
import { LinkTemplate } from './LinkTemplate.class.mjs';
import * as utilities from "./utilities.mjs";

/**
 * The collection of named link templates loaded by the Linkifier constructor. All templates strip UTM parameters from the URL, and regularise white space in the text and descriptions.
 * @type {Object.<string, module:link-template.LinkTemplate>}
 * @property {module:link-template.LinkTemplate} html - The default HTML link template. Uses the link title as a the text and description as the hover-text.
 * @property {module:link-template.LinkTemplate} htmlNewTab - The same as the `html` template, but with a `target="_blank"` attribute added.
 * @property {module:link-template.LinkTemplate} markdown - The default Markdown link template. Uses the link title as the text, and ignores the description.
 * @see {@link module:utilities.stripUTMParameters} for the function used to strip UTM parameters from the URL.
 * @see {@link module:utilities.regulariseWhitespace} for the function used to regularise white space in the text and description.
 */
export const linkTemplates = {
    html: new LinkTemplate(
        '<a href="{{{url}}}" title="{{description}}">{{text}}</a>',
        [
            ['url', utilities.stripUTMParameters],
            ['text', utilities.regulariseWhitespace],
            ['description', utilities.regulariseWhitespace]
        ]
    ),
    htmlNewTab: new LinkTemplate(
        '<a href="{{{url}}}" title="{{description}}" target="_blank" rel="noopener">{{text}}</a>',
        [
            ['url', utilities.stripUTMParameters],
            ['text', utilities.regulariseWhitespace],
            ['description', utilities.regulariseWhitespace]
        ]
    ),
    markdown: new LinkTemplate(
        '[{{{text}}}]({{{url}}})',
        [
            ['url', utilities.stripUTMParameters],
            ['text', utilities.regulariseWhitespace]
        ]
    )
};

/**
 * When conbverting strings to title case, some joiner words should be preserved in all lower case. The Title Case module handles most appropriately, but not all.
 * These are the additional words that also treated as so-called *small words* by the functions in the utility module.
 * @type {string[]}
 * @see {@link module:utilities.toTitleCase} for the function that uses this list to treat these words as small words by default.
 * @see {@link module:title-case} for the Title Case module who's default small word list is augmented by this list.
 */
export const smallWords = [ 'is', 'its' ];

/**
 * When converting strings to title case, some words need to have their capitalisations corrected. These are the custom capitalisations that will be used by default.
 * @type {string[]}
 * @see {@link module:utilities.toTitleCase} for the function that uses this list to correct capitalisations by default.
 */
export const speciallyCapitalisedWords = [
    // generic acronyms
    'FBI',
    'CIA',
    'USA',
    'UK',
    'EU',
    'NASA',
    'NSA',
    'OS',
    'OSes',
    'ID',
    'IDs',
    'MLB',
    'NFL',
    'NASCAR',
    'FIFA',
    'TV',
    'VR',
    'BAFTA',
    'BBC',
    'AI',
    'VP',
    'II',
    'III',
    'IV',

    // tech jargon
    'iOS',
    'macOS',
    'iPhone',
    'iPhones',
    'iPad',
    'iPads',
    'iPod',
    'iPods',
    'AirTag',
    'AirTags',
    'iPadOS',
    'watchOS',
    'tvOS',
    'CarPlay',
    'AirPods',
    'MacBook',
    'MacBooks',
    'iTunes',
    'WWDC',
    'XDR',
    'XProtect',
    'VESA',
    'HDMI',
    'DisplayPort',
    'LinkedIn',
    'ChatGPT'
];