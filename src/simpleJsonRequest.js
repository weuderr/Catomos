const fs = require('fs');

const readFolder = '/home/weuder/Trabalho/Freelance/Tellurianstudio/aperam/gftm/docs/json/';

fs.readdir(readFolder, async (err, files) => {
    for (const file of files) {
        if (file)
            await makeModel(file);
    }
});

function fieldsForModel(e) {
    let model = {}
    model.add(e['Atributo'])
    return model
}

function upFistLetter(parseName) {
    let fistWord = parseName[0].toUpperCase();
    let lastWord = parseName.substr(1, parseName.length);
    let fileName = fistWord + lastWord
    return fileName;
}

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

async function makeModel(file) {
    // console.log('Make init file: '+ file)
    let parseName = file.replace('.json', '').replace(' ', '_').toLowerCase();
    let fileName = upFistLetter(parseName);
    console.log(parseName+" - "+fileName)
    await fs.readFile(readFolder + file, 'utf8', async function (err, data) {

        if (data) {
            let values = JSON.parse(data)
            let model = {};

            values.forEach(function (e) {
                switch (e.Tipo) {
                    case "number" :
                        model[e.Atributo] = parseInt(Math.random()*1001)
                        break
                    case "varchar" :
                        model[e.Atributo] = makeid(e.Tamanho)
                        break
                    case "date" :
                        model[e.Atributo] = new Date()
                        break
                }
            });

            let pattern = new RegExp(/"([^"]+)":/g);
            let stringFy = JSON.stringify(model)
            let stringMod = stringFy.replace(',', ', \n')
            // stringMod = stringMod.replace(pattern, '$1:').replace(/\uFFFF/g, '\\\"')

            let fileWrite = "["+stringMod+"]"

            await fs.writeFile('parses/json/' + fileName.toLowerCase() + '.js', fileWrite, {flag: 'w'}, function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log("Saved "+fileName + ".js");
            });
        }

    });
    // console.log('Make finish file: '+ file)
}
