const request = require('request');
const fs = require("fs");
const qs = require("querystring");
const path = require("path");

const {exec} = require("child_process");

async function generateNewFiles() {
    await exec("node src/simpleJsonRequest.js", async (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            return;
        }
        console.log(`stdout: ${stdout}`);
    });

}

async function sendRequest() {
    await generateNewFiles();
    let urlFileRead = path.resolve(__dirname, '../parses/json/sol_transporte.js')
    await fs.readFile(urlFileRead, 'utf8', async function (err, data) {
        let url = 'http://localhost:4003/api/solicitacaotransporte'

        await request.post({
                url,
                form: JSON.parse(data)[0],
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    console.log(body);
                }
            }
        );
    });
}

sendRequest().then(r => {console.log("Successful")})
