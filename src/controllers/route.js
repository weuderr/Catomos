const fs = require("fs");
const {ensureDirectoryExistence} = require("../lib/Utils");

exports.makeRoute = async (parsedFileName, camelCaseNameFile, nameWithSpace) => {
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