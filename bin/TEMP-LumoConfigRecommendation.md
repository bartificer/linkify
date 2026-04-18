Here is the concise summary and the complete code pattern for lazy-loading config only for specific commands:

# 📋 Key Takeaways

Avoid Global Hooks: Do not use program.hook('preAction') if you want to skip config loading for commands like --help or init.
Scope the Hook: Attach the preAction hook only to the specific subcommands that need the config (e.g., .command('process').hook(...)).
Dynamic Import: Use await import(path) inside the hook to load the .mjs file only when that specific command runs.
Context Passing: Store the loaded config on the command instance (thisCommand.config) so the .action() handler can access it.


# 💻 Code Pattern

```javascript
// bin/cli.js
import { program } from 'commander';
import { loadConfig } from './lib/config-loader.js'; // Your helper function

program
  .name('linkify')
  .version('1.0.0')
  .option('-c, --config <path>', 'Path to config file (default: ~/.linkify-config.mjs)');

// ✅ Command WITHOUT config (Fast startup, no file I/O)
program
  .command('init')
  .description('Initialize project (no config needed)')
  .action(() => {
    console.log('Init logic...');
  });

// ✅ Command WITH config (Lazy loaded only when run)
program
  .command('process')
  .description('Process files (requires config)')
  .hook('preAction', async (thisCommand) => {
    const configPath = thisCommand.opts().config || '~/.linkify-config.mjs';
    
    try {
      const config = await loadConfig(configPath);
      thisCommand.config = config; // Attach to command instance
      
      if (!config) console.warn('No config found, using defaults.');
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
  })
  .action(async (options, cmd) => {
    const config = cmd.config; // Access loaded config
    // ... your processing logic using config
  });

program.parse();
```

You can copy this block directly into your project structure. Let me know if you need the loadConfig helper function code as well!