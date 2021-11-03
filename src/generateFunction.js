const fs = require('fs');
const path = require("path");

// const readFolder = '/home/weuder/Trabalho/Freelancer/Thellurian/Aperam/gftm/docs/json/';
// const readFolder = '/home/weuder/Trabalho/Freelance/Tellurianstudio/aperam/cld/docs/json/';
const readFolder = '/home/weuder/Trabalho/Freelancer/Thellurian/Aperam/cld/docs/json/';

fs.readdir(readFolder, async (err, files) => {
    for (const file of files) {
        if (file)
            await makeModel(file);
    }
});

function upFistLetter(parseName) {
    let fistWord = parseName[0].toUpperCase();
    let lastWord = parseName.substr(1, parseName.length);
    let fileName = fistWord + lastWord
    return fileName;
}

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

function makeFunction(model, parseName, fileName) {
    let pattern = new RegExp(/_/g);
    let setValues = '';
    let modalFields = '';
    let datatableFields = '';
    let editValues;
    model.forEach(function (e) {
        setValues += `$$('ch_${e.Atributo}').setValue(val.data.${e.Atributo});\n`

        modalFields += `new WebixInput('${e.Atributo}', '${e.Atributo.replace(pattern, ' ')}', {required: true}, {
            id: 'ch_${e.Atributo}',
            width: 280
          }).getField(),\n`
        datatableFields += `{
        id: '${e.Atributo}',
        editor: '${model[e.Tipo] === 'varchar' ? 'text' : e.Tipo === 'number' ? 'numeric' : 'date'}',
        header: ['${e.Atributo.replace(pattern, ' ')}}', {content: 'textFilter'}],
        fillspace: true,
        sort: '${model[e.Tipo] === 'numeric' ? 'int' : 'text'}'
      },\n`
        editValues += `${e.Atributo}: $$('ch_${e.Atributo}').getValue(),\n`

    });
    let funcDef = `async _${fileName}() {
    let $$ = this.$$;
    let webix = this.webix;
    let editId = null;
    let nameOfModel = '${fileName}';
    let nameOfDataTable = '${fileName}';
    let userId = this.profile.getIdUserLogged();
    let companyId = 1;
    let nameToolbarTab = 'toolbar${fileName}Tabs';
    let nameModal = '${fileName}';
    let idModal = 'modal${fileName}';
    
    this._genericService.getAll(nameOfModel).subscribe((val) => {
      this.$$(nameOfDataTable).define('data', val.data);
      this.$$(nameOfDataTable).refresh();
    }); 
    
    let modalTabModify = (id) => {
      editId = id.row;
      this._genericService.getOnlyOne(nameOfModel, id).subscribe((val) => {
        ${setValues}
        $$(idModal).show();
      });
    };

    let defButtons = [
      {
        view: 'button', value: 'Cancel', click: function (id) {
          $$(idModal).hide();
        }
      },
      {
        view: 'button', value: 'Confirm', click: function (id) {
          let values = {
            ${editValues}
            company_id: companyId,
            user: userId,
          }
          if (editId) {
            $$(nameOfDataTable).updateItem(editId, values);
            webix.message('Row update successfully');
            editId = null
          }
          else {
            $$(nameOfDataTable).add(values);
            webix.message('Row add successfully');
          }
          $$(idModal).hide();
        }
      }
    ];

    let defFields = [
      ${modalFields}
      {
        cols: defButtons
      }
    ]

    let defModal = {
      view: 'window',
      move: true,
      width: 300,
      height: 400,
      id: idModal,
      position: 'center',
      close: true,
      header: nameModal,
      modal: true,
      padding: 20,
      body: {
        rows: defFields
      },
    }

    this.webix.ui(defModal);
    
    let tooltipsTab = new WebixToolbar(nameToolbarTab, nameToolbarTab, [
      {
        view: 'icon', icon: 'fa fa-file-text-o', tooltip: 'Add', click: function (id) {
          editId = null;
          $$(nameOfDataTable).clearSelection()
          $$(idModal).show();
        }
      },
      {
        view: 'icon', icon: 'fa fa-eraser', tooltip: 'Clean', click: () => {
          this.webix.confirm('Are you sure you want to clear the current form?', (value) => {
            if (value) {
              var id = $$(nameOfDataTable).getSelectedId();
              if (id)
                $$(nameOfDataTable).remove(id);
            }
          });
        }
      }
    ])

    let fieldsDataTable = [
        ${datatableFields}
    ]

    let mainDataTable = {
      view: 'datatable',
      id: nameOfDataTable,
      multiselect: true,
      select: 'row',
      editable: false,
      columns: fieldsDataTable,
      save: {
        updateFromResponse: true,
        url: environment.apis.cld.url+'api/webix/'+nameOfModel
      },
      data: [],
      on: {
        'onItemDblClick': async function (id) {
          await modalTabModify(id);
        }
      }
    }

    return {
      rows: [
        tooltipsTab.getField(),
        mainDataTable
      ]
    }
  }`
    return funcDef;
}

async function makeModel(file) {
    let parseName = file.replace('.json', '').replace(/\s/g, '_').toLowerCase();
    let fileName = upFistLetter(parseName);
    console.log(parseName + " - " + fileName)
    await fs.readFile(readFolder + file, 'utf8', async function (err, data) {

        if (data) {
            let values = JSON.parse(data)

            let model = makeFunction(values, parseName, fileName)

            let filePath = path.resolve(__dirname, '../parses/func/' + fileName.toLowerCase() + '.ts')
            await fs.writeFile(filePath, model, {flag: 'w'}, function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log("Saved " + fileName + ".js");
            });
        }

    });
    // console.log('Make finish file: '+ file)
}
