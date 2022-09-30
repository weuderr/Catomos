const fs = require('fs');
const path = require("path");

const readFolder = 'docs/cast/';

fs.readdir(readFolder, async (err, files) => {
  if (files)
    for (const file of files) {
      if (file) {
        const fileName = file.replace('.json', '');
        let parsedFileName = fileName.replace(/ /g, "_").replace(/_/g, '-').toLowerCase(); //name of file without extension
        let camelCaseNameFile = upAllFistLetter(fileName); // name if camelCase
        let nameWithSpace = upAllFistLetterWithSpace(fileName.replace(/-/g, " ").replace(/_/g, ' '));


        // console.log(camelCaseNameFile+"Component,");
        console.log(camelCaseNameFile + "DocumentoReportComponent,");
        console.log(camelCaseNameFile + "LayoutDocumentoReportComponent,");
        // console.log("blank/application/tables/files/"+parsedFileName+".component,");
        console.log("blank/application/tables/files/" + parsedFileName + "Report.component,");
        console.log("blank/application/tables/files/Layout" + parsedFileName + "Report.component,");


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


        await fs.readFile(readFolder + fileName + '.json', 'utf8', async function (err, data) {
          await makeModel(parsedFileName, camelCaseNameFile, fileName, data);
          await makeEndPoint(parsedFileName, camelCaseNameFile, nameWithSpace);

          await makeInterfaceDatabase(parsedFileName, camelCaseNameFile);
          await makeValidates(parsedFileName, camelCaseNameFile, fileName, data);

          await makeFrontModels(parsedFileName, camelCaseNameFile, fileName, data);
          await makeFrontFileService(parsedFileName, camelCaseNameFile, fileName, data);
          await makeFileFront(parsedFileName, camelCaseNameFile, fileName, data);

          await makeFileFrontReport(parsedFileName, camelCaseNameFile, fileName, nameWithSpace, data);
        });
      }
    }
  else {
    console.log("########## INSIRA UM ARQUIVO ###########")
  }
});

function getType(e) {
  let type = '';
  switch (e['Tipo']) {
    case 'enum' :
      type = `DataTypes.ENUM(${e['Observacoes']})`;
      break;
    case 'numeric' :
      type = 'DataTypes.INTEGER';
      break;
    case 'number' :
      type = 'DataTypes.INTEGER';
      break;
    case ('varchar' || 'string') :
      type = 'DataTypes.STRING(' + e['Tamanho'] + ')';
      break;
    case 'date' :
      if (!e['Observacoes'] || e['Observacoes'].length >= 16)
        type = 'DataTypes.DATE';
      else
        type = 'DataTypes.DATEONLY';
      break;
    case 'boolean' :
      type = 'DataTypes.BOOLEAN';
      break;
    case 'text' :
      type = 'DataTypes.TEXT';
      break;
    case 'json' :
      type = 'DataTypes.JSON';
      break;
    case 'jsonb' :
      type = 'DataTypes.JSONB';
      break;
    case 'uuid' :
      type = 'DataTypes.UUID';
      break;
    case 'uuidv4' :
      type = 'DataTypes.UUIDV4';
      break;
    case 'uuidv1' :
      type = 'DataTypes.UUIDV1';
      break;
    case 'array' :
      type = 'DataTypes.ARRAY';
      break;
    case 'real' :
      type = 'DataTypes.REAL';
      break;
    case 'double' :
      type = 'DataTypes.DOUBLE';
      break;
    case 'float' :
      type = 'DataTypes.FLOAT';
      break;
    case 'decimal' :
      type = 'DataTypes.DECIMAL';
      break;
    case 'time' :
      type = 'DataTypes.TIME';
      break;
    case 'geometry' :
      type = 'DataTypes.GEOMETRY';
      break;
    case 'geometrycollection' :
      type = 'DataTypes.GEOMETRYCOLLECTION';
      break;
    case 'point' :
      type = 'DataTypes.POINT';
      break;
    case 'linestring' :
      type = 'DataTypes.LINESTRING';
      break;
  }
  return type;
}

function fieldsForModel(e) {
  let model = {}
  model.field = e['Atributo']

  e['Descricao'] !== "" ? model.comment = e['Descricao'] : '';
  model.type = getType(e)

  if (e['Observacoes'] === 'primary key') {
    model.allowNull = false
    model.required = true
    model.autoIncrement = !(e['Tipo'] === 'varchar')
    model.primaryKey = true
    model.unique = true
  } else {
    model.allowNull = e['Obrigatoriedade'] !== 'sim'
    model.required = e['Obrigatoriedade'] === 'sim'
  }
  return model
}

function castValues(camelCaseNameFileArray) {
  return camelCaseNameFileArray.map(value => {
    value = value.toLowerCase();
    switch (value) {
      case 'dat':
        value = "data";
        break;
      case 'sta':
        value = "status";
        break;
      case 'aplic':
        value = "aplicação";
        break;
      case 'desc':
        value = "descricao";
        break;
      case 'cod':
        value = "codigo"
        break;
      case 'qtd':
        value = "quantidade"
    }
    return value
  });
}

function upAllFistLetterWithSpace(camelCaseNameFile) {
  if (!camelCaseNameFile) return '';
  // camelCase in all first letters of the string after space or underline
  let newcamelCaseNameFile = '';
  let camelCaseNameFileArray = camelCaseNameFile.split(' ');
  if (!(camelCaseNameFileArray.length > 1)) {
    camelCaseNameFileArray = camelCaseNameFile.split('_');
  }
  for (let i = 0; i < camelCaseNameFileArray.length; i++) {
    if(i === camelCaseNameFileArray.length - 1) {
      newcamelCaseNameFile += camelCaseNameFileArray[i].charAt(0).toUpperCase() + camelCaseNameFileArray[i].slice(1);
    } else {
      newcamelCaseNameFile += camelCaseNameFileArray[i].charAt(0).toUpperCase() + camelCaseNameFileArray[i].slice(1) + ' ';
    }
  }
  return newcamelCaseNameFile;
}

function upAllFistLetter(camelCaseNameFile) {
  if (!camelCaseNameFile) return '';
  // camelCase in all first letters of the string after space or underline
  let newcamelCaseNameFile = '';
  let camelCaseNameFileArray = camelCaseNameFile.split(' ');
  if (!(camelCaseNameFileArray.length > 1)) {
    camelCaseNameFileArray = camelCaseNameFile.split('_');
  }
  for (let i = 0; i < camelCaseNameFileArray.length; i++) {
    newcamelCaseNameFile += camelCaseNameFileArray[i].charAt(0).toUpperCase() + camelCaseNameFileArray[i].slice(1);
  }
  return newcamelCaseNameFile;
}

function upLetter(camelCaseNameFile) {
  if (!camelCaseNameFile) return '';
  // camelCase in all first letters of the string after space or underline
  let newcamelCaseNameFile = '';
  let camelCaseNameFileArray = camelCaseNameFile.split(' ');
  if (!(camelCaseNameFileArray.length > 1)) {
    camelCaseNameFileArray = camelCaseNameFile.split('_');
  }

  for (let i = 0; i < camelCaseNameFileArray.length; i++) {
    newcamelCaseNameFile += camelCaseNameFileArray[i].charAt(0).toUpperCase() + camelCaseNameFileArray[i].slice(1);
  }

  return newcamelCaseNameFile.charAt(0).toLowerCase() + newcamelCaseNameFile.slice(1);
}

function upSpaceLetter(camelCaseNameFile) {
  if (!camelCaseNameFile) return '';
  // camelCase in all first letters of the string after space or underline
  let newcamelCaseNameFile = '';
  let camelCaseNameFileArray = camelCaseNameFile.split(' ');
  if (!(camelCaseNameFileArray.length > 1)) {
    camelCaseNameFileArray = camelCaseNameFile.split('_');
  }
  camelCaseNameFileArray = castValues(camelCaseNameFileArray);
  for (let i = 0; i < camelCaseNameFileArray.length; i++) {
    if (i + 1 < camelCaseNameFileArray.length)
      newcamelCaseNameFile += camelCaseNameFileArray[i] + " ";
    else
      newcamelCaseNameFile += camelCaseNameFileArray[i];
  }

  return newcamelCaseNameFile.charAt(0).toUpperCase() + newcamelCaseNameFile.slice(1);
}

function ensureDirectoryExistence(filePath) {
  if (fs.existsSync(filePath)) {
    return true;
  }
  fs.mkdirSync(filePath);
}

