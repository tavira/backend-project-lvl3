import { promises as fs } from 'fs';
import path from 'path';
import nock from 'nock';

import downloadPage from '../src/index';
import { getTmpFolderPath, getFixture } from './utils';

nock.disableNetConnect();

describe('download a page with a different URL resources', () => {
  const baseURL = /a.com/;
  const getFixturePathname = getFixture('pageWithResources/');
  const resourcesDir = 'a-com-index-html_files';

  let tmpFolder;

  let expectedPageContent;
  let expectedRelativeNonNestedResourceContent;
  let expectedRelativeNestedResourceContent;
  let expectedRootResourceContent;
  let expectedRootNestedResourceContent;
  let expectedProtocolRelativeResourceContent;
  let expectedAbsoluteNonNestedResourceContent;
  let expectedAbsoluteNestedResourceContent;
  let expectedRelativeImgResourceContent;
  let expectedAbsoluteLinkResourceContent;

  beforeAll(async () => {
    tmpFolder = await getTmpFolderPath();

    const givenPageName = 'index.html';
    const givenPagePathname = getFixturePathname(givenPageName);
    const givenPageContent = await fs.readFile(givenPagePathname, 'utf-8');

    const expectedPagePathname = getFixturePathname(
      'indexWithLocalResources.html',
    );
    expectedPageContent = await fs.readFile(expectedPagePathname, 'utf-8');

    const relativeNonNestedResourceName = 'resource.js';
    expectedRelativeNonNestedResourceContent = await fs.readFile(
      getFixturePathname(relativeNonNestedResourceName),
      'utf-8',
    );

    const relativeNestedResourceName = 'nested/resource.js';
    expectedRelativeNestedResourceContent = await fs.readFile(
      getFixturePathname(relativeNestedResourceName),
      'utf-8',
    );

    const rootResourceName = 'root.resource.js';
    expectedRootResourceContent = await fs.readFile(
      getFixturePathname(rootResourceName),
      'utf-8',
    );

    const rootNestedResourceName = 'one/two/root-nested.js';
    expectedRootNestedResourceContent = await fs.readFile(
      getFixturePathname(rootNestedResourceName),
      'utf-8',
    );

    const protocolRelativeResourceName = 'one/two/protocolRelative.js';
    expectedProtocolRelativeResourceContent = await fs.readFile(
      getFixturePathname(protocolRelativeResourceName),
      'utf-8',
    );

    const absoluteNonNestedResourceName = 'non_nested_absolute.js';
    expectedAbsoluteNonNestedResourceContent = await fs.readFile(
      getFixturePathname(absoluteNonNestedResourceName),
      'utf-8',
    );

    const absoluteNestedResourceName = 'nested/absolute_resource.js';
    expectedAbsoluteNestedResourceContent = await fs.readFile(
      getFixturePathname(absoluteNestedResourceName),
      'utf-8',
    );

    const relativeImgResourceName = 'resource.jpg';
    expectedRelativeImgResourceContent = await fs.readFile(
      getFixturePathname(relativeImgResourceName),
    );

    const absoluteLinkResourceName = 'resource.css';
    expectedAbsoluteLinkResourceContent = await fs.readFile(
      getFixturePathname(absoluteLinkResourceName),
      'utf-8',
    );

    nock(baseURL)
      .persist()
      .get('/index.html')
      .reply(200, givenPageContent)
      .get(`/${relativeNonNestedResourceName}`)
      .reply(200, expectedRelativeNonNestedResourceContent)
      .get(`/${relativeNestedResourceName}`)
      .reply(200, expectedRelativeNestedResourceContent)
      .get(`/${rootResourceName}`)
      .reply(200, expectedRootResourceContent)
      .get(`/${protocolRelativeResourceName}`)
      .reply(200, expectedProtocolRelativeResourceContent)
      .get(`/${rootNestedResourceName}`)
      .reply(200, expectedRootNestedResourceContent)
      .get('/404.js')
      .reply(404, '')
      .get('/500.js')
      .reply(500, '')
      .get(`/${absoluteNonNestedResourceName}`)
      .reply(200, expectedAbsoluteNonNestedResourceContent)
      .get(`/${absoluteNestedResourceName}`)
      .reply(200, expectedAbsoluteNestedResourceContent)
      .get(`/${relativeImgResourceName}`)
      .reply(200, expectedRelativeImgResourceContent)
      .get(`/${absoluteLinkResourceName}`)
      .reply(200, expectedAbsoluteLinkResourceContent);

    await downloadPage('http://a.com/index.html', tmpFolder);
  });

  test('links to same origin are transformed to local links', async () => {
    const actual = await fs.readFile(
      path.resolve(tmpFolder, 'a-com-index-html.html'),
      'utf-8',
    );

    expect(actual).toBe(expectedPageContent);
  });

  test('download file from non-nested relative url', async () => {
    const actual = await fs.readFile(
      path.resolve(tmpFolder, resourcesDir, 'resource.js'),
      'utf-8',
    );

    expect(actual).toBe(expectedRelativeNonNestedResourceContent);
  });

  test('download file from nested relative url', async () => {
    const actual = await fs.readFile(
      path.resolve(tmpFolder, resourcesDir, 'nested-resource.js'),
      'utf-8',
    );

    expect(actual).toBe(expectedRelativeNestedResourceContent);
  });

  test('download file from root relative url', async () => {
    const actual = await fs.readFile(
      path.resolve(tmpFolder, resourcesDir, 'root-resource.js'),
      'utf-8',
    );

    expect(actual).toBe(expectedRootResourceContent);
  });

  test('download file from root nested url', async () => {
    const actual = await fs.readFile(
      path.resolve(tmpFolder, resourcesDir, 'one-two-root-nested.js'),
      'utf-8',
    );

    expect(actual).toBe(expectedRootNestedResourceContent);
  });

  test('download file from protocol relative url', async () => {
    const actual = await fs.readFile(
      path.resolve(tmpFolder, resourcesDir, 'one-two-protocolRelative.js'),
      'utf-8',
    );

    expect(actual).toBe(expectedProtocolRelativeResourceContent);
  });

  test('no download for error resources', async () => {
    const resourcesDirFiles = await fs.readdir(
      path.resolve(tmpFolder, resourcesDir),
    );

    expect(resourcesDirFiles).not.toContain(['404.js', '500.js']);
  });

  test('download file from absolute non nested url', async () => {
    const actual = await fs.readFile(
      path.resolve(tmpFolder, resourcesDir, 'non-nested-absolute.js'),
      'utf-8',
    );

    expect(actual).toBe(expectedAbsoluteNonNestedResourceContent);
  });

  test('download file from absolute nested url', async () => {
    const actual = await fs.readFile(
      path.resolve(tmpFolder, resourcesDir, 'nested-absolute-resource.js'),
      'utf-8',
    );

    expect(actual).toBe(expectedAbsoluteNestedResourceContent);
  });

  test('download img from relative url', async () => {
    const actual = await fs.readFile(
      path.resolve(tmpFolder, resourcesDir, 'resource.jpg'),
    );

    expect(actual).toStrictEqual(expectedRelativeImgResourceContent);
  });

  test('download link resource from absolute url', async () => {
    const actual = await fs.readFile(
      path.resolve(tmpFolder, resourcesDir, 'resource.css'),
      'utf-8',
    );

    expect(actual).toBe(expectedAbsoluteLinkResourceContent);
  });
});

