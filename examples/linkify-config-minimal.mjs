// Example Linkifier Customisation Module - Minimal
// ================================================
// A customisation module defining defining both link generation customisations
// and default CLI options.

// Import the Needed Linkify Classes
// ---------------------------------
// 1. Linkifier - required for all link generation configuation customisations
// 2. LinkData - required to add custom data transformers
// 3. LinkTemplate - required to add custom templates
import { Linkifier, LinkData, LinkTemplate } from '@bartificer/linkify';

// Customise Link Generation
// -------------------------

// start with a default linkfifier
const linkifier = new Linkifier();

// add a custom template — a link with the page title and domain name as the text in markdown format
// e.g. https://lets-talk.ie/lta → [Let's Talk Apple — lets-talk.ie/…](https://lets-talk.ie/lta)
linkifier.registerTemplate( // a minimal template, no filters or extra field extractor
    'markdown-domain', // the template's name
    new LinkTemplate('[{{{text}}} — {{{uri.hostname}}}/…]({{{url}}})') //the template string in Mustache format
);

// Add a custom data transformer to strip the prefix from Daring Fireball blog posts
// Without Custom transformer:
// https://daringfireball.net/linked/2026/04/22/thompson-cook
// transforms to:
// [Daring Fireball: Ben Thompson on Tim Cook's Legacy — daringfireball.net/…](https://daringfireball.net/linked/2026/04/22/thompson-cook)
// Want:
// [Ben Thompson on Tim Cook's Legacy — daringfireball.net/…](https://daringfireball.net/linked/2026/04/22/thompson-cook)
linkifier.registerTransformer(
    'daringfirebill.net', // the domain name to apply the transformer to (propagates to sub-domains)
    (pData) => { // an arrow function that takes a PageData object as input, and must return a LinkData object
        return new LinkData(
            pData.url, // pass the url through un-changed
            pData.title.replace('Daring Fireball: ', '') // use the page title with the prefix removed as the link text
        )
    }
);

// Customise the App Behaviour
// ---------------------------

// set any desired options
const options = {
    clipboard: true, // equivalent to --clipboard flag
    echoClipboard: true, // equivalent to --echo-clipboard flag (all two-word flags are camelCased)
    template: 'markdown-domain' // equivalent to --template=markdown-domain 
};

// Export all Customisations
// -------------------------

// must export a plain object with the keys 'linkifier' and/or 'options' as 'default'
const config = { linkifier, options };
export {config as default};