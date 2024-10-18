const fs = require("fs");
const { ensureDirectoryExistence } = require("../lib/Utils");

exports.makeRoute = async (parsedFileName, camelCaseNameFile, nameWithSpace) => {
    const namefile = parsedFileName.split('_');
    function structure() {
        return `import { ${camelCaseNameFile}Controller } from "../api/${namefile}/${namefile}-controller";
import createValidate from "../api/${namefile}/validators/create.validate";
import updateValidate from "../api/${namefile}/validators/update.validate";

/**
 * Endpoints para o recurso ${nameWithSpace}
 * @public
 */
export const setup${camelCaseNameFile}Routes = app => {

  /**
   * @route POST /${parsedFileName.toLowerCase()}
   * @group ${nameWithSpace} - Operações relacionadas a ${nameWithSpace}
   * @param {${camelCaseNameFile}.model} ${camelCaseNameFile.toLowerCase()}.body.required - Dados do ${nameWithSpace} a ser criado
   * @returns {Object} 201 - ${nameWithSpace} criado com sucesso
   * @returns {Error} 406 - Erro na criação do ${nameWithSpace}
   * @returns {Error} 409 - ${nameWithSpace} já cadastrado
   */
  app.post("/${parsedFileName.toLowerCase()}", createValidate, ${camelCaseNameFile}Controller.create);

  /**
   * @route PUT /${parsedFileName.toLowerCase()}/:id
   * @group ${nameWithSpace} - Operações relacionadas a ${nameWithSpace}
   * @param {${camelCaseNameFile}.model} ${camelCaseNameFile.toLowerCase()}.body.required - Dados do ${nameWithSpace} a ser atualizado
   * @returns {Object} 200 - ${nameWithSpace} atualizado com sucesso
   * @returns {Error} 406 - Erro na atualização do ${nameWithSpace}
   * @returns {Error} 409 - ${nameWithSpace} não cadastrado
   */
  app.put("/${parsedFileName.toLowerCase()}/:id", updateValidate, ${camelCaseNameFile}Controller.update);

  /**
   * @route GET /${parsedFileName.toLowerCase()}
   * @group ${nameWithSpace} - Operações relacionadas a ${nameWithSpace}
   * @returns {Array.<${camelCaseNameFile}>} 200 - Lista de todos os ${nameWithSpace}s
   * @returns {Error} 404 - Erro ao buscar ${nameWithSpace}s
   */
  app.get("/${parsedFileName.toLowerCase()}", ${camelCaseNameFile}Controller.getAll);

  /**
   * @route GET /${parsedFileName.toLowerCase()}/:id
   * @group ${nameWithSpace} - Operações relacionadas a ${nameWithSpace}
   * @param {number} id.path.required - ID do ${nameWithSpace}
   * @returns {${camelCaseNameFile}.model} 200 - ${nameWithSpace} encontrado
   * @returns {Error} 404 - ${nameWithSpace} não encontrado
   */
  app.get("/${parsedFileName.toLowerCase()}/:id", ${camelCaseNameFile}Controller.getById);

  /**
   * @route DELETE /${parsedFileName.toLowerCase()}/:id
   * @group ${nameWithSpace} - Operações relacionadas a ${nameWithSpace}
   * @param {number} id.path.required - ID do ${nameWithSpace}
   * @returns {Object} 200 - ${nameWithSpace} removido com sucesso
   * @returns {Error} 404 - ${nameWithSpace} não encontrado
   */
  app.delete("/${parsedFileName.toLowerCase()}/:id", ${camelCaseNameFile}Controller.delete);
};

export default setup${camelCaseNameFile}Routes;
    `;
    }

    const fileWrite = structure();
    const pathName = 'docs/files/back/routes/';
    ensureDirectoryExistence(pathName);
    await fs.writeFile(`${pathName}${parsedFileName.replace(/_/g, '-')}-routers.js`, fileWrite, { flag: 'w' }, (err) => {
        if (err) {
            return console.log(err);
        }
    });
};
