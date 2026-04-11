// import Linkify Lib
import { linkify, LinkTemplate, LinkData } from '../dist/index.js';

// import 3rd-party library for interacting with the clipboard
import clipboardy from 'clipboardy';

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

// register a special Markdown template for XKCD cartoons presss releases and make it the default for XKCD's domain
// TO DO — figure out the right way to add support for extra fields like the sequence number, image permalink & alt text
linkify.registerTemplate('md-xkcd', new LinkTemplate(
    // the description should the the comic's sequence number, at least for now
    '[XKCD {{{description}}}: {{{text}}}]({{{url}}})\n![ADD DESCRIPTION](IMAGE_PERMALINK.png "ALT TEXT")'
));
linkify.registerDefaultTemplateMapping('xkcd.com', 'md-xkcd');

// Cache commonly needed transforer functions to reduce code repetition
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
linkify.registerTransformer('xkcd.com', (pData) => {
    // extract the sequence number from the URL and add it to the description field
    const comicNumber = pData.uri.path().replaceAll('/', '');
    const comicTitle = pData.title.replace(/^xkcd[:][ ]/, '');
    return new LinkData(pData.url, comicTitle, comicNumber);
});

// read the URL from the clipboard
let testURL = clipboardy.readSync();

// try generate the formatted link from the URL
linkify.generateLink(testURL).then(function(d){
    console.log(d);
});