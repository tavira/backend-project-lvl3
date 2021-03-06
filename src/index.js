import { promises as fs, constants } from 'fs';
import path from 'path';
import axios from 'axios';
import debug from 'debug';
import Listr from 'listr';

import { extractLinks, updateLinks } from './utils/pageContent';
import {
  getPathnameToSavePage,
  getPathForAssets,
  getPathForLocalLink,
  getFilenameForLocalLink,
} from './utils/gettingNames';

import { name as packageName } from '../package.json';

const log = debug(packageName);

const ensureFileNotExist = pathname => fs.access(pathname, constants.F_OK)
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

const downloadPage = (url, dir = __dirname) => {
  log('given download link - %o', url);
  log('given directory to save -%o', dir);
  const tagAttrMapping = {
    img: 'src',
    script: 'src',
    link: 'href',
  };

  const pagePathname = getPathnameToSavePage(url, dir);
  log('computed pathname to save page - %o', pagePathname);

  let resourceLinks = [];
  let resourcesDirPathname = null;

  return fs.access(dir, constants.W_OK)
    .then(() => ensureFileNotExist(pagePathname))
    .then(() => axios.get(url))
    .then(({ data: downloadedPageContent }) => {
      log('downloadedPageContent - %O', downloadedPageContent);
      resourceLinks = extractLinks(downloadedPageContent, tagAttrMapping, url);
      log('extracted links - %O', resourceLinks);
      const updatedPageContent = updateLinks(
        downloadedPageContent,
        tagAttrMapping,
        getPathForLocalLink(url, dir),
      );
      return fs.writeFile(pagePathname, updatedPageContent, 'utf-8');
    })
    .then(() => {
      if (resourceLinks.length === 0) {
        return null;
      }
      resourcesDirPathname = getPathForAssets(url, dir);
      return fs.mkdir(resourcesDirPathname);
    })
    .then(() => {
      const tasks = new Listr([], { concurrent: true, exitOnError: false });
      log('pageDomainLinks - %O', resourceLinks);
      resourceLinks.forEach(domainURL => tasks.add({
        title: `Download - ${domainURL}`,
        task: () => axios.get(domainURL, { responseType: 'arraybuffer' })
          .then(({ config, data }) => saveResource(
            resourcesDirPathname, { url: config.url, data },
          )),
      }));

      return tasks;
    })
    .then(tasks => tasks.run().catch(() => { }));
};

export default downloadPage;
