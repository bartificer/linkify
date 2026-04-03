# `linkify` from Bartificer Creations

An MIT-licensed ES6 Javascript module for generating links in any format from a URL.

This code was written by [Bart Busschots](https://www.lets-talk.ie/contributor/bart) to speed up the creation of shownotes for the [Let's Talk Apple](https://www.lets-talk.ie/lta) and the [Security Bits](https://www.podfeet.com/blog/category/security-bits/) segments on the [NosillaCast](https://www.podfeet.com/blog/category/nosillacast/). It is released open-source as a courtesy to other podcasters and bloggers who regularly need to covert URLs into nicely formatted links.

Pull requests and issues are welcomed, but on the understanding that this is a volunteer-maintained package, and all responses will be at the maintainer's discression as and when they have time. Realistically, you won't hear back from days or weeks, and if life is very hectic, perhaps even months.

Given this reality, **do not use this repository for anything mission-critical!**.

## Instalation

```sh
npm install '@bartificer/linkifier';
```

## Examples

This is an ES6 module, so when used with NPM, your scripts must have the `.mjs` file extension (to force ES module mode).

### Generate a Link from a URL Using all the Defaults


Create a file named `demo.mjs` with the following content:

```javascript
// import the linkify module
import linkify from '@bartificer/linkify';

// generate a link from a URL using the default template
(async () => {
    let link = await linkify.generateLink('https://pbs.bartificer.net/pbs128');
    console.log(link);
})();
```

Execute the script with `node`:

```sh
node demo.mjs
```

### Using the Bundled Templates

The following demo code will generate a link using each of the bundled link templates:

```javascript
// import the linkify module
import linkify from '@bartificer/linkify';

// get a list of all registered template names
const templateNames = linkify.templateNames;
console.log('registered templates:', templateNames);

// iterate over each tempalte with an example URL
(async () => {
    let testURL = 'https://pbs.bartificer.net/pbs128';
    for(let templateName of templateNames){
        let link = await linkify.generateLink(testURL, templateName);
        console.log(`- ${templateName}: ${link}`);
    }
})();
```

### Real-World Examples

Two real-world scripts Bart users to build shownotes are included in [the `/example` folder in the GitHub repostitory](https://github.com/bartificer/linkify/tree/master/example):

1. `clipboardURLToMarkdown.mjs` — the script Bart uses to convert links to Markdown for use in show notes. This script contains a real-world example of a custom template, and, of a large collection of custom transformers registered against specific domain names for dealing with their various quirks.
2. `debugClipboardURL.mjs` — the script Bart uses to help develop custom transformers for any sites that need them.