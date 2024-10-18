const fs = require("fs");
const {ensureDirectoryExistence} = require("../lib/Utils");

exports.makeFrontFileService = async (parsedFileName, camelCaseNameFile, fileName, data) => {
    if (data.length) {
        const fields = JSON.parse(data);
        let doFile = true
        for (let index = 0; index < fields.length; index++) {
            const field = fields[index];
            if (index === 0 && field['Observacoes'].toLowerCase().includes('primary key')) {
                doFile = true;
                break;
            }
        }
        if (doFile) {

            const structure = () => {
                return `import {Injectable} from '@angular/core';
import {SGVService} from "../sgv-service/sgv-api.service";
import {HttpClient} from '@angular/common/http';
import {${camelCaseNameFile}} from '../../models/${parsedFileName}';

@Injectable({
  providedIn: 'root'
})
export class ${camelCaseNameFile}Service extends SGVService<${camelCaseNameFile}> {
  constructor(http: HttpClient) {
    super('${camelCaseNameFile.toLocaleLowerCase()}', http)
  }
}
`;
            }

            let fileWrite = structure()

            let nameOfPath = 'docs/files/front/services/' + parsedFileName + '-service/'
            ensureDirectoryExistence(nameOfPath);
            await fs.writeFile(nameOfPath + parsedFileName + '-service.ts', fileWrite, {flag: 'w'}, function (err) {
                if (err) {
                    return console.log(err);
                }
            });
        }
    }
    else
        console.log('Erro ao criar o arquivo de serviço do front')
}