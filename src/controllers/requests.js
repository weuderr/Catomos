const fs = require('fs');
const path = require('path');

exports.makeCrudRequests = async (parsedFileName, camelCaseNameFile, nameWithSpace) => {
    function structure() {
        return `# Requisições CRUD para ${nameWithSpace}

## Criar um novo ${nameWithSpace}

POST http://localhost:3000/${camelCaseNameFile.toLowerCase()}
Content-Type: application/json

{
  // Substitua pelos dados do ${nameWithSpace}
}

###

## Obter todos os ${nameWithSpace}s

GET http://localhost:3000/${camelCaseNameFile.toLowerCase()}
Accept: application/json

###

## Obter um ${nameWithSpace} pelo ID

GET http://localhost:3000/${camelCaseNameFile.toLowerCase()}/1
Accept: application/json

###

## Atualizar um ${nameWithSpace}

PUT http://localhost:3000/${camelCaseNameFile.toLowerCase()}/1
Content-Type: application/json

{
  // Substitua pelos novos dados do ${nameWithSpace}
}

###

## Deletar um ${nameWithSpace}

DELETE http://localhost:3000/${camelCaseNameFile.toLowerCase()}/1
Accept: application/json

###`;
    }

    const fileContent = structure();
    const fileName = `${parsedFileName.replace(/_/g, '-')}-requests.http`;
    const filePath = path.join('docs/files/', 'requests', fileName);

    // Certifique-se de que o diretório existe
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    // Escreva o arquivo de requisições
    fs.writeFileSync(filePath, fileContent, 'utf8');
};
