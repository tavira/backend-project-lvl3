import { promises as fs } from 'fs';
import path from 'path';
import axios from 'axios';

import { extractLinks, updateLinks } from './utils/pageContent';
import {
  getPathnameToSavePage,
  getPathForAssets,
  transformToAbsoluteLinks,
  getPathForLocalLink,
  getFilenameForLocalLink,
  indicatesDomainOrSubdomainPage,
} from './utils/gettingNames';

const downloadPageWithResources = (url, dir = __dirname, httpClient) => {
  const tagAttrMapping = {
    img: 'src',
    script: 'src',
    link: 'href',
  };

  const client = httpClient || axios.create({});

  const pagePathname = getPathnameToSavePage(url, dir);

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
      const updatedPageContent = updateLinks(
        downloadedPageContent,
        tagAttrMapping,
        getPathForLocalLink(url, dir),
      );
      return updatedPageContent;
    })
    .then(pageContent => fs.writeFile(pagePathname, pageContent, 'utf-8'))
    .then(() => transformToAbsoluteLinks(url, extractedFromPageLinks))
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
    .then(() => pageDomainLinks.map(link => client.get(link, { responseType: 'arraybuffer' })))
    .then(resourcesGetPromises => Promise.allSettled(resourcesGetPromises))
    .then(responses => responses.filter(r => r.status === 'fulfilled'))
    .then(successfulResponses => successfulResponses.map(({ value }) => {
      const resourceLocalName = getFilenameForLocalLink(value.config.url);
      const resourcePathname = path.resolve(
        resourcesDirPathname,
        resourceLocalName,
      );
      return fs.writeFile(resourcePathname, value.data);
    }))
    .catch((e) => {
      throw new Error(e);
    });
};

export default downloadPageWithResources;
