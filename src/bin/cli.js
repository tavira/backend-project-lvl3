#!/usr/bin/env node
import program from 'commander';

import downloadPageWithResources from '..';

const description = 'This program downloads page from the specified URL';

program
  .description(description)
  .option('--output <value>', 'destination folder')
  .arguments('<url>')
  .action(url => downloadPageWithResources(url, program.output)
    .then(() => 'Page downloaded')
    .catch(e => console.error(e)));

program.parse(process.argv);
