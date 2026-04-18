#!/usr/bin/env node

// import Commander.js
import { program } from 'commander';
import { linkify } from '@bartificer/linkify' // resolves because it matches the package name in ../package.json

// set up the CLI's basics
program
    .name('linkify')
    .version('0.0.1');

// add a command to generate a link
const generate = program.command('generate');
generate.action(async () => {
    console.log(await linkify.generateLink('https://www.lets-talk.ie/'));
});

// execute the CLI
program.parse();