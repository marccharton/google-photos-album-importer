import fs from "fs";
import path from "path";
import dotenv from 'dotenv';
import asyncForEach from 'async-await-foreach';
import {writeJsonFile} from 'write-json-file';

dotenv.config();

const albumsPath = process.env.ALBUMS_PATH;
let filesToUpload = {};
const albumsFileNamePath = "data/" + process.env.PROCESSED_ALBUMS_FILE_NAME;

const excludedFolderList = [
  "google-photos-album-importer",
  "2010",
  "2011",
  // "2013",
  // "2014",
  // "2016",
  "2022",
];

fs.readdir(process.env.ALBUMS_PATH, async (err, files) => {
  if (err) {
    console.error("An error occurred:", err);
    return;
  }

  const folders = files.filter(file => {
    if (excludedFolderList.includes(file))
      return false;
    const filePath = path.join(albumsPath, file);
    return fs.statSync(filePath).isDirectory();
  });
  await asyncForEach(folders, async year => {
    console.log("Processing folder :", year);
    await listYearDirectory(year);
  });

  await writeJsonFile(albumsFileNamePath, filesToUpload);
  console.log(`Photos are now ready to import, check this file : ${albumsFileNamePath}`);
});

async function listYearDirectory(year) {
  const yearDirectoryPath = path.join(albumsPath, year);
  const files = fs.readdirSync(yearDirectoryPath);

  files
    .filter(file => fs.statSync(path.join(yearDirectoryPath, file)).isDirectory() )
    .forEach(album => {
      const albumDescription = album.replace(/20[0-9]{2}.[0-9]{2}(.[0-9]{2})? /gm,'');
      const albumPath = path.join(yearDirectoryPath, album);
      filesToUpload[album] = [];
      listFilesAndFolders(albumPath, album, albumDescription);
    });
}

function listFilesAndFolders(albumPath, albumName, albumDescription) {
  try {
    const files = fs.readdirSync(albumPath);

    files.forEach(file => {
      const filePath = path.join(albumPath, file);
      const isDirectory = fs.statSync(filePath).isDirectory();

      if (isDirectory) {
        listFilesAndFolders(filePath, albumName, albumDescription);
      } else {
        filesToUpload[albumName].push({
          fileName: file, 
          filePath: filePath, 
          description: `${albumDescription} - ${path.parse(file).name}`, 
        });
      }
    });
  }
  catch (err) {
    console.error("An error occurred:", err);
    return;
  }
}