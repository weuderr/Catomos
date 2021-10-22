import ApiConfig from '../../config/api.conf';

const Item = (sequelize, DataTypes) => {

    // Define environment object
    const config = new ApiConfig();
    const environment = config.getEnv();
    let schema = environment.databases.postgres.schema;

    const model = sequelize.define('Secretary',{id:{field:"id",
type:"DataTypes.INTEGER",allowNull:false,required:true,primaryKey:true,autoIncrement:true,unique:true,comment:"Id"},secretary_name:{field:"secretary_name",type:"DataTypes.STRING(100)",allowNull:false,required:true,validate:{min:1,max:100},comment:"Name"}}    ).schema(schema);

    model.associate = (models) => {
   
    };

    return model;

};

module.exports = Item;