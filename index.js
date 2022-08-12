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

function getAllowNull(e) {
    return (e['Obrigatoriedade'] !== 'Sim');
}

function getRequired(e) {
    return (e['Obrigatoriedade'] === 'Sim');
}

function fieldsForModel(e) {
    let model = {}
    model.field = e['Atributo']
    //remove " with regex
    model.type = getType(e)
    model.allowNull = getAllowNull(e)
    model.required = getRequired(e)
    if(e['Descricao'] !== "")
        model.comment = e['Descricao']

    if (e['Observacoes'] === 'primary key')
    {
        model.primaryKey= true
        model.autoIncrement= !(e['Tipo'] === 'varchar')
        model.unique= true
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


function ensureDirectoryExistence(filePath) {
    if (fs.existsSync(filePath)) {
        return true;
    }
    fs.mkdirSync(filePath);
    fs.mkdirSync(filePath+'/validates');
}

async function makeModel(name, parseName) {
    await fs.readFile(readFolder + name +'.json', 'utf8', async function (err, data) {

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
                "            tableName: '"+name+"'\n" +
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
            let values = JSON.parse(data)
            structureUp = structureUp()
            structureDown = structureDown()
            structureMiddle = structureMiddle()
            let model = {};
            let foreignKey = '';

            values.forEach(function (e) {

                model[e['Atributo']] = fieldsForModel(e);
                if (e['Observacoes'] === 'foreign key') {
                    foreignKey += `model.hasMany( models.${upAllFistLetter(e['Atributo'].replace('_id',''))}, { foreignKey: \'${e['Atributo']}\' });`
                }

            });

            let pattern = new RegExp(/"([^"]+)":/g);
            let stringFy = JSON.stringify(model);
            //remove " with regex of all name fields
            let stringMod = stringFy.replace(pattern, '$1:').replace(/\uFFFF/g, '\\\"').replace(',', ',\n');
            //remove double quotes before beginning of phrase DataTypes and end of the same phrase
            stringMod = stringMod.replace(/\"DataTypes/g, 'DataTypes').replace(/\",allowNull/g, ',allowNull');


            let fileWrite = structureUp + stringMod +','+ structureMiddle + foreignKey + structureDown

            await fs.writeFile('docs/final/models/' + name.toLowerCase() + '.js', fileWrite, {flag: 'w'}, function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log("Saved "+name + ".js");
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
import { ${parseName}Info } from 'os';


/**
* MiddleWare que obtem os ${parseName}
* @private
*/
const get${parseName}MiddleWare = async (req, res) => { 
return new ${parseName}Aplication()
    .get(req.query.where, req.query.select, req.query.order)
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
const where = req.query;
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
const where = req.query;
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
const where = req.query;

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
 * /api/${parseName}all:
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
route.post('/api/${parseName}all', get${parseName}MiddleWare)

/**
 * @swagger
 * /api/${parseName}s:
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
route.get('/api/${parseName}', get${parseName}MiddleWare)

/**
 * @swagger
 * /api/${parseName}s/:id:
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
route.get('/api/${parseName}/:id', get${parseName}ByIdMiddleWare)

/**
 * @swagger
 * /api/${parseName}s:
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
route.post('/api/${parseName}', createValidate, create${parseName}MiddleWare)

/**
 * @swagger
 * /api/${parseName}s/:id:
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
route.put('/api/${parseName}/:id', updateValidate, update${parseName}MiddleWare)

/**
 * @swagger
 * /api/${parseName}s:
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
route.put('/api/${parseName}', updateValidate, update${parseName}MiddleWare)

/**
 * @swagger
 * /api/${parseName}s:
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
route.put('/api/${parseName}UpdateOrCreate', updateValidate, updateOrCreate${parseName}MiddleWare)

/**
 * @swagger
 * /api/${parseName}s/:id:
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
route.delete('/api/${parseName}/:id', delete${parseName}MiddleWare)

/**
 * @swagger
 * /api/${parseName}s:
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
route.delete('/api/${parseName}', delete${parseName}MiddleWare)
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

    await fs.writeFile('docs/final/api/'+ fileName +'/'+ parseName + '.js', fileWrite, {flag: 'w'}, function (err) {
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
            const rawFields = JSON.parse(data);
            let modelCreate = {};
            let modelUpdate = {};
            for (let field of rawFields) {
                modelCreate[field['Atributo']] = 'Joi.';
                if(field['Tipo'] === 'varchar') {
                    modelCreate[field['Atributo']] += 'string().';
                    modelCreate[field['Atributo']] += `max(${field['Tamanho']}).`;
                }
                else if(field['Tipo'] === 'number')
                    modelCreate[field['Atributo']] += 'number().';
                else
                    modelCreate[field['Atributo']] += 'string().';

                if(field['Obrigatoriedade'] === "sim")
                    modelCreate[field['Atributo']] += 'required()'
                else
                    modelCreate[field['Atributo']] += 'optional()';
            }
            for (let field of rawFields) {
                modelUpdate[field['Atributo']] = 'Joi.';
                if(field['Tipo'] === 'varchar') {
                    modelUpdate[field['Atributo']] += 'string().';
                    modelUpdate[field['Atributo']] += `max(${field['Tamanho']}).`;
                }
                else if(field['Tipo'] === 'number')
                    modelUpdate[field['Atributo']] += 'number().';
                else
                    modelUpdate[field['Atributo']] += 'string().';

                modelUpdate[field['Atributo']] += 'optional()';
            }

            modelUpdate['unit'] = "Joi.string().min(1).max(150).required()";
            modelUpdate['user'] = "Joi.string().min(1).max(150).required()";

            const parseModelCreate = JSON.stringify(modelCreate);
            const parseModelUpdate = JSON.stringify(modelUpdate);
            //Clear parseModel of double quotes
            const parseModelCreateClear = parseModelCreate.replace(/\"/g, '');
            const parseModelUpdateClear = parseModelUpdate.replace(/\"/g, '');

            let fileWriteCreate = structure() + parseModelCreateClear + structureDown()
            let fileWriteUpdate = structure() + parseModelUpdateClear + structureDown()

            await fs.writeFile('docs/final/api/'+ fileName +'/validates/create.validate.js', fileWriteCreate, {flag: 'w'}, function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log("Saved endPointValidateCreate: ", parseName + ".js");
            });
            await fs.writeFile('docs/final/api/'+ fileName +'/validates/update.validate.js', fileWriteUpdate, {flag: 'w'}, function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log("Saved endPointValidateUpdate: ", parseName + ".js");
            });
        }

    });
}

async function makeFileService(file) {

}

async function makeFileFront(file) {

}