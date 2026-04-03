import { LinkTemplate } from './LinkTemplate.class.mjs';
import * as utilities from "./utilities.mjs";

/**
 * @type {Object.<string, LinkTemplate>} A collection of named link templates.
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
