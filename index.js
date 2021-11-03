const fs = require('fs');

// const readFolder = '/home/weuder/Trabalho/Freelancer/Thellurian/Aperam/gftm/docs/json/';
const readFolder = '/home/weuder/Trabalho/Freelancer/Thellurian/Aperam/cld/docs/json/';

fs.readdir(readFolder, async (err, files) => {
    for (const file of files) {
        if (file)
            await makeModel(file);
    }
});

function getValidate(e) {
    let validate = {}
    switch (e.Tipo) {
        case 'number' :
            validate.isNumeric = true
            break
        case 'varchar' :
            if(e.Obrigatoriedade === 'Sim')
            {
                validate.min = 1;
            }
            else
            {
                validate.min = 0;
            }
            validate.max = e.Tamanho;
            break
        case 'date' :
            validate.isDate = true
            validate.notNull = (e.Obrigatoriedade === 'Sim');
            break
    }
    return validate
}

function getType(e) {
    let type = '';
    switch (e.Tipo) {
        case 'numeric' :
            type = 'DataTypes.INTEGER';
            break;
        case 'number' :
            type = 'DataTypes.INTEGER';
            break;
        case 'varchar' :
            type = 'DataTypes.STRING(' + e.Tamanho + ')';
            break;
        case 'date' :
            console.log(e.Tipo)
            console.log(e['Observation'])
            if( !e['Observation'] || e['Observation'].length >= 16)
                type =  'DataTypes.DATE';
            else
                type =  'DataTypes.DATEONLY';
            break;
    }
    return type;
}

function getAllowNull(e) {
    return (e.Obrigatoriedade !== 'Sim');
}

function getRequired(e) {
    return (e.Obrigatoriedade === 'Sim');
}

function fieldsForModel(e) {
    let model = {}
    model.field = e['Atributo']
    model.type = getType(e)
    model.allowNull = getAllowNull(e)
    model.required = getRequired(e)
    if(e['Descrição'] !== "")
        model.comment = e['Descrição']

    if (e['Observações'] === 'primary key')
    {
        model.primaryKey= true
        model.autoIncrement= true
        model.unique= true
    }
    return model
}

function upFistLetter(parseName) {
    let fistWord = parseName[0].toUpperCase();
    let lastWord = parseName.substr(1, parseName.length);
    let fileName = fistWord + lastWord
    return fileName;
}

async function makeModel(file) {
    // console.log('Make init file: '+ file)
    let parseName = file.replace('.json', '').replace(' ', '_').toLowerCase();
    let fileName = upFistLetter(parseName);
    console.log(parseName+" - "+fileName)
    await fs.readFile(readFolder + file, 'utf8', async function (err, data) {

        function structureUp() {
            return "import ApiConfig from '../../config/api.conf';\n" +
                "import { BasicFields } from '../fields/postgres/basicFields';\n" +
                "\n" +
                "const "+fileName+" = (sequelize, DataTypes) => {\n" +
                "\n" +
                "    const basicFields = new BasicFields(DataTypes);\n" +
                "\n" +
                "    // Define environment object\n" +
                "    const config = new ApiConfig();\n" +
                "    const environment = config.getEnv();\n" +
                "    let schema = environment.databases.postgres.schema;\n" +
                "\n" +
                "    const model = sequelize.define('" + fileName + "',";
        }

        function structureMiddle() {
            return "     {\n" +
                "            paranoid: true,\n" +
                "            tableName: '"+parseName+"'\n" +
                "        }).schema(schema);\n" +
                "\n" +
                "    model.associate = (models) => {\n";
        }

        function structureDown() {
            return "   \n" +
                "    };\n" +
                "\n" +
                "    return model;\n" +
                "\n" +
                "};\n" +
                "\n" +
                "module.exports = "+fileName+";";
        }

        var pattern0 = new RegExp(/"([^"]+)":/g);
        if (data) {
            let values = JSON.parse(data)
            structureUp = structureUp()
            structureDown = structureDown()
            structureMiddle = structureMiddle()
            let model = {};
            let foreignKey = '';

            values.forEach(function (e) {

                model[e.Atributo] = fieldsForModel(e);
                if (e['Observações'] === 'foreign key') {
                    foreignKey += `model.hasMany( models.${upFistLetter(e.Atributo.replace('_id',''))}, { foreignKey: \'${e.Atributo}\' });`
                }

            });

            let pattern = new RegExp(/"([^"]+)":/g);
            let stringFy = JSON.stringify(model)
            let stringMod = stringFy.replace(pattern, '$1:').replace(/\uFFFF/g, '\\\"').replace(',', ',\n')

            let fileWrite = structureUp + stringMod +','+ structureMiddle + foreignKey + structureDown

            await fs.writeFile('models/' + fileName.toLowerCase() + '.js', fileWrite, {flag: 'w'}, function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log("Saved "+fileName + ".js");
            });
        }

    });
    // console.log('Make finish file: '+ file)
}
