const { fieldsForModel, camelCaseLetter, lowerFirstLetter } = require("../lib/Utils");
const fs = require("fs");

exports.makeModel = async (parsedFileName, camelCaseNameFile, fileName, data, allFiles) => {

    // Estrutura de cabeçalho do arquivo de modelo
    const structureUp = () => `
import ApiConfig from '../../config/api.conf';
import { BasicFields } from '../fields/postgres/basicFields';
import { BasicHooks } from '../fields/postgres/basicHooks';

const ${camelCaseNameFile} = (sequelize, DataTypes) => {

    const basicFields = new BasicFields(DataTypes);

    // Define environment object
    const config = new ApiConfig();
    const environment = config.getEnv();
    let schema = environment.databases.postgres.schema;

    const model = sequelize.define('${camelCaseNameFile}', `;

    // Estrutura intermediária que define hooks e configurações da tabela
    const structureMiddle = (hook) => `, {
        paranoid: true,
        freezeTableName: true,
        tableName: '${fileName}',
        hooks: ${!!hook}
    }).schema(schema);

    model.associate = (models) => {
    `;

    // Estrutura final que fecha o arquivo e exporta o modelo
    const structureDown = (hook) => `
    };

    ${hook}

    return model;
};

module.exports = ${camelCaseNameFile};
`;

    if (data) {
        const fields = JSON.parse(data);
        let model = {};
        let foreignKeyAssociations = '';
        let hookVariable = '';
        let hookPromise = '';
        let bodyHook = '';

        // Itera pelos campos para configurar o modelo e chaves estrangeiras
        fields.forEach((field, index) => {
            const nameAttribute = index === 0 && field['Observacoes'] === 'primary key'
                ? 'id'
                : camelCaseLetter(field['Atributo']);

            model[nameAttribute] = fieldsForModel(field);

            if (field['Observacoes'] === 'foreign key') {
                foreignKeyAssociations += `
    model.belongsTo(models.${field['Tabela']}, { 
        foreignKey: '${camelCaseLetter(nameAttribute)}', 
        onDelete: 'SET NULL' 
    });
                `;
            }
        });

        // Configura hooks para verificações de relação entre tabelas
        allFiles.forEach((file) => {
            const data = JSON.parse(file.data);
            data.forEach((item) => {
                if (item['Tabela'] === camelCaseNameFile) {
                    const vinculado = file.className.endsWith('a') ? 'vinculada' : 'vinculado';
                    const tabela = item['displayName'].endsWith('a') ? 'esta' : 'este';

                    hookVariable += `
    const where${file.className} = { ${camelCaseLetter(item['Atributo'])}: options.where.${item['Atributo']} };
    const msg${file.className} = 'Existe uma ou mais ${file.className}(s) ${vinculado}(s) a ${tabela} ${item['Tabela']}.';
                    `;
                    hookPromise += `
    promisse.push(new BasicHooks('${file.className}').verifyExistRelation(where${file.className}, msg${file.className}));
                    `;
                    foreignKeyAssociations += `
    model.hasMany(models.${file.className}, {
        foreignKey: '${camelCaseLetter(item['Atributo'])}', 
        as: '${lowerFirstLetter(file.className)}'
    });
                    `;
                }
            });
        });

        // Campos básicos padrão para o modelo
        Object.assign(model, {
            unit: 'basicFields.setFieldUnit()',
            user: 'basicFields.setFieldUser()',
            situation: 'basicFields.setFieldSituation()',
            createdAt: 'basicFields.setFieldCreatedAt()',
            updatedAt: 'basicFields.setFieldUpdatedAt()',
            deletedAt: 'basicFields.setFieldDeletedAt()'
        });

        // Formatação do modelo como string
        let modelString = JSON.stringify(model, null, 4)
            .replace(/"([^"]+)":/g, '$1:')
            .replace(/"DataTypes/g, 'DataTypes')
            .replace(/\",allowNull/g, ',allowNull')
            .replace(/\"basicFields/g, 'basicFields')
            .replace(/\(\)\"/g, '()');

        // Configuração dos hooks, caso existam
        if (hookVariable) {
            bodyHook = `
    model.addHook('beforeBulkDestroy', (options) => {
        let promisse = [];
        ${hookVariable}
        
        ${hookPromise}

        return promisse;
    });
            `;
        }

        // Concatena as partes do arquivo final
        const fileContent = structureUp() + modelString + structureMiddle(!!hookVariable) + foreignKeyAssociations + structureDown(bodyHook);

        // Escreve o arquivo
        try {
            await fs.promises.writeFile(`docs/files/back/models/postgres/${camelCaseNameFile}.js`, fileContent, { flag: 'w' });
            console.log(`Model file created successfully: ${camelCaseNameFile}.js`);
        } catch (err) {
            console.error(`Error writing model file: ${err}`);
        }
    }
};
