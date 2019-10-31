import { promises as fs } from 'fs';
import path from 'path';
import nock from 'nock';

import downloadPage from '../src/index';
import { getTmpFolderPath, getFixtureFilename } from './utils';

let tmpFolder;
beforeEach(async () => {
  nock.disableNetConnect();
  tmpFolder = await getTmpFolderPath();
});

describe('download a page with a different URL resources', () => {
  const baseURL = /a.com/;
  const fixtureDir = 'pageWithResources/';
  const resourcesDir = 'a-com-index-html_files';

  let expectedPageContent;
  let expectedRelativeNonNestedResourceContent;
  let expectedRelativeNestedResourceContent;
  let expectedRootResourceContent;
  let expectedRootNestedResourceContent;
  let expectedProtocolRelativeResourceContent;
  let expectedAbsoluteNonNestedResourceContent;
  let expectedAbsoluteNestedResourceContent;
  let expectedRelativeImgContent;

  beforeEach(async () => {
    const givenPagePathname = getFixtureFilename(`${fixtureDir}/index.html`);
    const givenPageContent = await fs.readFile(givenPagePathname, 'utf-8');

    const expectedPagePathname = getFixtureFilename(
      `${fixtureDir}/indexWithLocalResources.html`,
    );
    expectedPageContent = await fs.readFile(expectedPagePathname, 'utf-8');

    const relativeNonNestedResourceName = '/resource.js';
    expectedRelativeNonNestedResourceContent = await fs.readFile(
      getFixtureFilename(`${fixtureDir}${relativeNonNestedResourceName}`),
      'utf-8',
    );

    const relativeNestedResourceName = '/nested/resource.js';
    expectedRelativeNestedResourceContent = await fs.readFile(
      getFixtureFilename(`${fixtureDir}${relativeNestedResourceName}`), 'utf-8',
    );

    const rootResourceName = '/root.resource.js';
    expectedRootResourceContent = await fs.readFile(
      getFixtureFilename(`${fixtureDir}${rootResourceName}`), 'utf-8',
    );

    const rootNestedResourceName = '/one/two/root-nested.js';
    expectedRootNestedResourceContent = await fs.readFile(
      getFixtureFilename(`${fixtureDir}${rootNestedResourceName}`), 'utf-8',
    );

    const protocolRelativeResourceName = '/one/two/protocolRelative.js';
    expectedProtocolRelativeResourceContent = await fs.readFile(
      getFixtureFilename(`${fixtureDir}${protocolRelativeResourceName}`),
      'utf-8',
    );

    const absoluteNonNestedResourceName = '/non_nested_absolute.js';
    expectedAbsoluteNonNestedResourceContent = await fs.readFile(
      getFixtureFilename(`${fixtureDir}${absoluteNonNestedResourceName}`),
      'utf-8',
    );

    const absoluteNestedResourceName = '/nested/absolute_resource.js';
    expectedAbsoluteNestedResourceContent = await fs.readFile(
      getFixtureFilename(`${fixtureDir}${absoluteNestedResourceName}`),
      'utf-8',
    );

    const relativeImgName = '/resource.img';
    expectedRelativeImgContent = await fs.readFile(
      getFixtureFilename(`${fixtureDir}${relativeImgName}`),
    );

    nock(baseURL)
      .persist()
      .get('/index.html')
      .reply(200, givenPageContent)
      .get('/resource.js')
      .reply(200, expectedRelativeNonNestedResourceContent)
      .get(relativeNestedResourceName)
      .reply(200, expectedRelativeNestedResourceContent)
      .get(rootResourceName)
      .reply(200, expectedRootResourceContent)
      .get(protocolRelativeResourceName)
      .reply(200, expectedProtocolRelativeResourceContent)
      .get(rootNestedResourceName)
      .reply(200, expectedRootNestedResourceContent)
      .get('/404.js')
      .reply(404, '')
      .get('/500.js')
      .reply(500, '')
      .get(absoluteNonNestedResourceName)
      .reply(200, expectedAbsoluteNonNestedResourceContent)
      .get(absoluteNestedResourceName)
      .reply(200, expectedAbsoluteNestedResourceContent)
      .get(relativeImgName)
      .reply(200, 'expectedRelativeImgContent');
  });

  test('links to same origin are transformed to local links', async () => {
    await downloadPage('http://a.com/index.html', tmpFolder);

    const actualMainPageContent = await fs.readFile(
      path.resolve(tmpFolder, 'a-com-index-html.html'), 'utf-8',
    );
    expect(actualMainPageContent).toBe(expectedPageContent);
  });


  test('download file from non-nested relative url', async () => {
    await downloadPage('http://a.com/index.html', tmpFolder);

    const actualRelativeNonNestedResourceContent = await fs.readFile(
      path.resolve(tmpFolder, resourcesDir, 'resource.js'), 'utf-8',
    );
    expect(actualRelativeNonNestedResourceContent)
      .toBe(expectedRelativeNonNestedResourceContent);
  });


  test('download file from nested relative url', async () => {
    await downloadPage('http://a.com/index.html', tmpFolder);

    const actualRelativeNestedResourceContent = await fs.readFile(
      path.resolve(tmpFolder, resourcesDir, 'nested-resource.js'), 'utf-8',
    );
    expect(actualRelativeNestedResourceContent)
      .toBe(expectedRelativeNestedResourceContent);
  });


  test('download file from root relative url', async () => {
    await downloadPage('http://a.com/index.html', tmpFolder);

    const actualRootResourceContent = await fs.readFile(
      path.resolve(tmpFolder, resourcesDir, 'root-resource.js'), 'utf-8',
    );
    expect(actualRootResourceContent).toBe(expectedRootResourceContent);
  });


  test('download file from root nested url', async () => {
    await downloadPage('http://a.com/index.html', tmpFolder);

    const actualRootNestedResourceContent = await fs.readFile(
      path.resolve(tmpFolder, resourcesDir, 'one-two-root-nested.js'), 'utf-8',
    );
    expect(actualRootNestedResourceContent)
      .toBe(expectedRootNestedResourceContent);
  });

  test('download file from protocol relative url', async () => {
    await downloadPage('http://a.com/index.html', tmpFolder);

    const actualProtocolRelativeResourceContent = await fs.readFile(
      path.resolve(tmpFolder, resourcesDir, 'one-two-protocolRelative.js'), 'utf-8',
    );
    expect(actualProtocolRelativeResourceContent)
      .toBe(expectedProtocolRelativeResourceContent);
  });

  test('no download for error resources', async () => {
    await downloadPage('http://a.com/index.html', tmpFolder);

    const resourcesDirFiles = await fs.readdir(path.resolve(tmpFolder, resourcesDir));
    expect(resourcesDirFiles).not.toContain(['404.js', '500.js']);
  });

  test('download file from absolute non nested url', async () => {
    await downloadPage('http://a.com/index.html', tmpFolder);

    const actualAbsoluteNonNestedResourceContent = await fs.readFile(
      path.resolve(tmpFolder, resourcesDir, 'non-nested-absolute.js'), 'utf-8',
    );
    expect(actualAbsoluteNonNestedResourceContent)
      .toBe(expectedAbsoluteNonNestedResourceContent);
  });

  test('download file from absolute nested url', async () => {
    await downloadPage('http://a.com/index.html', tmpFolder);

    const actualAbsoluteNestedResourceContent = await fs.readFile(
      path.resolve(tmpFolder, resourcesDir, 'nested-absolute-resource.js'), 'utf-8',
    );
    expect(actualAbsoluteNestedResourceContent)
      .toBe(expectedAbsoluteNestedResourceContent);
  });

  test.skip('download img from relative url', async () => {
    await downloadPage('http://a.com/index.html', tmpFolder);

    const actualRelativeResourceContent = await fs.readFile(
      path.resolve(tmpFolder, resourcesDir, 'resource.img'), 
    );
    expect(actualRelativeResourceContent).toStrictEqual(expectedRelativeImgContent);
  });
});



