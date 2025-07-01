// userdiscount.js
module.exports = (sequelize, DataTypes) => {
  const UserDiscount = sequelize.define(
    "UserDiscount",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      discount_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Discounts",
          key: "id",
        },
      },
      used_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "UserDiscounts",
      timestamps: true,
    }
  );

  UserDiscount.associate = (models) => {
    UserDiscount.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });

    UserDiscount.belongsTo(models.Discount, {
      foreignKey: "discount_id",
      as: "discount",
    });
  };

  return UserDiscount;
};
