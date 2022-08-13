const fs = require('fs');
const path = require("path");

const readFolder = 'docs/cast/';

fs.readdir(readFolder, async (err, files) => {
    if(files)
        for (const file of files) {
            if (file) {
                const name = file.replace('.json', '');
                let fileName = name.replace(' ', '_').toLowerCase(); //name of file without extension
                let parseName = upAllFistLetter(name); // name if camelCase

                await makeModel(fileName, parseName);
                await makeEndPoint(fileName, parseName);
                await makeInterfaceDatabase(fileName, parseName);
                await makeValidates(fileName, parseName);
                await makeModelFront(fileName, parseName);
                await makeFileService(fileName, parseName);
                await makeFileFront(fileName, parseName);
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
            if( !e['Observacoes'] || e['Observacoes'].length >= 16)
                type =  'DataTypes.DATE';
            else
                type =  'DataTypes.DATEONLY';
            break;
    }
    return type;
}

function fieldsForModel(e) {
    let model = {}
    model.field = e['Atributo']

    e['Descricao'] !== "" ? model.comment = e['Descricao'] : '';
    model.type = getType(e)

    if (e['Observacoes'] === 'primary key')
    {
        model.allowNull = false
        model.required = true
        model.autoIncrement= !(e['Tipo'] === 'varchar')
        model.primaryKey= true
        model.unique= true
    } else {
        model.allowNull = e['Obrigatoriedade'] !== 'sim'
        model.required = e['Obrigatoriedade'] === 'sim'
    }
    return model
}

function upAllFistLetter(parseName) {
    if(!parseName) return '';
    // camelCase in all first letters of the string after space or underline
    let newParseName = '';
    let parseNameArray = parseName.split(' ');
    if(!(parseNameArray.length > 1)) {
        parseNameArray = parseName.split('_');
    }
    for (let i = 0; i < parseNameArray.length; i++) {
        newParseName += parseNameArray[i].charAt(0).toUpperCase() + parseNameArray[i].slice(1);
    }
    return newParseName;
}

function upLetter(parseName) {
    if(!parseName) return '';
    // camelCase in all first letters of the string after space or underline
    let newParseName = '';
    let parseNameArray = parseName.split(' ');
    if(!(parseNameArray.length > 1)) {
        parseNameArray = parseName.split('_');
    }
    for (let i = 0; i < parseNameArray.length; i++) {
        newParseName += parseNameArray[i].charAt(0).toUpperCase() + parseNameArray[i].slice(1);
    }

    return newParseName.charAt(0).toLowerCase() + newParseName.slice(1);
}

function ensureDirectoryExistence(filePath) {
    if (fs.existsSync(filePath)) {
        return true;
    }
    fs.mkdirSync(filePath);
    if(filePath.includes('models'))
        fs.mkdirSync(filePath+'/validates');
}

async function makeModel(fileName, parseName) {
    await fs.readFile(readFolder + fileName +'.json', 'utf8', async function (err, data) {

        function structureUp() {
            return "import ApiConfig from '../../config/api.conf';\n" +
                "import { BasicFields } from '../fields/postgres/basicFields';\n" +
                "\n" +
                "const "+parseName+" = (sequelize, DataTypes) => {\n" +
                "\n" +
                "    const basicFields = new BasicFields(DataTypes);\n" +
                "\n" +
                "    // Define environment object\n" +
                "    const config = new ApiConfig();\n" +
                "    const environment = config.getEnv();\n" +
                "    let schema = environment.databases.postgres.schema;\n" +
                "\n" +
                "    const model = sequelize.define('" + parseName + "',";
        }

        function structureMiddle() {
            return "     {\n" +
                "            paranoid: true,\n" +
                "            freezeTableName: true,\n" +
                "            tableName: '"+fileName+"'\n" +
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
                "module.exports = "+parseName+";";
        }

        if (data) {
            let fields = JSON.parse(data)
            structureUp = structureUp()
            structureDown = structureDown()
            structureMiddle = structureMiddle()
            let model = {};
            let foreignKey = '';

            fields.forEach( function (field, index) {

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


            let fileWrite = structureUp + stringMod +','+ structureMiddle + foreignKey + structureDown

            await fs.writeFile('docs/final/models/' + fileName.toLowerCase() + '.js', fileWrite, {flag: 'w'}, function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log("Saved "+fileName + ".js");
            });
        }

    });
    // console.log('Make finish file: '+ file)
}

async function makeEndPoint(fileName, parseName) {
    function structure() {
        return `import { ${parseName}Aplication } from './${parseName}Aplication';
import createValidate from './validates/create.validate';
import updateValidate from './validates/update.validate';

/**
* MiddleWare que obtem os ${parseName}
* @private
*/
const get${parseName}MiddleWare = async (req, res) => { 
return new ${parseName}Aplication()
    .get(req.query.where, req.query.select, req.query.order, req.query.include, req.query.group)
    .then((success) => {
        res.api.send(success, res.api.codes.OK)
    })
    .catch((err) => {
        res.api.send(err, res.api.codes.INTERNAL_SERVER_ERROR)
    });
}

/**
* MiddleWare que obtem um ${parseName} por id
* @private
*/
const get${parseName}ByIdMiddleWare = async (req, res) => {
const id = Number(req.params.id)
return new ${parseName}Aplication()
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
* MiddleWare que cria uma novo ${parseName}
* @private
*/
const create${parseName}MiddleWare = async (req, res) => {
const body = req.body;

return new ${parseName}Aplication()
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
* MiddleWare que atualiza um ${parseName}
* @private
*/
const update${parseName}MiddleWare = async (req, res) => {
const id = Number(req.params.id);
const {where} = req.query;
const body = req.body;

return new ${parseName}Aplication()
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
* MiddleWare que atualiza ou cria um ${parseName}
* @private
*/
const updateOrCreate${parseName}MiddleWare = async (req, res) => {
const id = Number(req.params.id);
const {where} = req.query;
const body = req.body;

return new ${parseName}Aplication()
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
* MiddleWare que remove um ${parseName}
* @private
*/
const delete${parseName}MiddleWare = async (req, res) => {
const id = Number(req.params.id);
const {where} = req.query;

return new ${parseName}Aplication()
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
* Endpoints para o recurso ${parseName}
* @public
*/
const ${parseName}Routes = (route) => {

/**
 * @swagger
 * /api/${parseName.toLocaleLowerCase()}all:
 *   get:
 *     tags:
 *       - ${parseName}s
 *     description: Retorna todos os ${parseName}s
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         reponse: Response contendo no objeto data uma lista de ${parseName}s
 */
route.post('/api/${parseName.toLocaleLowerCase()}all', get${parseName}MiddleWare)

/**
 * @swagger
 * /api/${parseName.toLocaleLowerCase()}:
 *   get:
 *     tags:
 *       - ${parseName}s
 *     description: Retorna todos os ${parseName}s
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         reponse: Response contendo no objeto data uma lista de ${parseName}s
 */
route.get('/api/${parseName.toLocaleLowerCase()}', get${parseName}MiddleWare)

/**
 * @swagger
 * /api/${parseName.toLocaleLowerCase()}/:id:
 *   get:
 *     tags:
 *       - ${parseName}s
 *     description: Retorna a ${parseName}s pesquisada
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         reponse: Response contendo no objeto data uma lista de ${parseName}s
 */
route.get('/api/${parseName.toLocaleLowerCase()}/:id', get${parseName}ByIdMiddleWare)

/**
 * @swagger
 * /api/${parseName.toLocaleLowerCase()}:
 *   post:
 *     tags:
 *       - ${parseName}s
 *     description: Cria uma nova ${parseName}s
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         reponse: Response contendo no objeto que foi salvo da ${parseName}s
 */
route.post('/api/${parseName.toLocaleLowerCase()}', createValidate, create${parseName}MiddleWare)

/**
 * @swagger
 * /api/${parseName.toLocaleLowerCase()}/:id:
 *   put:
 *     tags:
 *       - ${parseName}s
 *     description: Altera os dados da ${parseName}s pelo id
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         reponse: Response contendo um array de string onde 1 - alterado 0 - não alterado
 */
route.put('/api/${parseName.toLocaleLowerCase()}/:id', updateValidate, update${parseName}MiddleWare)

/**
 * @swagger
 * /api/${parseName.toLocaleLowerCase()}:
 *   put:
 *     tags:
 *       - ${parseName}s
 *     description: Altera os dados da ${parseName}s pela query enviada
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         reponse: Response contendo um array de string onde 1 - alterado 0 - não alterado
 */
route.put('/api/${parseName.toLocaleLowerCase()}', updateValidate, update${parseName}MiddleWare)

/**
 * @swagger
 * /api/${parseName.toLocaleLowerCase()}UpdateOrCreate:
 *   put:
 *     tags:
 *       - ${parseName}s
 *     description: Altera os dados da ${parseName}s pela query enviada
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         reponse: Response contendo um array de string onde 1 - alterado 0 - não alterado
 */
route.put('/api/${parseName.toLocaleLowerCase()}UpdateOrCreate', updateValidate, updateOrCreate${parseName}MiddleWare)

/**
 * @swagger
 * /api/${parseName.toLocaleLowerCase()}/:id:
 *   delete:
 *     tags:
 *       - ${parseName}s
 *     description: Remove uma ${parseName}s baseada no id
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         reponse: Response contendo 1 - deletado 0 - não deletado
 */
route.delete('/api/${parseName.toLocaleLowerCase()}/:id', delete${parseName}MiddleWare)

/**
 * @swagger
 * /api/${parseName.toLocaleLowerCase()}:
 *   delete:
 *     tags:
 *       - ${parseName}s
 *     description: Renive yna ${parseName}s baseado na query enviada
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         reponse: Response contendo 1 - deletado 0 - não deletado
 */
route.delete('/api/${parseName.toLocaleLowerCase()}', delete${parseName}MiddleWare)
}

export default ${parseName}Routes
`;
    }
    let fileWrite = structure()
    ensureDirectoryExistence('docs/final/api/'+fileName+'/');
    await fs.writeFile('docs/final/api/'+ fileName + '/index' + '.js', fileWrite, {flag: 'w'}, function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("Saved api: ", parseName + ".js");
    });
}

async function makeInterfaceDatabase(fileName, parseName) {
    function structure() {
        return `import { BaseCrudApplication } from '../../core/BaseCrudAplication'
import config from '../../config/sequelize/sequelize.conf';

export class ${parseName}Aplication extends BaseCrudApplication {

/**
  * Método construtor
  * @returns {void}
  * @public
  */
constructor() {
    let { ${parseName} } = config.postgres.DB;
    super(${parseName});
}

/**
 * Método que obtem o ${parseName}
 * @param {object} where - Filtro
 * @param select - Campos a serem selecionados
 * @param order - Ordenação
 * @param include - Relacionamentos
 * @param group - Agrupamento
 * @returns {${parseName}[]}
 * @public
 */
get(where, select, order, include, group) {
    return super.get(where, select, {order: order, include: include, group: group});
}

/**
 * Método que obtem a ${parseName} por id
 * @param {number} id${parseName} - Id da (${parseName})s
 * @param select - Filtro
 * @returns {${parseName}}
 * @public
 */
getById(id${parseName}, select) {
    return super.getById(id${parseName}, select)
} 

/**
* Método que cria um nova ${parseName}
* @param {object} ${parseName} - novos dados da (${parseName}) que será criado
* @returns {${parseName}}
* @public
*/
create(${parseName}) { 
    return super.create(${parseName})
}

/**
* Método que atualiza uma ${parseName}
* @param {number} id${parseName} - Id da ${parseName}
* @param {object} ${parseName} - dados da (${parseName}) que será atualizado
* @param Where
* @returns {${parseName}}
* @public
*/
update(id${parseName}, ${parseName}, Where) {
    return super.update(id${parseName}, ${parseName}, Where)
}

/**
* Método que remove um ${parseName}
* @param {number} id${parseName} - Id da (${parseName})
* @param Where
* @returns {boolean}
* @public
*/
delete(id${parseName}, Where) {
    return super.delete(id${parseName}, Where)
}

}
`;
    }

    let fileWrite = structure()

    await fs.writeFile('docs/final/api/'+ fileName +'/'+ parseName + 'Aplication.js', fileWrite, {flag: 'w'}, function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("Saved api: ", parseName + ".js");
    });
}

async function makeValidates(fileName, parseName) {

    await fs.readFile(readFolder + fileName +'.json', 'utf8', async function (err, data) {

        const structure =  () => {
            return `import Joi from 'joi';
export default (req, res, next) => {
    return Joi
        .object(
`};

        const structureDown =  () => {
            return `).validate(req.body, err => {
            if (err)
                return res.api.send(err.details, res.api.codes.UNPROCESSABLE_ENTITY);

            return next();
        });
} 
`};

        if (data) {
            //Fields of validation with Joi
            const fields = JSON.parse(data);
            let modelCreate = {};
            let modelUpdate = {};
            fields.forEach( function (field, index) {
                const nameAttribute = index === 0 ? field['Observacoes'] === 'primary key' ? 'id' : upLetter(field['Atributo']) : upLetter(field['Atributo']);
                modelCreate[nameAttribute] = 'Joi.';
                if(field['Tipo'] === 'varchar') {
                    modelCreate[nameAttribute] += 'string().';
                    modelCreate[nameAttribute] += `max(${field['Tamanho']}).`;
                }
                else if(field['Tipo'] === 'number')
                    modelCreate[nameAttribute] += 'number().';
                else
                    modelCreate[nameAttribute] += 'string().';

                if(field['Obrigatoriedade'] === "sim" && index !== 0)
                    modelCreate[nameAttribute] += 'required()'
                else
                    modelCreate[nameAttribute] += 'optional()';


                // const nameAttribute = upLetter(field['Atributo']);
                modelUpdate[nameAttribute] = 'Joi.';
                if(field['Tipo'] === 'varchar') {
                    modelUpdate[nameAttribute] += 'string().';
                    modelUpdate[nameAttribute] += `max(${field['Tamanho']}).`;
                }
                else if(field['Tipo'] === 'number')
                    modelUpdate[nameAttribute] += 'number().';
                else
                    modelUpdate[nameAttribute] += 'string().';

                modelUpdate[nameAttribute] += 'optional()';
            });

            modelCreate['unit'] = "Joi.string().min(1).max(150).required()";
            modelCreate['user'] = "Joi.string().min(1).max(150).required()";

            modelUpdate['unit'] = "Joi.string().min(1).max(150).optional()";
            modelUpdate['user'] = "Joi.string().min(1).max(150).required()";

            const parseModelCreate = JSON.stringify(modelCreate);
            const parseModelUpdate = JSON.stringify(modelUpdate);
            //Clear parseModel of double quotes
            const parseModelCreateClear = parseModelCreate.replace(/\"/g, '');
            const parseModelUpdateClear = parseModelUpdate.replace(/\"/g, '');

            let fileWriteCreate = structure() + parseModelCreateClear + structureDown()
            let fileWriteUpdate = structure() + parseModelUpdateClear + structureDown()

            const namePath = 'docs/final/api/'+ fileName +'/validates/';
            ensureDirectoryExistence(namePath);
            await fs.writeFile(namePath+'create.validate.js', fileWriteCreate, {flag: 'w'}, function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log("Saved endPointValidateCreate: ", parseName + ".js");
            });
            await fs.writeFile(namePath+'update.validate.js', fileWriteUpdate, {flag: 'w'}, function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log("Saved endPointValidateUpdate: ", parseName + ".js");
            });
        }
    });
}

async function makeModelFront(fileName, parseName) {

    await fs.readFile(readFolder + fileName +'.json', 'utf8', async function (err, data) {
        if(data) {
            const fields = JSON.parse(data);
            let doFile = false
            fields.forEach(function (field, index) {
                if (index === 0 && field['Observacoes'] === 'primary key')
                    doFile = true
            });
            if (doFile) {
                const nameFileFront = fileName.replace('_', '-').toLocaleString();
                const structure = (fileName, fields) => {
                    return `export class ${fileName} ${fields}`;
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
                let fileWrite = structure(parseName, stringMod)

                let nameOfPath = 'docs/final/front/model/'
                ensureDirectoryExistence(nameOfPath);
                await fs.writeFile(nameOfPath + nameFileFront + '.ts', fileWrite, {flag: 'w'}, function (err) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log("Saved Model API: ", parseName.replace('_', '-') + ".js");
                });
            }
        }
    });
}

async function makeFileService(fileName, parseName) {
    await fs.readFile(readFolder + fileName +'.json', 'utf8', async function (err, data) {
        if(data) {
            const fields = JSON.parse(data);
            let doFile = false
            fields.forEach(function (field, index) {
                if (index === 0 && field['Observacoes'] === 'primary key')
                    doFile = true
            });
            if(doFile) {

                const structure = () => {
                    return `import {Injectable} from '@angular/core';
import {SarcService} from '../sarc-service/sarc-api.service';
import {HttpClient} from '@angular/common/http';
import {${parseName}} from '../../models/${fileName}';;

@Injectable({
  providedIn: 'root'
})
export class ${parseName}Service extends SarcService< ${parseName} > {
  constructor(http: HttpClient) {
    super('${parseName.toLocaleLowerCase()}', http)
  }
}
`;
                }

                let fileWrite = structure()

                let nameOfPath = 'docs/final/front/service/' + fileName + '_service/'
                ensureDirectoryExistence(nameOfPath);
                await fs.writeFile(nameOfPath + parseName + 'Service.ts', fileWrite, {flag: 'w'}, function (err) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log("Saved api: ", parseName + ".js");
                });
            }
        }
    });
}

