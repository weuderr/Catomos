const {fieldsForModel, upLetter, lowerFirstLetter} = require("../lib/Utils");
const fs = require("fs");

exports.makeModel = async (parsedFileName, camelCaseNameFile, fileName, data, allFiles) => {

    function structureUp() {
        return "import ApiConfig from '../../config/api.conf';\n" +
            "import { BasicFields } from '../fields/postgres/basicFields';\n" +
            "import {BasicHooks} from '../fields/postgres/basicHooks';\n" +
            "\n" +
            "const " + camelCaseNameFile + " = (sequelize, DataTypes) => {\n" +
            "\n" +
            "    const basicFields = new BasicFields(DataTypes);\n" +
            "\n" +
            "    // Define environment object\n" +
            "    const config = new ApiConfig();\n" +
            "    const environment = config.getEnv();\n" +
            "    let schema = environment.databases.postgres.schema;\n" +
            "\n" +
            "    const model = sequelize.define('" + camelCaseNameFile + "',";
    }

    function structureMiddle(hook) {
        return "     {\n" +
            "            paranoid: true,\n" +
            "            freezeTableName: true,\n" +
            "            tableName: '" + fileName + "',\n" +
            "            hooks: " + !!hook + "\n" +
            "        }).schema(schema);\n" +
            "\n" +
            "    model.associate = (models) => {\n";
    }

    function structureDown(hook) {
        return "   \n" +
            "    };\n" +
            "\n" +
            hook +
            "\n" +
            "    return model;\n" +
            "};\n" +
            "\n" +
            "module.exports = " + camelCaseNameFile + ";";
    }

    if (data) {
        let fields = JSON.parse(data)
        let model = {};
        let foreignKey = '';
        let bodyHook = '';
        let hook = '';

        fields.forEach(function (field, index) {

            const nameAttribute = index === 0 ? field['Observacoes'] === 'primary key' ? 'id' : upLetter(field['Atributo']) : upLetter(field['Atributo']);
            model[nameAttribute] = fieldsForModel(field);

            if (field['Observacoes'] === 'foreign key') {
                foreignKey += `model.belongsTo( models.${field['Tabela']}, { foreignKey: '${upLetter(nameAttribute)}', onDelete: 'SET NULL' } );`
            }

        });

        let hookVariable = '';
        let hookPromise = '';
        allFiles.forEach(function (file) {
            const data = JSON.parse(file.data);
            data.forEach(function (item) {
                if (item['Tabela'] === camelCaseNameFile) {
                    const getLastLatterVinc = file.className.split('').pop();
                    const getLastLatterTab = item['displayName'].split('').pop();
                    const vinculado = getLastLatterVinc !== 'a' ? 'vinculado' : 'vinculada';
                    const tabela = getLastLatterTab !== 'a' ? 'este' : 'esta';

                    hookVariable += `const where${file.className} = { ${upLetter(item['Atributo'])}: options.where.${item['Atributo']} };
                    const msg${file.className} = 'Existe uma ou mais ${file.className}(s) ${vinculado}(s) a ${tabela} ${item['Tabela']}.';`;
                    hookPromise += `promisse.push(new BasicHooks('${file.className}').verifyExistRelation(where${file.className}, msg${file.className}));`;

                    foreignKey += `model.hasMany(models.${file.className}, {foreignKey: '${upLetter(item['Atributo'])}', as: '${lowerFirstLetter(file.className)}'});`
                }
            })

        })

        model['unit'] = 'basicFields.setFieldUnit()';
        model['user'] = 'basicFields.setFieldUser()';
        model['situation'] = 'basicFields.setFieldSituation()';
        model['createdAt'] = 'basicFields.setFieldCreatedAt()';
        model['updatedAt'] = 'basicFields.setFieldUpdatedAt()';
        model['deletedAt'] = 'basicFields.setFieldDeletedAt()';

        let pattern = new RegExp(/"([^"]+)":/g);
        let stringFy = JSON.stringify(model);
        //remove " with regex of all name fields
        let stringMod = stringFy.replace(pattern, '$1:').replace(/\uFFFF/g, '\\\"').replace(',', ',\n');
        //remove double quotes before beginning of phrase DataTypes and end of the same phrase
        stringMod = stringMod.replace(/\"DataTypes/g, 'DataTypes').replace(/\",allowNull/g, ',allowNull');
        stringMod = stringMod.replace(/\"basicFields/g, 'basicFields').replace(/\(\)\"/g, '()');


        if(hookVariable) {
            hook = `${hookVariable}
            
            ${hookPromise}
            `
        }

        if(hook) {
            bodyHook = `model.addHook('beforeBulkDestroy', (options) =>{\n` +
                `let promisse = [];\n` +
                `${hook}\n` +
                `return promisse;\n` +
                `});`
        }
        structureUp = structureUp()
        structureMiddle = structureMiddle(hook)
        structureDown = structureDown(bodyHook)
        let fileWrite = structureUp + stringMod + ',' + structureMiddle + foreignKey + structureDown

        await fs.writeFile('docs/files/back/models/postgres/' + camelCaseNameFile + '.js', fileWrite, {flag: 'w'}, function (err) {
            if (err) {
                return console.log(err);
            }
        });
    }

    // console.log('Make finish file: '+ file)
}