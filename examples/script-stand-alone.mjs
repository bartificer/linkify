#!/usr/bin/env node

// Example Linkifier Script - Stand-alone Customisations
// =====================================================
// This example script imports a standard linkifier, customises it's link
// generation process, and then uses it to render links.

// import a default linkifier object and the classes needed to customis it
import { linkify as linkifier, LinkData, LinkTemplate } from '@bartificer/linkify';

// enable debug messages for a better understanding of how the module works
linkifier.util.enableDebugMessages();

// because the Linkify API is promise-based, wrap the script logic in a self-executing anonymous async function
(async () => {
    // customise the small words list
    linkifier.smallWords.add('visa-à-vis');
    linkifier.smallWords.delete('only');
    linkifier.util.info(`Updated small words: ${JSON.stringify([...linkifier.smallWords])}`);

    // customise the list of specially capitalised words
    linkifier.speciallyCapitalisedWords.delete('MacBook');
    linkifier.speciallyCapitalisedWords.add('SurfaceBook');
    linkifier.util.info(`Updated specially capitalised words:\n${JSON.stringify([...linkifier.speciallyCapitalisedWords])}`);

    // Add a custom data transformer for the Programming by Stealth podcast series
    // this transformer:
    // 1. passes the URL through un-changed
    // 2. uses the second h1 tag as the link text (array index of second heading is 1)
    linkifier.registerTransformer('pbs.bartificer.net', (pData) => {
        return new LinkData(pData.url, pData.h1s[1]);
    });
    linkifier.util.info(`Test PBS data transformer: ${await linkifier.generateLink('https://pbs.bartificer.net/pbs182')}`);

    // register a template for Markdown links with link emoji
    linkifier.registerTemplate(
        'markdown-emoji', // template name
        new LinkTemplate('[{{{text}}}🔗]({{{url}}})') // new template object
    );
    linkifier.util.info(`Test emoji Markdown template: ${await linkifier.generateLink('https://lets-talk.ie/', 'markdown-emoji')}`);

    // register a special template for Let's Talk Podcasts' home domains, *.lets-talk.ie
    // The template will be in markdown and add a house emoji
    // 1 - register a new template
    linkifier.registerTemplate(
        'markdown-home',
	    new LinkTemplate('🏡[{{{text}}}]({{{url}}})')
    );
    // 2 - assign it to the lets-talk.ie domain and all sub-domains
    linkifier.registerDefaultTemplateMapping('lets-talk.ie', 'markdown-home');
    linkifier.util.info(`Test home Markdown template: ${await linkifier.generateLink('https://lets-talk.ie/lta')}`);

    // update the markdown-emoji template to strip tracking parameters
    linkifier.getTemplate('markdown-emoji').addFilter(
        'url', // the field name
        linkifier.util.stripUTMParameters // a reference to a function — no trailing parens!
    );
    linkifier.util.info('Test tracking param removal:');
    const testURL = 'https://www.macobserver.com/news/apple-pay-takes-home-a-webby-award-thanks-to-a-lionel-messi-campaign/?utm_source=macobserver&utm_medium=rss&utm_campaign=rss_everything';
    linkifier.util.info(`- Raw URL: ${testURL}`);
    linkifier.util.info(`- Link: ${await linkifier.generateLink(testURL, 'markdown-emoji')}`);

    // register a special Markdown template for XKCD cartoons and make it the default for XKCD's domain
    linkifier.registerTemplate('md-xkcd', new LinkTemplate(
        '[XKCD {{{extraFields.comicNumber}}}: {{{extraFields.title}}}]({{{extraFields.permalink}}})\n![ADD A DESCRIPTION FOR THE VISUALLY IMPAIRED HERE]({{{extraFields.imageLink}}} "{{{extraFields.hoverText}}}")',
        null, // no field filters
        ($) => { // a custom field extractor function
            const $img = $('div#comic img').first(); // the cheerio selector to find the comic image
            const $comicLinks = $('div#middleContainer > a'); // the cheerio selector to find the two permalinks
            const permalink = $comicLinks.first().attr('href'); // the first permalink of the two is the one for the page
            const imageLink = $comicLinks.last().attr('href'); // second permalink of the two is the one for the image
            const comicNumber = permalink.match(/(?<comicNum>\d+)\/?$/).groups.comicNum;
            return {
                title: $('div#ctitle').text(), // capture the comic's title
                hoverText: $img.attr('title').replaceAll('"', '\\"'), // capture the all important hover text!
                imageLink,
                permalink,
                comicNumber
            };
        }
    ));
    linkifier.registerDefaultTemplateMapping('xkcd.com', 'md-xkcd');
    linkifier.util.info(`Test XKCD template with extra fields:\n${await linkifier.generateLink('https://xkcd.com/149/')}`);
})();