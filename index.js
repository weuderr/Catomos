const fs = require("fs");
const {ensureDirectoryExistence, upAllFistLetter, upAllFistLetterWithSpace} = require("./src/lib/Utils");
const {makeModel} = require("./src/controllers/model");
const {makeRoute} = require("./src/controllers/route");
const {makeInterfaceDatabase} = require("./src/controllers/controllers");
const {makeValidates} = require("./src/controllers/validates");
const {makeFrontModels} = require("./src/controllers/fontModel");
const {makeFileFront} = require("./src/controllers/screenFront");
const {makeFrontFileService} = require("./src/controllers/services");
const {makeFileFrontReport} = require("./src/controllers/report");

const readFolder = 'docs/cast/';


async function start(allFiles) {

  async function beaginFiles(parsedFileName, className, fileName, data, nameWithSpace) {
    await makeModel(parsedFileName, className, fileName, data, allFiles);
    await makeRoute(parsedFileName, className, nameWithSpace);

    await makeInterfaceDatabase(parsedFileName, className);
    await makeValidates(parsedFileName, className, fileName, data);

    await makeFrontModels(parsedFileName, className, fileName, data);
    await makeFrontFileService(parsedFileName, className, fileName, data);
    await makeFileFront(parsedFileName, className, fileName, nameWithSpace, data);

    await makeFileFrontReport(parsedFileName, className, fileName, nameWithSpace, data);
  }

  for (const file of allFiles) {
    await beaginFiles(file.parsedFileName, file.className, file.fileName, file.data, file.nameWithSpace);
  }
}

function createDirectors() {
  ensureDirectoryExistence('docs/');
  ensureDirectoryExistence('docs/files/');
  ensureDirectoryExistence('docs/files/front/');
  ensureDirectoryExistence('docs/files/front/services');
  ensureDirectoryExistence('docs/files/front/enum/');
  ensureDirectoryExistence('docs/files/front/tables/');
  ensureDirectoryExistence('docs/files/front/tables/report/');
  ensureDirectoryExistence('docs/files/front/models/');
  ensureDirectoryExistence('docs/files/back/');
  ensureDirectoryExistence('docs/files/back/api/');
  ensureDirectoryExistence('docs/files/back/models/');
  ensureDirectoryExistence('docs/files/back/models/postgres/');
}

function showFileCreateConsole(className, parsedFileName) {
  // console.log(camelCaseNameFile+"Component,");
  console.log(className + "Component");
  console.log(className + "ReportComponent");
  // console.log("blank/application/tables/files/"+parsedFileName+".component,");
  console.log("blank/application/tables/" + parsedFileName);
  console.log("blank/application/tables/Layout" + parsedFileName + "Report");
}

async function readFile(file) {
  const fileName = file.replace('.json', '');
  const parsedFileName = fileName.replace(/ /g, "_").replace(/_/g, '-').toLowerCase(); //name of file without extension
  const className = upAllFistLetter(fileName); // name if camelCase
  const nameWithSpace = upAllFistLetterWithSpace(fileName.replace(/-/g, " ").replace(/_/g, ' '));

  showFileCreateConsole(className, parsedFileName);

  createDirectors();

  return await new Promise((resolve, reject) => {
    fs.readFile(readFolder + fileName + '.json', 'utf8', async function (err, data) {
      resolve({
        fileName: fileName,
        nameWithSpace: nameWithSpace,
        className: className,
        parsedFileName: parsedFileName,
        data: data,
      });
    });
  }).then((filesRead) => {
    return filesRead;
  });
}

async function init() {
  await new Promise( async (resolveFiles, reject) => {
    let allFiles = [];
    await fs.readdir(readFolder, async (err, files) => {
      if (files) {
        for (const file of files) {
          if (file) {
            const bufferFile = await readFile(file);
            allFiles.push(bufferFile);
          }
        }
        resolveFiles(allFiles);
      }
      else {
        console.log("########## INSIRA UM ARQUIVO ###########")
      }
    });
  }).then(async (allFiles) => {
    await start(allFiles);
  });
}
init();