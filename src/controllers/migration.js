const fs = require("fs");

exports.makeMigration = async (parsedFileName, camelCaseNameFile, fileName, data, allFiles) => {

    // Estrutura de cabeçalho do arquivo de migração
    const structureUp = () => `
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    await queryInterface.createTable('${fileName}', {
    `;

    // Estrutura de rodapé do arquivo de migração
    const structureDown = () => `
    
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('${fileName}');
  }
};
    `;

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

            // Define a coluna com base no tipo e outras propriedades
            fieldDefinitions += `
      ${attributeName}: {
        type: DataTypes.${field['Tipo'].toUpperCase()}${field['Tamanho'] ? `(${field['Tamanho']})` : ''},
        ${isNotNull ? 'allowNull: false,' : 'allowNull: true,'}
        ${isPrimaryKey ? 'primaryKey: true,' : ''}
      },
            `;

            // Configuração de chave estrangeira
            if (isForeignKey) {
                foreignKeys += `
    await queryInterface.addConstraint('${fileName}', {
      fields: ['${attributeName}'],
      type: 'foreign key',
      name: 'fk_${fileName}_${attributeName}',
      references: {
        table: '${field['Tabela']}',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
                `;
            }
        });

        // Concatena todas as partes da estrutura da migração
        const migrationContent = structureUp() + fieldDefinitions + `
    });\n\n` + foreignKeys + structureDown();

        // Escreve o arquivo de migração
        try {
            await fs.promises.writeFile(`docs/files/back/migrations/${Date.now()}-create-${fileName}.js`, migrationContent, {flag: 'w'});
            console.log(`Migration file created successfully: ${fileName}`);
        } catch (err) {
            console.error(`Error writing migration file: ${err}`);
        }
    }
};
