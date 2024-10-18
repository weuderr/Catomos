const fs = require("fs");
const { ensureDirectoryExistence } = require("../lib/Utils");

exports.makeController = async (parsedFileName, camelCaseNameFile, nameWithSpace) => {
    function structure() {
        return `import ${camelCaseNameFile}Service from "./${parsedFileName.replace(/_/g, '-').toLowerCase()}-service";
import { handleError, handleSuccess } from "../../utils/http";

export class ${camelCaseNameFile}Controller {
  /**
   * Cria um novo ${nameWithSpace}.
   * @param {import("express").Request} req - Objeto de requisição do Express.
   * @param {import("express").Response} res - Objeto de resposta do Express.
   */
  static async create(req, res) {
    try {
      const data = await ${camelCaseNameFile}Service.create${camelCaseNameFile}(req.body);
      return handleSuccess(res, 201, "${nameWithSpace} Created", data);
    } catch (error) {
      return handleError(res, error);
    }
  }

  /**
   * Atualiza um ${nameWithSpace} existente.
   * @param {import("express").Request} req - Objeto de requisição do Express.
   * @param {import("express").Response} res - Objeto de resposta do Express.
   */
  static async update(req, res) {
    try {
      const id = Number(req.params.id);
      const data = await ${camelCaseNameFile}Service.update${camelCaseNameFile}(id, req.body);
      return handleSuccess(res, 200, "${nameWithSpace} Updated", data);
    } catch (error) {
      return handleError(res, error);
    }
  }

  /**
   * Obtém todos os ${nameWithSpace}s.
   * @param {import("express").Request} req - Objeto de requisição do Express.
   * @param {import("express").Response} res - Objeto de resposta do Express.
   */
  static async getAll(req, res) {
    try {
      const data = await ${camelCaseNameFile}Service.getAll${camelCaseNameFile}();
      return handleSuccess(res, 200, "Successfully retrieved ${nameWithSpace}s", data);
    } catch (error) {
      return handleError(res, error);
    }
  }

  /**
   * Obtém um ${nameWithSpace} pelo ID.
   * @param {import("express").Request} req - Objeto de requisição do Express.
   * @param {import("express").Response} res - Objeto de resposta do Express.
   */
  static async getById(req, res) {
    try {
      const id = Number(req.params.id);
      const include = JSON.parse(req.query.include|| '[]') ;
      const data = await ${camelCaseNameFile}Service.get${camelCaseNameFile}ById(id, req.query.order, include, req.query.group);
      return handleSuccess(res, 200, "${nameWithSpace} Found", data);
    } catch (error) {
      return handleError(res, error);
    }
  }

  /**
   * Remove um ${nameWithSpace} pelo ID.
   * @param {import("express").Request} req - Objeto de requisição do Express.
   * @param {import("express").Response} res - Objeto de resposta do Express.
   */
  static async delete(req, res) {
    try {
      const id = Number(req.params.id);
      await ${camelCaseNameFile}Service.delete${camelCaseNameFile}(id);
      return handleSuccess(res, 200, "${nameWithSpace} Deleted");
    } catch (error) {
      return handleError(res, error);
    }
  }
}

export default ${camelCaseNameFile}Controller;
`;
    }

    const fileWrite = structure();
    const pathName = `docs/files/back/api/${parsedFileName.replace(/_/g, '-')}/`;
    ensureDirectoryExistence(pathName);
    await fs.writeFile(`${pathName}${parsedFileName.replace(/_/g, '-')}-controller.js`, fileWrite, { flag: 'w' }, (err) => {
        if (err) {
            return console.log(err);
        }
    });
};
