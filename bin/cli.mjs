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

// import the Linkifier class — resolves because the name here matches the package name in ../package.json
import { Linkifier } from '@bartificer/linkify'

// --- Conditional Dynamic Imports ---

/**
 * The file name to to try read the config from in the user's home directory.
 * @private
 * @type {string}
 */
const CONFIG_FILE_NAME = `.linkify-config.mjs`;

/**
 * A function to try import a customised Linkfifier object and/or CLI options from a configuration module. The module should
 * export a single object by default. The exported object should define one or both of the keys `linkifier` or `options`.
 * `linkifier` should be an instance of the `Linkifier` class, and `options` an object.
 * 
 * If no path is passed, will try import from a file named `.linkify-config.mjs` in the user's home directory.
 * 
 * If a path is passed, it will be coerced to a string with `String()`.
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
        configPath = path.join(os.homedir(), CONFIG_FILE_NAME);
        console.debug(`no config path specified, falling back to standard: ${configPath}`);
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
 * The loaded config.
 * @private
 * @type {cliConfigurationObject}
 */
let CONFIG = null;

/**
 * The commander object representing the CLI itself.
 * @type {module:commander.Command}
 */
const cli = new Command()
    .name('linkify')
    .version('0.0.1')
    .option('-c, --config <path>', `Path to config file (default: ~/${CONFIG_FILE_NAME})`);

/**
 * The commander object representing the link generation sub-command.
 * @type {module:commander.Command}
 */
const generate = cli.command('generate');
generate.hook('preAction', async (cmd) => {
    // capture the passed config path, if any
    const configPath = cli.opts().config || '';

    // try import a config
    try {
        CONFIG = await importConfig(configPath);
    } catch (err) {
      console.error(`FATAL: ${err.message}`);
      process.exit(1);
    }
});
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