async function makeFileFront(fileName, parseName) {
    await fs.readFile(readFolder + fileName +'.json', 'utf8', async function (err, data) {
        if(data) {
            const fields = JSON.parse(data);
            let doFile = false
            fields.forEach(function (field, index) {
                if (index === 0 && field['Observacoes'] === 'primary key')
                    doFile = true
            });
            if (doFile) {
                const nameFileFront = fileName.replace('_', '-').toLocaleString();
                const structure = (inputs, datatable, form, select) => {
                    return `import { Component } from '@angular/core';
import { MessageService } from '../../../services/message/message.service';
import { WebixInput } from 'src/app/classes/webix.input';
import { WebixToolbar } from 'src/app/classes/webix.toolbar';
import { WebixSelect } from 'src/app/classes/webix.select';
import { WebixDatatable } from 'src/app/classes/webix.datatable';
import { ${parseName}Service } from '../../services/${fileName}/${parseName}Service';
import { QuerysBuilderService } from '../../services/querys-builder/querys-builder.service';
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

@Component({
  selector: 'app-${nameFileFront}',
  templateUrl: './${nameFileFront}.component.html',
  styleUrls: ['./${nameFileFront}.component.scss']
})
export class ${parseName}Component {
  /*
   Declaração das variaveis do Webix, as mesmas são setadas pelo serviço WebixService
 */
  webixUi: any;
  webix: any;
  $$: any;

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
    Id do formulário é colocado em uma variável para poder ser reutilizado no código abaixo
  */
  formId: string = 'Frm${parseName}';

  /*
    Id do accordion onde tem o formulário é colocado em uma variável para poder ser utilizado no código abaixo
  */
  accordionFormId: string = 'accordionItemForm${parseName}';

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
    'dt${parseName}',
    this.formId,
    [
        ${datatable}
    ],
    {
      pager: this.paginate.getId(),
      footer: true,
      onClick: {
        view: (ev, elem, html) => {
          this.viewElement(elem.row);
        },

        edit: (ev, elem, html) => {
          this._checkFormDuty(() => {
            const item = this.dataAll.find(item => item.id === elem.row);
            this.$$(this.accordionFormId).expand();
            this.$$(this.inputId.getId()).show();
            this.$$(this.inputId.getId()).setValue(item.id);
            // this.$$(this.inputSituation.getId()).show();
            this._edit(item);
          });
        },

        remove: (ev, elem, html) => {
          this._checkFormDuty(() => {
            const item = this.dataAll.find(item => item.id === elem.row);
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
    private _service: ${parseName}Service,
    private _profileService: ProfileService,
    private _i18nService: I18nService,
    private _googleSheetsService: GoogleSheetsService,
    private _querysBuilderService: QuerysBuilderService,
    private _localStorageService: LocalStorageService,
    private _messageService: MessageService) {
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
   * Configura o layout com os componentes webix utilizando as variaveis declaradas acima
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
                    await this.setFormAgentInputs()
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
                        this.paginate.getField()
                      ]
                    }
                  ]
                }
              }
            ]
          }
        ]
      });
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
    const result: any = await this._service.get(query).toPromise();
    this.dataAll = result.data.reverse();
    this.datatable.setData(this.dataAll);
    this.$$(this.accordionFormId).collapse();
    loadingHide();
    this.subscribeEvents();
  }

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
    const item = this.dataAll.find(item => item.id === row);
    const form = this.$$(this.formId)
    form.setValues(item);
    this.$$(this.inputId.getId()).show();
    this.$$(this.inputId.getId()).setValue(item.id);
    // this.$$(this.inputSituation.getId()).show();
    this.$$(this.accordionFormId).expand();
    form.setDirty(false);
  }
  /*
  * Desativa o formulário de acordo com a regra de negocio necessaria
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
    const values = form.getValues();
    const isValid = form.validate();

    if (isValid) {

      if (values.id > 0) {
        this._update(values);
      } else {
        this._create(values);
      }
      this._loadData();
    } else {
      this._messageService.show('Formulário Inválido', 'error');
    }
  }

  /*
  * Envia os valores para API atualizar
  */
  _update(values) {
    delete values.deletedAt;

    if (values.createdAt)
      delete values.createdAt

    if (values.updatedAt)
      delete values.updatedAt

    this._service.put(values.id, values).subscribe(
      (success) => _success(success),
      (error) => _error(error)
    )

    const _success = (success) => {
      const datatable = this.$$(this.datatable.getId());
      datatable.updateItem(values.id, values);
      const index = this.dataAll.findIndex(item => item.id === values.id);
      this.dataAll[index] = values;
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
  _create(values) {
    delete values.id;
    delete values.situation;

    this._service.post(values).subscribe(
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
   * Confirma se realmente é pra remover e exclui as informações na API
   */
  remove(item) {
    this._service.delete(item.id).subscribe(
      (success) => _success(success),
      (error) => _error(error)
    )

    const _success = (success) => {
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
    // this.$$(this.inputSituation.getId()).hide();
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
      \`Registros - Locais \${moment(new Date()).format('DD/MM/YYYY hh:mm:ss')}\`,
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
                let inputs = ``
                let datatable = ``
                let form = ``;
                let cont = 0;
                let close = true
                let select = '';
                fields.forEach(function (field, index) {

                    const nameAttribute = index === 0 ? field['Observacoes'] === 'primary key' ? 'id' : upLetter(field['Atributo']) : upLetter(field['Atributo']);
                    const nameAttributeAllUp = upAllFistLetter(index === 0 ? field['Observacoes'] === 'primary key' ? 'id' : upLetter(field['Atributo']) : upLetter(field['Atributo']));
                    select += ` '${nameAttribute}',`
                    if (cont++ === 0) {
                        close = false
                        form += `{ cols: [\n`;
                    }
                    if (index === 0) {
                        form += `this.inputId.getField(),\n`;
                        inputs += `inputId = new WebixInput('${nameAttribute}', this.translate('${nameAttributeAllUp}'), { required: ${(field['Obrigatorio'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: this.translate('${field['Descricao']}') });\n`;
                    } else {
                        form += `this.input${nameAttributeAllUp}.getField(),\n`;
                        inputs += `input${nameAttributeAllUp} = new WebixInput('${nameAttribute}', this.translate('${nameAttributeAllUp}'), { required: ${(field['Obrigatorio'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: this.translate('${field['Descricao']}') });\n`;
                    }
                    if (cont === 3) {
                        close = true
                        cont = 0;
                        form += `] },\n`;
                    }
                    datatable += `{ id: "${nameAttribute}", header: [this.translate("${nameAttributeAllUp}"), { content: "textFilter" }], fillspace: true, sort: ${field['Tipo'] !== "number" ? "'text'" : "'number'"} },`;


                }.bind(this));
                if (!close) {
                    form += `] },\n`;
                }
                inputs += `inputSituation = new WebixSelect('situation', this.translate('Situação'), AtivoInativoFilter, { required: false }, { width: 120, disabled: false, hidden: true });\n`;
                let fileWrite = structure(inputs, datatable, form, select)

                let nameOfPath = 'docs/final/front/tables/' + nameFileFront + '/'
                ensureDirectoryExistence(nameOfPath);
                await fs.writeFile(nameOfPath + nameFileFront + '.component.ts', fileWrite, {flag: 'w'}, function (err) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log("Saved api: ", parseName.replace('_', '-') + ".js");
                });

                //      createfile: './${fileName}.component.html',
                await fs.writeFile(nameOfPath + nameFileFront + '.component.html', '', {flag: 'w'}, function (err) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log("Saved tables: ", nameFileFront + ".component.html");
                });

                //      createfile: './${fileName}.component.scss'
                await fs.writeFile(nameOfPath + nameFileFront + '.component.scss', '', {flag: 'w'}, function (err) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log("Saved tables: ", nameFileFront + ".component.scss");
                });

            }
        }
    });
}

// Verify fist key of the file is primary key
// async function verifyPrimeryKey(fileName) {
//     return fs.readFile(readFolder + fileName + '.json', 'utf8', async function (err, data) {
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