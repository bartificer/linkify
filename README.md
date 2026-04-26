# `linkify` from Bartificer Creations

An MIT-licensed command line app and ES6 JavaScript module for generating links in any format from a URL. Users can define their own templates and processing logic in JavaScript, and templates can utilise information from actual web pages.

[Bart Busschots](https://www.lets-talk.ie/contributor/bart) created this tool to speed up the creation of show notes for the [Let's Talk Apple](https://www.lets-talk.ie/lta) podcast and the [Security Bits](https://www.podfeet.com/blog/category/security-bits/) segments on the [NosillaCast](https://www.podfeet.com/blog/category/nosillacast/). This module is published under an open-source license as a courtesy to other podcasters and bloggers who regularly need to convert URLs into nicely formatted links.

Pull requests and issues are welcomed, but on the understanding that this tool is volunteer-maintained. All responses will be at the Bart's discretion as and when time allows. Realistically, don't expect to hear back for at least a few days, more likely a few weeks, and possibly even a few months.

Given this reality, **use this tool at your own risk!**

# Intended Purpose & Key Features

This module's *raison d'être* is converting URLs to links with the target page's main content title as the link text. To achieve this, the module fetches the page's content, parses it with [Cheerio](https://cheerio.js.org), extracts the page title and all top and second-level headings, applies per-domain logic to extract the best title from that data, then uses that to render a link in any format using a [Mustache](https://github.com/janl/mustache.js) template.

This is not a tool for simply converting a URL to a generic link. Unless you need to enrich your links with information from the web pages the links point to, it's probably overkill for you! 

The key features:

1. Meaningful link titles can be programmatically extracted from the web pages the URLs point to, and the extraction logic can be customised per domain using *data transformers* (JavaScript functions).
2. Since it has become more common for sites to block scripted downloads (thanks, AI!), the tool falls back to reversing URL slugs to derive meaningful titles when URLs can't be fetched. This reversing is enhanced with a title-case conversion, and that conversion can be configured to adjust the so-called *small words* (those that don't get a leading capital), and to define special words that have custom capitalisations like acronyms and product names, e.g., `NASA` and `iPhone`.
3. Once the data has been extracted, it can be rendered in any format using customisable templates, and these templates can also be assigned on a per-domain basis if needed.
4. All functionality that's attached to domain names is interpreted in a DNS-aware way, so a configuration for a parent domain is inherited by its subdomains, unless also defined at the subdomain level. Global defaults can be defined by associating transformers and templates with the root domain (`.`).

The reason the module allows customisations to be attached to specific domain names is that it is common to regularly link to the same sites. Which sites get used regularly will differ from user to user, so this approach allows each user to automate the corrections of they find themselves repeating regularly.

To make use of this tool's primary features, you need to write your own JavaScript code to define data transformers and templates, and assign them to domain names.

The CLI may be useful in its default state, but it was very much **intended to be customised**, and to do that, you need to be able to write at least some basic JavaScript.

# Requirements & Assumptions

1. This codebase depends on the [NodeJS JavaScript runtime,](https://nodejs.org/en/about) and you need to be running [the latest LTS](https://nodejs.org/en/download) (Long Term Support) version to use it.
2. This codebase is only [distributed](https://www.npmjs.com/package/@bartificer/linkify) via the [Node Package Manager](https://www.npmjs.com/) (NPM). You can download the source [from GitHub](https://github.com/bartificer/linkify) and re-bundle it yourself, but if you do, you're going to need to fork the code to remove all the Node dependencies from it!
3. This tool is **intended to be customised**, and to do that, you **need basic JavaScript skills** and an ability to read [API documentation](https://bartificer.github.io/linkify/). You may find some value in using the tool purely in its default state, but you'll regularly need to fix the link text to deal with website peculiarities!

# Installation

This tool is installed via the Node Package Manager (NPM). **Before you start, be sure you're running the [latest LTS](https://nodejs.org/en/download) version of NodeJS!**

If you're going to use the command line interface, you need to install the package globally:

```sh
# global install for CLI
sudo npm install --global '@bartificer/linkify'
```

Once the installation completes, you can test that it succeeded with the command:

```sh
npx linkify --version
```

If you're only going to use the tool's JavaScript modules within a specific project, you should install it locally into your project (rather than globally):

```sh
# local install within a NodeJS project
npm install --save '@bartificer/linkify'
```

# Command Line Interface (CLI) Overview

The CLI (command line interface) is shipped as a JavaScript file within the NPM bundle, so the simplest way to run it is to use NodeJS's binary locating and executing tool [NPX](https://docs.npmjs.com/cli/v8/commands/npx) (included with NodeJS):

```sh
npx linkify …
```

The tool implements the sub-command philosophy used by many open source tools like `git`; therefore, all `linkify` commands will take the following form:

```
npx linkify COMMAND [OPTIONS] [ARGUMENTS]
```

The tool offers built-in help, the top-level of which is available via the sub-command `help`:

```sh
npx linkify help
```

This lists the command's global options, and available sub-commands.

To get help on a sub-command, pass that command as an argument to the `help` sub-command. For example, to get help on link generation, use the command:

```sh
npx linkify help generate
```

Here are some of the most useful commands:

```sh
# show the default configuration
npx linkify defaults

# generate a link from a URL passed as an argument
npx linkify generate 'https://lets-talk.ie/'

# generate a link by piping a URL to linkify
echo 'https://lets-talk.ie/' | npx linkify generate

# generate a link by reading a URL from the clipboard (copy a link first!)
npx linkify generate --from-clipboard

# generate a link from an argument and send it to the clipboard
npx linkify generate 'https://lets-talk.ie/' --to-clipboard

# generate a link from the clipboard and write it back to the clipboard (copy a link first!)
npx linkify generate --clipboard

# show the active configuration
# help debug your customisations!
npx linkify config

# show the information extracted from the website at a URL
# help write data transformers & templates!
npx linkify page-data 'https://lets-talk.ie/'
```

To better understand how the module works, or, to help debug your customisations, the `--debug` flag enables the printing of debug messages.

# Customising the Tool

There are two types of customisation possible:

1. Define default values for the CLI's `generate` action
2. Customise the link generation process

## Customisation Modules

Both forms of customisation are accomplished by writing a configuration module in JavaScript. Customisation modules are ES6 JavaScript modules that export a single object with two keys, `options` & `linkifier` as the named export `default`.

Specifically, the value of the `options` key should be a plain object where the keys are the names of valid CLI options, and the values are strings for options that expect a value, and booleans for options that don't. The only small caveat is that hyphenated options need to be camelCased. Here's the options object Bart uses in his default customisation module:

```javascript
const options = {
    clipboard: true, // equivalent to --clipboard flag
    echoClipboard: true, // equivalent to --echo-clipboard flag (all two-word flags are camelCased)
    template: 'markdown-domain' // equivalent to --template=markdown-domain 
};
```

The value of the `linkifier` key must be an instance of the class `Linkifier` with your desired link generation customisations applied.

You don't have to specify both `options` and `linkifier; if you only need one type of customisation, it's fine to omit the key you don't need.

Customisation modules should have the following overall structure:

```javascript
import { Linkifier } from '@bartificer/linkify'; // add classes depending on customisation needs

// create and customise a linkifier object
const linkifier = new Linkifier(); // a default linkifier object

// ADD YOUR CUSTOMISATIONS HERE (to linkifier)

// define your desired default cli options
const options = {
    // ADD YOUR OPTIONS HERE 
};

// export your customisations
const config = { linkifier, options };
export {config as default};
```

The command line tool automatically checks for and attempts to import `~/.linkify-config.mjs`, and any customisation module can be specified with the `--config` option.

If you're using the tool within a JavaScript project, you can also import the default customisation module, or a specific customisation module, with the static asynchronous function `Linkifier.importConfig()`. A typical script would take the following form:

```javascript
#!/usr/bin/env node

import { Linkifier } from '@bartificer/linkify'; // add classes depending on customisation needs

(async () => { // promise-based, simplest to use async IIFE
    const configObject = await Linkifier.importConfig(); // can pass path as arg
    const linkifier = configObject.linkifier; // instance of Linkifier class

    // CALL ANY INSTANCE FUNCTIONS ON linkifier HERE
})();
```

If you're using the tool within a code base, you may not want to load your customisations from an external module, but define them within the script itself. This is a simple pattern for doing that:

```javascript
#!/usr/bin/env node

// import a ready-to-use default Linkify instance with the named import linkify
import { linkify } from '@bartificer/linkify'; // add classes depending on customisation needs

// ADD YOUR CUSTOMISATIONS TO linkify HERE

(async () => { // promise-based, simplest to use async IIFE
    // CALL ANY INSTANCE FUNCTIONS ON linkify HERE
})();
```

# Customising Link Generation

Whether you're adding your link customisations to a customisation module, or, directly into a script, the process is the same.

To succeed, you'll need to familiarise yourself with two things:

1. The link generation process the tool uses (described below)
2. The module's API documentation — [https://bartificer.github.io/linkify/](https://bartificer.github.io/linkify/)

The following classes are the most important to familiarise yourself with:

1. `Linkify` — the module's functionality is primarily exposed via instance methods on this class
2. `PageData` — the data transformers you write will receive instances of this class as their input
3. `LinkData` — the data transformers you write need to return instances of this class
4. `LinkTemplate` — you define your templates by creating instances of this class

It's also a good idea to familiarise yourself with the content of the `utilities` module. It's not directly exported, but all the functions it provides are made available as both instance and static members of the `Linkifier` class — statically as `Linkifier.utilities`, and as `.util` & `.utilities` on any instance of the `Linkifier` class.

## The Link Generation Process

Link generation is triggered by calling the `generateLink(url)` function on an instance of the `Linkifier` class.

The first step in the process is to attempt to fetch the content of the page the URL points to. The relevant information is then extracted from the page's content and saved as an instance of the `PageData` class.

These days, it's not uncommon for web servers to block scripted page downloads, so when the fetch fails, the module automatically falls back to reversing the URL slug into a human-friendly page title. The resulting titles are also captured in a `PageData` object, just one containing much less information.

The second step is to extract the most useful information from the `PageData` object and use that to build a new object that represents the generic properties of any link — its URL, the link text, and optionally, a link description. This link information is captured in instances of the `LinkData` class.

The conversion is performed by a *Data Transformer*, a JavaScript function that takes a `PageData` object as an argument, and returns a `LinkData` object. 

This is where the nuances and peculiarities of individual websites need to be handled. Some sites put their article titles in the first `<h1>` tag on the page, others in the first `<h2>`, and some in odd places like the second or third `<h1>`! The key point is that no matter how weird they get, pages on the same site tend to be consistent, so we need to be able to customise the data transformation process on a per-site basis!
	
This is why the module assigns transformers to domain names. Because some organisations use multiple subdomains, these assignments are DNS-aware, that is to say, a transformer assigned to `lets-talk.ie` is also used for `www.lets-talk.ie`. This subdomain fallback is conditional; if there is a different transformer assigned to a specific subdomain, then that transformer takes precedence! For example, if I added an assignment for `media.lets-talk.ie` that would be used for that subdomain, but the transformer for `let's-talk.ie` would still be used for `www.lets-talk.ie`. This DNS-aware fallback makes it easy to assign an overall default transformer; you assign it to the root DNS name, simply `.`!

Un-customised instances of the `Linkifier` class have a somewhat intelligent generic transformer assigned to `.` (`Linkifier.defaults.dataTransformer()`).

The final step in the process is to convert the link data to a link using a template. Templates are instances of the `LinkTemplate` class. The heart of a link template is a template string in [Mustache](https://github.com/janl/mustache.js/) format. The template string can reference any field provided by the `LinkData` class, e.g.:

```json
{
  "url":	"https://www.lets-talk.ie/",
  "text": "Let's Talk Podcasts",
  "description": "The home of the Let's Talk Podcasts",
	"extraFields": {},
	"uri": {
    "hostname":	"www.lets-talk.ie",
    "path": "/",
    "hasPath": false
  }
}
```

The default HTML template uses the following template string:

```
<a href="{{{url}}}" title="{{description}}">{{text}}</a>
```

Because templates may want to apply transformations to the values in some fields, like converting link text to all lowercase, you can add *field filters* to templates. These filters get applied before the template is rendered. Field filters are simply JavaScript functions that take strings as their first argument and return strings.

Writing your own filter functions is easy, but there are some potentially useful functions in the `utility` module that work as a field filter:

1. `regulariseWhitespace(text)` to replace all white space, even new lines and tabs, with single regular spaces.
2. `stripQueryString(url)` to remove the query string entirely
3. `stripUTMParameters(url)` to remove tracking parameters from the query string.

_**Note** that for advanced use-cases, it's also possible to add logic for extracting extra fields from web pages to templates, see below for details._

Specific template names can be passed to the `.generateLink()` function, but if none are passed, the tool falls back to resolving the template to use based on the domain name. Default instances of the `Linkify` class have the `html` template assigned to the root DNS name (`.`), so that template acts as a universal default.

This entire process, including customisations to the reversing of URL slugs, is illustrated in the [Mermaid](https://mermaid.ai/open-source/) diagram below:

```mermaid
flowchart TD
    classDef inputNode fill:#cfc,color:#090,stroke:#000,stroke-width:2px;
    URL([fa:fa-circle-down URL]):::inputNode
    TPLNAME([fa:fa-circle-down Template Name — Optional]):::inputNode

    classDef datastoreNode fill:#ccf,color:#009,stroke:#000;
    TPLMAP[(Domain → Default Template Mappings)]:::datastoreNode
    TPLS[(Registered Tempaltes)]:::datastoreNode
    TRANSMAP[(Domain → Transformer Mappings)]:::datastoreNode
    CUSTCAPLIST[(Custom Capitalisations)]:::datastoreNode
    SMWORDLIST[(Small Words)]:::datastoreNode

    FETCH{Try Fetch Page}
    HAVETPLNAME{Template Name Specified?}
    
    PARSE[fa:fa-gears Parse]
    REVSLUG[fa:fa-gears Reverse Slug]
    RSLVTPLNAME[fa:fa-gears Resolve Template Name]
    RSLVTPL[fa:fa-gears Resolve Template]
    RSLVTRANS[fa:fa-gears Resolve Transformer]
    TRANS[fa:fa-gears Transform]
    RENDER[fa:fa-gears Render]

    classDef objectNode fill:#009,color:#fff,stroke:#000;
    PDATA{{fa:fa-table-cells PageData Object}}:::objectNode
    LDATA{{fa:fa-table-cells LinkData Object}}:::objectNode
    TPLNAMESTR{{fa:fa-quote-left Template Name}}:::objectNode
    TPLOBJ{{fa:fa-table-cells Template Object}}:::objectNode
    TRANSFN{{fa:fa-code Transformer Function}}:::objectNode
    
    classDef outputNode fill:#090,color:#fff,stroke:#000,stroke-width:2px;
    LINK([fa:fa-quote-left Link]):::outputNode

    URL --> FETCH
    TPLNAME --> HAVETPLNAME
    FETCH -->|Success| PARSE
    FETCH -->|Fail| REVSLUG
    CUSTCAPLIST --> REVSLUG
    SMWORDLIST --> REVSLUG
    PARSE --> PDATA
    REVSLUG --> PDATA
    HAVETPLNAME -->|Yes| TPLNAMESTR
    HAVETPLNAME -->|No| RSLVTPLNAME
    TPLMAP --> RSLVTPLNAME
    RSLVTPLNAME --> TPLNAMESTR
    TPLNAMESTR --> RSLVTPL
    RSLVTPL --> TPLOBJ
    TPLS --> RSLVTPL
    TRANSMAP --> RSLVTRANS
    RSLVTRANS --> TRANSFN
    PDATA --> TRANS
    TRANSFN --> TRANS
    TRANS --> LDATA
    LDATA --> RENDER
    TPLOBJ --> RENDER
    RENDER --> LINK
```

## Customisation Points

To summarise the previous section, you can customise the link generation process in the following ways:

1. Tweak the process for reversing URL slugs when page fetches fail by:
   1. Updating the list of words that do not get leading caps, the *small words*
   2. Updating the list of words that need special capitalisations applied, e.g., *NASA* & *iPhone*.
2. Define custom data transformers, and assign them to specific domains
3. Define custom templates and optionally assign them to specific domains

To have an effect, all customisations to the link generation logic need to be applied to an instance of the  `Linkifier` class using the appropriate instance method. Some customisations require the creation of instances of other Linkifier classes. Specifically, data transformers require instances of the `LinkData` class and templates of the `LinkTemplate` class.

## Applying Link Generation Customisations

The process for customising the link generation process is the same regardless of whether you're writing a customisation module for use with the CLI, or adding customisations in a stand-alone script.

To get started, you need to import three things from the `@bartificer/linkify` NPM module:

1. **Either** a default instance of the `Linkifier` class, **or** the `Linkifier` class itself:
   1. The named export `linkify` is an instance of the `Linkifier` class that's ready to use
   2. The named export `Linkifier` is the class itself
2. The named export `LinkData` is that class
3. The named export `LinkTemplate` is that class

Putting it all together, that means we need:

```javascript
// the pre-made Linkifier instance option
import {linkify, LinkData, LinkTemplate} from '@bartificer/linkify';
// or, if you prefer to name the instance linkifier
import { linkify as linkifier, LinkData, LinkTemplate } from '@bartificer/linkify';

// the more explicit direct Linkifier class option
import {Linkifier, LinkData, LinkTemplate} from '@bartificer/linkify';
```

The second, more explicit option is more flexible, so all the examples in this section will assume the following lines of code:

```javascript
// Assumed setup for all examples!

// import the three customisation classes
import {Linkifier, LinkData, LinkTemplate} from '@bartificer/linkify';

// create an instance of the Linkifier class named linkifier
const linkifier = new Linkifier();
```

### 1 — Customising the Slug Reversing Process

Fresh `Linkifier` instances use the small words list from `Linkifier.defaults.smallWords`. Once created, each instance maintains its own list as the [JavaScript Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) `.smallWords`.

Because it's a set, you can easily remove words you disagree with, add new words of your own, or even start fresh with a whole new list:

```javascript
// customise the small words list
linkifier.smallWords.add('visa-à-vis');
linkifier.smallWords.delete('only');

// or start over with a fresh list
linkifier.smallWords.clear();
['in', 'and', 'to', 'of'].forEach((w) => { linkifier.smallWords.add(w) });
```

Similarly, fresh `Linkifier` instances have a set of specially capitalised words, `.speciallyCapitalisedWords` which is initialised from `Linkifier.defaults.speciallyCapitalisedWords`. This can be customised in the same way:

```javascript
// customise the list of specially capitalised words
linkifier.speciallyCapitalisedWords.delete('MacBook');
linkifier.speciallyCapitalisedWords.add('SurfaceBook');
```

Note that for this setting *'words'* can include spaces. For example, the default list contains `'the US'`, allowing headlines like *'Apple Roll Some Feature Out in the US'* to render correctly, as well as headlines like *'"Some of Us Just Knew He'd Do Well" Said a Relative'.

### 2 — Custom Data Transformers

Data transformers are simple JavaScript functions that take instances of the `PageData` class as input, and return instances of the `LinkData` class. The `LinkData` constructor expects the following arguments:

1. The URL the link should point to — **required!**
2. The text for the link, **optional**, defaults to the URL
3. A link description, **optional**, defaults to the link text

Transformers have no names, and get directly assigned to domain names using the `.registerTransformer()` function. This function requires two arguments:

1. A domain name
2. A reference to a JavaScript function

Because link transformers are often very simple, it's often convenient to define them right within the argument list using JavaScript's *fat arrow* syntax.

```javascript
// Add a custom data transformer for the Programming by Stealth podcast series
// this transformer:
// 1. passes the URL through un-changed
// 2. uses the second h1 tag as the link text (array index of second heading is 1)
linkifier.registerTransformer('pbs.bartificer.net', (pData) => {
  return new LinkData(pData.url, pData.h1s[1]);
});
```

### 3 — Custom Templates

Custom templates are instances of the `LinkTemplate` class. Because templates are referenced by name, they need to be registered with the `Linkifier` instances under a particular name using the `.registerTemplate()` function.

The only argument the constructor needs is a template string in [Mustache format](https://github.com/janl/mustache.js/).

For example, you can register a new template named `markdown-emoji` that generates a link in [Markdown](https://www.markdownlang.com) format that adds a link emoji to the end of the link text, like so:

```javascript
// register a template for Markdown links with link emoji
linkifier.registerTemplate(
  'markdown-emoji', // template name
  new LinkTemplate('[{{{text}}}🔗]({{{url}}})') // new template object
);
```

You may also want to create a template specific to one site, say your organisation's domain. To do that, you can create the template, then assign it to your organisation's domain as the default with the `.registerDefaultTemplateMapping()` function:

```javascript
// register a special template for Let's Talk Podcasts' home domains, *.lets-talk.ie
// The template will be in markdown and add a house emoji
// 1 - register a new template
linkifier.registerTemplate(
  'markdown-home',
	new LinkTemplate('🏡[{{{text}}}]({{{url}}})')
);
// 2 - assign it to the lets-talk.ie domain and all subdomains
linkifier.registerDefaultTemplateMapping('lets-talk.ie', 'markdown-home');
```

Finally, some websites like to add tracking information to the query string, which can be removed by registering the utility function `stripUTMParameters()` as a filter on the `url` field. Let's expand our original `markdown-emoji` template to do that. We can do that by using the `.getTemplate()` function on our `Linkifier` instance and then attaching a field filter with the `.addFilter()` instance function provided by the `LinkTemplate` class:

```javascript
// update the markdown-emoji template to strip tracking parameters
linkifier.getTemplate('markdown-emoji').addFilter(
  'url', // the field name
  linkifier.util.stripUTMParameters // a reference to a function — no trailing parens!
);
```

### Advanced Usage — Template with Extra Field Extractor

Very rarely, a template needs access to information that's not extracted from the page content by default. This is possible with the use of an *Extra Field Extractor* function.

Under the hood, the process is spread out over many classes, but to keep things simple for API users, the public interface to this functionality is entirely contained within the `LinkTemplate` class's constructor.

To create a template that uses extra fields, you must:

1. Pass a custom field extractor function as the optional third argument to the `new LinkTemplate()` constructor.
   * This function will be passed just one argument, a [Cheerio object](https://cheerio.js.org/docs/api/classes/cheerio/) representing the web page's parsed DOM.
   * This function **must** return a plain object mapping field names to simple values, specifically, values that Mustache can render.
2. Use the extra fields in the template's template string. The fields you extracted will be available as keys on the `extraFields` object. For example, if your extractor function returned fields named `permalink` and `volume`, those two fields can then be referenced as `extraFields.permalink` & `extraFields.volume` in the template string.

As a practical example, here's a custom template to render XKCD comics as Markdown links followed by Markdown images with the comic number, comic title, comic permalink, and comic image URL extracted from the DOM as extra fields and referenced in the template string:

```javascript
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
```

# Examples

To help you get started using the tool, the `/examples` folder [in the GitHub repository](https://github.com/bartificer/linkify/tree/master/examples) provides four example files:

1. A pair of example customisation modules:
   1. `linkify-config-minimal.mjs` — a starter customisation module.
   2. `linkify-config-realworld.mjs` — a snapshot of the customisation module Bart uses when preparing show notes for his podcasts.
2. A pair of example scripts:
   1. `script-with-cli-config.mjs` — a starter script that imports the user's customisation module, allowing the same config to be shared between the CLI and scripts.
   2. `script-stand-alone.mjs` — a starter script that imports no customisations but defines them all internally.

# Extending/Contributing

You can fork this repository to extend the code for your own use, or to contribute back PRs (pull requests) with bug fixes and/or enhancements.

To be effective when working with the code, you'll need to generate a version of the documentation that includes all the private modules, variables, functions, and classes. You can do that with the command:

```sh
npm run docs-dev
```

This will output the developer docs to `./docs-dev/index.html`.

You can also build an updated local version of the pubic documentation with the command:

```sh
npm run docs
```

This will output the public docs to `./docs/index.html`.

The actual source code is located in the `./src` folder; the files in the `dist` folder are bundled versions of the source code built with [Webpack](https://webpack.js.org). **Always make your edits in the `./src` folder!** To build your updated code for testing, run:

```sh
npm run build
```

Finally, care has been taken to document the code in great detail using [JSDoc](https://jsdoc.app). If you make changes, please ensure you also update the JSDoc documentation comments!