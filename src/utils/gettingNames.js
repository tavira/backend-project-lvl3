import path from 'path';
import debug from 'debug';

import { name as packageName } from '../../package.json';

const log = debug(packageName);

const replaceNonLettersWithHyphens = s => s.replace(/[\W_]+/g, '-');

const getHyphenatedHost = ({ host }) => replaceNonLettersWithHyphens(host);

const getHyphenatedPathname = ({ pathname }) => {
  const normalizedPathname = pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;
  return replaceNonLettersWithHyphens(normalizedPathname);
};

const getPathnameForPage = (url, baseDir) => {
  const URLObject = new URL(url);
  const hyphenatedHost = getHyphenatedHost(URLObject);
  const hyphenatedPathname = getHyphenatedPathname(URLObject);
  const filename = `${hyphenatedHost}${hyphenatedPathname}.html`;
  const pathname = path.resolve(baseDir, filename);

  return pathname;
};

const getDirNameForResourceDir = (url) => {
  const URLObject = new URL(url);
  const hyphenatedHost = getHyphenatedHost(URLObject);
  const hyphenatedPathname = getHyphenatedPathname(URLObject);
  const dirName = `${hyphenatedHost}${hyphenatedPathname}_files`;

  return dirName;
};

const getPathnameForResourceDir = (url, baseDir) => {
  const dirName = getDirNameForResourceDir(url);
  const pathname = path.resolve(baseDir, dirName);

  return pathname;
};

const transformToAbsoluteLink = (domainURL, resourceLink) => {
  log('input resource link - %o', resourceLink);
  const url = new URL(domainURL);

  const getTransformType = () => {
    if (resourceLink.startsWith('..')) {
      return 'backward';
    }
    if (resourceLink.startsWith('http')) {
      return 'absolute';
    }
    if (resourceLink.startsWith('//')) {
      return 'protocolRelative';
    }
    if (resourceLink.startsWith('/')) {
      return 'rootRelative';
    }
    return 'relative';
  };

  const transformType = getTransformType();
  log('link type - %o', transformType);

  const transformMapping = {
    backward: () => {
      const pathnameParts = url.pathname.split('/');
      const pathnameLastPart = pathnameParts.slice(-1);
      const pathnamePartsOneLevelUp = pathnameParts.slice(0, -2);
      const pathnameOneLevelUp = [
        ...pathnamePartsOneLevelUp,
        ...pathnameLastPart,
      ].join('/');

      url.pathname = pathnameOneLevelUp;

      const resourceLinkLevelUp = resourceLink.substring(3);

      return transformToAbsoluteLink(url.toString(), resourceLinkLevelUp);
    },
    absolute: () => resourceLink,
    protocolRelative: () => {
      const pathnameParts = resourceLink.split('/');
      const firstSection = pathnameParts[2];
      // it means that resource link includes origin
      if (firstSection.includes('.')) {
        const absoluteLink = `${url.protocol}${resourceLink}`;
        return absoluteLink;
      }
      // resource link doesn`t include origin
      const absoluteLink = `${url.origin}${resourceLink.substring(1)}`;
      return absoluteLink;
    },
    rootRelative: () => {
      const absoluteLink = `${url.origin}${resourceLink}`;
      return absoluteLink;
    },
    relative: () => {
      const pathnameParts = url.pathname.split('/');
      const pathnamePartsForCurrentDir = pathnameParts.slice(0, -1);
      const resultingPathname = [
        ...pathnamePartsForCurrentDir,
        resourceLink,
      ].join('/');
      url.pathname = resultingPathname;
      return url.toString();
    },
  };

  const absoluteLink = transformMapping[transformType]();
  log('output link - %o', absoluteLink);
  return absoluteLink;
};

const transformToAbsoluteLinks = (url, links) => (
  links.map(link => transformToAbsoluteLink(url, link))
);

const getFilenameForLocalLink = (absoluteResourceURL) => {
  const { pathname } = new URL(absoluteResourceURL);
  const splittedPathname = pathname.split('.');
  const ext = splittedPathname.slice(-1);
  const name = splittedPathname
    .slice(0, splittedPathname.length - 1)
    .join('.')
    .substring(1);
  const localName = replaceNonLettersWithHyphens(name);
  const localFilename = `${localName}.${ext}`;

  return localFilename;
};

const indicatesDomainOrSubdomainPage = (currentUrl, sampleUrl) => {
  const { hostname: hostnameCurrentUrl } = new URL(currentUrl);
  const { hostname: hostnameSampleUrl } = new URL(sampleUrl);

  return hostnameCurrentUrl.includes(hostnameSampleUrl);
};

const getPathForLocalLink = address => (link) => {
  const absoluteResourceURL = transformToAbsoluteLink(address, link);
  if (!indicatesDomainOrSubdomainPage(absoluteResourceURL, address)) {
    return link;
  }

  const localFilename = getFilenameForLocalLink(absoluteResourceURL);
  const assetsFolder = getDirNameForResourceDir(address);
  const filename = path.join(assetsFolder, localFilename);

  return filename;
};

export {
  getPathnameForPage as getPathnameToSavePage,
  getPathnameForResourceDir as getPathForAssets,
  transformToAbsoluteLinks,
  getPathForLocalLink,
  getFilenameForLocalLink,
  indicatesDomainOrSubdomainPage,
};
