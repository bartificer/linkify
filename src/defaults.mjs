/**
 * @file The default values used throughout the linkifier classes.
 * @author Bart Busschots <opensource@bartificer.ie>
 * @license MIT
 */

/**
 * This module provides default values for use by the various linkifier functions and classes. These separated out for clarity, helping users decide which values to override or augment.
 * @module defaults
 * @requires link-template
 * @requires utilities
 */
import { LinkTemplate } from './LinkTemplate.class.mjs';
import * as utilities from "./utilities.mjs";

/**
 * The collection of named link templates loaded by the Linkifier constructor.
 * @type {Object.<string, module:link-template.LinkTemplate>}
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
 * The default list of words with special capitalisations.
 * @type {string[]}
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