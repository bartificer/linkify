#!/usr/bin/env node

/**
 * @file The code for the command-line interface. This file does not contribute to the module's public API.
 * @author Bart Busschots <opensource@bartificer.ie>
 * @license MIT
 */

/**
 * A commandline inteface (CLI) published as `linkify`.
 * 
 * The CLI can be customised with a module that exports a configured `Linkifier` object as it's default export.
 * @private
 * @module linkify-cli
 * @requires module:clipboardy
 * @requires module:commander
 * @requires module:kleur
 * @requires module:urijs
 * @requires module:utilities
 * @requires module:linkifier-class.Linkifier
 */

//
// === Imports ===
//

// --- Static Imports ---

// import Commander.js (CLI framework)
import { Command } from 'commander';

// import the needed text formatting from kleur
import kleur from 'kleur';
const { bold, italic, blue, green, grey, red } = kleur;
import URI from 'urijs';

// import the clipboard support
import clipboard from 'clipboardy';

// import the required linkifier classes — resolves because the name here matches the package name in ../package.json
import { Linkifier, VERSION } from '@bartificer/linkify'
//import { Linkifier } from '../src/Linkifier.class.mjs' // for debugging
const utilities = Linkifier.utilities; // for conveniece

// --- Conditional Dynamic Imports ---

/**
 * Placeholder into which a config can be loaded.
 * @type {configurationObject}
 */
let CONFIG = null;

//
// === CLI Utility functions ===
//

/**
 * Merge CLI options into config options.
 * 
 * Note that the config options are read from the global variable.
 * @param {Object} cliOpts - the options passed to the CLI.
 * @returns {Object} the merged and rationalised options, with the CLI options taking precedence over the config options, and clipboard blocks over clipboard requests.
 */
function mergeOptions(cliOpts){
    // start with any options from a loaded config module (could be an empty object)
    const opts = {...CONFIG.options};
    utilities.debug(`Options loaded from config:\n${JSON.stringify(opts, null, 2)}`);

    // merge in the cli options
    utilities.debug(`CLI Options: (take precedence)\n${JSON.stringify(cliOpts, null, 2)}`);
    for(const [name, value] of Object.entries(cliOpts)){
        opts[name] = value;
    }

    // Rationalise Clipboard options — within actions, only check the explicit to and from options!
    // Apply two-level precdence logic:
    // 1. do not override precedence of CLI flags over config options
    // 2. clipboard blocks have a higher precedence than individual clipboard requests (--no-clipboard > --to-clipboard etc.)
    if(opts.hasOwnProperty('clipboard')){ // an explicit value was set
        if(opts.clipboard){ // a truthy value was set
            // a truthy value was set, propagate each interaction unless explicitly blocked
            if(opts.hasOwnProperty('fromClipboard') && !opts.fromClipboard){
                utilities.debug('options --clipboard & --no-from-clipboard both set, --no-from-clipboard not overriden');
            } else {
                opts.fromClipboard = true;
                utilities.debug('option --clipboard set, and no --no-from-clipboard, therefore set --from-clipboard');
            }
            if(opts.hasOwnProperty('toClipboard') && !opts.toClipboard){
                utilities.debug('options --clipboard & --no-to-clipboard both set, --no-to-clipboard not overriden');
            } else {
                opts.toClipboard = true;
                utilities.debug('option --clipboard set, and no --no-to-clipboard, therefore set --to-clipboard');
            }
        } else {
            // a falsy value was set — block all clipboard interaction
            opts.fromClipboard = false;
            opts.toClipboard = false;
            utilities.debug('option --no-clipboard set, therefore set --no-to-clipboard & --no-from-clipboard');
        }
    }

    // debug the final merged options
    utilities.debug(`Merged options:\n${JSON.stringify(opts, null, 2)}`);

    // return the merged options
    return opts;
}

/**
 * Resolve the URL passed to a cli command via an argument, the clipboard, or piped in.
 * 
 * The following algorithm is followed:
 * 1. Read from the clipboard if an appropriate option was passed
 * 2. read from the argument, if passed
 * 3. try read from the input pipe
 * 4. throw an error
 * @param {Object} opts - merged options
 * @param {string} urlArg - the URL argumemt received by the command
 * @returns {string} the URL
 */
