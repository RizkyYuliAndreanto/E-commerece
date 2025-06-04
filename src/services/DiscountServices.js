// const { Discount } = require("../models");
// const { Op } = require("sequelize");

// class DiscountServices{
//     static async create(data) {
//         return await Discount.create(data);

//     }

//     static async getAll() {
//         return await Discount.findAll()

//     }

//     static async getByCode(code, userId){
//         const discount = await Discount.findOne({
//             where: {
//                 code: code,
//                 acrive: true,
//                 valid_until: {
//                     [Op.gte]: new Date()
//                 }
//             }
//         });

//         if (!discount) return null;
        

//         const alreadyUsed = await Discountuse
//     }
// }