describe('downloading resources from relative backward URLs', () => {
  const baseURL = /a.com/;
  const getFixturePathname = getFixture('pageWithResources/');
  const resourcesDir = 'a-com-one-two-index-html_files';

  let tmpFolder;

  let expectedPageContent;
  let expectedBackwardOneLevelResourceContent;
  let expectedBackwardTwoLevelResourceContent;
  let expectedBackwardSiblingResourceContent;

  beforeAll(async () => {
    tmpFolder = await getTmpFolderPath();

    const givenPageName = 'backwardIndex.html';
    const givenPagePathname = getFixturePathname(givenPageName);
    const givenPageContent = await fs.readFile(givenPagePathname, 'utf-8');

    const expectedPageName = 'backwardIndexWithLocalResources.html';
    const expectedPagePathname = getFixturePathname(expectedPageName);
    expectedPageContent = await fs.readFile(expectedPagePathname, 'utf-8');

    const backwardOneLevelResourceName = 'one/backwardOneLevel.js';
    expectedBackwardOneLevelResourceContent = await fs.readFile(
      getFixturePathname(backwardOneLevelResourceName),
      'utf-8',
    );

    const backwardTwoLevelResourceName = 'backwardTwoLevel.js';
    expectedBackwardTwoLevelResourceContent = await fs.readFile(
      getFixturePathname(backwardTwoLevelResourceName),
      'utf-8',
    );

    const backwardSiblingResourceName = 'nested/backwardSibling.js';
    expectedBackwardSiblingResourceContent = await fs.readFile(
      getFixturePathname(backwardSiblingResourceName),
      'utf-8',
    );

    nock(baseURL)
      .persist()
      .get('/one/two/index.html')
      .reply(200, givenPageContent)
      .get(`/${backwardOneLevelResourceName}`)
      .reply(200, expectedBackwardOneLevelResourceContent)
      .get(`/${backwardTwoLevelResourceName}`)
      .reply(200, expectedBackwardTwoLevelResourceContent)
      .get(`/${backwardSiblingResourceName}`)
      .reply(200, expectedBackwardSiblingResourceContent);

    const givenURL = 'http://a.com/one/two/index.html';

    await downloadPage(givenURL, tmpFolder);
  });

  test('backward relative links are transformed to local links', async () => {
    const actual = await fs.readFile(
      path.resolve(tmpFolder, 'a-com-one-two-index-html.html'),
      'utf-8',
    );

    expect(actual).toBe(expectedPageContent);
  });

  test('download file from one level backward relative url', async () => {
    const actual = await fs.readFile(
      path.resolve(tmpFolder, resourcesDir, 'one-backwardOneLevel.js'),
      'utf-8',
    );

    expect(actual).toBe(expectedBackwardOneLevelResourceContent);
  });

  test('download file from second level backward relative url', async () => {
    const actual = await fs.readFile(
      path.resolve(tmpFolder, resourcesDir, 'backwardTwoLevel.js'),
      'utf-8',
    );

    expect(actual).toBe(expectedBackwardTwoLevelResourceContent);
  });
});


