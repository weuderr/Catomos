const fs = require("fs");
const { ensureDirectoryExistence } = require("../lib/Utils");

exports.makeServiceBack = async (parsedFileName, camelCaseNameFile) => {
    function structure() {
        return `import ${camelCaseNameFile}Model from "../../models/${parsedFileName}";

class ${camelCaseNameFile}Service {
  /**
   * Cria um novo ${camelCaseNameFile}.
   * @async
   * @param {object} ${camelCaseNameFile.toLowerCase()} - Dados do ${camelCaseNameFile}.
   * @returns {Promise<Object>} - ${camelCaseNameFile} criado.
   * @throws {Error} - Se ocorrer erro na criação.
   */
  async create${camelCaseNameFile}(${camelCaseNameFile.toLowerCase()}) {
    try {
      await this.verifyUniqueConstraints(${camelCaseNameFile.toLowerCase()});
      const instance = await ${camelCaseNameFile}Model.create(${camelCaseNameFile.toLowerCase()});
      return instance;
    } catch (error) {
      this.handleError(error, 406);
    }
  }

  /**
   * Atualiza um ${camelCaseNameFile} existente.
   * @async
   * @param {number} id - ID do ${camelCaseNameFile} a ser atualizado.
   * @param {object} ${camelCaseNameFile.toLowerCase()} - Novos dados do ${camelCaseNameFile}.
   * @returns {Promise<Object>} - ${camelCaseNameFile} atualizado.
   * @throws {Error} - Se o ${camelCaseNameFile} não existir ou ocorrer erro na atualização.
   */
  async update${camelCaseNameFile}(id, ${camelCaseNameFile.toLowerCase()}) {
    const instance = await ${camelCaseNameFile}Model.findByPk(id);
    if (!instance) {
      const error = new Error(\`${camelCaseNameFile} com ID \${id} não encontrado.\`);
      error.status = 409;
      throw error;
    }

    try {
      return await instance.update(${camelCaseNameFile.toLowerCase()});
    } catch (error) {
      this.handleError(error, 406);
    }
  }

  /**
   * Obtém todos os ${camelCaseNameFile}s.
   * @async
   * @returns {Promise<Array<Object>>} - Lista de ${camelCaseNameFile}s.
   * @throws {Error} - Se ocorrer erro na busca.
   */
  async getAll${camelCaseNameFile}s() {
    try {
      return await ${camelCaseNameFile}Model.findAll();
    } catch (error) {
      this.handleError(error, 404);
    }
  }


  /**
   * Busca um Campanha por ID.
   * @async
   * @param {number} id - ID do Campanha.
   * @param order
   * @param include
   * @param group
   * @returns {Promise<Object>} - Campanha encontrado.
   * @throws {Error} - Se o Campanha não for encontrado.
   */
  async getCampanhaById(id, order = [], include = [], group = []) {
    try {
      const instance = await ${camelCaseNameFile}Model.findByPk(id, {order: order, include: include, group: group});
      if (!instance) throw new Error(\`${camelCaseNameFile} com ID \${id} não encontrado.\`);
      return instance;
    } catch (error) {
      this.handleError(error, 404);
    }
  }

  /**
   * Remove um ${camelCaseNameFile} por ID.
   * @async
   * @param {number} id - ID do ${camelCaseNameFile} a ser removido.
   * @returns {Promise<void>}
   * @throws {Error} - Se o ${camelCaseNameFile} não for encontrado ou ocorrer erro na remoção.
   */
  async delete${camelCaseNameFile}(id) {
    const instance = await ${camelCaseNameFile}Model.findByPk(id);
    if (!instance) {
      const error = new Error(\`${camelCaseNameFile} com ID \${id} não encontrado.\`);
      error.status = 404;
      throw error;
    }

    try {
      await instance.destroy();
    } catch (error) {
      this.handleError(error, 500);
    }
  }

  /**
   * Verifica restrições únicas (exemplo: e-mail).
   * @async
   * @param {object} data - Dados do ${camelCaseNameFile}.
   * @throws {Error} - Se as restrições forem violadas.
   */
  async verifyUniqueConstraints(data) {
    // Adicione verificações de restrições exclusivas aqui, se necessário
  }

  /**
   * Manipula erros e lança uma exceção com status personalizado.
   * @param {Error} error - Objeto de erro.
   * @param {number} status - Código de status HTTP.
   * @throws {Error} - Lança o erro com status definido.
   */
  handleError(error, status) {
    error.status = status || 500;
    throw error;
  }
}

export default new ${camelCaseNameFile}Service();
`;
    }

    const fileWrite = structure();
    const pathName = `docs/files/back/api/${parsedFileName.replace(/_/g, '-')}/`;
    ensureDirectoryExistence(pathName);

    await fs.writeFile(`${pathName}${parsedFileName.replace(/_/g, '-')}-service.js`, fileWrite, { flag: 'w' }, (err) => {
        if (err) {
            return console.log(err);
        }
    });
};
