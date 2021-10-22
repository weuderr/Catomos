import ApiConfig from '../../config/api.conf';

const Item = (sequelize, DataTypes) => {

    // Define environment object
    const config = new ApiConfig();
    const environment = config.getEnv();
    let schema = environment.databases.postgres.schema;

    const model = sequelize.define('PreviousName',{id:{field:"id",
type:"DataTypes.INTEGER",allowNull:false,required:true,primaryKey:true,autoIncrement:true,unique:true,comment:"Id"},company_id:{field:"company_id",type:"DataTypes.INTEGER",allowNull:false,required:true,validate:{isNumeric:true},comment:"Company Id"},previous_name:{field:"previous_name",type:"DataTypes.STRING(200)",allowNull:false,required:true,validate:{min:1,max:200},comment:"Previous Name"},change_date:{field:"change_date",type:"DataTypes.date",allowNull:true,required:false,validate:{isDate:true,notNull:false},comment:"Change Date"}}    ).schema(schema);

    model.associate = (models) => {
model.hasMany( models.company_id, { foreignKey: 'company_id' });   
    };

    return model;

};

module.exports = Item;