describe('other stuff', () => {
  let baseURL;
  let tmpFolder;
  beforeEach(async () => {
    baseURL = /a.com/;
    tmpFolder = await getTmpFolderPath();
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
      .get(`/${fixtureFilename1}`)
      .reply(200, expectedData1);

    nock('http://localhost')
      .get(`/${fixtureFilename2}/`)
      .reply(200, expectedData2);

    await downloadPage(`http://localhost/${fixtureFilename1}`, tmpFolder);
    const actualData1 = await fs.readFile(
      path.resolve(tmpFolder, 'localhost-single1-html.html'),
      { encoding: 'UTF-8' },
    );
    expect(actualData1).toEqual(expectedData1);

    await downloadPage(`http://localhost/${fixtureFilename2}/`, tmpFolder);
    const actualData2 = await fs.readFile(
      path.resolve(tmpFolder, 'localhost-single2.html'),
      { encoding: 'UTF-8' },
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

    await downloadPage('http://a.com/pageWithoutResources', tmpFolder);
    const actualPageContent = await fs.readFile(
      path.resolve(tmpFolder, 'a-com-pageWithoutResources.html'),
      'utf-8',
    );
    expect(actualPageContent).toEqual(expectedPageContent);

    const files = await fs.readdir(tmpFolder);
    expect(files).not.toContain('a-com-pageWithoutResources_files');
  });

  test('download page from url with long pathname', async () => {
    const getFixturePathname = getFixture('pageWithResources/');

    const givenPageName = 'index.html';
    const givenPagePathname = getFixturePathname(givenPageName);
    const givenPageContent = await fs.readFile(givenPagePathname, 'utf-8');

    nock(baseURL)
      .get('/ru/all/top10')
      .reply(200, givenPageContent);

    await downloadPage('http://a.com/ru/all/top10', tmpFolder);

    const downloadDir = await fs.readdir(tmpFolder);

    expect(downloadDir).toContain('a-com-ru-all-top10.html');
  });
});

describe('error situations', () => {
  const baseURL = /a.com/;

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
});
