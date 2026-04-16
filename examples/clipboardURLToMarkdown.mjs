// import Linkify Lib
import URI from 'urijs';
import { linkify, LinkTemplate, LinkData } from '../src/index.js'; // for using the source module
//import { linkify, LinkTemplate, LinkData } from '@bartificer/linkify'; // for using the built module

// import 3rd-party library for interacting with the clipboard
import clipboardy from 'clipboardy';

// NOTE: this example supports one optional argument, a special-case name, if passed:
// 1. if there is a custom transformer defined with that name, it will be used as a one-off transformer
// 2. if there is a template defined with that name, it will be used as a one-off template

//
// === Register custom templates, transformers, etc... ===
//

// register a custom Markdown link template and make it the default
linkify.registerTemplate('md-bartificer', new LinkTemplate(
    '[{{{text}}} — {{{uri.hostname}}}{{#uri.hasPath}}/…{{/uri.hasPath}}]({{{url}}})',
    [
        ['url', linkify.util.stripUTMParameters],
        ['text', linkify.util.regulariseWhitespace]
    ]
));
linkify.defaultTemplateName = 'md-bartificer';

// register a special Markdown template for Apple presss releases and make it the default for Apple's domain
linkify.registerTemplate('md-apr', new LinkTemplate(
    '[{{{text}}} — 📣 Apple PR]({{{url}}})',
    [
        ['url', linkify.util.stripUTMParameters],
        ['text', linkify.util.regulariseWhitespace]
    ]
));
linkify.registerDefaultTemplateMapping('apple.com', 'md-apr');

// register a special Markdown template for XKCD cartoons and make it the default for XKCD's domain
linkify.registerTemplate('md-xkcd', new LinkTemplate(
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
linkify.registerDefaultTemplateMapping('xkcd.com', 'md-xkcd');

// register a special Markdown template that just contains the link title, and nothing more
linkify.registerTemplate('md-title-only', new LinkTemplate(
    '[{{{text}}}]({{{url}}})',
    [
        ['url', linkify.util.stripUTMParameters],
        ['text', linkify.util.regulariseWhitespace]
    ]
));

// capture any templates that should be made available for special cases
const templates = {
    mastodonServer: 'md-title-only'
}

// Cache commonly needed transforer functions to reduce code repetition
// NOTE: these are the transformers that are available as special cases
const transformers = {
    mainHeading: function(pData){
        return new LinkData(pData.url, pData.mainHeading);
    },
    titleMinusPrefix: function(pData, prefix){
        const regex = new RegExp(`^${linkify.util.escapeRegex(prefix)}`);
        return new LinkData(pData.url, pData.title.replace(regex, '').trim());
    },
    titleMinusPostscript: function(pData, postscript){
        const regex = new RegExp(`${linkify.util.escapeRegex(postscript)}$`);
        return new LinkData(pData.url, pData.title.replace(regex, '').trim());
    },
    mastodonServer: function(pData){
        const mastodonServer = pData.uri.hostname();

        // see if the link points to a user-related page on the server
        const mastodonPathMatch = pData.uri.path().match(/^\/@(?<handle>[^\/]+)(?:\/(?<postId>\d+))?/);
        if (mastodonPathMatch && mastodonPathMatch.groups){
            // if so, return the handle as the link text and the post ID as the description (if there is one)
            const handle = mastodonPathMatch.groups.handle;
            const postId = mastodonPathMatch.groups.postId;

            // see if we're a post or some kind of profile page
            if(postId){
                // this is a post, so use the handle and the post snippet as the text

                // extract the post snippet from the title
                let snippet = pData.title.replace(/^[^"]+"/, '').replace(/"[^"]+$/, '').trim();

                return new LinkData(pData.url, `@${handle}@${mastodonServer} on Mastodon: "${snippet}"`);
            }else{
                // some kind of profile page, so just return the handle with some text to indicate this is a Mastodon server
                return new LinkData(pData.url, `@${handle}@${mastodonServer} on Mastodon`);
            }
            return new LinkData(pData.url, pData.title, mastodonServer);
        } else {
            // we're on a generic page, so return the title with with a note that this is a Mastodon server
            return new LinkData(pData.url, `${pData.title} (Mastodon)`);
        }
    }
};

// define & register custom transformers for domains that need them
linkify.registerTransformer('9to5mac.com', transformers.mainHeading);
linkify.registerTransformer('apod.nasa.gov', (pData) => {
    // parse the title to extract the date and picture title
    let titlePartsMatch = pData.title.match(/^APOD:[ ](?<year>\d{4})[ ](?<month>[a-zA-Z]+)[ ](?<day>\d{1,2})[ ]–[ ](?<title>.+)$/);
    if(titlePartsMatch && titlePartsMatch.groups){
        return new LinkData(
            pData.url,
            `NASA Astronomy Picture of the Day for ${titlePartsMatch.groups.day} ${titlePartsMatch.groups.month} ${titlePartsMatch.groups.year}: ${titlePartsMatch.groups.title}`,
        )
    } else {
        // fall back on just using the title
        return new LinkData(pData.url, pData.title);
    }
});
linkify.registerTransformer('social.bartificer.ie', transformers.mastodonServer);
linkify.registerTransformer('cultofmac.com', transformers.mainHeading);
linkify.registerTransformer('daringfireball.net', (pData) => transformers.titleMinusPrefix(pData, 'Daring Fireball: '));
linkify.registerTransformer('intego.com', (pData) => transformers.titleMinusPostscript(pData, ' | Intego'));
linkify.registerTransformer('krebsonsecurity.com', (pData) => transformers.titleMinusPostscript(pData, ' – Krebs on Security'));
linkify.registerTransformer('macstories.net', (pData) => transformers.titleMinusPostscript(pData, ' - MacStories'));
linkify.registerTransformer('nakedsecurity.sophos.com', (pData) => transformers.titleMinusPostscript(pData, ' – Naked Security'));
linkify.registerTransformer('overcast.fm', function(pData){
    // strip Overcast append, split on em-dash to replace with n-dash and get podcast name
    let textParts =  pData.title.replace(' — Overcast', '').split('—');
    let podcastName = textParts.pop();

    // re-assemble the text
    let linkText = podcastName.trim() + ': ' + textParts.join(' – ').replace(/[ ]+/g, ' ').replace(':', '-').trim();
    return new LinkData(pData.url, linkText);
});
linkify.registerTransformer('sixcolors.com', transformers.mainHeading);
linkify.registerTransformer('theverge.com', transformers.mainHeading);
linkify.registerTransformer('wired.com', transformers.mainHeading);

//
// === Genereate the Link ===
//

// read the URL from the clipboard
let testURL = clipboardy.readSync();

// check if a specicla-case was passed
let specialCaseName = '';
let templateName = null;
if(process.argv.length > 2){
    specialCaseName = String(process.argv[2]);
}
if(specialCaseName){
    // check for a special-case transformer
    if (transformers[specialCaseName]){
        linkify.registerTransformer(URI(testURL).hostname(), transformers[specialCaseName]);
    } else {
        console.warn(`No transformer found with the name "${specialCaseName}". Proceeding without a one-off transformer.`);
    }

    // check for a special-case template
    if(templates[specialCaseName]){
        templateName = templates[specialCaseName];
    } else {
        console.warn(`No template found for special case "${specialCaseName}". Proceeding without a one-off template.`);
    }
}

// try generate the formatted link from the URL
linkify.generateLink(testURL, templateName).then(function(d){
    console.log(d);
});