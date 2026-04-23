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
 * @module cli
 * @requires module:clipboardy
 * @requires module:commander
 * @requires module:kleur
 * @requires module:utilities
 * @requires module:linkifier.Linkifier
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

// import the clipboard support
import clipboard from 'clipboardy';

// import the required linkifier classes — resolves because the name here matches the package name in ../package.json
import { Linkifier } from '@bartificer/linkify'
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
 * Conditionally write debug messages to STDOUT.
 * 
 * This is a small wrapper around the `utilities.debug()` function.
 * @param {string|*} msg - the primary message, passed to `console.debug` as the first argument.
 * @param {...*} extraArgs - additional arguments are passed through to `console.debug`.
 * @see {@link module:utilities.debug}
 */
export function debug(msg, ...extraArgs){
    // unless debug mode is enabled, just return
    if(!(cli && cli.opts().debug)) return;

    // otherwise pass through to the main debug function
    utilities.debug(msg, ...extraArgs);
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
    .version('0.0.1')
    .description('Convert URLs to rich links in any format based on the page contents.')
    .option('-C, --config <path>', `path to config file (default: ~/${Linkifier.defaults.configFilename})`)
    .option('-d, --debug', 'enable debug mode');

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
    // --- merge and resolve options --
    //

    // start with any options from a loaded config module (could be an empty object)
    const opts = {...CONFIG.options};
    debug(`Options loaded from config:\n${JSON.stringify(opts, null, 2)}`);

    // merge in the cli options
    debug(`CLI Options: (take precedence)\n${JSON.stringify(o, null, 2)}`);
    for(const [name, value] of Object.entries(o)){
        opts[name] = value;
    }

    // Rationalise Clipboard options — later, only check the explicit to and from options!
    // Apply two-level precdence logic:
    // 1. do not override precedence of CLI flags over config options
    // 2. clipboard blocks have a higher precedence than individual clipboard requests (--no-clipboard > --to-clipboard etc.)
    if(opts.hasOwnProperty('clipboard')){ // an explicit value was set
        if(opts.clipboard){ // a truthy value was set
            // a truthy value was set, propagate each interaction unless explicitly blocked
            if(opts.hasOwnProperty('fromClipboard') && !opts.fromClipboard){
                debug('options --clipboard & --no-from-clipboard both set, --no-from-clipboard not overriden');
            } else {
                opts.fromClipboard = true;
                debug('option --clipboard set, and no --no-from-clipboard, therefore set --from-clipboard');
            }
            if(opts.hasOwnProperty('toClipboard') && !opts.toClipboard){
                debug('options --clipboard & --no-to-clipboard both set, --no-to-clipboard not overriden');
            } else {
                opts.toClipboard = true;
                debug('option --clipboard set, and no --no-to-clipboard, therefore set --to-clipboard');
            }
        } else {
            // a falsy value was set — block all clipboard interaction
            opts.fromClipboard = false;
            opts.toClipboard = false;
            debug('option --no-clipboard set, therefore set --no-to-clipboard & --no-from-clipboard');
        }
    }

    // debug the final merged options
    debug(`Merged options:\n${JSON.stringify(opts, null, 2)}`);

    //
    // --- resolve the URL ---
    // 
    // Use the following order of precedence:
    // 1. Read from the clipboard if an appropriate option was passed
    // 2. read from the argument, if passed
    // 3. try read from the input pipe
    // 4. throw an error

    // default to an empty URL
    let url = '';

    // apply the above precedence rules
    if(opts.clipboard || opts.fromClipboard){
        url = await clipboard.read();
        if(opts.echoClipboard){
            utilities.info(`URL read from clipboard:\n${grey(url)}`);
        }
    } else if(u) {
        url = u;
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

    //
    // --- resolve the explicit template (if any) ---
    //

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
        debug('no explicit template passed, the default will be used (potentially overriden on specific URL domains)');
    }

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