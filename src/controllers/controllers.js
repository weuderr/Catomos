const fs = require("fs");


exports.makeInterfaceDatabase = async (parsedFileName, camelCaseNameFile) => {
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