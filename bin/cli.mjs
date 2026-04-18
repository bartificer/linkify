#!/usr/bin/env node

// import Commander.js
import { program } from 'commander';

// set up the CLI's basics
program
    .name('linkify')
    .version('0.0.1');

// add a command to generate a link
const generate = program.command('generate');
generate.action(() => {
    console.log('Hello World!');
});

// execute the CLI
program.parse();