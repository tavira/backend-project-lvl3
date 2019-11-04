import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const getTmpFolderPath = async () => fs.mkdtemp(path.join(os.tmpdir(), '/'));

const getFixture = fixtureDir => (
  fixtureFilename => (
    path.resolve(__dirname, '..', '__fixtures__', fixtureDir, fixtureFilename)
  )
);

export { getTmpFolderPath, getFixture };
