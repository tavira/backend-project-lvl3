import { promises as fs } from 'fs';
import path from 'path';
import axios from 'axios';
import debug from 'debug';

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

const downloadPageWithResources = (url, dir = __dirname, httpClient) => {
  log('given download link - %o', url);
  log('given directory to save -%o', dir);
  const tagAttrMapping = {
    img: 'src',
    script: 'src',
    link: 'href',
  };

  const client = httpClient || axios.create({});

  const pagePathname = getPathnameToSavePage(url, dir);
  log('computed pathname to save page - %o', pagePathname);

  let extractedFromPageLinks = [];
  let pageDomainLinks = [];
  let resourcesDirPathname = null;

  return client
    .get(url)
    .then(({ data: downloadedPageContent }) => {
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
    .then(() => pageDomainLinks.map(link => client.get(
      link, { responseType: 'arraybuffer' },
    )))
    .then(resourcesGetPromises => Promise.allSettled(resourcesGetPromises))
    .then(responses => responses.filter(r => r.status === 'fulfilled'))
    .then(successfulResponses => successfulResponses.map(({ value }) => {
      const resourceLocalName = getFilenameForLocalLink(value.config.url);
      const resourcePathname = path.resolve(
        resourcesDirPathname,
        resourceLocalName,
      );
      return fs.writeFile(resourcePathname, value.data)
        .then(() => {
          log('successful saving of the resource %o to file %o',
            value.config.url, resourcePathname);
          console.info(`${value.config.url} downloaded`);
          return null;
        });
    }))
    .catch((e) => {
      console.error(e);
      throw new Error(e);
    });
};

export default downloadPageWithResources;
