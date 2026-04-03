// import Linkify Lib
import { linkify, LinkTemplate, LinkData } from '../src/index.js';

// import 3rd-party library for interacting with the clipboard
import clipboardy from 'clipboardy';

// define a custom Markdown link template and register it
const mdTitleTpl = new LinkTemplate('[{{{text}}} — {{{uri.hostname}}}{{#uri.hasPath}}/…{{/uri.hasPath}}]({{{url}}})');
linkify.registerTemplate('md-title', mdTitleTpl);

// define & register custom transformers for domains that need them
linkify.registerTransformer('9to5mac.com', function(pData){
    return new LinkData(pData.url, pData.mainHeading);
});
linkify.registerTransformer('cultofmac.com', function(pData){
    return new LinkData(pData.url, pData.mainHeading);
});
linkify.registerTransformer('daringfireball.net', function(pData){
    return new LinkData(pData.url, pData.title.replace(/^Daring Fireball:[ ]/, ''));
});
linkify.registerTransformer('intego.com', function(pData){
    return new LinkData(pData.url, pData.title.replace(' - The Mac Security Blog', ''));
});
linkify.registerTransformer('krebsonsecurity.com', function(pData){
    return new LinkData(pData.url, pData.title.replace(' – Krebs on Security', ''));
});
linkify.registerTransformer('macstories.net', function(pData){
    return new LinkData(pData.url, pData.title.replace(' - MacStories', ''));
});
linkify.registerTransformer('nakedsecurity.sophos.com', function(pData){
    return new LinkData(pData.url, pData.title.replace(' – Naked Security', ''));
});
linkify.registerTransformer('overcast.fm', function(pData){
    // strip Overcast append, split on em-dash to replace with n-dash and get podcast name
    let textParts =  pData.title.replace(' — Overcast', '').split('—');
    let podcastName = textParts.pop();

    // re-assemble the text
    let linkText = podcastName.trim() + ': ' + textParts.join(' – ').replace(/[ ]+/g, ' ').replace(':', '-').trim();
    return new LinkData(pData.url, linkText);
});
linkify.registerTransformer('sixcolors.com', function(pData){
    return new LinkData(pData.url, pData.mainHeading);
});
linkify.registerTransformer('theverge.com', function(pData){
    return new linkify.LinkData(pData.url, pData.title.replace(/[ ][-][ ]The[ ]Verge.*$/, ''));
});
linkify.registerTransformer('wired.com', function(pData){
    return new linkify.LinkData(pData.url, pData.mainHeading);
});

// read the URL from the clipboard
let testURL = clipboardy.readSync();

// try generate the formatted link from the URL
linkify.generateLink(testURL, 'md-title').then(function(d){
    console.log(d);
});