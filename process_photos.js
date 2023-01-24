import fs from "fs";
import path from "path";
import {writeJsonFile} from 'write-json-file';

const currentDir = process.cwd();
let filesToUpload = {};

const excludedYearList = [
  "2022",
  "2010",
  "2013",
  "2014",
  "2016",
  "node_modules",
];

fs.readdir(currentDir, (err, files) => {
  if (err) {
    console.error("An error occurred:", err);
    return;
  }

  const yearList = files.filter(file => {
    const filePath = path.join(currentDir, file);
    return fs.statSync(filePath).isDirectory();
  });

  yearList.forEach(year => {
    if (excludedYearList.includes(year))
      return ;
    console.log("Year:", year);
    listYearDirectory(year)
  });
});

async function listYearDirectory(year) {

  const yearDirectoryPath = path.join(currentDir, year);

  const files = fs.readdirSync(yearDirectoryPath);

  const photoAlbums = files.filter(file => {
    const filePath = path.join(yearDirectoryPath, file);
    return fs.statSync(filePath).isDirectory();
  });

  photoAlbums.forEach(album => {
    filesToUpload[album] = [];
    listFilesAndFolders(path.join(yearDirectoryPath, album), album);
  });

  const reportFileName = 'photos.json';
  await writeJsonFile(reportFileName, filesToUpload);
  console.log(`Photos are now ready to import, check this file : ${reportFileName}`);
}

function listFilesAndFolders(dir, albumName) {
  try {
    const files = fs.readdirSync(dir);
    const albumDescription = albumName.replace(/20[0-9]{2}.[0-9]{2}(.[0-9]{2})? /gm,'');

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const isDirectory = fs.statSync(filePath).isDirectory();

      if (isDirectory) {
        listFilesAndFolders(filePath, albumName);
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