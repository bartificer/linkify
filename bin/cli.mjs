#!/usr/bin/env node

/**
 * @file The code for the command-line interface.
 * @author Bart Busschots <opensource@bartificer.ie>
 * @license MIT
 */

/**
 * A commandline inteface (CLI) published as `linkify`.
 * 
 * The CLI can be customised with a module that exports a configuration object as it's default export.
 * @module cli
 * @requires node:os
 * @requires node:path
 * @requires node:fs/promise
 * @requires module:commander
 * @requires linkify
 * @see {@link cliConfigObject} for details the configuration object that can be used to customise the CLI.
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

// import the Linkify — resolves because the name here matches the package name in ../package.json
import { linkify } from '@bartificer/linkify'

// --- Conditional Dynamic Imports ---

/**
 * The file name to to try read the config from in the user's home directory.
 * @private
 * @type {string}
 */
const CONFIG_FILE_NAME = `.linkify-config.mjs`;

/**
 * A function to try load a configuration file. If no path is passed, defaults to `.linkify-config.mjs` in the user's home directory. The value passed will be coerced to a string with `String()`.
 * @param {string} [configPath] — an optional path to load the configuration from.
 * @returns {Object} If no config is found, an empty object is returned.
 * @throws {Error} An Error is thrown if an explicit path is passed and read access is denied, or the file fails to import.
 * @private
 */
async function loadConfig(configPath = ''){
    // determine the file path to try load from
    configPath = String(configPath); // coerce the path to a string
    const fallingBackToDefault = configPath === '' ? false : true;
    if(fallingBackToDefault){
        configPath = path.join(os.homedir(), CONFIG_FILE_NAME);
    }

    // make sure the path exists
    try{
        console.debug(`Checking for readable config file: ${configPath}`);
        await fs.access(configPath, fs.constants.R_OK);
    } catch (err){
        // only we're only trying as a fallback, don't throw an error, just return an empty object
        if(fallingBackToDefault){
            console.debug(`Cannot read config file from standatrd location (using defaults): ${configPath}`);
            return {};
        }

        // a specific path was passed but it does not exist, throw an error
        throw new Error('Config not readable', { cause: err });
    }

    // try load the config
    let config = {};
    try {
        console.debug(`Attempting to load config from: ${configPath}`);
        config = (await import(configPath)).default;
        console.debug('OK — config loaded');
    } catch (err) {
        throw new Error('Failed to load config', { cause: err });
    }

    // return the loaded config
    return config;
}

//
// === Build the CLI ===
//

/**
 * The loaded config.
 * @private
 * @type {cliConfigObject}
 */
let config = {};

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

    // try load a config
    let rawConfig = {};
    try {
        rawConfig = await loadConfig(configPath);
    } catch (err) {
      console.error(`FATAL: ${err.message}`);
      process.exit(1);
    }
});
generate.action(async () => {
    console.log(await linkify.generateLink('https://www.lets-talk.ie/'));
});

// execute the CLI
try {
    cli.parse();
} catch (err) {
    console.error(`FATAL: ${err.message}`);
    process.exit(1);
}