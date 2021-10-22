import ApiConfig from '../../config/api.conf';

const Item = (sequelize, DataTypes) => {

    // Define environment object
    const config = new ApiConfig();
    const environment = config.getEnv();
    let schema = environment.databases.postgres.schema;

    const model = sequelize.define('Agent',{id:{field:"id",
type:"DataTypes.INTEGER",allowNull:false,required:true,primaryKey:true,autoIncrement:true,unique:true,comment:"Id"},agent_name:{field:"agent_name",type:"DataTypes.STRING(5)",allowNull:false,required:true,validate:{min:1,max:5},comment:"Name"},agent_type:{field:"agent_type",type:"DataTypes.STRING(1)",allowNull:false,required:true,validate:{min:1,max:1},comment:"Type"},email:{field:"email",type:"DataTypes.STRING(100)",allowNull:true,required:false,validate:{min:0,max:100},comment:"Email Address"},phone_number:{field:"phone_number",type:"DataTypes.STRING(20)",allowNull:true,required:false,validate:{min:0,max:20},comment:"Phone Number"},mobile_number:{field:"mobile_number",type:"DataTypes.STRING(20)",allowNull:true,required:false,validate:{min:0,max:20},comment:"Mobile Number"}}    ).schema(schema);

    model.associate = (models) => {
   
    };

    return model;

};

module.exports = Item;