async function makeModel(parsedFileName, camelCaseNameFile, fileName, data) {

  function structureUp() {
    return "import ApiConfig from '../../config/api.conf';\n" +
      "import { BasicFields } from '../fields/postgres/basicFields';\n" +
      "\n" +
      "const " + camelCaseNameFile + " = (sequelize, DataTypes) => {\n" +
      "\n" +
      "    const basicFields = new BasicFields(DataTypes);\n" +
      "\n" +
      "    // Define environment object\n" +
      "    const config = new ApiConfig();\n" +
      "    const environment = config.getEnv();\n" +
      "    let schema = environment.databases.postgres.schema;\n" +
      "\n" +
      "    const model = sequelize.define('" + camelCaseNameFile + "',";
  }

  function structureMiddle() {
    return "     {\n" +
      "            paranoid: true,\n" +
      "            freezeTableName: true,\n" +
      "            tableName: '" + fileName + "'\n" +
      //TODO onDelete: 'RESTRICT'
      // hooks: true, //  Not allow delete if exist relation of row
      "        }).schema(schema);\n" +
      "\n" +
      "    model.associate = (models) => {\n";
  }

  function structureDown() {
    return "   \n" +
      "    };\n" +
      "\n" +
      "    return model;\n" +
      "\n" +
      "};\n" +
      "\n" +
      "module.exports = " + camelCaseNameFile + ";";
  }

  if (data) {
    let fields = JSON.parse(data)
    structureUp = structureUp()
    structureMiddle = structureMiddle()
    structureDown = structureDown()
    let model = {};
    let foreignKey = '';

    fields.forEach(function (field, index) {

      const nameAttribute = index === 0 ? field['Observacoes'] === 'primary key' ? 'id' : upLetter(field['Atributo']) : upLetter(field['Atributo']);
      model[nameAttribute] = fieldsForModel(field);

      if (field['Observacoes'] === 'foreign key') {
        // foreignKey += `model.hasMany( models.${upLetter(nameAttribute.replace('Id',''))}, { foreignKey: \'${nameAttribute}\' });`
        foreignKey += `model.belongsTo( models.${field['Tabela']}, { foreignKey: \'${upLetter(nameAttribute)}\' } );`

        //TODO Buscar refrencia em todas as outra tabelas, para encontrar a chave estrangeira Hasmany
      }

    });
    model['unit'] = 'basicFields.setFieldUnit()';
    model['user'] = 'basicFields.setFieldUser()';
    model['situation'] = 'basicFields.setFieldSituation()';
    model['createdAt'] = 'basicFields.setFieldCreatedAt()';
    model['updatedAt'] = 'basicFields.setFieldUpdatedAt()';
    model['deletedAt'] = 'basicFields.setFieldDeletedAt()';

    let pattern = new RegExp(/"([^"]+)":/g);
    let stringFy = JSON.stringify(model);
    //remove " with regex of all name fields
    let stringMod = stringFy.replace(pattern, '$1:').replace(/\uFFFF/g, '\\\"').replace(',', ',\n');
    //remove double quotes before beginning of phrase DataTypes and end of the same phrase
    stringMod = stringMod.replace(/\"DataTypes/g, 'DataTypes').replace(/\",allowNull/g, ',allowNull');
    stringMod = stringMod.replace(/\"basicFields/g, 'basicFields').replace(/\(\)\"/g, '()');


    let fileWrite = structureUp + stringMod + ',' + structureMiddle + foreignKey + structureDown

    await fs.writeFile('docs/files/back/models/postgres/' + camelCaseNameFile + '.js', fileWrite, {flag: 'w'}, function (err) {
      if (err) {
        return console.log(err);
      }
    });
  }

  // console.log('Make finish file: '+ file)
}

async function makeEndPoint(parsedFileName, camelCaseNameFile, nameWithSpace) {
  function structure() {
    return `import { ${camelCaseNameFile}Aplication } from './${camelCaseNameFile}Aplication';
import createValidate from './validates/create.validate';
import updateValidate from './validates/update.validate';

/**
* MiddleWare que obtem os ${nameWithSpace}(s) do banco de dados
* @private
*/
const get${camelCaseNameFile}MiddleWare = async (req, res) => { 
    const include = JSON.parse(req.query.include|| '[]') ;
    return new ${camelCaseNameFile}Aplication()
    .get(req.query.where, req.query.select, req.query.order, include, req.query.group)
    .then((success) => {
        res.api.send(success, res.api.codes.OK)
    })
    .catch((err) => {
        res.api.send(err, res.api.codes.INTERNAL_SERVER_ERROR)
    });
}

/**
* MiddleWare que obtem um ${nameWithSpace} por id do banco de dados
* @private
*/
const get${camelCaseNameFile}ByIdMiddleWare = async (req, res) => {
    const id = Number(req.params.id)
    return new ${camelCaseNameFile}Aplication()
    .getById(id, req.query.select)
    .then((success) => {
        if (success)
            res.api.send(success, res.api.codes.OK)
        else
            res.api.send({}, res.api.codes.OK)
    })
    .catch((err) => {
        res.api.send(err, res.api.codes.INTERNAL_SERVER_ERROR)
    });
}

/**
* MiddleWare que cria uma novo ${nameWithSpace} no banco de dados
* @private
*/
const create${camelCaseNameFile}MiddleWare = async (req, res) => {
    const body = req.body;
    return new ${camelCaseNameFile}Aplication()
    .create(body)
    .then((success) => {
        if (success)
            res.api.send(success, res.api.codes.CREATED)
        else
            res.api.send({}, res.api.codes.OK)
    })
    .catch((err) => {
        res.api.send(err, res.api.codes.INTERNAL_SERVER_ERROR)
    });
}

/**
* MiddleWare que atualiza um ${nameWithSpace} no banco de dados
* @private
*/
const update${camelCaseNameFile}MiddleWare = async (req, res) => {
    const id = Number(req.params.id);
    const {where} = req.query;
    const body = req.body;
    return new ${camelCaseNameFile}Aplication()
    .update(id, body, where)
    .then((success) => {
        if (success)
            res.api.send(success, res.api.codes.OK)
        else
            res.api.send({}, res.api.codes.OK)
    })
    .catch((err) => {
        res.api.send(err, res.api.codes.INTERNAL_SERVER_ERROR)
    });
}

/**
* MiddleWare que atualiza ou cria um ${nameWithSpace} no banco de dados
* @private
*/
const updateOrCreate${camelCaseNameFile}MiddleWare = async (req, res) => {
    const id = Number(req.params.id);
    const {where} = req.query;
    const body = req.body;
    return new ${camelCaseNameFile}Aplication()
    .upsert(id, body, where)
    .then((success) => {
        if (success)
            res.api.send(success, res.api.codes.OK)
        else
            res.api.send({}, res.api.codes.OK)
    })
    .catch((err) => {
        res.api.send(err, res.api.codes.INTERNAL_SERVER_ERROR)
    });
}

/**
* MiddleWare que remove um ${nameWithSpace} no banco de dados
* @private
*/
const delete${camelCaseNameFile}MiddleWare = async (req, res) => {
    const id = Number(req.params.id);
    const {where} = req.query;
    return new ${camelCaseNameFile}Aplication()
    .delete(id, where)
    .then((success) => {
        if (success)
            res.api.send(success, res.api.codes.OK)
        else
            res.api.send({}, res.api.codes.OK)
    })
    .catch((err) => {
        res.api.send(err, res.api.codes.INTERNAL_SERVER_ERROR)
    });
}

// swagger-jsdoc

/**
* Endpoints para o recurso ${nameWithSpace}
* @public
*/
const ${camelCaseNameFile}Routes = (route) => {

/**
 * @swagger
 * /api/${camelCaseNameFile.toLocaleLowerCase()}all:
 *   get:
 *     tags:
 *       - ${camelCaseNameFile}s
 *     description: Retorna todos os ${nameWithSpace}s
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         reponse: Response contendo no objeto data uma lista de ${nameWithSpace}s
 */
route.post('/api/${camelCaseNameFile.toLocaleLowerCase()}all', get${camelCaseNameFile}MiddleWare)

/**
 * @swagger
 * /api/${camelCaseNameFile.toLocaleLowerCase()}:
 *   get:
 *     tags:
 *       - ${camelCaseNameFile}s
 *     description: Retorna todos os ${nameWithSpace}s
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         reponse: Response contendo no objeto data uma lista de ${nameWithSpace}s
 */
route.get('/api/${camelCaseNameFile.toLocaleLowerCase()}', get${camelCaseNameFile}MiddleWare)

/**
 * @swagger
 * /api/${camelCaseNameFile.toLocaleLowerCase()}/:id:
 *   get:
 *     tags:
 *       - ${camelCaseNameFile}s
 *     description: Retorna a ${nameWithSpace}s pesquisada
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         reponse: Response contendo no objeto data uma lista de ${nameWithSpace}s
 */
route.get('/api/${camelCaseNameFile.toLocaleLowerCase()}/:id', get${camelCaseNameFile}ByIdMiddleWare)

/**
 * @swagger
 * /api/${camelCaseNameFile.toLocaleLowerCase()}:
 *   post:
 *     tags:
 *       - ${camelCaseNameFile}s
 *     description: Cria uma nova ${nameWithSpace}s
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         reponse: Response contendo no objeto que foi salvo da ${nameWithSpace}s
 */
route.post('/api/${camelCaseNameFile.toLocaleLowerCase()}', createValidate, create${camelCaseNameFile}MiddleWare)

/**
 * @swagger
 * /api/${camelCaseNameFile.toLocaleLowerCase()}/:id:
 *   put:
 *     tags:
 *       - ${camelCaseNameFile}s
 *     description: Altera os dados da ${nameWithSpace}s pelo id
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         reponse: Response contendo um array de string onde 1 - alterado 0 - não alterado
 */
route.put('/api/${camelCaseNameFile.toLocaleLowerCase()}/:id', updateValidate, update${camelCaseNameFile}MiddleWare)

/**
 * @swagger
 * /api/${camelCaseNameFile.toLocaleLowerCase()}:
 *   put:
 *     tags:
 *       - ${camelCaseNameFile}s
 *     description: Altera os dados da ${nameWithSpace}s pela query enviada
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         reponse: Response contendo um array de string onde 1 - alterado 0 - não alterado
 */
route.put('/api/${camelCaseNameFile.toLocaleLowerCase()}', updateValidate, update${camelCaseNameFile}MiddleWare)

/**
 * @swagger
 * /api/${camelCaseNameFile.toLocaleLowerCase()}UpdateOrCreate:
 *   put:
 *     tags:
 *       - ${camelCaseNameFile}s
 *     description: Altera os dados da ${nameWithSpace}s pela query enviada
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         reponse: Response contendo um array de string onde 1 - alterado 0 - não alterado
 */
route.put('/api/${camelCaseNameFile.toLocaleLowerCase()}UpdateOrCreate', updateValidate, updateOrCreate${camelCaseNameFile}MiddleWare)

/**
 * @swagger
 * /api/${camelCaseNameFile.toLocaleLowerCase()}/:id:
 *   delete:
 *     tags:
 *       - ${camelCaseNameFile}s
 *     description: Remove uma ${nameWithSpace}s baseada no id
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         reponse: Response contendo 1 - deletado 0 - não deletado
 */
route.delete('/api/${camelCaseNameFile.toLocaleLowerCase()}/:id', delete${camelCaseNameFile}MiddleWare)

/**
 * @swagger
 * /api/${camelCaseNameFile.toLocaleLowerCase()}:
 *   delete:
 *     tags:
 *       - ${camelCaseNameFile}s
 *     description: Renive yna ${camelCaseNameFile}s baseado na query enviada
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         reponse: Response contendo 1 - deletado 0 - não deletado
 */
route.delete('/api/${camelCaseNameFile.toLocaleLowerCase()}', delete${camelCaseNameFile}MiddleWare)
}

export default ${camelCaseNameFile}Routes
`;
  }

  let fileWrite = structure()
  const pathName = 'docs/files/back/api/' + parsedFileName.replace(/_/g, '-') + '/'
  ensureDirectoryExistence(pathName);
  await fs.writeFile(pathName + 'index' + '.js', fileWrite, {flag: 'w'}, function (err) {
    if (err) {
      return console.log(err);
    }
  });
}

async function makeInterfaceDatabase(parsedFileName, camelCaseNameFile) {
  function structure() {
    return `import { BaseCrudApplication } from '../../core/BaseCrudAplication'
import config from '../../config/sequelize/sequelize.conf';

export class ${camelCaseNameFile}Aplication extends BaseCrudApplication {

/**
  * Método construtor
  * @returns {void}
  * @public
  */
constructor() {
    let { ${camelCaseNameFile} } = config.postgres.DB;
    super(${camelCaseNameFile});
}

/**
 * Método que obtem o ${camelCaseNameFile}
 * @param {object} where - Filtro
 * @param select - Campos a serem selecionados
 * @param order - Ordenação
 * @param include - Relacionamentos
 * @param group - Agrupamento
 * @returns {${camelCaseNameFile}[]}
 * @public
 */
get(where, select, order, include, group) {
    return super.get(where, select, {order: order, include: include, group: group});
}

/**
 * Método que obtem a ${camelCaseNameFile} por id
 * @param {number} id${camelCaseNameFile} - Id da (${camelCaseNameFile})s
 * @param select - Filtro
 * @returns {${camelCaseNameFile}}
 * @public
 */
getById(id${camelCaseNameFile}, select) {
    return super.getById(id${camelCaseNameFile}, select)
} 

/**
* Método que cria um nova ${camelCaseNameFile}
* @param {object} ${camelCaseNameFile} - novos dados da (${camelCaseNameFile}) que será criado
* @returns {${camelCaseNameFile}}
* @public
*/
create(${camelCaseNameFile}) { 
    return super.create(${camelCaseNameFile})
}

/**
* Método que atualiza uma ${camelCaseNameFile}
* @param {number} id${camelCaseNameFile} - Id da ${camelCaseNameFile}
* @param {object} ${camelCaseNameFile} - dados da (${camelCaseNameFile}) que será atualizado
* @param Where
* @returns {${camelCaseNameFile}}
* @public
*/
update(id${camelCaseNameFile}, ${camelCaseNameFile}, Where) {
    return super.update(id${camelCaseNameFile}, ${camelCaseNameFile}, Where)
}

/**
* Método que remove um ${camelCaseNameFile}
* @param {number} id${camelCaseNameFile} - Id da (${camelCaseNameFile})
* @param Where
* @returns {boolean}
* @public
*/
delete(id${camelCaseNameFile}, Where) {
    return super.delete(id${camelCaseNameFile}, Where)
}

}
`;
  }

  let fileWrite = structure()

  await fs.writeFile('docs/files/back/api/' + parsedFileName.replace(/_/g, '-') + '/' + camelCaseNameFile + 'Aplication.js', fileWrite, {flag: 'w'}, function (err) {
    if (err) {
      return console.log(err);
    }
  });
}

function getTypeForValidate(field) {
  let attr = '';
  if (field['Tipo'] === 'varchar') {
    attr += 'string().';
    attr += `max(${field['Tamanho']}).`;
  } else if (field['Tipo'] === 'enum')
    attr += 'valid([' + field['Observacoes'] + ']).';
  else if (field['Tipo'] === 'number')
    attr += 'number().';
  else if (field['Tipo'] === 'date')
    attr += 'date().';
  else if (field['Tipo'] === 'boolean')
    attr += 'boolean().';
  else if (field['Tipo'] === 'text')
    attr += 'string().';
  else if (field['Tipo'] === 'json')
    attr += 'object().';
  else if (field['Tipo'] === 'jsonb')
    attr += 'object().';
  else if (field['Tipo'] === 'uuid')
    attr += 'string().';
  else if (field['Tipo'] === 'integer')
    attr += 'number().';
  else if (field['Tipo'] === 'decimal')
    attr += 'number().';
  else if (field['Tipo'] === 'float')
    attr += 'number().';
  else if (field['Tipo'] === 'double')
    attr += 'number().';
  else if (field['Tipo'] === 'real')
    attr += 'number().';
  else if (field['Tipo'] === 'time')
    attr += 'string().';
  else if (field['Tipo'] === 'timestamp')
    attr += 'date().';
  else if (field['Tipo'] === 'timestamp with time zone')
    attr += 'date().';
  else if (field['Tipo'] === 'timestamp without time zone')
    attr += 'date().';
  else if (field['Tipo'] === 'bit')
    attr += 'boolean().';
  else if (field['Tipo'] === 'varbit')
    attr += 'boolean().';
  else if (field['Tipo'] === 'money')
    attr += 'number().';
  else if (field['Tipo'] === 'bytea')
    attr += 'string().';
  else if (field['Tipo'] === 'inet')
    attr += 'string().';
  else if (field['Tipo'] === 'cidr')
    attr += 'string().';
  else
    attr += 'string().';

  return attr;
}

async function makeValidates(parsedFileName, camelCaseNameFile, fileName, data) {

  const structure = () => {
    return `import Joi from 'joi';
export default (req, res, next) => {
    return Joi
        .object(
`
  };

  const structureDown = () => {
    return `).validate(req.body, err => {
            if (err)
                return res.api.send(err.details, res.api.codes.UNPROCESSABLE_ENTITY);

            return next();
        });
} 
`
  };

  if (data) {
    //Fields of validation with Joi
    const fields = JSON.parse(data);
    let modelCreate = {};
    let modelUpdate = {};
    fields.forEach(function (field, index) {
      let baseModel = "Joi.";
      const nameAttribute = index === 0 ? field['Observacoes'] === 'primary key' ? 'id' : upLetter(field['Atributo']) : upLetter(field['Atributo']);
      baseModel += getTypeForValidate(field);
      // START Create
      // modelCreate[nameAttribute] = 'Joi.';
      modelCreate[nameAttribute] = baseModel;

      if (field['Obrigatoriedade'] === "sim" && index !== 0)
        modelCreate[nameAttribute] += 'required()'
      else
        modelCreate[nameAttribute] += 'optional()';

      // END Create


      //Start Update
      // const nameAttribute = upLetter(field['Atributo']);
      // modelUpdate[nameAttribute] = 'Joi.';
      modelUpdate[nameAttribute] = baseModel;
      modelUpdate[nameAttribute] += 'optional()';
      //End Update
    });

    modelCreate['unit'] = "Joi.string().min(1).max(150).required()";
    modelCreate['user'] = "Joi.string().min(1).max(150).required()";

    modelUpdate['situation'] = "Joi.string().optional()";
    modelUpdate['unit'] = "Joi.string().min(1).max(150).optional()";
    modelUpdate['user'] = "Joi.string().min(1).max(150).required()";

    const parseModelCreate = JSON.stringify(modelCreate);
    const parseModelUpdate = JSON.stringify(modelUpdate);
    //Clear parseModel of double quotes
    const parseModelCreateClear = parseModelCreate.replace(/\"/g, '');
    const parseModelUpdateClear = parseModelUpdate.replace(/\"/g, '');

    let fileWriteCreate = structure() + parseModelCreateClear + structureDown()
    let fileWriteUpdate = structure() + parseModelUpdateClear + structureDown()

    const namePath = 'docs/files/back/api/' + parsedFileName.replace(/_/g, '-') + '/validates/';
    ensureDirectoryExistence(namePath);
    await fs.writeFile(namePath + 'create.validate.js', fileWriteCreate, {flag: 'w'}, function (err) {
      if (err) {
        return console.log(err);
      }
    });
    await fs.writeFile(namePath + 'update.validate.js', fileWriteUpdate, {flag: 'w'}, function (err) {
      if (err) {
        return console.log(err);
      }
    });
  }
}

async function makeFrontModels(parsedFileName, camelCaseNameFile, fileName, data) {
  if (data) {
    const fields = JSON.parse(data);
    let doFile = false
    fields.forEach(function (field, index) {
      if (index === 0 && field['Observacoes'] === 'primary key')
        doFile = true
    });
    if (doFile) {
      const structure = (parsedFileName, fields) => {
        return `export class ${parsedFileName} ${fields}`;
      }

      let fields = JSON.parse(data)
      let inputs = {}
      fields.forEach(function (field, index) {

        const nameAttribute = index === 0 ? field['Observacoes'] === 'primary key' ? 'id' : upLetter(field['Atributo']) : upLetter(field['Atributo']);
        let tipo = ''
        field['Tipo'] === 'varchar' ? tipo = 'string' : field['Tipo'] === 'number' ? tipo = 'number' : field['Tipo'] === 'date' ? tipo = 'Date' : field['Tipo'] === 'boolean' ? tipo = 'boolean' : field['Tipo'] === 'enum' ? tipo = 'string' : tipo = 'any'
        inputs[nameAttribute] = tipo
      }.bind(this));

      let stringFy = JSON.stringify(inputs);
      let stringMod = stringFy.replace(/\"/g, '').replace(/,/g, ';');
      let fileWrite = structure(camelCaseNameFile, stringMod)

      let nameOfPath = 'docs/files/front/models/'
      await fs.writeFile(nameOfPath + parsedFileName + '.ts', fileWrite, {flag: 'w'}, function (err) {
        if (err) {
          return console.log(err);
        }
      });
    }
  }
}

async function makeFrontFileService(parsedFileName, camelCaseNameFile, fileName, data) {
  if (data) {
    const fields = JSON.parse(data);
    let doFile = false
    fields.forEach(function (field, index) {
      if (index === 0 && field['Observacoes'] === 'primary key')
        doFile = true
    });
    if (doFile) {

      const structure = () => {
        return `import {Injectable} from '@angular/core';
import {SarcService} from '../sarc-service/sarc-api.service';
import {HttpClient} from '@angular/common/http';
import {${camelCaseNameFile}} from '../../models/${parsedFileName}';

@Injectable({
  providedIn: 'root'
})
export class ${camelCaseNameFile}Service extends SarcService< ${camelCaseNameFile} > {
  constructor(http: HttpClient) {
    super('api/${camelCaseNameFile.toLocaleLowerCase()}', http)
  }
}
`;
      }

      let fileWrite = structure()

      let nameOfPath = 'docs/files/front/services/' + parsedFileName + '-service/'
      ensureDirectoryExistence(nameOfPath);
      await fs.writeFile(nameOfPath + camelCaseNameFile + 'Service.ts', fileWrite, {flag: 'w'}, function (err) {
        if (err) {
          return console.log(err);
        }
      });
    }
  }
}

async function makeFileFront(parsedFileName, className, fileName, data) {
  if (data) {
    const fields = JSON.parse(data);
    let doFile = false
    fields.forEach(function (field, index) {
      if (index === 0 && field['Observacoes'] === 'primary key')
        doFile = true
    });
    if (doFile) {
      const structure = (inputs, datatable, form, select, setLoadSuggest, importConstructor, importService, includeVariables, reMapToGetIdSuggest, reMapToGetValue, mapToGetIdSelect) => {
        return `import { Component } from '@angular/core';
import { MessageService } from '../../../services/message/message.service';
import { WebixInput } from 'src/app/classes/webix.input';
import { WebixToolbar } from 'src/app/classes/webix.toolbar';
import { WebixSelect } from 'src/app/classes/webix.select';
import { WebixDatatable } from 'src/app/classes/webix.datatable';
import { ${className}Service } from '../../services/${parsedFileName}-service/${className}Service';
import { QuerysBuilderService } from '../../../services/querys-builder/querys-builder.service';
import { WebixService } from '../../../services/webix/webix.service';
import { WebixPaginate } from 'src/app/classes/webix.paginate';
import { WebixVideo } from 'src/app/classes/webix.video';
import { WebixTextarea } from 'src/app/classes/webix.textarea';
import { ProfileService } from 'src/app/services/profile/profile.service';
import { loadingShow, loadingHide } from 'src/app/classes/Util';
import { GoogleSheetsService } from 'src/app/services/google-sheets/google-sheets.service';
import * as moment from 'moment';
import { AtivoInativoFilter } from '../../enum/AtivoInativo';
import { LocalStorageService } from 'src/app/services/local-storage/local-storage.service';
import { I18nService } from 'src/app/services/i18n/i18n.service';
import {WebixSelect} from 'src/app/classes/webix.select';
import {WebixSuggest} from "../../../classes/webix.suggest";
import {WebixInputDate} from "../../../classes/webix.inputDate";
${importService}

@Component({
  selector: 'app-${parsedFileName}',
  templateUrl: './${parsedFileName}.component.html',
  styleUrls: ['./${parsedFileName}.component.scss']
})
export class ${className}Component {
  /*
   Declaração das variaveis do Webix, as mesmas são setadas pelo serviço WebixService
 */
  webixUi: any;
  webix: any;
  $$: any;
  ${includeVariables} 

  /*
    Esse array faz a busca nas informações que estão no banco, é o mesmo select que se faz na tabela
  */
  select = [${select} 'unit', 'user', 'situation', 'createdAt', 'updatedAt'];

  /*
    Declara a páginação 
  */
  paginate = new WebixPaginate('pagination', { size: 50, group: 5 });

  /*
    Insere todo o array que existe no datatable para eventuais pesquisas futuras
  */
  dataAll: any = [];

  /*
    Id do formulário é colocado numa variável para poder ser reutilizado no código abaixo
  */
  formId: string = 'Frm${className}';

  /*
    Id do accordion onde tem o formulário é colocado numa variável para poder ser utilizado no código abaixo
  */
  accordionFormId: string = 'accordionItemForm${className}';

  /**
  * Variavel de leitura/edição dos campos
  */
  readonly = true;

  AtivoInativoFilter = AtivoInativoFilter.map(a => a.value = this.translate(a.value));
  
  /*
   Declaração dos campos para montar o formulário
  */
  ${inputs}

  /*
    Declaração da barra de tarefas que fica localizado no topo
  */
  toolbar = new WebixToolbar('toolbar', this.formId, [
    { view: "icon", icon: "fa fa-file-text-o", tooltip: "Novo", click: () => { this._cancelOrClearConfirm(true) } },
    { view: "icon", icon: "fa fa-floppy-o", tooltip: "Salvar", click: () => this._save() },
    { view: "icon", icon: "fa fa-eraser", tooltip: "Limpar", click: () => this._cancelOrClearConfirm() },
    { view: "icon", icon: "fa fa-file-excel-o", tooltip: "Exportar", click: async () => { await this._exportSheets() } },
    { view: "icon", icon: "fa fa-refresh", tooltip: "Atualizar", click: () => { this._loadData(); this._messageService.show('Atualizado com sucesso!', 'success') } },
    { view: "icon", icon: "fa fa-file-video-o", tooltip: "Tutorial", click: () => { this._loadTutorial() } },
  ])

  /*
    Declaração da tabela
  */
  datatable = new WebixDatatable(
    'dt${className}',
    this.formId,
    [
        ${datatable}
    ],
    {
      pager: this.paginate.getId(),
      footer: true,
      onClick: {
        view: (ev, elem) => {
          this.viewElement(elem.row);
        },
        edit: (ev, elem) => {
          this._checkFormDuty(() => {
            const item = this.dataAll.find(select => select.id === elem.row);
            this.$$(this.accordionFormId).expand();
            this.$$(this.inputId.getId()).show();
            this.$$(this.inputId.getId()).setValue(item.id);
            this.$$(this.inputSituation.getId()).show();
            this._edit(item);
          });
        },
        remove: (ev, elem) => {
          this._checkFormDuty(() => {
            const item = this.dataAll.find(select => select.id === elem.row);
            this.webix.confirm(this.translate('Tem certeza que deseja remover o registro ') + item.id + ' - ' + item.description + '?', (value) => {
              if (value) {
                this.remove(item);
              }
            })
          })
        }
      }
    }
  );

  /*
    Declaração do video tutorial
  */
  video = new WebixVideo('tutorial', "assets/videotutorial1.webm", () => { this.$$(this.video.getId()).close() })

  constructor(
    private _webixService: WebixService,
    private _profileService: ProfileService,
    private _i18nService: I18nService,
    private _googleSheetsService: GoogleSheetsService,
    private _querysBuilderService: QuerysBuilderService,
    private _localStorageService: LocalStorageService,
    private _messageService: MessageService,
    private service: ${className}Service,
    ${importConstructor}
    ) {
    this.init()
  }

  /**
     * Inicia o processo do component, é chamado pelo constructor
     * Essa função é separada para caso precisar chamar novamente
     */
  async init() {
    this.webix = this._webixService.getWebix();
    this.$$ = this._webixService.get$$();
    this.datatable.footerInit();
    await this.setWebixUi();
  }

  /**
   * Configura a disposição com os componentes webix utilizando as variaveis declaradas acima
   */
  async setWebixUi() {
    this.webix.ready(async () => {
      this.webixUi = this.webix.ui({
        rows: [
          this.toolbar.getField(),
          {
            view: "accordion",
            multi: true,
            css: "accordion",
            padding: {
              top: 25,
              right: 25,
              left: 25,
              bottom: 25
            },
            rows: [
              {
                view: "accordionitem",
                id: this.accordionFormId,
                header: this.translate("Cadastro"),
                collapsed: true,
                body: {
                  rows: [
                    this.setFormAgentInputs()
                  ]
                }
              },
              { height: 15 },
              {
                view: "accordionitem",
                header: this.translate("Pesquisa"),
                body: {
                  padding: {
                    top: 15
                  },
                  rows: [
                    this.datatable.getField(),
                    {
                      cols: [
                        this.paginate.getField(),
                      ]
                    }
                  ]
                }
              },
            ]
          }
        ]
      });
      ${setLoadSuggest !== "" ? 'await this.loadSuggests();' : ''}
      await this._loadData();
    })
  }

  /**
   * Retorna o objeto com as variaveis do formulário para dentro do webixUi
   */
  setFormAgentInputs() {
    return {
      id: this.formId,
      view: 'form',
      rows: [ 
        ${form}
      ]
    }
  }

  /**
   * Ao ser chamada ela recarrega todas as informações fazendo uma nova requisição na API
   */
  async _loadData() {
    loadingShow();
    const query = this._querysBuilderService.getSelect(this.select);
    const result: any = await this.service.get(query).toPromise();
    if(result.data.length > 0) {
        this.dataAll = result.data${reMapToGetValue}.reverse();
        this.datatable.setData(this.dataAll);
        this.$$(this.accordionFormId).collapse();
    }
    loadingHide();
    this.subscribeEvents();
  }
  
  ${setLoadSuggest}

  subscribeEvents() {
    this.$$(this.datatable.getId()).attachEvent("onAfterSelect", (elem) => {
      if (this.$$(this.formId).isEnabled() && elem.column !== 'actions') {
        this.viewElement(elem.row);
      } else if (elem.column !== 'actions') {
        this.viewElement(elem.row);
      }
    });
  }

  viewElement(row) {
    if (!this.readonly) {
      if (this.$$(this.formId).isDirty() && this.$$(this.formId).isEnabled()) {
        this.webix.confirm(this.translate('Tem certeza que deseja cancelar a edição/inclusão para o registro ativo?'), (value) => {
          if (value) {
            this.showView(row);
          }
        })
      } else {
        this.showView(row);
      }
    } else {
      this.showView(row);
    }
  }

  showView(row) {
    this.setReadOnly(true);
    const item = this.dataAll.find(select => select.id === row);
    const form = this.$$(this.formId)
    form.setValues(item);
    this.$$(this.inputId.getId()).show();
    this.$$(this.inputId.getId()).setValue(item.id);
    this.$$(this.inputSituation.getId()).show();
    this.$$(this.accordionFormId).expand();
    form.setDirty(false);
  }
  /*
  * Desativa o formulário conforme a regra de negocio necessaria
  */
  setReadOnly(value) {
    this.$$(this.formId).clearValidation();
    this.readonly = value;
    const elements = this.$$(this.formId).elements;
    for (let item in elements) {
      if (elements[item].data.view === 'select') {
        this.$$(elements[item].data.id).define('disabled', value);
        this.$$(elements[item].data.id).refresh();
      } else {
        this.$$(elements[item].data.id).define('readonly', value);
        this.$$(elements[item].data.id).refresh();
      }
    }
    this.$$(this.accordionFormId).expand();
  }

  /*
  * Torna o video tutorial visivel
  */
  _loadTutorial() {
    this.webix.ui(this.video.getField()).show();
  }

  /**
   * Inicia o processo de salvar e validar as informações do formulário
   */
  _save = () => {
    const form = this.$$(this.formId);
    const item = form.getValues();
    const isValid = form.validate();

    if (isValid) {
      ${mapToGetIdSuggest}
      if (item.id > 0) {
        this._update(item);
      } else {
        this._create(item);
      }
      this._loadData();
    } else {
      this._messageService.show('Formulário Inválido', 'error');
    }
  }

  /*
  * Envia os valores para API atualizar
  */
  _update(item) {
    delete item.deletedAt;

    if (item.createdAt)
      delete item.createdAt

    if (item.updatedAt)
      delete item.updatedAt

    this.service.put(item.id, item).subscribe(
      () => _success(),
      (error) => _error(error)
    )

    const _success = () => {
      const datatable = this.$$(this.datatable.getId());
      datatable.updateItem(item.id, item);
      const index = this.dataAll.findIndex( select => select.id == item.id);
      this.dataAll[index] = item;
      this._messageService.show('Atualizado com sucesso', 'success');
      this._cancelOrClear();
      this._loadData();
    }

    const _error = (error) => {
      console.error(error)
      this._messageService.show('Erro ao atualizar', 'error');
    }
  }

  /**
   * Envia os valores para API salvar
   */
  _create(item) {
    delete item.id;
    delete item.situation;

    this.service.post(item).subscribe(
      (success) => _success(success),
      (error) => _error(error)
    );

    const _success = (success) => {
      this.$$(this.datatable.getId()).add(success.data, 0);
      this.dataAll.unshift(success.data);
      this._messageService.show('Cadastrado com sucesso', 'success');
      this._cancelOrClear();
      this._loadData();
    }

    const _error = (error) => {
      console.error(error)
      this._messageService.show('Erro ao cadastrar', 'error');
    }
  }

  /*
  * Inicia o processo de edição, inserindo as informações no formulário
   */
  _edit(item) {
    const form = this.$$(this.formId)
    form.setValues(item);
    this.setReadOnly(false);
  }

  /**
   * Confirma se realmente é para remover e exclui as informações na API
   */
  remove(item) {
    this.service.delete(item.id).subscribe(
      () => _success(),
      (error) => _error(error)
    )

    const _success = () => {
      this.$$(this.datatable.getId()).remove(item.id);
      this._cancelOrClear();
      this._messageService.show('Removido com sucesso', 'success');
      this.$$(this.accordionFormId).collapse();
    }

    const _error = (error) => {
      console.error(error)
      this._messageService.show('Erro ao remover', 'success');
    }
  }

  /*
 * Verifica se o formulario esta sujo antes de realizar a ação
 */
  _checkFormDuty(callback) {
    if (this.$$(this.formId).isDirty() && this.$$(this.formId).isEnabled()) {
      this.webix.confirm(this.translate('Tem certeza que deseja cancelar a edição/inclusão para o registro ativo?'), (value) => {
        if (value) {
          callback();
        }
      })
    } else {
      callback();
    }
  }

  /**
   * Cancela/Limpa o formulário
   */
  _cancelOrClear() {
    this.$$(this.formId).clearValidation();
    this.$$(this.formId).clear();
    this.$$(this.inputId.getId()).hide();
    this.$$(this.inputSituation.getId()).hide();
    this.setReadOnly(true)
  }

  _cancelOrClearConfirm(insertMode: boolean = false, callback = null) {
    const enabled = this.$$(this.formId).isEnabled();
    const dirty = this.$$(this.formId).isDirty();

    if (dirty && enabled) {
      this.webix.confirm(this.translate('Tem certeza que deseja limpar o formulário atual?'), (value) => {
        if (value) {
          this._cancelOrClear();

          if (insertMode) {
            this.setReadOnly(false);
          }

          if (callback) {
            callback();
          }
        }
      });
    } else if ((!dirty && enabled) || !enabled) {
      this._cancelOrClear();

      if (insertMode) {
        this.setReadOnly(false);
      }

      if (callback) {
        callback();
      }
    }
  }



  /**
    * Exportar para o Sheets
    */
  async _exportSheets() {
    if (!this.dataAll) {
      this._messageService.show('Nada a exportar', 'error');
      return;
    }

    loadingShow();

    this._googleSheetsService.createSheetFromDatatableAndOpen(this.$$(this.datatable.getId()),
      \`Registros - ${parsedFileName} \${moment(new Date()).format('DD/MM/YYYY hh:mm:ss')}\`,
      \`Exportacao/SAIA/Registros\`,
      this._localStorageService.getItem('user').email,
      'Locais', undefined, undefined, () => loadingHide(), () => {
        loadingHide();
        this._messageService.show('Erro ao gerar o relatório.', 'error');
      }, { ignoreColumnFooter: true });
  }
  
    /**
    * Exportar para o Excel
    */
    translate(key) {
        return this._i18nService.translate(key);
    }
}`;
      }


      let fields = JSON.parse(data)
      let fileEnum = []
      let inputs = ``
      let datatable = ``
      let form = ``;
      let cont = 0;
      let close = true
      let select = '';
      let loadSuggest = ""
      let importConstructor = ""
      let fileImports = ""
      let includeVariables = ""
      let mapToGetIdSuggest = ""
      let mapToGetValue = ""
      let mapToGetIdSelect = ""

      fields.forEach(function (field, index) {

        const nameAttribute = index === 0 ? field['Observacoes'] === 'primary key' ? 'id' : upLetter(field['Atributo']) : upLetter(field['Atributo']);
        const nameAttributeAllUp = upAllFistLetter(index === 0 ? field['Observacoes'] === 'primary key' ? 'id' : upLetter(field['Atributo']) : upLetter(field['Atributo']));
        const displayName = upSpaceLetter(field['displayName'] || field['Atributo']);
        select += ` '${nameAttribute}',`
        if (cont++ === 0) {
          close = false
          form += `{ cols: [\n`;
        }
        if (index === 0) {
          form += `this.inputId.getField(),\n`;
          //regex to remove break lines
          // const parten = /\n/g;
          datatable += `{ id: "${nameAttribute}", header: [this.translate("${displayName}"), { content: "textFilter" }], fillspace: false, sort: "${field['Tipo'] !== "number" ? "text" : "number"}" },\n`;
          //TODO INSERT TITLE
          inputs += `inputId = new WebixInput('${nameAttribute}', this.translate('${displayName}'), { required: ${(field['Obrigatoriedade'] === 'sim')} }, { width: 200, disabled: true, ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: this.translate('${field['Descricao'].replace(/\n/g, '')}') });\n`;
        } else {
          form += `this.input${nameAttributeAllUp}.getField(),\n`;
          if(field['Tipo'] !== 'enum')
            datatable += `{ id: "${nameAttribute}", header: [this.translate("${displayName}"), { content: "${field['Tipo'] !== "number" ? "textFilter" : "numberFilter"}" }], fillspace: true, sort: "${field['Tipo'] !== "number" ? "text" : "number"}" },\n`;
          else
            datatable += `{ id: "${nameAttribute}", header: [this.translate("${displayName}"), { content: "textFilter" }], fillspace: true, sort: 'text', format: (value) => { return formatEnum(value, ${nameAttribute}Enum) } },\n`;
          if (field['Tipo'] === 'date') {
            inputs += `input${nameAttributeAllUp} = new WebixInputDate('${nameAttribute}', this.translate('${displayName}'), { required: ${(field['Obrigatoriedade'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: this.translate('${field['Descricao'].replace(/\n/g, '')}') });\n`;
            mapToGetValue += `item.${nameAttribute} = new Date(item.${nameAttribute});\n`;
          } else if (field['Tipo'] === 'enum') {
            // START DEFINE O ENUM PARA CRIACAO DO ARQUIVO
            fileEnum.push([nameAttribute, `export const ${nameAttribute}EnumFilter = ${
              JSON.stringify(field['Observacoes'].split(',').map(i => {
              return {id: i.replace(/'/g, ''), value: i.replace(/'/g, '')}
            }))}; \n/*${field['Descricao']}*/\n
            export const ${nameAttribute}Enum = ${nameAttribute}EnumFilter.filter((item) => {
              if (item.id !== null) return {...item}
            })
            `]);

            fileImports += `import {${nameAttribute}Enum} from "../../../enum/${nameAttribute}.enum";\n`;

            // END DEFINE O ENUM PARA CRIACAO DO ARQUIVO

            inputs += `input${nameAttributeAllUp} = new WebixSelect('${nameAttribute}', this.translate('${displayName}'), ${nameAttribute}Enum, { required: ${(field['Obrigatoriedade'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: this.translate('${field['Descricao'].replace(/\n/g, '')}') });\n`;
            //filter datatable by enum
            mapToGetValue += `const ${nameAttribute}Id = ${nameAttribute}Enum.find( select => select.id == item.${nameAttribute});
                                 ${nameAttribute}Id? item.${nameAttribute} = ${nameAttribute}Id.value : null;\n`;
            mapToGetIdSelect += `const ${nameAttribute}Value = ${nameAttribute}Enum.find( select => select.value == item.${nameAttribute});
                                 ${nameAttribute}Value? item.${nameAttribute} = ${nameAttribute}Value.id : null;\n`;
          } else if (field['Observacoes'] === 'foreign key') {
            inputs += `input${nameAttributeAllUp} = new WebixSuggest('${nameAttribute}', this.translate('${displayName}'), { required: ${(field['Obrigatoriedade'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: this.translate('${field['Descricao'].replace(/\n/g, '')}') });\n`;

            const nameService = field['Tabela'].replace(' ', '')
            //Replace up letter for same letter lower and underscore not can start with underscore
            const nameServiceAllUp = nameService.charAt(0).toLowerCase() + nameService.slice(1).replace(/([A-Z])/g, '-$1').toLowerCase();
            fileImports += `import { ${nameService}Service } from '../../services/${nameServiceAllUp}-service/${nameService}Service';\n`;

            includeVariables += `private ${nameAttribute}Data: any = [];\n`;
            mapToGetIdSuggest += `this.suggestValues.${nameAttribute} ? item.${nameAttribute} = this.suggestValues.${nameAttribute} : item.${nameAttribute} = this.${nameAttribute}Data.find(select => select.value == item.${nameAttribute}).id;\n`;
            if (importConstructor.indexOf(`private _${nameService}Service`) === -1) {
              importConstructor += `private _${nameService}Service: ${nameService}Service,\n`;
            }
            //    Suggest
            //  text //Start load ${nameService} not exit in loadSuggest
            if (loadSuggest.indexOf(`Start load ${nameService}`) === -1) {
              loadSuggest += `//Start load ${nameService}
                            let ${nameService}Resp = await this._${nameService}Service.get(simpleWhere).toPromise();
                            if (${nameService}Resp.data.length > 0) {
                                this.${nameAttribute}Data = ${nameService}Resp.data.map((${nameService}) => {
                                    return {
                                        id: ${nameService}.id,
                                        value: ${nameService}.desc${nameAttribute.replace('cod', '')}
                                    };
                                });
                                await this.input${nameAttributeAllUp}.setSuggest(this.${nameAttribute}Data, {
                                    onValueSuggest: (item) => {
                                        this.suggestValues.${nameAttribute} = item.id;
                                    },
                                });
                            }
                            //End load ${nameService}\n
                            `
            }
            //filter in this.${nameAttribute}Data for ${nameAttribute}
            mapToGetValue += `const ${nameAttribute} = this.${nameAttribute}Data.find( select => select.id == item.${nameAttribute});
                            ${nameAttribute}? item.${nameAttribute}= ${nameAttribute}.value : '';\n`;
          } else {
            inputs += `input${nameAttributeAllUp} = new WebixInput('${nameAttribute}', this.translate('${displayName}'), { required: ${(field['Obrigatoriedade'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: this.translate('${field['Descricao'].replace(/\n/g, '')}') });\n`;
          }

        }
        if (cont === 3) {
          close = true
          cont = 0;
          form += `] },`;
        }
      }.bind(this));
      form += `\nthis.inputSituation.getField()`
      if (!close) {
        form += `] },\n`;
      }
      inputs += `inputSituation = new WebixSelect('situation', this.translate('Situação'), AtivoInativoFilter, { required: false }, { width: 120, disabled: false, hidden: true });\n`;
      includeVariables += `private suggestValues: any = {};\n`;
      let setLoadSuggest = ""
      loadSuggest ? setLoadSuggest = `async loadSuggests() {
                    const simpleWhere = "where="+JSON.stringify({situation: 'A'});\n
                    ${loadSuggest}\n
                    loadingHide();\n
                }` : '';

      const reMapToGetIdSuggest = `
                if(this.suggestValues) {
                    ${mapToGetIdSuggest}
                }\n
                `
      const reMapFoDataTable = `.map( (item) => {
                    ${mapToGetValue}
                    return item;
                })`
      let fileWrite = structure(inputs, datatable, form, select, setLoadSuggest, importConstructor, fileImports, includeVariables, reMapToGetIdSuggest, reMapFoDataTable, mapToGetIdSelect)

      //Start write file
      let nameOfPath = 'docs/files/front/tables/' + parsedFileName + '/'
      ensureDirectoryExistence(nameOfPath);
      await fs.writeFile(nameOfPath + parsedFileName + '.component.ts', fileWrite, {flag: 'w'}, function (err) {
        if (err) {
          return console.log(err);
        }
      });

      //      createfile: './${parsedFileName}.component.html',
      await fs.writeFile(nameOfPath + parsedFileName + '.component.html', '', {flag: 'w'}, function (err) {
        if (err) {
          return console.log(err);
        }
      });

      //      createfile: './${parsedFileName}.component.scss'
      await fs.writeFile(nameOfPath + parsedFileName + '.component.scss', '', {flag: 'w'}, function (err) {
        if (err) {
          return console.log(err);
        }
      });

      // createfile: './${parsedFileName}Enum.ts'
      fileEnum.forEach((file) => {
        fs.writeFile('docs/files/front/enum/' + file[0] + '.enum.ts', file[1], {flag: 'w'}, function (err) {
          if (err) {
            return console.log(err);
          }
        });
      });


    }
  }
}

async function makeFileFrontReport(parsedFileName, className, fileName, nameWithSpace, data) {
  if (data) {
    const fields = JSON.parse(data);
    let doFile = false
    fields.forEach(function (field, index) {
      if (index === 0 && field['Observacoes'] === 'primary key')
        doFile = true
    });
    if (doFile) {

      const structureScreen = (objectAll) => {
        return `import {Component} from '@angular/core';
import {MessageService} from '../../../../../services/message/message.service';
import {WebixInput} from 'src/app/classes/webix.input';
import {WebixToolbar} from 'src/app/classes/webix.toolbar';
import {WebixSelect} from 'src/app/classes/webix.select';
import {WebixDatatable} from 'src/app/classes/webix.datatable';
import {DocumentoService} from '../../../../services/documento-service/DocumentoService';
import {QuerysBuilderService} from '../../../../../services/querys-builder/querys-builder.service';
import {WebixService} from '../../../../../services/webix/webix.service';
import {WebixPaginate} from 'src/app/classes/webix.paginate';
import {WebixVideo} from 'src/app/classes/webix.video';
import {ProfileService} from 'src/app/services/profile/profile.service';
import {formatEnum, loadingHide, loadingShow} from 'src/app/classes/Util';
import {GoogleSheetsService} from 'src/app/services/google-sheets/google-sheets.service';
import {AtivoInativoFilter} from '../../../../enum/AtivoInativo';
import {LocalStorageService} from 'src/app/services/local-storage/local-storage.service';
import {I18nService} from 'src/app/services/i18n/i18n.service';
import {WebixSuggest} from "../../../../../classes/webix.suggest";
import {ItemDocumentalService} from '../../../../services/item-documental-service/ItemDocumentalService';
import {TipoOrgaoService} from '../../../../services/tipo-orgao-service/TipoOrgaoService';
import {WebixButton} from "../../../../../classes/webix.button";
import {WebixInputDateRange} from "../../../../../classes/webix.inputDateRange";
import {WebixMultiCombo} from "../../../../../classes/webix.multiCombo";
import {WebixInputDate} from "../../../../../classes/webix.inputDate";
${objectAll.fileImports}

@Component({
  selector: 'app-${parsedFileName}-report',
  templateUrl: './${parsedFileName}-report.component.html',
  styleUrls: ['./${parsedFileName}-report.component.scss']
})
export class ${className}ReportComponent {
  /*
   Declaração das variaveis do Webix, as mesmas são setadas pelo serviço WebixService
 */
  webixUi: any;
  webix: any;
  $$: any;
  ${objectAll.includeVariables}
  
  /*
    Esse array faz a busca nas informações que estão no banco, é o mesmo select que se faz na tabela
  */
  select = [${objectAll.select} 'unit', 'user', 'situation', 'createdAt', 'updatedAt'];
  /*
    Declara a páginação
  */
  paginate = new WebixPaginate('pagination', {size: 50, group: 5});
  /*
    Insere todo o array que existe no datatable para eventuais pesquisas futuras
  */
  dataAll: any = [];
  /*
    Id do formulário é colocado numa variável para poder ser reutilizado no código abaixo
  */
  formId: string = 'FrmDocumento';
  /*
    Id do accordion onde tem o formulário é colocado numa variável para poder ser utilizado no código abaixo
  */
  accordionFormId: string = 'accordionItemFormDocumento';
  /**
   * Variavel de leitura/edição dos campos
   */
  readonly = true;
  /**
   * Definições de input para o filtro
   */
  ${objectAll.inputs}
  
  AtivoInativoFilter = AtivoInativoFilter.map(a => a.value = this.translate(a.value));
  
  /*
    Declaração do video tutorial
  */
  video = new WebixVideo('tutorial', "assets/videotutorial1.webm", () => {
    this.$$(this.video.getId()).close()
  })
  /*
    Declaração da barra de tarefas que fica localizado no topo
  */
  toolbar = new WebixToolbar('toolbar', this.formId, [
    {
      tooltip: "Report", view: "icon", icon: "fa fa-file-pdf-o", click: () => {
        this.generateReport();
      }
    },
    {
      view: "icon", icon: "fa fa-refresh", tooltip: "Atualizar", click: () => {
        this._loadData();
        this._messageService.show('Atualizado com sucesso!', 'success')
      }
    },
    {
      view: "icon", icon: "fa fa-file-video-o", tooltip: "Tutorial", click: () => {
        this._loadTutorial()
      }
    },
  ])
  
  /*
    Declaração da tabela
  */
  datatable = new WebixDatatable(
    'dt${className}Report',
    this.formId,
    [
      ${objectAll.datatable}
    ],
    {
      pager: this.paginate.getId(),
      footer: true,
      onClick: {
      }
    },
    []
  );

  constructor(
    private _webixService: WebixService,
    private _profileService: ProfileService,
    private _i18nService: I18nService,
    private _googleSheetsService: GoogleSheetsService,
    private _querysBuilderService: QuerysBuilderService,
    private _localStorageService: LocalStorageService,
    private _messageService: MessageService,
    private service: ${className}Service,
    ${objectAll.importConstructor}
  ) {
    this.init()
  }

  /**
   * Inicia o processo do component, é chamado pelo constructor
   * Essa função é separada para caso precisar chamar novamente
   */
  async init() {
    this.webix = this._webixService.getWebix();
    this.$$ = this._webixService.get$$();
    this.datatable.footerInit();
    await this.setWebixUi();
  }

  /**
   * Configura a disposição com os componentes webix utilizando as variaveis declaradas acima
   */
  async setWebixUi() {
    this.webix.ready(async () => {
      this.webixUi = this.webix.ui({
        rows: [
          this.toolbar.getField(),
          {
            view: "accordion",
            multi: true,
            css: "accordion",
            padding: {
              top: 25,
              right: 25,
              left: 25,
              bottom: 25
            },
            rows: [
              {
                view: "accordionitem",
                id: this.accordionFormId + "Filter",
                header: this.translate("Filtro"),
                collapsed: true,
                body: {
                  rows: [
                    this.setFormFilterInputs()
                  ]
                }
              },
              {height: 15},
              {
                view: "accordionitem",
                header: this.translate("Pesquisa"),
                body: {
                  padding: {
                    top: 15
                  },
                  rows: [
                    this.datatable.getField(),
                    {
                      cols: [
                        this.paginate.getField(),
                      ]
                    }
                  ]
                }
              },
            ]
          }
        ]
      });

      ${objectAll.setLoadSuggest !== "" ? 'await this.loadSuggests();' : ''}
      await this._loadData();
    })
  }

  /**
   * Retorna o objeto com as variaveis do formulário para dentro do webixUi
   */
  setFormFilterInputs() {
    return {
      id: this.formId + "Filter",
      view: 'form',
      rows: [
        ${objectAll.form}
      ]
    }
  }

  /**
   * Ao ser chamada ela recarrega todas as informações fazendo uma nova requisição na API
   */
  async _loadData() {
    loadingShow();

    let query = this._querysBuilderService.getSelect(this.select);
    
    ${objectAll.getValueInput}
    let where: any = {};
    ${objectAll.SetValueWhere}
    
    let include = [${objectAll.includeQuery}]
    
    query += "&where=" + JSON.stringify(where);
    query += "&include=" + JSON.stringify(include);
    
    const result: any = await this.service.get(query).toPromise();
    
    if(result.data.length > 0) {
      this.dataAll = result.data${objectAll.reMapFoDataTable}.reverse();
      this.datatable.setData(this.dataAll);
    } else {
      this.dataAll = [];
    }
    this.datatable.setData(this.dataAll);
    loadingHide();
  }

  ${objectAll.setLoadSuggest}

  showView(row) {
    const item = this.dataAll.find(select => select.id === row);
    const form = this.$$(this.formId)
    form.setValues(item);
    this.$$(this.inputId.getId()).show();
    this.$$(this.inputId.getId()).setValue(item.id);
    this.$$(this.inputSituation.getId()).show();
    this.$$(this.accordionFormId).expand();
    form.setDirty(false);
  }

  /*
  * Torna o video tutorial visivel
  */
  _loadTutorial() {
    this.webix.ui(this.video.getField()).show();
  }

  /**
   * Exportar para o Excel
   */
  translate(key) {
    return this._i18nService.translate(key);
  }

  private generateReport() {
    if (this.dataAll.length > 0) {
      this._localStorageService.setItem('reportItem', this.dataAll);
      window.open('/blank/application/tables/layout_${fileName}_report', '_blank')
    } else
      this._messageService.show('Nenhum registro selecionado, revise os filtros e tente novamente.', 'error');
  }
}
`;
      }

      const structureReport = () => {
        return `
        import {Component, OnInit} from '@angular/core';
import * as moment from 'moment';
import {LocalStorageService} from 'src/app/services/local-storage/local-storage.service';

@Component({
  selector: 'app-layout-${parsedFileName}-report',
  templateUrl: './layout-${parsedFileName}-report.component.html',
  styleUrls: ['./layout-${parsedFileName}-report.component.scss']
})
export class Layout${className}ReportComponent {
  report = {data: [], title: ''};
  moment = moment

  constructor( private _localStorageService: LocalStorageService) {
    this.generate${className}Report();
  }

  private generate${className}Report() {
    let report = this._localStorageService.getItem('reportItem');
    if(report) {
      this.report.data = report
      this.report.title = 'Relacão de ${nameWithSpace} - '+moment().format('DD/MM/YYYY HH:mm');
      this._localStorageService.removeItem('reportItem');
    }
  }
}
`;
      }

      const structureHtmlReport = (htmlReport) => {
        return `
        <!DOCTYPE HTML>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{report.title || 'None'}}</title>
  <style>
    @page {
      size: 7in 9.25in;
      margin: 27mm 16mm 27mm 16mm;
    }
  </style>
</head>


<body>
  <header>
    <div
      style="background: #ffffff; width: 100%; height: 55px; color: #000000; display: flex; justify-content: space-between">
      <h1 class="title"><strong>{{report.title}}</strong></h1>
      <img src="./assets/logo_48.png" alt="Aperam BioEnergia" height="35">
    </div>
  </header>

  <div style="border-top: 3px solid #c8c8"></div>
  <div *ngFor="let item of report.data; let i = index">
      <div style="    display: flex; flex-direction: row; justify-content: space-between; flex-wrap: nowrap;">
          <div class="positionItem">
            <div *ngIf="i==0" style="font-weight: bold">ID</div>
            <div class="positionVaue">{{item.id}}</div>
          </div>
          ${htmlReport}
    </div>
    <div style="border-top: 3px solid #c8c8"></div>
  </div>
</body>

</html>

`;
      }


      let fields = JSON.parse(data)
      let fileEnum = []
      let inputs = ``
      let datatable = ``
      let form = ``;
      let cont = 0;
      let close = true
      let select = '';
      let loadSuggest = ""
      let getValueInput = ""
      let SetValueWhere = ""
      let importConstructor = ""
      let fileImports = `import { ${className}Service } from '../../../../services/${parsedFileName}-service/${className}Service';\n`
      let includeVariables = ""
      let includeQuery = "\n"
      let mapToGetIdSuggest = ""
      let mapToGetValue = ""
      let mapToGetIdSelect = ""
      let htmlReport = ""

      fields.forEach(function (field, index) {

        const nameAttribute = index === 0 ? field['Observacoes'] === 'primary key' ? 'id' : upLetter(field['Atributo']) : upLetter(field['Atributo']);
        const nameAttributeAllUp = upAllFistLetter(index === 0 ? field['Observacoes'] === 'primary key' ? 'id' : upLetter(field['Atributo']) : upLetter(field['Atributo']));
        const displayName = upSpaceLetter(field['displayName'] || field['Atributo']);
        select += ` '${nameAttribute}',`
        if (cont++ === 0) {
          close = false
          form += `{ cols: [\n`;
        }
        if (index === 0) {
          form += `this.inputId.getField(),\n`;
          //regex to remove break lines
          // const parten = /\n/g;
          datatable += `{ id: "${nameAttribute}", header: [this.translate("${displayName}"), { content: "textFilter" }], fillspace: false, sort: "${field['Tipo'] !== "number" ? "text" : "number"}" },\n`;
          //TODO INSERT TITLE
          inputs += `inputId = new WebixInput('${nameAttribute}', this.translate('${displayName}'), { required: ${(field['Obrigatoriedade'] === 'sim')} }, { width: 200, disabled: true, ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: this.translate('${field['Descricao'].replace(/\n/g, '')}') });\n`;
        } else {
          form += `this.input${nameAttributeAllUp}.getField(),\n`;
          //START DEFINE DATATABLE
          if (field['Tipo'] !== 'enum')
            datatable += `{ id: "${nameAttribute}", header: [this.translate("${displayName}"), { content: "${field['Tipo'] !== "number" ? "textFilter" : "numberFilter"}" }], fillspace: true, sort: "${field['Tipo'] !== "number" ? "text" : "number"}" },\n`;
          else
            datatable += `{ id: "${nameAttribute}", header: [this.translate("${displayName}"), { content: "textFilter" }], fillspace: true, sort: 'text', format: (value) => { return formatEnum(value, ${nameAttribute}Enum) } },\n`;
          //END DEFINE DATATABLE

          if (field['Tipo'] === 'date') {
            inputs += `input${nameAttributeAllUp} = new WebixInputDate('${nameAttribute}', this.translate('${displayName}'), { required: ${(field['Obrigatoriedade'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: this.translate('${field['Descricao'].replace(/\n/g, '')}') });\n`;
            mapToGetValue += `item.${nameAttribute} = new Date(item.${nameAttribute});\n`;

            getValueInput += `const ${nameAttributeAllUp}Value = this.$$(this.input${nameAttributeAllUp}.getId()).getValue();`
            SetValueWhere += `${nameAttributeAllUp}Value ? where.${nameAttribute} = ${nameAttributeAllUp}Value : null;`
          } else if (field['Tipo'] === 'enum') {
            // START DEFINE O ENUM PARA CRIACAO DO ARQUIVO
            fileEnum.push([nameAttribute, `export const ${nameAttribute}EnumFilter = ${
              JSON.stringify(field['Observacoes'].split(',').map(i => {
                return {id: i.replace(/'/g, ''), value: i.replace(/'/g, '')}
              }))}; \n/*${field['Descricao']}*/\n
            export const ${nameAttribute}Enum = ${nameAttribute}EnumFilter.filter((item) => {
              if (item.id !== null) return {...item}
            })
            `]);

            fileImports += `import {${nameAttribute}Enum} from "../../../../enum/${nameAttribute}.enum";\n`;

            // END DEFINE O ENUM PARA CRIACAO DO ARQUIVO

            inputs += `input${nameAttributeAllUp} = new WebixSelect('${nameAttribute}', this.translate('${displayName}'), ${nameAttribute}Enum, { required: ${(field['Obrigatoriedade'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: this.translate('${field['Descricao'].replace(/\n/g, '')}') });\n`;
            //filter datatable by enum
            mapToGetValue += `const ${nameAttribute}Id = ${nameAttribute}Enum.find( select => select.id === item.${nameAttribute});
                                 ${nameAttribute}Id? item.${nameAttribute} = ${nameAttribute}Id.value : null;\n`;
            mapToGetIdSelect += `const ${nameAttribute}Value = ${nameAttribute}Enum.find( select => select.value === item.${nameAttribute});
                                 ${nameAttribute}Value? item.${nameAttribute} = ${nameAttribute}Value.id : null;\n`;

            getValueInput += `const ${nameAttributeAllUp}Value = this.$$(this.input${nameAttributeAllUp}.getId()).getValue();`
            SetValueWhere += `${nameAttributeAllUp}Value ? where.${nameAttribute} = ${nameAttributeAllUp}Value : null;`
          } else if (field['Observacoes'] === 'foreign key') {
            inputs += `input${nameAttributeAllUp} = new WebixSuggest('${nameAttribute}', this.translate('${displayName}'), { required: ${(field['Obrigatoriedade'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: this.translate('${field['Descricao'].replace(/\n/g, '')}') });\n`;

            const nameService = field['Tabela'].replace(' ', '')
            //Replace up letter for same letter lower and underscore not can start with underscore
            const nameServiceAllUp = nameService.charAt(0).toLowerCase() + nameService.slice(1).replace(/([A-Z])/g, '-$1').toLowerCase();
            fileImports += `import { ${nameService}Service } from '../../../../services/${nameServiceAllUp}-service/${nameService}Service';\n`;

            includeVariables += `private ${nameAttribute}Data: any = [];\n`;
            includeQuery += `'${nameAttribute.replace('cod', '')}',\n`;
            mapToGetIdSuggest += `this.suggestValues.${nameAttribute} ? item.${nameAttribute} = this.suggestValues.${nameAttribute} : item.${nameAttribute} = this.${nameAttribute}Data.find(select => select.value == item.${nameAttribute}).id;\n`;
            if (importConstructor.indexOf(`private _${nameService}Service`) === -1) {
              importConstructor += `private _${nameService}Service: ${nameService}Service,\n`;
            }
            //    Suggest
            //  text //Start load ${nameService} not exit in loadSuggest
            if (loadSuggest.indexOf(`Start load ${nameService}`) === -1) {
              loadSuggest += `//Start load ${nameService}
                            let ${nameService}Resp = await this._${nameService}Service.get(simpleWhere).toPromise();
                            if (${nameService}Resp.data.length > 0) {
                                this.${nameAttribute}Data = ${nameService}Resp.data.map((${nameService}) => {
                                    return {
                                        id: ${nameService}.id,
                                        value: ${nameService}.desc${nameAttribute.replace('cod', '')}
                                    };
                                });
                                await this.input${nameAttributeAllUp}.setSuggest(this.${nameAttribute}Data, {
                                    onValueSuggest: (item) => {
                                        this.suggestValues.${nameAttribute} = item.id;
                                    },
                                });
                            }
                            //End load ${nameService}\n
                            `
            }
            //filter in this.${nameAttribute}Data for ${nameAttribute}
            mapToGetValue += `const ${nameAttribute} = this.${nameAttribute}Data.find( select => select.id == item.${nameAttribute});
                            ${nameAttribute}? item.${nameAttribute}= ${nameAttribute}.value : '';\n`;

            // getValueInput += `const ${nameAttributeAllUp}Value = this.$$(this.input${nameAttributeAllUp}.getId()).getValue();`
            SetValueWhere += `this.suggestValues.${nameAttribute} ? where.${nameAttribute} = this.suggestValues.${nameAttribute} : null;`
          } else {
            inputs += `input${nameAttributeAllUp} = new WebixInput('${nameAttribute}', this.translate('${displayName}'), { required: ${(field['Obrigatoriedade'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: this.translate('${field['Descricao'].replace(/\n/g, '')}') });\n`;

            getValueInput += `const ${nameAttributeAllUp}Value = this.$$(this.input${nameAttributeAllUp}.getId()).getValue();`
            SetValueWhere += `${nameAttributeAllUp}Value ? where.${nameAttribute} = ${nameAttributeAllUp}Value : null;`
          }

          htmlReport += `<div class="positionItem">
                  <div *ngIf="i==0" style="font-weight: bold">${displayName}</div>
                  <div class="positionVaue">{{item.${nameAttribute}}}</div>
                </div>
                `;

        }
        if (cont === 3) {
          close = true
          cont = 0;
          form += `] },`;
        }
      }.bind(this));
      form += `\nthis.inputSituation.getField()`
      if (!close) {
        form += `] },\n`;
      }
      inputs += `inputSituation = new WebixSelect('situation', this.translate('Situação'), AtivoInativoFilter, { required: false }, { width: 120, disabled: false, hidden: true });\n`;
      includeVariables += `private suggestValues: any = {};\n`;
      let setLoadSuggest = ""
      loadSuggest ? setLoadSuggest = `async loadSuggests() {
                    const simpleWhere = "where="+JSON.stringify({situation: 'A'});\n
                    ${loadSuggest}\n
                    loadingHide();\n
                }` : '';

      const reMapToGetIdSuggest = `
                if(this.suggestValues) {
                    ${mapToGetIdSuggest}
                }\n
                `
      const reMapFoDataTable = `.map( (item) => {
                    ${mapToGetValue}
                    return item;
                })`

      let objectAll = {
        form: form,
        inputs: inputs,
        select: select,
        includeVariables: includeVariables,
        mapToGetIdSelect: mapToGetIdSelect,
        mapToGetIdSuggest: mapToGetIdSuggest,
        mapToGetValue: mapToGetValue,
        getValueInput: getValueInput,
        SetValueWhere: SetValueWhere,
        htmlReport: htmlReport,
        fileImports: fileImports,
        importConstructor: importConstructor,
        loadSuggest: loadSuggest,
        setLoadSuggest: setLoadSuggest,
        reMapToGetIdSuggest: reMapToGetIdSuggest,
        reMapFoDataTable: reMapFoDataTable,
        includeQuery: includeQuery,
        datatable: datatable
      }

      let fileWrite = structureScreen(objectAll);
      let fileReportWrite = structureReport();
      let fileHtmlWrite = structureHtmlReport(htmlReport);


      //Start write file
      let nameOfPath = 'docs/files/front/tables/report/' + parsedFileName + '-report/'
      ensureDirectoryExistence(nameOfPath);
      await fs.writeFile(nameOfPath + parsedFileName + '-report.component.ts', fileWrite, {flag: 'w'}, function (err) {
        if (err) {
          return console.log(err);
        }
      });
      //      createfile: './${parsedFileName}.component.html',
      await fs.writeFile(nameOfPath + parsedFileName + '-report.component.html', '', {flag: 'w'}, function (err) {
        if (err) {
          return console.log(err);
        }
      });
      //      createfile: './${parsedFileName}.component.scss'
      await fs.writeFile(nameOfPath + parsedFileName + '-report.component.scss', '', {flag: 'w'}, function (err) {
        if (err) {
          return console.log(err);
        }
      });


      nameOfPath = 'docs/files/front/tables/report/' + parsedFileName + '-report/layout-' + parsedFileName + '-report/'
      ensureDirectoryExistence(nameOfPath);

      await fs.writeFile(nameOfPath + 'layout-' + parsedFileName + '-report.component.ts', fileReportWrite, {flag: 'w'}, function (err) {
        if (err) {
          return console.log(err);
        }
      });
      //      createfile: './${parsedFileName}.component.html',
      await fs.writeFile(nameOfPath + 'layout-' + parsedFileName + '-report.component.html', fileHtmlWrite, {flag: 'w'}, function (err) {
        if (err) {
          return console.log(err);
        }
      });
      //      createfile: './${parsedFileName}.component.scss'
      await fs.writeFile(nameOfPath + 'layout-' + parsedFileName + '-report.component.scss', '', {flag: 'w'}, function (err) {
        if (err) {
          return console.log(err);
        }
      });
    }
  }
}

// Verify fist key of the file is primary key
// async function verifyPrimeryKey(parsedFileName) {
//     return fs.readFile(readFolder + parsedFileName + '.json', 'utf8', async function (err, data) {
//         if (data) {
//             const fields = JSON.parse(data);
//             let model = {};
//             let isPrimeryKey = false
//             fields.forEach(function (field, index) {
//                 if (index === 0 && field['Observacoes'] === 'primary key')
//                     isPrimeryKey = true
//             });
//             return isPrimeryKey;
//         }
//     });
// }