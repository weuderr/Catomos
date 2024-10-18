const fs = require("fs");

exports.makeMigration = async (parsedFileName, camelCaseNameFile, fileName, data, allFiles) => {
    fileName = fileName.toUpperCase();
    const schema = 'sgv';
    // Estrutura de cabeçalho do arquivo de migração
    const structureUp = () => `
'use strict';
/** @type {import('sequelize-cli').Migration} */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('${fileName}', {`;

    // Estrutura de rodapé do arquivo de migração
    const structureDown = () => `},

  down: async queryInterface => {
    await queryInterface.dropTable('${fileName}');
  }
};
    `;

    function replaceEnumValues(fieldElement) {
        const values = fieldElement.split(',').map((value) => {
            return value.trim().replace(/'/g, '');
        });
        return JSON.stringify(values);
    }

    if (data) {
        const fields = JSON.parse(data);
        let fieldDefinitions = '';
        let foreignKeys = '';

        // Itera sobre os campos para definir as colunas da tabela
        fields.forEach((field) => {
            const attributeName = field['Atributo'];
            const isPrimaryKey = field['Observacoes'] && field['Observacoes'].includes('primary key');
            const isForeignKey = field['Observacoes'] && field['Observacoes'].includes('foreign key');
            const isNotNull = field['Obrigatoriedade'] === 'sim';
            const comment = field['Descricao'];
            const tipoEnum = field['Tipo'] === 'enum';

            // Define a coluna com base no tipo e outras propriedades
            fieldDefinitions += `
    ${attributeName}: {
        type: Sequelize.${field['Tipo'].toUpperCase()}${field['Tamanho'] ? `(${field['Tamanho']})` : ''},${tipoEnum ? `\nvalues: ${replaceEnumValues(field['Observacoes'])},` : ''}
        ${isNotNull ? 'allowNull: false,' : 'allowNull: true,'}
        ${!!comment ? `comment: "${field['Descricao']}",` : ''}${isPrimaryKey ? '\n        primaryKey: true,' : ''}
      },`;

            // Configuração de chave estrangeira
            if (isForeignKey) {
                foreignKeys += `
    await queryInterface.addConstraint('${schema ? `${schema}.` : ''}${fileName}', {
      fields: ['${attributeName}'],
      type: 'foreign key',
      name: 'fk_${fileName}_${attributeName}',
      references: {
        table: { tableName: '${field['Tabela'].toUpperCase()}', schema: '${schema}' },
        field: '${field['Campo'] || attributeName }'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });`;
            }
        });

        // Concatena todas as partes da estrutura da migração
        const migrationContent = structureUp() + fieldDefinitions + `
    },{${schema ? `\nschema: '${schema}',` : ''}paranoid:true,timestamp:false});\n` + foreignKeys + structureDown();

        // Escreve o arquivo de migração
        try {
            await fs.promises.writeFile(`docs/files/back/migrations/${Date.now()}-create-${fileName.toLowerCase()}.js`, migrationContent, {flag: 'w'});
            console.log(`Migration file created successfully: ${fileName}`);
        } catch (err) {
            console.error(`Error writing migration file: ${err}`);
        }
    }
};