async function resolveURL(opts, urlArg){
    // default to an empty URL
    let url = '';

    // apply the above precedence rules
    if(opts.clipboard || opts.fromClipboard){
        url = await clipboard.read();
        if(opts.echoClipboard){
            utilities.info(`URL read from clipboard:\n${grey(url)}`);
        }
    } else if(urlArg) {
        url = urlArg;
    } else if(!process.stdin.isTTY) { // only read from pipes, not from keyboards!
        // a helper function to read from STDIN — generated by Lumo AI, verified with NodeJS API docs
        const pipeReadHelper = function(){
            return new Promise((resolve, reject) => {
                let data = '';
                process.stdin.setEncoding('utf8');
                process.stdin.on('data', (chunk) => (data += chunk));
                process.stdin.on('end', () => resolve(data));
                process.stdin.on('error', reject);
            });
        }; 
        url = await pipeReadHelper();
    } else {
        utilities.fatal('no URL passed');
    }

    // validate the URL for cleaner error messages (rather than letting the module get cranky)
    if(!CONFIG.linkifier.util.isURL(url)){
        utilities.fatal(`invalid URL:\n${grey(url)}`);
    }

    // return the URL
    return url;
}

/**
 * Resolve the optional explicit template passed to a cli command.
 * @param {Object} opts - merged options.
 * @returns {?module:link-template.LinkTemplate}
 */
function resolveExplicitTemplate(opts){
    // assume no explicit template
    let tpl = null;

    // accept an optional template from the config or CLI
    if(opts.template){
        // make sure the template is registered
        if(CONFIG.linkifier.hasTemplate(opts.template)){
            tpl = opts.template;
        } else {
            utilities.fatal(`undefined template: ${grey(opts.template)}'\n${bold().grey('Available Templates:')} ${grey(JSON.stringify(CONFIG.linkifier.templateNames))}`);
        }
    } else {
        utilities.debug('no explicit template passed, the default will be used (potentially overriden on specific URL domains)');
    }

    // return the template
    return tpl;
}

//
// === Build the CLI ===
//

/**
 * The commander object representing the CLI itself.
 * @type {module:commander.Command}
 */
const cli = new Command()
    .name('linkify')
    .version(VERSION)
    .description('Convert URLs to rich links in any format based on the page contents.')
    .option('-C, --config <path>', `path to config file (default: ~/${Linkifier.defaults.configFilename})`)
    .option('-d, --debug', 'enable debug mode')
    .hook('preAction', (cmd) => { if(cmd.opts().debug) utilities.enableDebugMessages() });

/**
 * A re-usable hook for loading the config into the `CONFIG` variable.
 * @function
 * @param {module:commander.Command} cmd - the command loading the config.
 */
const loadConfigHook = async (cmd) => {
    // capture the passed config path, if any
    const configPath = cli.opts().config || '';

    // try import a config
    try {
        CONFIG = await Linkifier.importConfig(configPath);
    } catch (err) {
        utilities.fatal(err.message);
    }
};

/**
 * The commander object representing the sub-command for showing the defaults.
 * @type {module:commander.Command}
 */
const showDefaults = cli.command('show-defaults')
    .alias('defaults')
    .summary('show configuration defaults');
