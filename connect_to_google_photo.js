import dotenv from 'dotenv';
import {google} from 'googleapis';
import Photos from 'googlephotos';
import express from 'express';
import open from 'open';
import asyncForEach from 'async-await-foreach';
import fs from "fs";
import path from "path";
import {writeJsonFile} from 'write-json-file';
import ejs  from 'ejs';

dotenv.config();
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), '/views'));
app.use(express.static('public'))

let oauth2Client, photos, photosData, errorReport = {};

makeItDone("Processing albums to import...", () => photosData = JSON.parse(fs.readFileSync(process.env.PROCESSED_ALBUMS_FILE_NAME, 'utf8')));

app.get('/', async function (req, res) {
  // await open("http://localhost:8000/connect");
  // res.send("go conect");
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
  res.render('pages/menu');
});

app.get('/photos/list', async function(req, res) {
  if (!process.env.ACCESS_TOKEN) {
    res.redirect('/connect');
    return;
  }
  else {
    photos = new Photos(process.env.ACCESS_TOKEN);
  }

  const response = await photos.albums.list(50);

  return res.render('pages/list', {albums: response.albums});
});

app.get('/photos/upload/album', async function(req, res) {
  if (!process.env.ACCESS_TOKEN) {
    res.redirect('/connect');
    return;
  }
  else {
    photos = new Photos(process.env.ACCESS_TOKEN);
  }

  try {
    for (const {albumName, files} of getNextAlbum(photosData)) {
      const album = await createAlbum(albumName);
      if (album === null)
        continue;

      console.log(`Uploading album "${albumName}" ...`);
  
      await asyncForEach(files, async file => {
          await uploadingFile( 
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
  }
  catch (err) {
    res.status(500).send({ err });
    return ;
  }
  
  if (!isEmpty(errorReport)) {
    await writeJsonFile("error_report.json", errorReport);
  }
  
  console.log("Every albums had been processed successfully. Check error report for more details.");
  res.render('pages/upload');
});
async function uploadingFile(album, fileName, filePath, description, requestDelay) {  
  try {
    process.stdout.write(`\--> Uploading file "${fileName}" ...`);

    const response = await photos.mediaItems.upload(album.id, fileName, filePath, description, requestDelay);
    console.log(' Done ! 🎉');

    return response;
  }
  catch(err) {
    log(album.title, fileName, err);
    await writeJsonFile("error_report.json", errorReport);
    console.log(" Failed 😭");
  }
}
async function createAlbum(albumName) {
  try {
    return await photos.albums.create(albumName);
  } catch (err) {
    console.log(`⚠️  "${albumName}" album creation failed.`);
    log("album-creation", albumName, err);
    return null;
  }
} 


app.listen(8000, () => {
  console.log("listening on port 8000");
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
