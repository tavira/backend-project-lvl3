#!/usr/bin/env node
import program from 'commander';

import downloadPage from '..';

const description = 'This program downloads page from the specified URL';

program
  .description(description)
  .option('--output <value>', 'destination folder')
  .arguments('<url>')
  .action(url => downloadPage(url, program.output)
    .then(() => console.log('\nPage downloaded'))
    .catch((e) => {
      console.error(e.message);
      process.exit(1);
    }));

program.parse(process.argv);
