'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
   class Cart extends Model {
     static associate(models) {
       // Tambahkan asosiasi ke CartItem
       this.hasMany(models.CartItem, {
         foreignKey: "cart_id",
         as: "items",
       });

       // Asosiasi ke User jika diperlukan
       this.belongsTo(models.User, {
         foreignKey: "user_id",
         as: "user",
       });
     }
   }
  Cart.init({
    user_id: DataTypes.INTEGER,
    is_active: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Cart',
  });
  return Cart;
};