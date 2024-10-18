const fs = require("fs");
const { camelCaseLetter, upAllFistLetterWithSpace, castCamelCaseToFileName } = require("../lib/Utils");

exports.makeModel = async (parsedFileName, camelCaseNameFile, fileName, data, allFiles) => {
    let imports = '';

    if (data) {
        const fields = JSON.parse(data);
        let attributes = {};
        let associations = '';
        let hooks = '';

        // Processa os campos para criar os atributos do modelo
        fields.forEach((field) => {
            const fieldName = field['Atributo'].toUpperCase();
            const fieldReName = camelCaseLetter(fieldName);
            const fieldType = field['Tipo'].toUpperCase();

            const attribute = {
                type: `DataTypes.${fieldType}`,
                field: fieldName,
            };

            if (field['PermiteNull'] === 'não') {
                attribute.allowNull = false;
            } else {
                attribute.allowNull = true;
            }

            // Define a coluna como chave primária, se indicado
            if (field['Observacoes'] && field['Observacoes'].toLowerCase().includes('primary key')) {
                attribute.primaryKey = true;
            }

            attributes[fieldReName] = attribute;

            // Adiciona associações se o campo for uma chave estrangeira
            if (field['Observacoes'] && field['Observacoes'].toLowerCase().includes('foreign key')) {
                const associatedModelName = upAllFistLetterWithSpace(field['Tabela']);
                const associatedModelFileName = castCamelCaseToFileName(field['Tabela']);
                imports += `import ${associatedModelName} from "./${associatedModelFileName}.js";\n`;

                associations += `
      this.belongsTo(models.${associatedModelName}, { 
        foreignKey: '${fieldReName}',
        targetKey: '${field['ChaveEstrangeira'] || 'id'}',
        as: '${camelCaseLetter(associatedModelName)}',
        onDelete: 'SET NULL',
      });
        `;
            }
        });

        // Processa associações adicionais de outros modelos
        allFiles.forEach((file) => {
            const fileData = JSON.parse(file.data);
            fileData.forEach((item) => {
                if (item['Tabela'] === camelCaseNameFile) {
                    const relatedModelName = upAllFistLetterWithSpace(file.className);
                    const relatedModelFileName = castCamelCaseToFileName(file.className);
                    imports += `import ${relatedModelName} from "./${relatedModelFileName}.js";\n`;

                    const vinculado = file.className.endsWith('a') ? 'vinculada' : 'vinculado';
                    const tabela = item['displayName'].endsWith('a') ? 'esta' : 'este';

                    hooks += `
  beforeBulkDestroy: async (options) => {
    const where${relatedModelName} = { ${camelCaseLetter(item['Atributo'])}: options.where.${camelCaseLetter(item['Atributo'])} };
    const msg${relatedModelName} = 'Existe uma ou mais ${relatedModelName}(s) ${vinculado}(s) a ${tabela} ${item['Tabela']}.';
    await new BasicHooks('${relatedModelName}').verifyExistRelation(where${relatedModelName}, msg${relatedModelName});
  },
          `;

                    associations += `
      this.hasMany(models.${relatedModelName}, {
        foreignKey: '${camelCaseLetter(item['Atributo'])}',
        sourceKey: '${camelCaseLetter(item['Atributo'])}',
        as: '${camelCaseLetter(relatedModelName)}',
      });
          `;
                }
            });
        });

        // Gera o conteúdo do arquivo do modelo
        const fileContent = `
import { Model, DataTypes } from "sequelize";
import { sequelizePostgres } from "../database/postgres";
${imports ? imports + 'import BasicHooks from "./core/basic-hooks";' : ''}

class ${camelCaseNameFile}Model extends Model {
  static associate(models) {${associations}
  }
}

${camelCaseNameFile}Model.init(${JSON.stringify(attributes, null, 2).replace(/"DataTypes\.(\w+)"/g, 'DataTypes.$1')}, {
  sequelize: sequelizePostgres,
  tableName: "${fileName.toUpperCase()}",
  modelName: "${camelCaseNameFile}",
  timestamps: false,
  ${hooks ? `hooks: {
    ${hooks}
  }` : ''}
});

export default ${camelCaseNameFile}Model;
`;

        // Escreve o arquivo
        try {
            const path = `docs/files/back/models/postgres/${parsedFileName}.js`;
            await fs.promises.writeFile(path, fileContent, { flag: 'w' });
            console.log(`Model file created successfully: ${camelCaseNameFile}Model.js`);
        } catch (err) {
            console.error(`Error writing model file: ${err}`);
        }
    }
};
