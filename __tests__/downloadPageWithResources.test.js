import { promises as fs } from 'fs';
import path from 'path';
import nock from 'nock';
import axios from 'axios';

import downloadPage from '../src/index';
import { getTmpFolderPath, getFixture } from './utils';

nock.disableNetConnect();

const baseURL = /a.com/;

let tmpDir;
beforeEach(async () => {
  tmpDir = await getTmpFolderPath();
});

test('download a page with a different URL resources', async () => {
  const getFixturePathname = getFixture('pageWithResources');
  const resourcesDir = 'a-com-one-two-three-index-html_files';

  const actualPageContent = await fs.readFile(
    getFixturePathname('index.html'),
    'utf-8',
  );

  const expectedPageContent = await fs.readFile(
    getFixturePathname('indexWithLocalResources.html'),
    'utf-8',
  );

  const relativeNonNestedResourceName = 'resource.js';
  const expectedRelativeNonNestedResourceContent = await fs.readFile(
    getFixturePathname(relativeNonNestedResourceName),
    'utf-8',
  );

  const relativeNestedResourceName = 'nested/resource.js';
  const expectedRelativeNestedResourceContent = await fs.readFile(
    getFixturePathname(relativeNestedResourceName),
    'utf-8',
  );

  const rootResourceName = 'root.resource.js';
  const expectedRootResourceContent = await fs.readFile(
    getFixturePathname(rootResourceName),
    'utf-8',
  );

  const rootNestedResourceName = 'one/two/root-nested.js';
  const expectedRootNestedResourceContent = await fs.readFile(
    getFixturePathname(rootNestedResourceName),
    'utf-8',
  );

  const protocolRelativeResourceName = 'one/two/protocolRelative.js';
  const expectedProtocolRelativeResourceContent = await fs.readFile(
    getFixturePathname(protocolRelativeResourceName),
    'utf-8',
  );

  const absoluteNonNestedResourceName = 'non_nested_absolute.js';
  const expectedAbsoluteNonNestedResourceContent = await fs.readFile(
    getFixturePathname(absoluteNonNestedResourceName),
    'utf-8',
  );

  const absoluteNestedResourceName = 'nested/absolute_resource.js';
  const expectedAbsoluteNestedResourceContent = await fs.readFile(
    getFixturePathname(absoluteNestedResourceName),
    'utf-8',
  );

  const relativeImgResourceName = 'resource.jpg';
  const expectedRelativeImgResourceContent = await fs.readFile(
    getFixturePathname(relativeImgResourceName),
  );

  const absoluteLinkResourceName = 'resource.css';
  const expectedAbsoluteLinkResourceContent = await fs.readFile(
    getFixturePathname(absoluteLinkResourceName),
    'utf-8',
  );

  const backwardOneLevelResourceName = 'backwardOneLevel.js';
  const expectedBackwardOneLevelResourceContent = await fs.readFile(
    getFixturePathname(backwardOneLevelResourceName),
    'utf-8',
  );

  const backwardTwoLevelResourceName = 'backwardTwoLevel.js';
  const expectedBackwardTwoLevelResourceContent = await fs.readFile(
    getFixturePathname(backwardTwoLevelResourceName),
    'utf-8',
  );

  const backwardSiblingResourceName = 'nested/backwardSibling.js';
  const expectedBackwardSiblingResourceContent = await fs.readFile(
    getFixturePathname(backwardSiblingResourceName),
    'utf-8',
  );

  nock(baseURL)
    .persist()
    .get('/one/two/three/index.html')
    .reply(200, actualPageContent)
    .get(`/one/two/three/${relativeNonNestedResourceName}`)
    .reply(200, expectedRelativeNonNestedResourceContent)
    .get(`/one/two/three/${relativeNestedResourceName}`)
    .reply(200, expectedRelativeNestedResourceContent)
    .get(`/${rootResourceName}`)
    .reply(200, expectedRootResourceContent)
    .get(`/${protocolRelativeResourceName}`)
    .reply(200, expectedProtocolRelativeResourceContent)
    .get(`/${rootNestedResourceName}`)
    .reply(200, expectedRootNestedResourceContent)
    .get('/one/two/three/404.js')
    .reply(404, '')
    .get('/one/two/three/500.js')
    .reply(500, '')
    .get(`/${absoluteNonNestedResourceName}`)
    .reply(200, expectedAbsoluteNonNestedResourceContent)
    .get(`/${absoluteNestedResourceName}`)
    .reply(200, expectedAbsoluteNestedResourceContent)
    .get(`/one/two/three/${relativeImgResourceName}`)
    .reply(200, expectedRelativeImgResourceContent)
    .get(`/${absoluteLinkResourceName}`)
    .reply(200, expectedAbsoluteLinkResourceContent)
    .get(`/one/two/${backwardOneLevelResourceName}`)
    .reply(200, expectedBackwardOneLevelResourceContent)
    .get(`/one/${backwardTwoLevelResourceName}`)
    .reply(200, expectedBackwardTwoLevelResourceContent)
    .get(`/one/${backwardSiblingResourceName}`)
    .reply(200, expectedBackwardSiblingResourceContent);

  await downloadPage('http://a.com/one/two/three/index.html', tmpDir);

  const processedPageContent = await fs.readFile(
    path.resolve(tmpDir, 'a-com-one-two-three-index-html.html'),
    'utf-8',
  );
  expect(processedPageContent).toBe(expectedPageContent);

  const actual = await fs.readFile(
    path.resolve(tmpDir, resourcesDir, 'one-two-three-resource.js'),
    'utf-8',
  );
  expect(actual).toBe(expectedRelativeNonNestedResourceContent);

  const actualRelativeNestedResourceContent = await fs.readFile(
    path.resolve(tmpDir, resourcesDir, 'one-two-three-nested-resource.js'),
    'utf-8',
  );
  expect(actualRelativeNestedResourceContent)
    .toBe(expectedRelativeNestedResourceContent);

  const actualRootResourceContent = await fs.readFile(
    path.resolve(tmpDir, resourcesDir, 'root-resource.js'),
    'utf-8',
  );
  expect(actualRootResourceContent).toBe(expectedRootResourceContent);

  const actualRootNestedResourceContent = await fs.readFile(
    path.resolve(tmpDir, resourcesDir, 'one-two-root-nested.js'),
    'utf-8',
  );
  expect(actualRootNestedResourceContent)
    .toBe(expectedRootNestedResourceContent);

  const actualProtocolRelativeResourceContent = await fs.readFile(
    path.resolve(tmpDir, resourcesDir, 'one-two-protocolRelative.js'),
    'utf-8',
  );
  expect(actualProtocolRelativeResourceContent)
    .toBe(expectedProtocolRelativeResourceContent);

  const resourcesDirFiles = await fs.readdir(
    path.resolve(tmpDir, resourcesDir),
  );
  expect(resourcesDirFiles).not.toContain(
    ['one/two/three/404.js', 'one/two/three/500.js'],
  );

  const actualAbsoluteNonNestedResourceContent = await fs.readFile(
    path.resolve(tmpDir, resourcesDir, 'non-nested-absolute.js'),
    'utf-8',
  );
  expect(actualAbsoluteNonNestedResourceContent)
    .toBe(expectedAbsoluteNonNestedResourceContent);

  const actualAbsoluteNestedResourceContent = await fs.readFile(
    path.resolve(tmpDir, resourcesDir, 'nested-absolute-resource.js'),
    'utf-8',
  );
  expect(actualAbsoluteNestedResourceContent)
    .toBe(expectedAbsoluteNestedResourceContent);

  const actualRelativeImgResourceContent = await fs.readFile(
    path.resolve(tmpDir, resourcesDir, 'one-two-three-resource.jpg'),
  );
  expect(actualRelativeImgResourceContent)
    .toStrictEqual(expectedRelativeImgResourceContent);

  const actualAbsoluteLinkResourceContent = await fs.readFile(
    path.resolve(tmpDir, resourcesDir, 'resource.css'),
    'utf-8',
  );
  expect(actualAbsoluteLinkResourceContent)
    .toBe(expectedAbsoluteLinkResourceContent);

  const actualBackwardOneLevelResourceContent = await fs.readFile(
    path.resolve(tmpDir, resourcesDir, 'one-two-backwardOneLevel.js'),
    'utf-8',
  );
  expect(actualBackwardOneLevelResourceContent)
    .toBe(expectedBackwardOneLevelResourceContent);

  const actualBackwardTwoLevelResourceContent = await fs.readFile(
    path.resolve(tmpDir, resourcesDir, 'one-backwardTwoLevel.js'),
    'utf-8',
  );
  expect(actualBackwardTwoLevelResourceContent)
    .toBe(expectedBackwardTwoLevelResourceContent);

  const actualBackwardSiblingResourceContent = await fs.readFile(
    path.resolve(tmpDir, resourcesDir, 'one-nested-backwardSibling.js'),
    'utf-8',
  );
  expect(actualBackwardSiblingResourceContent)
    .toBe(expectedBackwardSiblingResourceContent);
});

