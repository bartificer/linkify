import { LinkTemplate } from './LinkTemplate.class.mjs';

/**
 * @type {Object.<string, LinkTemplate>} A collection of named link templates.
 */
export const linkTemplates = {
    html: new LinkTemplate('<a href="{{{url}}}" title="{{description}}">{{text}}</a>'),
    htmlNewTab: new LinkTemplate('<a href="{{{url}}}" title="{{description}}" target="_blank" rel="noopener">{{text}}</a>'),
    markdown: new LinkTemplate('[{{{text}}}]({{{url}}})')
};
