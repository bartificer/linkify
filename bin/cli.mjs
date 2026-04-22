#!/usr/bin/env node

/**
 * @file The code for the command-line interface.
 * @author Bart Busschots <opensource@bartificer.ie>
 * @license MIT
 */

/**
 * A commandline inteface (CLI) published as `linkify`.
 * 
 * The CLI can be customised with a module that exports a configured `Linkifier` object as it's default export.
 * @module cli
 * @requires node:os
 * @requires node:path
 * @requires node:fs/promise
 * @requires module:clipboardy
 * @requires module:commander
 * @requires module:kleur
 * @requires module:linkifier.Linkifier
 */

//
// === Imports ===
//

// --- Static Imports ---

// import standatd NodeJS modules
import os  from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

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

// --- Conditional Dynamic Imports ---

/**
 * The file name to to try read the config from in the user's home directory.
 * @private
 * @type {string}
 */
const CONFIG_FILE_NAME = `.linkify-config.mjs`;

/**
 * The loaded config.
 * @private
 * @type {cliConfigurationObject}
 */
let CONFIG = null;

/**
 * A function to try import a customised Linkfifier object and/or CLI options from a configuration module.
 * 
 * If the path is empty, tries to import from a file named `.linkify-config.mjs` in the user's home directory.
 * 
 * Paths are coerced to strings with `String()` and resolved relative to the user's shell's current working directory.
 * @param {string} [configPath] — an optional path to import the configuration from.
 * @returns {cliConfigurationObject} if no path is passed, and there is no module in the default location, an empty object will be returned.
 * @throws {TypeError} A TypeError is thrown if the loaded module contains a key named `linfifier` that is not an instance of the `Linkifier` class, or, a key named `options` that is not an object.
 * @throws {Error} An Error is thrown if a path is passed but a module can't be imported from it.
 * @private
 */
async function importConfig(configPath = ''){
    // determine the file path to try load from
    configPath = String(configPath); // coerce the path to a string
    const fallingBackToDefault = configPath === '';
    if(fallingBackToDefault){
        // build the default path
        configPath = path.join(os.homedir(), CONFIG_FILE_NAME);
        debug(`no config path specified, falling back to standard: ${configPath}`);
    } else {
        // resolve the passed path so it is relative to the user's current working directory in the shell
        configPath = path.resolve(configPath);
    }

    // make sure the path exists
    try{
        debug(`checking read access to configuartion module path: ${configPath}`);
        await fs.access(configPath, fs.constants.R_OK);
    } catch (err){
        // only we're only trying as a fallback, don't throw an error, just return an empty object
        if(fallingBackToDefault){
            debug('failed read configuration module, returning default Linkifier and empty option list');
            return {
                linkifier: new Linkifier(),
                options: {}
            };
        }

        // a specific path was passed but it does not exist, throw an error
        throw new Error('Configuration module not readable', { cause: err });
    }

    // try load the config
    let rawConfig = null;
    try {
        debug(`attempting to import configuration module from: ${configPath}`);
        rawConfig = (await import(configPath)).default;
        debug(`${green('OK')} — config imported`);
    } catch (err) {
        debug(`${red('FAILED')} with error: ${err.message}`);
        throw new Error('Failed to import configuration module', { cause: err });
    }

    // extract and verify the expected information
    const config = {
        linkifier: null,
        options: {}
    };
    if(rawConfig.hasOwnProperty('linkifier')){
        if(rawConfig.linkifier instanceof Linkifier){
            config.linkifier = rawConfig.linkifier;
        } else {
            throw new TypeError("Config key 'linkifier' must be an instance of the Linkifier class");
        }
    } else {
        config.linkifier = new Linkifier();
    }
    if(rawConfig.hasOwnProperty('options')){
        config.options = { ...rawConfig.options };
    }

    // return the imported configuration
    return config;
}

//
// === CLI Helper Functions
//

/**
 * Write debug messages.
 * @param {string|*} msg - the primary message, passed to `console.debug` as the first argument.
 * @param {...*} extraArgs - additional arguments are passed through to `console.debug`.
 */
function debug(msg, ...extraArgs){
    // unless debug mode is enabled, just return
    if(!(cli && cli.opts().debug)) return;

    // if the first argument is a string, format it
    if(typeof msg == 'string'){
        msg = grey(`${bold('DEBUG:')} ${msg}`);
    }

    // pass the arguments through to console.debug
    console.debug(msg, ...extraArgs);
}

/**
 * Write optional informational messages.
 * @param {string|*} msg - the primary message, passed to `console.log` as the first argument.
 * @param {...*} extraArgs - additional arguments are passed through to `console.log`.
 */
function info(msg, ...extraArgs){
    // if the first argument is a string, format it
    if(typeof msg == 'string'){
        msg = `${blue().bold('INFO:')} ${msg}`;
    }

    // pass the arguments through to console.debug
    console.debug(msg, ...extraArgs);
}

/**
 * Exit with fatal error.
 * @param {string|*} msg - the primary message, passed to `console.error` as the first argument.
 * @param {...*} extraArgs - additional arguments are passed through to `console.error`.
 */
function fatal(msg, ...extraArgs){
    // if the first argument is a string, format it
    if(typeof msg == 'string'){
        msg = red(`${bold('FATAL:')} ${msg}`);
    }

    // pass the arguments through to console.error, then kill the process
    console.error(msg, ...extraArgs);
    process.exit(1);
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
    .option('-C, --config <path>', `path to config file (default: ~/${CONFIG_FILE_NAME})`)
    .option('-d, --debug', 'enable debug mode');

/**
 * A re-usable hook for loading the config into the `CONFIG` variable.
 * @private
 * @function
 * @param {module:commander.Command} cmd - the command loading the config.
 */
const loadConfigHook = async (cmd) => {
    // capture the passed config path, if any
    const configPath = cli.opts().config || '';

    // try import a config
    try {
        CONFIG = await importConfig(configPath);
    } catch (err) {
        fatal(err.message);
    }
};

/**
 * The commander object representing the sub-command for showing the defaults.
 * @private
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
 * @private
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
 * @private
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
            info(`URL read from clipboard:\n${grey(url)}`);
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
        fatal('no URL passed');
    }

    // validate the URL for cleaner error messages (rather than letting the module get cranky)
    if(!CONFIG.linkifier.util.isURL(url)){
        fatal(`invalid URL:\n${grey(url)}`);
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
            fatal(`undefined template: ${grey(opts.template)}'\n${bold().grey('Available Templates:')} ${grey(JSON.stringify(CONFIG.linkifier.templateNames))}`);
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
            info(`link written to clipboard:\n${grey(link)}`);
        }
    } else {
        console.log(link);
    }
});

// execute the CLI
try {
    cli.parse(process.argv);
} catch (err) {
    fatal(err.message);
}