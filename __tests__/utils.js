import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const getTmpFolderPath = async () => fs.mkdtemp(path.join(os.tmpdir(), '/'));

const getFixtureFilename = pathFromFixtureFolder => path.resolve(__dirname, '..', '__fixtures__', pathFromFixtureFolder);

export { getTmpFolderPath, getFixtureFilename };
