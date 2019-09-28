import { promises as fs } from 'fs';
import path from 'path';
import nock from 'nock';

import downloadPage from '../src/index';
import { getTmpFolderPath, getFixtureFilename } from './utils';

let tmpFolder;
beforeEach(async () => {
  tmpFolder = await getTmpFolderPath();
  console.log(`Current tmp directory - ${tmpFolder}`);
});

test('download two different pages to the same folder', async () => {
  const fixtureFilename1 = 'single1.html';
  const fixtureFilename2 = 'single2';
  const expectedData1 = await fs.readFile(getFixtureFilename(fixtureFilename1), 'UTF-8');
  const expectedData2 = await fs.readFile(getFixtureFilename(fixtureFilename2), 'UTF-8');

  nock('http://localhost')
    .get(`/${fixtureFilename1}`)
    .reply(200, expectedData1);

  nock('http://localhost')
    .get(`/${fixtureFilename2}/`)
    .reply(200, expectedData2);

  await downloadPage(`http://localhost/${fixtureFilename1}`, tmpFolder);
  const actualData1 = await fs.readFile(path.resolve(tmpFolder, 'localhost-single1-html.html'), { encoding: 'UTF-8' });
  expect(actualData1).toEqual(expectedData1);

  await downloadPage(`http://localhost/${fixtureFilename2}/`, tmpFolder);
  const actualData2 = await fs.readFile(path.resolve(tmpFolder, 'localhost-single2.html'), { encoding: 'UTF-8' });
  expect(actualData2).toEqual(expectedData2);
});