showDefaults.action(async () => {
    // the default templates
    console.log(bold().green('TEMPLATES'));
    console.log(bold().green('---------'));
    for(const [name, tpl] of Object.entries(Linkifier.defaults.linkTemplates)){
        console.log(`\n${bold().green(name)}`);

        // the template string
        console.log(`Mustache string:\n${grey(tpl.templateString)}`);

        // the filters
        if(tpl.hasFilters){
            console.log(`Filters: ${grey(tpl.numFilters)}`);
            for(const [fieldName, filter] of tpl.filterTuples){
                console.log(`${blue(fieldName)}: ${grey(filter.toString())}`);
            }
        } else {
            console.log(`Filters: ${italic().grey('none')}`);
        }

        // the extra field extractor
        if(tpl.hasExtraFields){
            console.log(`Extra Field Extractor: ${grey(tpl.fieldExtractor.toString())}`);
        } else {
            console.log(`Extra Fields: ${italic().grey('not supported')}`);
        }
    }

    // the default data transformer
    console.log(bold().green('\nDATA TRANSFORMER'));
    console.log(bold().green('----------------'));
    console.log(grey(Linkifier.defaults.dataTransformer.toString()));

    // the default small words list
    console.log(bold().green('\nSMALL WORDS'));
    console.log(bold().green('-----------'));
    console.log(italic().grey('Used for the title-case conversion when reversing URL slugs'));
    console.log(italic().grey(`The default short word list from the title-case NPM module with ${green('additions')}`));
    let smallWords = new Set([...Linkifier.defaults.importedSmallWords, ...Linkifier.defaults.extraSmallWords]);
    let smallWordsList = "";
    const extraSmallWords = new Set(Linkifier.defaults.extraSmallWords);
    [...smallWords].sort().forEach((smallWord, i, list) => {
        if(i > 0){
            smallWordsList += i === list.length -1 ? ' & ' : ', ';
        }
        smallWordsList += `'${extraSmallWords.has(smallWord) ? green(smallWord) : smallWord}'`;
    });
    console.log(smallWordsList);

    // the default specially capitalised words list
    console.log(bold().green('\nSPECIALLY CAPITALISED WORDS'));
    console.log(bold().green('---------------------------'));
    console.log(italic().grey('Used for the title-case conversion when reversing URL slugs'));
    let specialWordsList = "";
    Linkifier.defaults.speciallyCapitalisedWords.sort().forEach((word, i, list) => {
        if(i > 0){
            specialWordsList += i === list.length -1 ? ' & ' : ', ';
        }
        specialWordsList += `'${word}'`;
    });
    console.log(specialWordsList);
});

/**
 * The commander object representing the sub-command for showing the loaded config.
 * @type {module:commander.Command}
 */
const showConfig = cli.command('show-config')
    .alias('config')
    .summary('show active configuration');
showConfig.hook('preAction', loadConfigHook); // load the config for this command
showConfig.action(async () => {
    // the loaded templates
    console.log(bold().green('AVAILABLE TEMPLATES'));
    console.log(bold().green('-----------------'));
    for(const name of CONFIG.linkifier.templateNames.sort()){
        const tpl = CONFIG.linkifier.getTemplate(name);
        console.log(`\n${bold().green(name)}`);

        // the template string
        console.log(`Mustache string:\n${grey(tpl.templateString)}`);

        // the filters
        if(tpl.hasFilters){
            console.log(`Filters: ${grey(tpl.numFilters)}`);
            for(const [fieldName, filter] of tpl.filterTuples){
                console.log(`${blue(fieldName)}: ${grey(filter.toString())}`);
            }
        } else {
            console.log(`Filters: ${italic().grey('none')}`);
        }

        // the extra field extractor
        if(tpl.hasExtraFields){
            console.log(`Extra Field Extractor: ${grey(tpl.fieldExtractor.toString())}`);
        } else {
            console.log(`Extra Fields: ${italic().grey('not supported')}`);
        }
    }

    // the template mappings
    console.log(bold().green('\nDOMAIN → DEFAULT THEME MAPPINGS'));
    console.log(bold().green('-------------------------------'));
    const tplMappings = CONFIG.linkifier.domainToDefaultTemplateNameMappings;
    for(const domain of Object.keys(tplMappings).sort()){
        console.log(`${domain == '.' ? bold().blue('DEFAULT') : blue(domain)} → ${tplMappings[domain]}`);
    }

    // the data transformer mappings
    console.log(bold().green('\nDOMAIN → DATATRANSFORMER MAPPINGS'));
    console.log(bold().green('---------------------------------'));
    const transformerMappings = CONFIG.linkifier.domainToTransformerMappings;
    for(const domain of Object.keys(transformerMappings).sort()){
        console.log(`${domain == '.' ? bold().blue('DEFAULT') : blue(domain)} → ${transformerMappings[domain].toString()}`);
    }

    // the current small words list
    console.log(bold().green('\nSMALL WORDS'));
    console.log(bold().green('-----------'));
    console.log(italic().grey('Used for the title-case conversion when reversing URL slugs'));
    let smallWordsList = "";
    [...CONFIG.linkifier.smallWords].sort().forEach((smallWord, i, list) => {
        if(i > 0){
            smallWordsList += i === list.length -1 ? ' & ' : ', ';
        }
        smallWordsList += `'${smallWord}'`;
    });
    console.log(smallWordsList);

    // the current specially capitalised words list
    console.log(bold().green('\nSPECIALLY CAPITALISED WORDS'));
    console.log(bold().green('---------------------------'));
    console.log(italic().grey('Used for the title-case conversion when reversing URL slugs'));
    let specialWordsList = "";
    [...CONFIG.linkifier.speciallyCapitalisedWords].sort().forEach((word, i, list) => {
        if(i > 0){
            specialWordsList += i === list.length -1 ? ' & ' : ', ';
        }
        specialWordsList += `'${word}'`;
    });
    console.log(specialWordsList);
});

