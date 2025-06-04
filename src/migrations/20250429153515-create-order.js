'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      cart_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Carts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      total_price: {
        type: Sequelize.FLOAT
      },
      discount_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Discounts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true

      },
      final_price: {
        type: Sequelize.FLOAT
      },
      payment_status: {
        type: Sequelize.ENUM,
        values: ['pending', 'success', 'failed'],
        defaultValue: 'pending'
      },
      payment_method: {
        type: Sequelize.STRING
      },
      midtrans_order_id: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Orders');
  }
};