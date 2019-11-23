import { promises as fs } from 'fs';
import path from 'path';
import nock from 'nock';

import downloadPage from '../src/index';
import { getTmpFolderPath, getFixture } from './utils';

nock.disableNetConnect();

const baseURL = /a.com/;

let tmpDir;
beforeEach(async () => {
  tmpDir = await getTmpFolderPath();
  nock.cleanAll();
});

test('download a page with a different URL resources', async () => {
  const getFixturePathname = getFixture('pageWithResources');
  const resourcesDir = 'a-com-one-two-three-index-html_files';

  const expectedPageContent = await fs.readFile(
    getFixturePathname('indexWithLocalResources.html'), 'utf-8',
  );

  const expectedScriptContent = await fs.readFile(
    getFixturePathname('one/two/three/resource.js'), 'utf-8',
  );

  const expectedLinkContent = await fs.readFile(
    getFixturePathname('resource.css'), 'utf8',
  );

  const expectedImgContent = await fs.readFile(
    getFixturePathname('one/two/three/resource.jpg'), 'utf-8',
  );

  const scope = nock(baseURL);

  const resources = [
    'one/two/three/index.html',
    'one/two/three/resource.js',
    'one/two/three/nested/resource.js',
    'root.resource.js',
    'one/two/protocolRelative.js',
    'non_nested_absolute.js',
    'nested/absolute_resource.js',
    'one/two/three/resource.jpg',
    'resource.css',
    'one/two/backwardOneLevel.js',
    'one/backwardTwoLevel.js',
    'one/nested/backwardSibling.js',
  ];

  await Promise.all(resources.map(async (resource) => {
    const content = await fs.readFile(getFixturePathname(resource), 'utf-8');
    scope.get(`/${resource}`).reply(200, content);
  }));

  await downloadPage('http://a.com/one/two/three/index.html', tmpDir);

  const processedPageContent = await fs.readFile(
    path.resolve(tmpDir, 'a-com-one-two-three-index-html.html'),
    'utf-8',
  );
  expect(processedPageContent).toBe(expectedPageContent);

  const actualScriptContent = await fs.readFile(
    path.resolve(tmpDir, resourcesDir, 'one-two-three-resource.js'), 'utf8',
  );
  expect(actualScriptContent).toBe(expectedScriptContent);

  const actualLinkContent = await fs.readFile(
    path.resolve(tmpDir, resourcesDir, 'resource.css'), 'utf8',
  );
  expect(actualLinkContent).toBe(expectedLinkContent);

  const actualImgContent = await fs.readFile(
    path.resolve(tmpDir, resourcesDir, 'one-two-three-resource.jpg'), 'utf8',
  );
  expect(actualImgContent).toBe(expectedImgContent);
});

test('download page from url without pathname', async () => {
  const getFixturePathname = getFixture('pageWithResources/');
  const givenPageName = 'one/two/three/index.html';
  const givenPagePathname = getFixturePathname(givenPageName);
  const givenPageContent = await fs.readFile(givenPagePathname, 'utf-8');
  nock(baseURL)
    .get('/')
    .reply(200, givenPageContent);

  await downloadPage('http://a.com', tmpDir);

  const downloadDir = await fs.readdir(tmpDir);

  expect(downloadDir).toContain('a-com.html');
});

test('save page to unexistent directory', async () => {
  const dir = '/unexisted_directory';
  nock(baseURL)
    .get('/')
    .reply(200, '');

  await expect(downloadPage('http://a.com', dir))
    .rejects.toThrowErrorMatchingSnapshot();
});

test('save page to forbidden directory', async () => {
  const dir = '/';
  nock(baseURL)
    .get('/')
    .reply(200, '');

  await expect(downloadPage('http://a.com', dir))
    .rejects.toThrowErrorMatchingSnapshot();
});

test('page downloading failed (404)', async () => {
  nock(baseURL)
    .get('/')
    .reply(404);

  await expect(downloadPage('http://a.com', tmpDir))
    .rejects.toThrowErrorMatchingSnapshot();
});

test('resource downloading errors do not create local files', async () => {
  const getFixturePathname = getFixture('pageWithResources');
  const resourcesDir = 'a-com-one-two-three-index-html_files';

  const pageContent = await fs.readFile(
    path.resolve(getFixturePathname('one/two/three/index.html')), 'utf8',
  );

  nock(baseURL)
    .get('/one/two/three/index.html')
    .reply(200, pageContent)
    .get('/one/two/three/resource.js')
    .reply(200, 'OK')
    .get('/one/two/three/404.js')
    .reply(404, '404 error')
    .get('/one/two/three/500.js')
    .reply(500, '500 error');

  await downloadPage('http://a.com/one/two/three/index.html', tmpDir);

  const resourcesDirContent = await fs.readdir(
    path.resolve(tmpDir, resourcesDir),
  );

  expect(resourcesDirContent).not.toContain('one-two-three-404.js');
  expect(resourcesDirContent).not.toContain('one-two-three-500.js');
});
