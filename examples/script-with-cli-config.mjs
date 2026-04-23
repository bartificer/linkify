#!/usr/bin/env node

// Example Linkifier Script - Imports Customisation Module
// =======================================================
// This example script imports link generation customisations from a
// customisation module that is compatible with the linkfiy command line app.
// 
// This script expects to be passed an optional configuration file path as an
// only argument.

// Import the Linkifier Class
import { Linkifier } from '@bartificer/linkify';

// get the config path, if any
const configPath = process.argv[2] ? String(process.argv[2]) : '';

// enable debug messages to help illuminate the module's processes
Linkifier.utilities.enableDebugMessages();

// because the Linkify API is promise-based, wrap the script logic in a self-executing anonymous async function
(async () => {
    // to get a pre-configured instance of the Linkifier class from a
    // specificed config or the user's default config (if any), first fetch
    // a full config object, this will have two keys:
    // * linkifier - a pre-configured instance of the Linkifier class, or, a
    //   defailt instance of that class if no config was found.
    // * options - an Object with CLI option values (irrelevant in scripts)
    const configObject = await Linkifier.importConfig(configPath);
    const linkifier = configObject.linkifier;

    // you can now interrogate, or indeed update, this linkifier instance
    console.log(`The default template in use is '${linkifier.defaultTemplateName}'`);

    // you can now use this configured linkifier object to render links
    const url = 'https://lets-talk.ie';
    console.log(`\nA Link to Let's Talk Podcsasts:`);
    console.log(await linkifier.generateLink(url));

    // If you don't want links, you can also get the raw page data
    // it will be returned as a LinkData object
    const pageData = await linkifier.fetchPageData(url);

    // you can get at the raw values with the .asPlainObject() instance function
    console.log(`\nThe Page Data for the Let's Talk Podcasts Homepage:`);
    console.log(JSON.stringify(pageData.asPlainObject(), null, 2));
})();