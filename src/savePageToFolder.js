import { promises as fs } from 'fs';
import path from 'path';
import axios from 'axios';

const getFilenameFromUrl = (address) => {
  const { host, pathname } = new URL(address);
  const urlPathnameWithoutSlash = pathname.endsWith('/') ? pathname.substring(0, pathname.length - 1) : pathname;
  const rawFilename = `${host}${urlPathnameWithoutSlash}`.replace(/[\W_]+/g, '-');
  const filename = `${rawFilename}.html`;
  return filename;
};

const savePageToFolder = (address, folder = __dirname) => axios.get(address)
  .then(({ data }) => {
    const filename = getFilenameFromUrl(address);
    const pathname = path.join(folder, filename);
    return fs.writeFile(pathname, data, 'UTF-8');
  })
  .catch((e) => {
    throw new Error(e);
  });

export default savePageToFolder;