test('download two different pages to the same folder', async () => {
  const getFixturePathname = getFixture('.');
  const fixtureFilename1 = 'single1.html';
  const fixtureFilename2 = 'single2';
  const expectedData1 = await fs.readFile(
    getFixturePathname(fixtureFilename1),
    'UTF-8',
  );
  const expectedData2 = await fs.readFile(
    getFixturePathname(fixtureFilename2),
    'UTF-8',
  );

  nock('http://localhost')
    .persist()
    .get(`/${fixtureFilename1}`)
    .reply(200, expectedData1)
    .get(`/${fixtureFilename2}`)
    .reply(200, expectedData2);

  await downloadPage(`http://localhost/${fixtureFilename1}`, tmpDir);
  await downloadPage(`http://localhost/${fixtureFilename2}`, tmpDir);
  const actualData1 = await fs.readFile(
    path.resolve(tmpDir, 'localhost-single1-html.html'),
    'utf-8',
  );
  expect(actualData1).toEqual(expectedData1);

  const actualData2 = await fs.readFile(
    path.resolve(tmpDir, 'localhost-single2.html'), 'UTF-8',
  );
  expect(actualData2).toEqual(expectedData2);
});

test('download page without resources', async () => {
  const getFixturePathname = getFixture('.');

  const expectedPageContent = await fs.readFile(
    getFixturePathname('pageWithoutResources.html'),
    'utf-8',
  );

  nock(baseURL)
    .get('/pageWithoutResources')
    .reply(200, expectedPageContent);

  await downloadPage('http://a.com/pageWithoutResources', tmpDir);
  const actualPageContent = await fs.readFile(
    path.resolve(tmpDir, 'a-com-pageWithoutResources.html'),
    'utf-8',
  );
  expect(actualPageContent).toEqual(expectedPageContent);

  const files = await fs.readdir(tmpDir);
  expect(files).not.toContain('a-com-pageWithoutResources_files');
});