/**
 * The commander object representing the page data previewing sub-command.
 * @type {module:commander.Command}
 */
const pageDataPreview = cli.command('preview-page-data')
    .alias('page-data')
    .summary('preview the page data extracted from a URL')
    .option('-c, --clipboard', 'read the URL from the clipboard')
    .option('--no-clipboard', 'block all clipboard interaction')
    .option('--from-clipboard', 'read the URL from the clipboard, added for consistency with generate action')
    .option('--no-from-clipboard', 'block all reading from the clipboard, added for consistency with generate action')
    .option('-e, --echo-clipboard', 'echo information about clipboard interactions to STDOUT')
    .option('-t --template <name>', 'the name of a template that defines a extra field extractor to see extra fields')
    .argument('<url>', 'the URL to preview the page data from, can also be read from the clipboard with the appropriate flags, or piped to to the command');
pageDataPreview.hook('preAction', loadConfigHook); // load the config for this command
pageDataPreview.action(async (u, o) => {
    //
    // --- gather the needed information ---
    //

    // merge and resolve options
    const opts = mergeOptions(o); 

    // resolve the URL
    const url = await resolveURL(opts, u);

    //
    // --- resolve the template ---
    //

    // resolve the explicit template (if any)
    let template = resolveExplicitTemplate(opts); // could be null

    // if not explicit template was found, get the default for the URL's domain
    if(!template){
        const uri = new URI(url);
        template = CONFIG.linkifier.getTemplateForDomain(uri.hostname());
    }

    //
    // --- fetch and output the page data ---
    //

    // try fetch the page data
    const pageData = await CONFIG.linkifier.fetchPageData(url, template.fieldExtractor);

    // render the page data
    console.log(JSON.stringify(pageData.asPlainObject(), null, 2));
});

/**
 * The commander object representing the link generation sub-command.
 * @type {module:commander.Command}
 */
const generate = cli.command('generate-link')
    .alias('generate')
    .summary('generate a link from a URL')
    .option('--from-clipboard', 'read the URL from the clipboard')
    .option('--no-from-clipboard', 'block all reading from the clipboard')
    .option('--to-clipboard', 'write the link to the clipboard')
    .option('--no-to-clipboard', 'block writting to the clipboard')
    .option('-c, --clipboard', 'read the URL from the clipboard and write the link to the clipboard')
    .option('--no-clipboard', 'block all clipboard interaction')
    .option('-e, --echo-clipboard', 'echo information about clipboard interactions to STDOUT')
    .option('-t --template <name>', 'the name of the template to use to render the link')
    .argument('[url]', 'the URL to generate a link for, can also be read from the clipboard with the appropriate flags, or piped to to the command');
generate.hook('preAction', loadConfigHook); // load the config for this command
generate.action(async (u, o) => {
    //
    // --- gather the needed information ---
    //

    // merge and resolve options
    const opts = mergeOptions(o); 

    // resolve the URL
    const url = await resolveURL(opts, u);

    // resolve the explicit template (if any)
    const tpl = resolveExplicitTemplate(opts); // could be null

    //
    // --- generate and output the link ---
    //

    // generate the link
    const link = await CONFIG.linkifier.generateLink(url, tpl);

    // output the link
    if(opts.clipboard || opts.toClipboard){
        await clipboard.write(link);
        if(opts.echoClipboard){
            utilities.info(`link written to clipboard:\n${grey(link)}`);
        }
    } else {
        console.log(link);
    }
});

// execute the CLI
try {
    cli.parse(process.argv);
} catch (err) {
    utilities.fatal(err.message);
}