test('downloading resources from relative backward URLs', async () => {
  const baseURL = /a.com/;
  const fixtureDir = 'pageWithResources';

  const originalMainPagePathname = getFixtureFilename(`${fixtureDir}/backwardIndex.html`);
  const originalMainPageContent = await fs.readFile(originalMainPagePathname, 'utf-8');

  const expectedMainPagePathname = getFixtureFilename(`${fixtureDir}/backwardIndexWithLocalResources.html`);
  const expectedMainPageContent = await fs.readFile(expectedMainPagePathname, 'utf-8');

  const backwardOneLevelResourceName = '/one/backwardOneLevel.js';
  const expectedBackwardOneLevelResourceContent = await fs.readFile(
    getFixtureFilename(`${fixtureDir}${backwardOneLevelResourceName}`), 'utf-8',
  );

  const backwardTwoLevelResourceName = '/backwardTwoLevel.js';
  const expectedBackwardTwoLevelResourceContent = await fs.readFile(
    getFixtureFilename(`${fixtureDir}${backwardTwoLevelResourceName}`), 'utf-8',
  );

  const backwardSiblingResourceName = '/nested/backwardSibling.js';
  const expectedBackwardSiblingResourceContent = await fs.readFile(
    getFixtureFilename(`${fixtureDir}${backwardSiblingResourceName}`), 'utf-8',
  );

  nock(baseURL)
    .persist()
    .get('/one/two/index.html')
    .reply(200, originalMainPageContent)
    .get(backwardOneLevelResourceName)
    .reply(200, expectedBackwardOneLevelResourceContent)
    .get(backwardTwoLevelResourceName)
    .reply(200, expectedBackwardTwoLevelResourceContent)
    .get(backwardSiblingResourceName)
    .reply(200, expectedBackwardSiblingResourceContent);

  await downloadPage('http://a.com/one/two/index.html', tmpFolder);

  const actualMainPageContent = await fs.readFile(path.resolve(tmpFolder, 'a-com-one-two-index-html.html'), 'utf-8');
  expect(actualMainPageContent).toBe(expectedMainPageContent);

  const resourcesDir = 'a-com-one-two-index-html_files';

  const actualBackwardOneLevelResourceContent = await fs.readFile(path.resolve(tmpFolder, resourcesDir, 'one-backwardOneLevel.js'), 'utf-8');
  expect(actualBackwardOneLevelResourceContent).toBe(expectedBackwardOneLevelResourceContent);

  const actualBackwardTwoLevelResourceContent = await fs.readFile(path.resolve(tmpFolder, resourcesDir, 'backwardTwoLevel.js'), 'utf-8');
  expect(actualBackwardTwoLevelResourceContent).toBe(expectedBackwardTwoLevelResourceContent);

  const actualBackwardSiblingResourceContent = await fs.readFile(path.resolve(tmpFolder, resourcesDir, 'nested-backwardSibling.js'), 'utf-8');
  expect(actualBackwardSiblingResourceContent).toBe(expectedBackwardSiblingResourceContent);
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
  const actualData1 = await fs.readFile(
    path.resolve(tmpFolder, 'localhost-single1-html.html'), { encoding: 'UTF-8' }
  );
  expect(actualData1).toEqual(expectedData1);

  await downloadPage(`http://localhost/${fixtureFilename2}/`, tmpFolder);
  const actualData2 = await fs.readFile(
    path.resolve(tmpFolder, 'localhost-single2.html'), { encoding: 'UTF-8' }
  );
  expect(actualData2).toEqual(expectedData2);
});


test('download page without resources', async () => {
  const expectedPageContent = await fs.readFile(getFixtureFilename('pageWithoutResources.html'), 'utf-8');
  nock(/a.com/)
    .get('/pageWithoutResources')
    .reply(200, expectedPageContent);

  await downloadPage('http://a.com/pageWithoutResources', tmpFolder);
  const actualPageContent = await fs.readFile(path.resolve(tmpFolder, 'a-com-pageWithoutResources.html'), 'utf-8');
  expect(actualPageContent).toEqual(expectedPageContent);

  const files = await fs.readdir(tmpFolder);
  expect(files).not.toContain('a-com-pageWithoutResources_files');
});
