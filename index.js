const fs = require('fs');

const testFolder = '/home/weuder/Trabalho/Freelancer/Thellurian/Aperam/cld/docs/';

fs.readdir(testFolder, async (err, files) => {
    for (const file of files) {
        console.log(file)
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
    return (e.Tipo === 'number') ? 'DataTypes.INTEGER' : e.Tipo === 'varchar' ? 'DataTypes.STRING(' + e.Tamanho + ')' : 'DataTypes.date';
}

function getAllowNull(e) {
    return (e.Obrigatoriedade !== 'Sim');
}

function getRequired(e) {
    return (e.Obrigatoriedade === 'Sim');
}

function fieldsForModel(e) {
    if (e['Observações'] === 'primary key')
        return {
            field: e.Atributo,
            type: getType(e),
            allowNull: getAllowNull(e),
            required: getRequired(e),
            primaryKey: true,
            autoIncrement: true,
            unique: true,
            comment: e.Descrição

        }
    else
        return {
            field: e.Atributo,
            type: getType(e),
            allowNull: getAllowNull(e),
            required: getRequired(e),
            validate: getValidate(e),
            comment: e.Descrição
        };
}

async function makeModel(file) {
    // console.log('Make init file: '+ file)
    let parseName = file.replace('.json', '').replace(' ', '_');
    let fistWord = parseName[0].toUpperCase();
    let lastWord = parseName.substr(1, parseName.length);
    let fileName = fistWord + lastWord
    await fs.readFile('/home/weuder/Trabalho/Freelancer/Thellurian/Aperam/cld/docs/' + file, 'utf8', async function (err, data) {

        function structureUp() {
            return "import ApiConfig from '../../config/api.conf';\n" +
                "\n" +
                "const Item = (sequelize, DataTypes) => {\n" +
                "\n" +
                "    // Define environment object\n" +
                "    const config = new ApiConfig();\n" +
                "    const environment = config.getEnv();\n" +
                "    let schema = environment.databases.postgres.schema;\n" +
                "\n" +
                "    const model = sequelize.define('" + fileName + "',";
        }

        function structureDown() {
            return "   \n" +
                "    };\n" +
                "\n" +
                "    return model;\n" +
                "\n" +
                "};\n" +
                "\n" +
                "module.exports = Item;";
        }

        function structureMiddle() {
            return "    ).schema(schema);\n" +
                "\n" +
                "    model.associate = (models) => {\n";
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
                    foreignKey += `model.hasMany( models.${e.Atributo}, { foreignKey: \'${e.Atributo}\' });`
                }

            });

            let pattern = new RegExp(/"([^"]+)":/g);
            let stringFy = JSON.stringify(model)
            let stringMod = stringFy.replace(pattern, '$1:').replace(/\uFFFF/g, '\\\"').replace(',', ',\n')

            let fileWrite = structureUp + stringMod + structureMiddle + foreignKey + structureDown

            await fs.writeFile('models/_' + fileName.toLowerCase() + '.js', fileWrite, {flag: 'w'}, function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log("Saved "+fileName + ".js");
            });
        }

    });
    // console.log('Make finish file: '+ file)
}
