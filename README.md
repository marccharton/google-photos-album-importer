# google-photos-album-importer
Import albums photos to [google photos](https://www.google.com/photos/about/) from local files.

## todo
- [x] feed readme
- [x] fix download error report
- [ ] reload photos
- [ ] fix use of variable REDIRECT_URL
- [ ] launch import from client (to see the process growing)
- [ ] move error logs to a folder and use dates for names to ensure unicity
- [ ] ...

## Environment
      
### CLIENT_ID  
**Environment variable aiming at** : proving client ID to google server.  
**Type of value** : Google UID  
**Source of value** : [Google Cloud](https://console.cloud.google.com/apis/credentials)  
  
### CLIENT_SECRET  
**Environment variable aiming at** : proving client secret to google server  
**Type of value** : Google Secret  
**Source of value** : [Google Cloud](https://console.cloud.google.com/apis/credentials)  
  
### REDIRECT_URL  
**Environment variable aiming at** : serve a local address used by google OAuth authentication.  
**Type of value** : URL  
**Source of value** : Node script.  
  
### ALBUMS_PATH  
**Environment variable aiming at** : providing the path to local system folder with photos albums  
**Type of value** : Folder Path  
**Source of value** : Your path to photos albums.  
  
### PROCESSED_ALBUMS_FILE_NAME  
**Environment variable aiming at** : giving a name to the file with all photos paths.  
**Type of value** : Json File Name  
**Source of value** : Arbitrary, you can keep it as it is.  

## Prerequisities

- you to create an authorization to access to google photos api through API Key. [See more](https://console.cloud.google.com/apis/credentials)
- [nodejs](https://nodejs.org/en/)
- specific folder archicture for albums (see below)
- take care of bad character encoding, if a symbol is replacing a character it won't be possible to import the file.


### folder architecture

- year
  - album
  - ablum
    - sub folder
    - sub folder
 
Example : 
          <li>2011
            <ul>
              <li>This akward weekend</li>
              <li>Let's go to Stockholm
                <ul>
                  <li> leaving home </li>
                  <li> stay in amsterdam </li>
                  <li> buildings </li>
                </ul>
              </li>
            </ul>
          </li>
          <li>2012
            <ul>
              <li>My super weekend</li>
              <li>My mom's birthday</li>
            </ul>
          </li>
  

## Usage

### Install dependencies

```
npm install
```

### Process photos

This script generates a file with all the galleries parsed.  

```
npm start
```


### Launch the import to google photo

This script launches a web app that let you import your galleries.  

```
npm run import
```