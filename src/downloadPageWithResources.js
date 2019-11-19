import { promises as fs, constants } from 'fs';
import path from 'path';
import axios from 'axios';
import debug from 'debug';
import Listr from 'listr';

import { extractLinks, updateLinks } from './utils/pageContent';
import {
  getPathnameToSavePage,
  getPathForAssets,
  transformToAbsoluteLinks,
  getPathForLocalLink,
  getFilenameForLocalLink,
  indicatesDomainOrSubdomainPage,
} from './utils/gettingNames';

import { name as packageName } from '../package.json';

const log = debug(packageName);

const isFileNotExisted = pathname => fs.access(pathname, constants.F_OK)
  .then(() => {
    const e = new Error();
    e.errno = -17;
    e.code = 'EEXIST';
    e.syscall = 'access';
    e.path = pathname;
    e.message = 'This page is already downloaded in the selected directory';
    throw e;
  },
  () => pathname);

const saveResource = (resourcesDirPathname, { url, data }) => {
  log(resourcesDirPathname);
  log(url);
  log(data);
  const localName = getFilenameForLocalLink(url);
  const resourcePathname = path.join(resourcesDirPathname, localName);
  log('path to resource - %O', resourcePathname);
  return fs.writeFile(resourcePathname, data, 'utf-8');
};

const downloadPageWithResources = (url, dir = __dirname, httpClient) => {
  log('given download link - %o', url);
  log('given directory to save -%o', dir);
  const tagAttrMapping = {
    img: 'src',
    script: 'src',
    link: 'href',
  };

  const client = httpClient || axios.create({});
  log('client - %O', client);

  const pagePathname = getPathnameToSavePage(url, dir);
  log('computed pathname to save page - %o', pagePathname);

  let extractedFromPageLinks = [];
  let pageDomainLinks = [];
  let resourcesDirPathname = null;

  return fs.access(dir, constants.W_OK)
    .then(() => isFileNotExisted(pagePathname))
    .then(() => client.get(url))
    .then(({ data: downloadedPageContent }) => {
      log('downloadedPageContent - %O', downloadedPageContent);
      extractedFromPageLinks = extractLinks(
        downloadedPageContent,
        tagAttrMapping,
      );
      log('extracted links - %O', extractedFromPageLinks);
      const updatedPageContent = updateLinks(
        downloadedPageContent,
        tagAttrMapping,
        getPathForLocalLink(url, dir),
      );
      return updatedPageContent;
    })
    .then(pageContent => fs.writeFile(pagePathname, pageContent, 'utf-8'))
    .then(() => {
      const transformedLinks = transformToAbsoluteLinks(url, extractedFromPageLinks);
      log('transformed links - %O', transformedLinks);
      return transformedLinks;
    })
    .then(absoluteLinks => absoluteLinks.filter(
      absoluteLink => indicatesDomainOrSubdomainPage(absoluteLink, url),
    ))
    .then((domainLinks) => {
      if (domainLinks.length === 0) {
        return null;
      }
      pageDomainLinks = domainLinks;
      resourcesDirPathname = getPathForAssets(url, dir);
      return fs.mkdir(resourcesDirPathname);
    })
    .then(() => {
      const tasks = new Listr([], { concurrent: true, exitOnError: false });
      log('pageDomainLinks - %O', pageDomainLinks);
      pageDomainLinks.forEach(domainURL => tasks.add({
        title: `Download - ${domainURL}`,
        task: () => client.get(domainURL, { responseType: 'arraybuffer' })
          .then(({ config, data }) => saveResource(
            resourcesDirPathname, { url: config.url, data },
          )),
      }));

      return tasks;
    })
    .then(tasks => tasks.run().catch(() => { }));
};

export default downloadPageWithResources;