test('download page from url without pathname', async () => {
  const getFixturePathname = getFixture('pageWithResources/');

  const givenPageName = 'index.html';
  const givenPagePathname = getFixturePathname(givenPageName);
  const givenPageContent = await fs.readFile(givenPagePathname, 'utf-8');

  nock(baseURL)
    .get('/')
    .reply(200, givenPageContent);

  await downloadPage('http://a.com', tmpDir);

  const downloadDir = await fs.readdir(tmpDir);
  console.log(downloadDir);

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

test('download the same page into a folder', async () => {
  const getFixturePathname = getFixture('pageWithResources');
  const expectedData = await fs.readFile(
    getFixturePathname('index.html'), 'utf-8',
  );

  nock(baseURL)
    .persist()
    .get('/')
    .reply(200, expectedData);

  await downloadPage('http://a.com', tmpDir);

  await expect(downloadPage('http://a.com', tmpDir))
    .rejects.toThrowErrorMatchingSnapshot();

  nock.cleanAll();
});

test('download invalid URL', async () => {
  const url = 'http://non-existing.com';
  const e = new Error();
  e.message = 'URL is not found';
  e.code = 'ENOTFOUND';
  e.config = { url };

  nock(url)
    .get('/')
    .replyWithError(e);

  await expect(downloadPage('http://non-existing.com', tmpDir))
    .rejects.toThrowErrorMatchingSnapshot();
});

test('reset download page by timeout', async () => {
  const client = axios.create({ timeout: 1000 });
  nock(baseURL)
    .get('/')
    .delay(1100)
    .reply(200, 'ok');

  await expect(downloadPage('http://a.com', tmpDir, client))
    .rejects.toThrowErrorMatchingSnapshot();
});

test('page downloading failed (404)', async () => {
  nock(baseURL)
    .get('/')
    .reply(404);

  await expect(downloadPage('http://a.com', tmpDir))
    .rejects.toThrowErrorMatchingSnapshot();
});
