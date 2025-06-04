'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Discount extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Discount.init({
    code: DataTypes.STRING,
    type: DataTypes.ENUM ('percentage', 'fixed'),
    value: DataTypes.FLOAT,
    active: DataTypes.BOOLEAN,
    valid_until: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Discount',
  });
  return Discount;
};