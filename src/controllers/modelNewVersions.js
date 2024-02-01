const {fieldsForModel, camelCaseLetter, upSpaceLetter, lowerFirstLetter} = require("../lib/Utils");
const fs = require("fs");

exports.modelNewVersions = async (parsedFileName, camelCaseNameFile, fileName, data, allFiles) => {
    const attributes = JSON.parse(data).map(field => {
        const fieldName = camelCaseLetter(field['Atributo']);
        const type = field['Tipo'] === 'varchar' ? `DataTypes.STRING(${field['Tamanho']})` :
            field['Tipo'] === 'number' ? 'DataTypes.INTEGER' :
            field['Tipo'] === 'bigint' ? 'DataTypes.BIGINT' :
            field['Tipo'] === 'float' ? 'DataTypes.FLOAT' :
            field['Tipo'] === 'double' ? 'DataTypes.DOUBLE' :
            field['Tipo'] === 'decimal' ? `DataTypes.DECIMAL(${field['Precision']}, ${field['Scale']})` :
            field['Tipo'] === 'date' ? 'DataTypes.DATEONLY' :
            field['Tipo'] === 'datetime' ? 'DataTypes.DATE' :
            field['Tipo'] === 'boolean' ? 'DataTypes.BOOLEAN' :
            field['Tipo'] === 'uuid' ? 'DataTypes.UUID' :
            'DataTypes.TEXT'; // default fallback
        const allowNull = field['Obrigatoriedade'] === 'não';
        const primaryKey = field['Observacoes'].includes('primary key');
        const unique = primaryKey || field['Observacoes'].includes('UUID');
        const comment = field['Descricao'];

        return `${fieldName}: {
            type: ${type},
            allowNull: ${allowNull}, 
            ${primaryKey ? 'primaryKey: true,\n' : ''}${unique ? 'unique: true,\n' : ''}comment: "${comment}"
        }`;
    }).join(',\n        ');


    let fields = JSON.parse(data)
    let associations = '';
    fields.forEach(function (field, index) {

        const nameAttribute = index === 0 ? field['Observacoes'].includes('foreign key') ? 'id' : camelCaseLetter(field['Atributo']) : camelCaseLetter(field['Atributo']);

        if (field['Observacoes'].includes('foreign key')) {
            associations += `model.belongsTo( models.${field['Tabela']}, { foreignKey: '${camelCaseLetter(nameAttribute)}', onDelete: 'SET NULL' } );\n`
        }

    });

    let hookVariable = '';
    let hookPromise = '';

    allFiles.forEach(function (v, i) {
        if(camelCaseNameFile === v.className) return;
        const item = JSON.parse(v.data);
        let referencia = item.filter(i => i['Tabela'] === camelCaseNameFile);
        if (referencia.length > 0) {
            referencia = referencia[0];
            const file = v;
            const getLastLatterVinc = file['className'][0]
            const getLastLatterTab = camelCaseNameFile[0];
            const vinculado = getLastLatterVinc !== 'A' ? 'vinculado' : 'vinculada';
            const tabela = getLastLatterTab !== 'A' ? 'este' : 'esta';

            hookVariable += `const where${file.className} = { ${referencia['Atributo']}: options.where.${referencia['Atributo']} };
                const msg${file.className} = 'Existe uma ou mais ${file.className}(s) ${vinculado}(s) a ${tabela} ${referencia['Tabela']}.';\n`;
            hookPromise += `promisse.push(new BasicHooks('${file.className}').verifyExistRelation(where${file.className}, msg${file.className}));\n`;

            associations += `model.hasMany(models.${file.className}, {foreignKey: '${referencia['Atributo']}', as: '${file.className}s'});\n`
        }
    });


    const modelTemplate = `'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ${upSpaceLetter(camelCaseNameFile)} extends Model {
        /**
         * Método auxiliar para definir associações.
         * Este método não é parte do ciclo de vida do Sequelize.
         * O arquivo 'models/index' chamará este método automaticamente.
         */
        static associate(models) {
            ${associations}
        }
        
        static async beforeCreate(model) {
            const promisse = [];
            ${hookVariable}
            ${hookPromise}
            await Promise.all(promisse);
        }
    }
    
    ${upSpaceLetter(camelCaseNameFile)}.init({
        ${attributes}
    }, {
        sequelize,
        modelName: '${upSpaceLetter(camelCaseNameFile)}',
        timestamps: true,
        paranoid: true,
        underscored: true,
    });

    return ${upSpaceLetter(camelCaseNameFile)};
};`;


    await fs.writeFile('docs/files/backNew/models/postgres/' + camelCaseNameFile + '.js', modelTemplate, {flag: 'w'}, function (err) {
        if (err) throw err;
        console.log('Saved!');
    });
};