import cheerio from 'cheerio';

const extractLinks = (html, tagAttrMapping) => {
  const $ = cheerio.load(html);
  return Object.keys(tagAttrMapping)
    .map(t => $.root().find(t).toArray())
    .flat()
    .map(selector => $(selector).attr(tagAttrMapping[selector.tagName]))
    .filter(attr => attr);
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
