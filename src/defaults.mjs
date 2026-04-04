import { LinkTemplate } from './LinkTemplate.class.mjs';
import * as utilities from "./utilities.mjs";

/**
 * The collection of named link templates loaded by the Linkifier constructor.
 * @type {Object.<string, LinkTemplate>}
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
    'FBI',
    'CIA',
    'USA',
    'UK',
    'EU',
    'NASA',
    'NSA',
    'OS',
    'iOS',
    'macOS',
    'iPad',
    'LinkedIn',
    'XProtect'
];
