import dotenv from 'dotenv';
import {google} from 'googleapis';
import Photos from 'googlephotos';
import express from 'express';
import asyncForEach from 'async-await-foreach';
import fs from "fs";
import path from "path";
import {writeJsonFile} from 'write-json-file';

dotenv.config();
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), '/views'));
app.use(express.static('public'))

let oauth2Client, photos, photosData, errorReport = {};
const errorReportPath = "public/error_report.json";
const albumsFileNamePath = "data/" + process.env.PROCESSED_ALBUMS_FILE_NAME;

deleteOldReport();
makeItDone("Processing albums to import...", () => photosData = JSON.parse(fs.readFileSync(albumsFileNamePath, 'utf8')));

app.get('/', async function (req, res) {
  res.render('pages/index');
})

app.get('/connect', function(req, res) {
    
  oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  );

  const scopes = [
    Photos.Scopes.READ_AND_APPEND
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });

  res.redirect(url);
});

app.get("/google/auth/redirect", async function (req, res) {
  
  const {tokens} = await oauth2Client.getToken(req.query.code)
  process.env.ACCESS_TOKEN = tokens.access_token;
  
  res.redirect('/photos/menu');
});

app.get('/photos/menu', function (req, res) {
  photos = getGooglePhotosWrapper();
  if (photos === null)
    return res.redirect('/connect');

  res.render('pages/menu');
});

app.get('/photos/list', async function(req, res) {
  photos = getGooglePhotosWrapper();
  if (photos === null)
    return res.redirect('/connect');
   
  const response = await photos.albums.list(50);

  return res.render('pages/list', {albums: response.albums});
});

app.get('/photos/upload/album', async function(req, res) {
  photos = getGooglePhotosWrapper();
  if (photos === null)
    return res.redirect('/connect');

  try {
    for (const {albumName, files} of getNextAlbum(photosData)) {
      if (await uploadAlbum(albumName, files) === null)
        continue;
    }
  }
  catch (err) {
    return res.status(500).send({ err });
  }
  
  finalLog();

  return res.render('pages/upload', { existingReport : !isEmpty(errorReport) });
});
async function createAlbum(albumName) {
  try {
    return await photos.albums.create(albumName);
  } catch (err) {
    console.log(`⚠️  "${albumName}" album creation failed.`);
    log("album-creation", albumName, err);
    return null;
  }
} 
async function uploadAlbum(albumName, files) {
  const album = await createAlbum(albumName);
  if (album === null)
    return null;

  console.log(`Uploading files into album "${albumName}" ...`);

  await asyncForEach(files, async file => {
      await uploadFile( 
        album,
        file.fileName,
        file.filePath,
        file.description,
        100000,
      );
  }).then(_ => {
    console.log(`☑️ The album "${albumName}" imported ${errorReport[albumName] !== undefined
                                                        ? 'with errors (check error report file)'
                                                        : 'successfully'}`);
  }).catch(err => {
    console.log(err);
  })
}
async function uploadFile(album, fileName, filePath, description, requestDelay) {  
  try {
    process.stdout.write(`\--> Uploading file "${fileName}" ...`);

    const response = await photos.mediaItems.upload(album.id, fileName, filePath, description, requestDelay);
    console.log(' Done ! 🎉');

    return response;
  }
  catch(err) {
    log(album.title, fileName, err);
    await writeJsonFile(errorReportPath, errorReport);
    console.log(" Failed 😭");
  }
}

app.listen(8000, () => {
  console.log("Check the link : http://localhost:8000");
});

// ======= UTILS ========

function* getNextAlbum(data) {
  for (let index in data) {
    const albumName = index;
    const files = data[index];
    yield {albumName, files};
  }
}
function makeItDone(message, cb) {
  process.stdout.write(message);
  cb();
  console.log(" Done !");
}
function log(albumName, fileName, err) {
  if (errorReport[albumName] === undefined) {
    errorReport[albumName] = [];
  }
  errorReport[albumName].push({fileName, err});
}
function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}
function deleteOldReport() {
  fs.unlink(errorReportPath, (err) => {
    if (err) {
      if (err.errno !== -4058)
        throw err;
      console.log("No Existing Error Report");
      return;
    }
    console.log('Error Report was deleted');
  });
}
function getGooglePhotosWrapper () {
  if (!process.env.ACCESS_TOKEN) {
    return null;
  }
  return new Photos(process.env.ACCESS_TOKEN);
}
async function finalLog() {
  if (!isEmpty(errorReport)) {
    await writeJsonFile(errorReportPath, errorReport);
    console.log("Some albums had reported some errors.");
  }
  else {
    console.log("Every albums had been processed successfully.");
  }
  console.log("Check error report for more details.");
}