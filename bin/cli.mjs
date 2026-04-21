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
const { bold, italic, blue, green, grey } = kleur;

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
        console.debug(`no config path specified, falling back to standard: ${configPath}`);
    } else {
        // resolve the passed path so it is relative to the user's current working directory in the shell
        configPath = path.resolve(configPath);
    }

    // make sure the path exists
    try{
        console.debug(`checking read access to configuartion module path: ${configPath}`);
        await fs.access(configPath, fs.constants.R_OK);
    } catch (err){
        // only we're only trying as a fallback, don't throw an error, just return an empty object
        if(fallingBackToDefault){
            console.debug('failed read configuration module, returning default Linkifier and empty option list');
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
        console.debug(`Attempting to import configuration module from: ${configPath}`);
        rawConfig = (await import(configPath)).default;
        console.debug('OK — config imported');
    } catch (err) {
        console.debug(err);
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
// === Build the CLI ===
//

/**
 * The commander object representing the CLI itself.
 * @type {module:commander.Command}
 */
const cli = new Command()
    .name('linkify')
    .version('0.0.1')
    .option('-c, --config <path>', `Path to config file (default: ~/${CONFIG_FILE_NAME})`);

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
      console.error(`FATAL: ${err.message}`);
      process.exit(1);
    }
};

/**
 * The commander object representing the sub-command for showing the defaults.
 * @private
 * @type {module:commander.Command}
 */
const showDefaults = cli.command('show-defaults').alias('defaults');
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
const showConfig = cli.command('show-config').alias('config');
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
const generate = cli.command('generate');
generate.hook('preAction', loadConfigHook); // load the config for this command
generate.action(async () => {
    console.log(await CONFIG.linkifier.generateLink('https://www.lets-talk.ie/'));
});

// execute the CLI
try {
    cli.parse(process.argv);
} catch (err) {
    console.error(`FATAL: ${err.message}`);
    process.exit(1);
}