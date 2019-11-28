import cheerio from 'cheerio';
import {
  transformToAbsoluteLinks,
  indicatesDomainOrSubdomainPage,
} from './gettingNames';

const extractLinks = (html, tagAttrMapping, domainURL) => {
  const $ = cheerio.load(html);
  const sourceLinks = Object.keys(tagAttrMapping)
    .map(t => $.root().find(t).toArray())
    .flat()
    .map(selector => $(selector).attr(tagAttrMapping[selector.tagName]))
    .filter(attr => attr);
  const links = transformToAbsoluteLinks(domainURL, sourceLinks)
    .filter(link => indicatesDomainOrSubdomainPage(link, domainURL));

  return links;
};

const updateLinks = (html, tagAttrMapping, updateFunc) => {
  const $ = cheerio.load(html);
  Object.keys(tagAttrMapping)
    .map(t => $.root().find(t).toArray())
    .flat()
    .forEach((selector) => {
      const matchedAttribute = tagAttrMapping[selector.tagName];
      const currentAttrValue = $(selector).attr(matchedAttribute);
      if (currentAttrValue) {
        $(selector).attr(matchedAttribute, updateFunc(currentAttrValue));
      }
    });
  return $.html();
};

export {
  extractLinks,
  updateLinks,
};
