import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import nock from 'nock';

import downloadPage from '../src/index';

let tmpFolder;
beforeEach(async () => fs.mkdtemp(path.join(os.tmpdir(), '/'))
  .then((name) => {
    tmpFolder = name;
  })
  .catch((e) => {
    throw new Error(e);
  }));

test('download two different pages to the same folder', async () => {
  const fixtureFilename1 = 'single1.html';
  const fixtureFilename2 = 'single2';
  const expectedData1 = await fs.readFile(path.resolve(__dirname, 'fixtures', fixtureFilename1), 'UTF-8');
  const expectedData2 = await fs.readFile(path.resolve(__dirname, 'fixtures', fixtureFilename2), 'UTF-8');
  nock('http://localhost')
    .get(`/${fixtureFilename1}`)
    .reply(200, expectedData1);

  nock('http://localhost')
    .get(`/${fixtureFilename2}/`)
    .reply(200, expectedData2);

  try {
    await downloadPage(`http://localhost/${fixtureFilename1}`, tmpFolder);
    const actualData1 = await fs.readFile(path.resolve(tmpFolder, 'localhost-single1-html.html'), { encoding: 'UTF-8' });
    expect(actualData1).toEqual(expectedData1);

    await downloadPage(`http://localhost/${fixtureFilename2}/`, tmpFolder);
    const actualData2 = await fs.readFile(path.resolve(tmpFolder, 'localhost-single2.html'), { encoding: 'UTF-8' });
    expect(actualData2).toEqual(expectedData2);
  } catch (e) {
    throw new Error(e);
  }
});
